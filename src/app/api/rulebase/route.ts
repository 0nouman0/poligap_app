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

export async function GET() {
  const data = await readRules();
  return NextResponse.json({ rules: data.rules || [] });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description = '', tags = [], sourceType = 'text', active = true } = body || {};
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }
    const data = await readRules();
    const rule = {
      _id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      name,
      description,
      tags: Array.isArray(tags) ? tags : [],
      sourceType,
      active: active !== false,
      updatedAt: new Date().toISOString(),
    };
    data.rules = [rule, ...(data.rules || [])];
    await writeRules(data);
    return NextResponse.json({ rule });
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, active, name, description, tags } = body || {};
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    const data = await readRules();
    const list = Array.isArray(data.rules) ? data.rules : [];
    const idx = list.findIndex((r: any) => r._id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    const current = list[idx] || {};
    const updated = {
      ...current,
      ...(typeof active === 'boolean' ? { active } : {}),
      ...(typeof name === 'string' ? { name } : {}),
      ...(typeof description === 'string' ? { description } : {}),
      ...(Array.isArray(tags) ? { tags } : {}),
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    data.rules = list;
    await writeRules(data);
    return NextResponse.json({ rule: updated });
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id } = body || {};
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    const data = await readRules();
    const list = Array.isArray(data.rules) ? data.rules : [];
    const next = list.filter((r: any) => r._id !== id);
    if (next.length === list.length) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    data.rules = next;
    await writeRules(data);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

