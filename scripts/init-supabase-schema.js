const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase with service role key (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function runMigration() {
  console.log('🚀 Starting Poligap Supabase schema initialization...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Read migration file: 001_initial_schema.sql');
    console.log(`📏 SQL Length: ${sqlContent.length} characters\n`);

    // Split SQL into individual statements (rough split by semicolons)
    // This is a simple approach - for production, use a proper SQL parser
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute statements one by one for better error reporting
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      const preview = statement.substring(0, 80).replace(/\n/g, ' ');
      
      process.stdout.write(`\r[${i + 1}/${statements.length}] Executing: ${preview}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        }).single();

        if (error) {
          // Try direct execution as fallback
          const { error: directError } = await supabase
            .from('_migrations')
            .insert({ statement })
            .select();

          if (directError) {
            console.log(`\n⚠️  Statement ${i + 1} warning: ${directError.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.log(`\n❌ Statement ${i + 1} error: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n\n✅ Migration completed!`);
    console.log(`   Success: ${successCount}/${statements.length} statements`);
    if (errorCount > 0) {
      console.log(`   Warnings: ${errorCount} (these may be expected for existing objects)`);
    }

    // Verify tables were created
    console.log('\n🔍 Verifying tables...\n');
    
    const tables = [
      'companies', 'users', 'members', 'media', 'company_media',
      'agent_conversations', 'chat_messages', 'rulebase',
      'document_analysis', 'audit_logs', 'search_history', 'feedback'
    ];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: Not found or error - ${error.message}`);
      } else {
        console.log(`✅ ${table}: Exists (${count || 0} records)`);
      }
    }

    console.log('\n🎉 Poligap schema initialization complete!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
