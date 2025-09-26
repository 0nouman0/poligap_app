import { NextResponse } from "next/server";

export const runtime = "nodejs";

function prependLogo(markdown: string, logoDataUrl?: string | null) {
  if (!logoDataUrl) return markdown;
  // Centered logo image using HTML for better control; md-to-pdf supports HTML in Markdown
  const logoBlock = `\n<p style="text-align:center; margin-bottom: 16px;">\n  <img src="${logoDataUrl}" alt="Company Logo" style="max-height:120px; max-width:220px; object-fit:contain;" />\n</p>\n\n`;
  return logoBlock + markdown;
}

function escapeLatex(text: string) {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([%#&_{}])/g, "\\$1")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/~/g, "\\textasciitilde{}");
}

function mdToLatex(md: string): string {
  let lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let inItemize = false;
  let inEnumerate = false;
  let inCode = false;
  for (let raw of lines) {
    let line = raw;
    // code fences
    if (/^```/.test(line)) {
      if (!inCode) {
        out.push("\\begin{verbatim}");
        inCode = true;
      } else {
        out.push("\\end{verbatim}");
        inCode = false;
      }
      continue;
    }
    if (inCode) { out.push(line); continue; }

    // headings
    if (/^###\s+/.test(line)) { out.push(`\\subsubsection{${escapeLatex(line.replace(/^###\s+/, ""))}}`); continue; }
    if (/^##\s+/.test(line)) { out.push(`\\subsection{${escapeLatex(line.replace(/^##\s+/, ""))}}`); continue; }
    if (/^#\s+/.test(line)) { out.push(`\\section{${escapeLatex(line.replace(/^#\s+/, ""))}}`); continue; }

    // lists
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inItemize) { out.push("\\begin{itemize}"); inItemize = true; }
      const item = line.replace(/^\s*[-*]\s+/, "");
      out.push("\\item " + inlineMdToLatex(item));
      continue;
    } else if (/^\s*\d+\.\s+/.test(line)) {
      if (!inEnumerate) { out.push("\\begin{enumerate}"); inEnumerate = true; }
      const item = line.replace(/^\s*\d+\.\s+/, "");
      out.push("\\item " + inlineMdToLatex(item));
      continue;
    } else {
      if (inItemize) { out.push("\\end{itemize}"); inItemize = false; }
      if (inEnumerate) { out.push("\\end{enumerate}"); inEnumerate = false; }
    }

    if (line.trim() === "") { out.push(""); continue; }
    out.push(inlineMdToLatex(line));
  }
  if (inItemize) out.push("\\end{itemize}");
  if (inEnumerate) out.push("\\end{enumerate}");
  if (inCode) out.push("\\end{verbatim}");
  return out.join("\n");
}

function inlineMdToLatex(text: string): string {
  // links [text](url)
  let t = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, p1, p2) => `\\href{${escapeLatex(p2)}}{${escapeLatex(p1)}}`);
  // bold **text**
  t = t.replace(/\*\*([^*]+)\*\*/g, (_m, p1) => `\\textbf{${escapeLatex(p1)}}`);
  // italic *text*
  t = t.replace(/\*([^*]+)\*/g, (_m, p1) => `\\textit{${escapeLatex(p1)}}`);
  // inline code `code`
  t = t.replace(/`([^`]+)`/g, (_m, p1) => `\\texttt{${escapeLatex(p1)}}`);
  return escapeLatex(t);
}

export async function POST(req: Request) {
  try {
    const { markdown, fileName, logo } = await req.json();
    if (!markdown || !fileName) {
      return NextResponse.json({ error: "markdown and fileName are required" }, { status: 400 });
    }

    const combined = prependLogo(markdown as string, logo as string | undefined);
    // 1) Try LaTeX pipeline first (Markdown -> LaTeX -> PDF via node-latex)
    try {
      const os = await import('node:os');
      const path = await import('node:path');
      const fs = await import('node:fs/promises');
      const { Readable } = await import('node:stream');
      const latexMod: any = await import('node-latex');

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'latex-export-'));
      let logoPath: string | undefined;
      if (logo && typeof logo === 'string' && logo.startsWith('data:')) {
        const match = /^data:(.*?);base64,(.*)$/.exec(logo);
        if (match) {
          const ext = (match[1] || 'image/png').includes('jpeg') ? 'jpg' : 'png';
          const buf = Buffer.from(match[2], 'base64');
          logoPath = path.join(tmpDir, `logo.${ext}`);
          await fs.writeFile(logoPath, buf);
        }
      }

      const bodyLatex = mdToLatex(markdown as string);
      const logoBlock = logoPath ? `\\begin{center}\\includegraphics[height=3cm]{${path.basename(logoPath)}}\\end{center}` : '';
      const texDoc = `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{hyperref}
\\usepackage{graphicx}
\\usepackage{enumitem}
\\setlist{itemsep=4pt, topsep=4pt}
\\title{${escapeLatex(fileName.replace(/-/g, ' '))}}
\\date{}
\\begin{document}
${logoBlock}
${bodyLatex}
\\end{document}`;

      // Write logo file into inputs path
      const inputs: string[] = logoPath ? [tmpDir] : [];
      const stream = latexMod.default ? latexMod.default(Readable.from([texDoc]), { inputs }) : latexMod(Readable.from([texDoc]), { inputs });
      const chunks: Buffer[] = [];
      const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
        stream.on('data', (d: Buffer) => chunks.push(d));
        stream.on('error', reject);
        stream.on('finish', () => resolve(Buffer.concat(chunks)));
      });
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=${fileName}.pdf`,
          "X-Engine": "node-latex",
        },
      });
    } catch (latexErr) {
      console.error('[export-pdf] node-latex failed:', latexErr);
    }

    // 2) Fallback: Try global CLI 'md-to-pdf', then final fallback with @react-pdf/renderer
    try {
      const os = await import('node:os');
      const path = await import('node:path');
      const fs = await import('node:fs/promises');
      const { spawn } = await import('node:child_process');
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mdtopdf-'));
      const mdPath = path.join(tmpDir, `${fileName}.md`);
      const pdfPath = path.join(tmpDir, `${fileName}.pdf`);
      await fs.writeFile(mdPath, combined, 'utf8');

      await new Promise<void>((resolve, reject) => {
        const proc = spawn('md-to-pdf', ['--output', pdfPath, mdPath], { shell: true });
        let stderr = '';
        proc.stderr.on('data', (d) => { stderr += d.toString(); });
        proc.on('error', reject);
        proc.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`md-to-pdf CLI exit ${code}: ${stderr}`));
        });
      });

      const buffer = await fs.readFile(pdfPath);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=${fileName}.pdf`,
          "X-Export-Fallback": "md-to-pdf-cli",
        },
      });
    } catch (cliErr) {
      console.error('[export-pdf] md-to-pdf CLI failed:', cliErr);
      // Final fallback: generate a simple PDF with @react-pdf/renderer so the user still gets a file
      try {
        const React = (await import("react")).default;
        const pdfMod: any = await import("@react-pdf/renderer");
        const { Document, Page, View, Text, Image, StyleSheet } = pdfMod;
        const styles = StyleSheet.create({
          page: { padding: 32 },
          logoWrap: { alignItems: 'center', marginBottom: 16 },
          logo: { height: 80, width: 180, objectFit: 'contain' },
          content: { fontSize: 12, lineHeight: 1.4, whiteSpace: 'pre-wrap' },
        });
        const FallbackDoc = (
          React.createElement(Document, null,
            React.createElement(Page, { size: 'A4', style: styles.page },
              logo ? React.createElement(View, { style: styles.logoWrap },
                React.createElement(Image, { style: styles.logo, src: logo as string })
              ) : null,
              React.createElement(Text, { style: styles.content }, combined)
            )
          )
        );
        const inst = pdfMod.pdf(FallbackDoc);
        const buffer = await inst.toBuffer();
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=${fileName}.pdf`,
            "X-Export-Fallback": "react-pdf",
          },
        });
      } catch (fallbackErr) {
        return NextResponse.json({ error: "PDF export failed" }, { status: 500 });
      }
    }
  } catch (e) {
    console.error("[export-pdf] unexpected error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
