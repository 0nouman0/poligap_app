import { NextResponse } from 'next/server';

// In-memory storage for rules (will reset on deployment)
// In production, this should use a database like MongoDB
let rulesStore: { rules: any[] } = { rules: [] };

async function readRules() {
  return rulesStore;
}

async function writeRules(data: any) {
  rulesStore = data;
}

export async function GET() {
  const data = await readRules();
  return NextResponse.json({ rules: data.rules || [] });
}

export async function POST(req: Request) {
  try {
    console.log('POST /api/rulebase - Starting request');
    
    const body = await req.json();
    console.log('POST body:', body);
    
    const { name, description = '', tags = [], sourceType = 'text', active = true } = body || {};
    
    if (!name || typeof name !== 'string') {
      console.log('POST error: Invalid name');
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
    
    console.log('Creating rule:', rule);
    
    data.rules = [rule, ...(data.rules || [])];
    await writeRules(data);
    
    console.log('POST success');
    return NextResponse.json({ rule });
  } catch (e) {
    console.error('POST error:', e);
    return NextResponse.json({ 
      error: 'Bad request', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    console.log('PATCH /api/rulebase - Starting request');
    
    const body = await req.json();
    console.log('PATCH body:', body);
    
    const { id, active, name, description, tags } = body || {};
    
    if (!id) {
      console.log('PATCH error: id is required');
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    
    const data = await readRules();
    const list = Array.isArray(data.rules) ? data.rules : [];
    console.log('Current rules count:', list.length);
    
    const idx = list.findIndex((r: any) => r._id === id);
    console.log('Rule index found:', idx);
    
    if (idx === -1) {
      console.log('PATCH error: Rule not found for id:', id);
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
    
    console.log('Updated rule:', updated);
    
    list[idx] = updated;
    data.rules = list;
    await writeRules(data);
    
    console.log('PATCH success');
    return NextResponse.json({ rule: updated });
  } catch (e) {
    console.error('PATCH error:', e);
    return NextResponse.json({ 
      error: 'Bad request', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    console.log('DELETE /api/rulebase - Starting request');
    
    const body = await req.json().catch(() => ({}));
    console.log('DELETE body:', body);
    
    const { id } = body || {};
    
    if (!id) {
      console.log('DELETE error: id is required');
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    
    const data = await readRules();
    const list = Array.isArray(data.rules) ? data.rules : [];
    console.log('Current rules count before delete:', list.length);
    
    const next = list.filter((r: any) => r._id !== id);
    
    if (next.length === list.length) {
      console.log('DELETE error: Rule not found for id:', id);
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    
    console.log('Rules count after delete:', next.length);
    
    data.rules = next;
    await writeRules(data);
    
    console.log('DELETE success');
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE error:', e);
    return NextResponse.json({ 
      error: 'Bad request', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 400 });
  }
}

