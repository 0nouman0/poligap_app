import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'learn-modules.json');
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf-8');
      const modules = JSON.parse(raw);
      if (Array.isArray(modules)) {
        return NextResponse.json({ modules });
      }
    }
    return NextResponse.json({ modules: [] });
  } catch (e) {
    console.error('training/list unexpected error:', e);
    return NextResponse.json({ modules: [] });
  }
}
