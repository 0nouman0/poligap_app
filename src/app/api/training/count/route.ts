import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns count of training modules for the current user (default 0 if not implemented)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ count: 0 });

    // If you add a training table in future, adjust this query accordingly
    // Example:
    // const { count } = await supabase
    //   .from('training_modules')
    //   .select('*', { count: 'exact', head: true })
    //   .eq('user_id', user.id);

    return NextResponse.json({ count: 0 });
  } catch (e) {
    console.error('training/count unexpected error:', e);
    return NextResponse.json({ count: 0 });
  }
}
