import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

// Returns count of training modules for the current user (default 0 if not implemented)
export async function GET() {
  try {
    // Prefer Supabase-backed training table when available
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // If a real `training_modules` table exists, uncomment and adapt the query below
        // const { count } = await supabase
        //   .from('training_modules')
        //   .select('*', { count: 'exact', head: true })
        //   .eq('user_id', user.id);
        // if (typeof count === 'number') return NextResponse.json({ count });
      }
    } catch (dbErr) {
      // Proceed to fallback to file-based modules if supabase or auth is not configured
      console.debug('training/count supabase check failed, using file fallback:', String(dbErr));
    }

    // Fallback: read local sample modules file (useful for development and to show non-empty data)
    try {
      const dataPath = path.join(process.cwd(), 'data', 'learn-modules.json');
      if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, 'utf-8');
        const modules = JSON.parse(raw);
        if (Array.isArray(modules)) {
          return NextResponse.json({ count: modules.length });
        }
      }
    } catch (fileErr) {
      console.debug('training/count fallback read failed:', String(fileErr));
    }

    // Default safe response
    return NextResponse.json({ count: 0 });
  } catch (e) {
    console.error('training/count unexpected error:', e);
    return NextResponse.json({ count: 0 });
  }
}
