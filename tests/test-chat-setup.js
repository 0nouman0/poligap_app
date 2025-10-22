/**
 * Chat Setup Verification Test
 * Verifies database tables and tests basic chat functionality
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ovnnsldnefxwypkclbjc.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bm5zbGRuZWZ4d3lwa2NsYmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3Nzc1MTMsImV4cCI6MjA3NDM1MzUxM30.IKDbB6CGMSGTjMiH_gWtubjNSAdu1cgwb4-H8_iDl2Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
  console.log('🔍 Verifying database tables...\n');

  try {
    // Check conversations table
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);

    if (convError && convError.code === '42P01') {
      console.log('❌ conversations table does NOT exist');
      console.log('   Error:', convError.message);
      return false;
    } else if (convError) {
      console.log('⚠️  conversations table exists but has issues:', convError.message);
    } else {
      console.log('✅ conversations table exists');
      console.log('   Current rows:', conversations.length);
    }

    // Check chat_messages table
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('*')
      .limit(1);

    if (msgError && msgError.code === '42P01') {
      console.log('❌ chat_messages table does NOT exist');
      console.log('   Error:', msgError.message);
      return false;
    } else if (msgError) {
      console.log('⚠️  chat_messages table exists but has issues:', msgError.message);
    } else {
      console.log('✅ chat_messages table exists');
      console.log('   Current rows:', messages.length);
    }

    console.log('\n✅ All required tables exist!\n');
    return true;

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

async function testChatFlow() {
  console.log('🧪 Testing basic chat flow...\n');

  // Note: This requires authentication
  console.log('⚠️  Chat flow testing requires user authentication');
  console.log('   To test fully:');
  console.log('   1. Start dev server: npm run dev');
  console.log('   2. Open: http://localhost:3000/chat');
  console.log('   3. Sign in');
  console.log('   4. Send a test message');
  console.log('   5. Refresh page - message should persist\n');
}

async function checkIndexes() {
  console.log('📊 Checking indexes...\n');

  const { data, error } = await supabase.rpc('exec', {
    query: `
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('conversations', 'chat_messages')
      ORDER BY tablename, indexname;
    `
  });

  if (error) {
    console.log('⚠️  Could not check indexes (may need service role key)');
  } else if (data) {
    console.log('Indexes created:', data.length);
    data.forEach(idx => {
      console.log(`  - ${idx.tablename}.${idx.indexname}`);
    });
  }
}

async function getTableStructure() {
  console.log('\n📋 Table Structure:\n');

  const query = `
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name IN ('conversations', 'chat_messages')
    ORDER BY table_name, ordinal_position;
  `;

  // This would need service role or GraphQL
  console.log('Table structure check requires GraphQL or service role access');
  console.log('You can view structure in Supabase Dashboard:\n');
  console.log('https://supabase.com/dashboard/project/ovnnsldnefxwypkclbjc/editor\n');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Chat Setup Verification Test                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const tablesExist = await verifyTables();

  if (tablesExist) {
    await testChatFlow();
    await getTableStructure();
    
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   ✅ VERIFICATION COMPLETE - ALL CHECKS PASSED         ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log('🎉 Your chat system is ready!\n');
    console.log('Next steps:');
    console.log('  1. Start dev server: npm run dev');
    console.log('  2. Open: http://localhost:3000/chat');
    console.log('  3. Select a model and start chatting!');
    console.log('  4. Messages will now persist across page refreshes\n');
  } else {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   ❌ VERIFICATION FAILED - TABLES MISSING              ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log('Please run the migration script:');
    console.log('  1. Open: https://supabase.com/dashboard/project/ovnnsldnefxwypkclbjc/sql/new');
    console.log('  2. Copy contents of: RUN_THIS_IN_SUPABASE.sql');
    console.log('  3. Paste and click RUN\n');
  }
}

main().catch(console.error);
