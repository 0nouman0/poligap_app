import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Utility: normalize mention token to a search value
function normalizeMention(m: string) {
  return m.trim().replace(/^@/, '').replace(/[\s]+/g, '_').toLowerCase();
}

// Basic text extraction from ArrayBuffer with naive PDF handling
async function extractTextFromArrayBuffer(buf: ArrayBuffer, mime: string, url: string): Promise<string> {
  try {
    // Try UTF-8 decode first
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const content = decoder.decode(new Uint8Array(buf));

    if (mime?.includes('pdf') || url.endsWith('.pdf')) {
      // Very naive PDF text scrape: pull sequences in parentheses or readable runs
      const paren = content.match(/\([^)]{10,}\)/g)?.map(m => m.replace(/^\(|\)$/g, '')) || [];
      const readable = content.match(/[a-zA-Z\s.,!?;:'"()\-]{20,}/g) || [];
      const combined = [...paren, ...readable].join(' ');
      return combined.replace(/\s+/g, ' ').trim();
    }

    // For text-like
    const readable = content.match(/[\x20-\x7E\s]{50,}/g);
    if (readable) return readable.join(' ').replace(/\s+/g, ' ').trim();

    return content.slice(0, 8000);
  } catch {
    return '';
  }
}

function isReadable(text: string): boolean {
  if (!text) return false;
  const length = text.length;
  const wordCount = (text.match(/\b\w+\b/g) || []).length;
  const letters = (text.match(/[A-Za-z]/g) || []).length;
  const letterRatio = letters / Math.max(1, length);
  const uniqueChars = new Set(text.split('')).size;
  const uniqueRatio = uniqueChars / Math.max(1, length);
  const avgWordLen = length / Math.max(1, wordCount);
  const longEnough = length >= 300 || wordCount >= 50;
  const sufficientLetters = letterRatio >= 0.35;
  const reasonableUniqueness = uniqueRatio >= 0.04;
  const reasonableAvgWord = avgWordLen >= 2.5 && avgWordLen <= 14;
  return longEnough && sufficientLetters && reasonableUniqueness && reasonableAvgWord;
}

export async function POST(request: NextRequest) {
  try {
    const { mentions } = await request.json();
    if (!Array.isArray(mentions) || mentions.length === 0) {
      return NextResponse.json({ success: false, error: 'No mentions provided' }, { status: 400 });
    }

    const tokens = mentions.map(normalizeMention);

    const { db } = await connectToDatabase();

    // Search by originalName, filename, tags
    const regexes = tokens.map(t => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));

    const assets = await db.collection('assets').find({
      $or: [
        { originalName: { $in: regexes } },
        { filename: { $in: regexes } },
        { tags: { $in: tokens } },
      ],
    }).limit(10).toArray();

    // Fetch and extract text for each asset (best-effort)
    const results = await Promise.all(assets.map(async (a: any) => {
      let text = '';
      let snippet = '';
      try {
        if (a?.url) {
          const res = await fetch(a.url);
          if (res.ok) {
            const buf = await res.arrayBuffer();
            text = await extractTextFromArrayBuffer(buf, a?.mimetype || '', a.url);
            if (!isReadable(text)) text = '';
            snippet = text ? text.slice(0, 1200) : '';
          }
        }
      } catch {
        // ignore fetch/extract errors
      }
      return {
        _id: String(a._id),
        originalName: a.originalName,
        filename: a.filename,
        mimetype: a.mimetype,
        size: a.size,
        uploadDate: a.uploadDate,
        tags: a.tags,
        category: a.category,
        url: a.url,
        thumbnailUrl: a.thumbnailUrl,
        text,
        snippet,
      };
    }));

    return NextResponse.json({ success: true, assets: results });
  } catch (error) {
    console.error('assets/resolve error', error);
    return NextResponse.json({ success: false, error: 'Failed to resolve mentions' }, { status: 500 });
  }
}
