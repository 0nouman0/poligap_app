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
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let inItemize = false;
  let inEnumerate = false;
  let inCode = false;
  for (const raw of lines) {
    const line = raw;
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
    
    // Use React PDF renderer as the primary method for reliability
    try {
      const React = (await import("react")).default;
      const pdfMod: any = await import("@react-pdf/renderer");
      const { Document, Page, View, Text, Image, StyleSheet } = pdfMod;
      
      // Enhanced styles for better formatting
      const styles = StyleSheet.create({
        page: { 
          padding: 40,
          fontFamily: 'Helvetica',
          fontSize: 11,
          lineHeight: 1.6,
          color: '#333333'
        },
        logoWrap: { 
          alignItems: 'center', 
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: '1 solid #e0e0e0'
        },
        logo: { 
          height: 60, 
          width: 'auto', 
          maxWidth: 200,
          objectFit: 'contain' 
        },
        title: {
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 16,
          color: '#2c3e50',
          textAlign: 'center'
        },
        heading1: {
          fontSize: 16,
          fontWeight: 'bold',
          marginTop: 20,
          marginBottom: 12,
          color: '#2c3e50'
        },
        heading2: {
          fontSize: 14,
          fontWeight: 'bold',
          marginTop: 16,
          marginBottom: 10,
          color: '#34495e'
        },
        heading3: {
          fontSize: 12,
          fontWeight: 'bold',
          marginTop: 12,
          marginBottom: 8,
          color: '#7f8c8d'
        },
        paragraph: {
          marginBottom: 10,
          textAlign: 'justify'
        },
        listItem: {
          marginBottom: 4,
          marginLeft: 16
        },
        code: {
          fontFamily: 'Courier',
          backgroundColor: '#f8f9fa',
          padding: 8,
          fontSize: 10,
          marginBottom: 10,
          border: '1 solid #e9ecef'
        },
        bold: {
          fontWeight: 'bold'
        },
        italic: {
          fontStyle: 'italic'
        }
      });

      // Simple markdown parser for React PDF
      const parseMarkdown = (text: string) => {
        const lines = text.split('\n');
        const elements: any[] = [];
        let currentParagraph = '';
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (!line) {
            if (currentParagraph) {
              elements.push(
                React.createElement(Text, { style: styles.paragraph, key: `p-${i}` }, currentParagraph.trim())
              );
              currentParagraph = '';
            }
            continue;
          }
          
          // Headers
          if (line.startsWith('### ')) {
            if (currentParagraph) {
              elements.push(
                React.createElement(Text, { style: styles.paragraph, key: `p-${i}` }, currentParagraph.trim())
              );
              currentParagraph = '';
            }
            elements.push(
              React.createElement(Text, { style: styles.heading3, key: `h3-${i}` }, line.substring(4))
            );
          } else if (line.startsWith('## ')) {
            if (currentParagraph) {
              elements.push(
                React.createElement(Text, { style: styles.paragraph, key: `p-${i}` }, currentParagraph.trim())
              );
              currentParagraph = '';
            }
            elements.push(
              React.createElement(Text, { style: styles.heading2, key: `h2-${i}` }, line.substring(3))
            );
          } else if (line.startsWith('# ')) {
            if (currentParagraph) {
              elements.push(
                React.createElement(Text, { style: styles.paragraph, key: `p-${i}` }, currentParagraph.trim())
              );
              currentParagraph = '';
            }
            elements.push(
              React.createElement(Text, { style: styles.heading1, key: `h1-${i}` }, line.substring(2))
            );
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            if (currentParagraph) {
              elements.push(
                React.createElement(Text, { style: styles.paragraph, key: `p-${i}` }, currentParagraph.trim())
              );
              currentParagraph = '';
            }
            elements.push(
              React.createElement(Text, { style: styles.listItem, key: `li-${i}` }, `• ${line.substring(2)}`)
            );
          } else if (line.startsWith('```')) {
            // Skip code fence markers for now
            continue;
          } else {
            currentParagraph += (currentParagraph ? ' ' : '') + line;
          }
        }
        
        if (currentParagraph) {
          elements.push(
            React.createElement(Text, { style: styles.paragraph, key: 'final-p' }, currentParagraph.trim())
          );
        }
        
        return elements;
      };

      const content = parseMarkdown(markdown as string);
      
      const PDFDoc = React.createElement(Document, null,
        React.createElement(Page, { size: 'A4', style: styles.page },
          // Logo section
          logo ? React.createElement(View, { style: styles.logoWrap },
            React.createElement(Image, { style: styles.logo, src: logo as string })
          ) : null,
          
          // Title
          React.createElement(Text, { style: styles.title }, 
            fileName.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
          ),
          
          // Content
          React.createElement(View, null, ...content)
        )
      );
      
      const inst = pdfMod.pdf(PDFDoc);
      const buffer = await inst.toBuffer();
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=${fileName}.pdf`,
          "X-Export-Engine": "react-pdf-renderer",
        },
      });
      
    } catch (pdfErr) {
      console.error('[export-pdf] React PDF failed:', pdfErr);
      return NextResponse.json({ 
        error: "PDF export failed", 
        details: (pdfErr as Error).message 
      }, { status: 500 });
    }
    
  } catch (e) {
    console.error("[export-pdf] unexpected error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
