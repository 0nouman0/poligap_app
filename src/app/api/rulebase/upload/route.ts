import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const RULES_PATH = path.join(DATA_DIR, 'rulebase.json');

async function ensureStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(RULES_PATH);
  } catch {
    await fs.writeFile(RULES_PATH, JSON.stringify({ rules: [] }, null, 2), 'utf-8');
  }
}

async function readRules() {
  await ensureStore();
  const raw = await fs.readFile(RULES_PATH, 'utf-8');
  try { return JSON.parse(raw); } catch { return { rules: [] }; }
}

async function writeRules(data: any) {
  await ensureStore();
  await fs.writeFile(RULES_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    // We don't persist file content to disk for now; just register metadata
    const data = await readRules();
    const rule = {
      _id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      name: file.name,
      description: `Uploaded rule file (${(arrayBuffer.byteLength/1024).toFixed(1)} KB)`,
      tags: ['uploaded'],
      sourceType: 'file' as const,
      fileName: file.name,
      active: true,
      updatedAt: new Date().toISOString(),
    };
    data.rules = [rule, ...(data.rules || [])];
    await writeRules(data);
    return NextResponse.json({ rule });
  } catch (e) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
