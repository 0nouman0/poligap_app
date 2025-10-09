const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function initSchema() {
  console.log('🚀 Initializing Poligap Supabase Schema...\n');

  // Read migration SQL
  const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log('📄 Migration file loaded\n');
  console.log('⚠️  NOTE: Please run this SQL manually in Supabase Dashboard:\n');
  console.log('   1. Go to: https://ovnnsldnefxwypkclbjc.supabase.co/project/ovnnsldnefxwypkclbjc/sql');
  console.log('   2. Paste the contents of: supabase/migrations/001_initial_schema.sql');
  console.log('   3. Click "Run"\n');
  console.log('   OR use the Supabase CLI:\n');
  console.log('   $ npx supabase db push --db-url "$DATABASE_URL"\n');

  // For now, let's verify if we can connect and list what exists
  console.log('🔍 Checking current database status...\n');

  try {
    // Try to query a table to see if schema exists
    const { data, error } = await supabase
      .from('companies')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Tables not yet created');
        console.log('   Please run the migration SQL in Supabase Dashboard\n');
      } else {
        console.log(`⚠️  Error: ${error.message}\n`);
      }
    } else {
      console.log('✅ Tables already exist! Schema is ready.\n');
    }
  } catch (err) {
    console.log(`❌ Connection error: ${err.message}\n`);
  }
}

initSchema();
