#!/usr/bin/env ts-node

/**
 * Supabase Initialization CLI
 * 
 * Run: npm run init:supabase
 * or: npx ts-node scripts/init-supabase.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Import initialization module
import('../src/lib/supabase/init').then(async (module) => {
  const {
    initializeSupabase,
    getSchemaSQL,
    getRLSPoliciesSQL,
    getSetupInstructions,
  } = module;

  const args = process.argv.slice(2);
  const command = args[0];

  // Handle commands
  if (command === '--help' || command === '-h') {
    console.log(`
🚀 Supabase Initialization CLI

Commands:
  npm run init:supabase              Run full initialization
  npm run init:supabase --schema     Print schema SQL
  npm run init:supabase --rls        Print RLS policies SQL
  npm run init:supabase --help       Show this help

What it does:
  ✅ Checks Supabase health
  ✅ Creates all database tables
  ✅ Sets up Storage buckets  
  ✅ Configures Auth
  ✅ Prepares GraphQL endpoint
    `);
    process.exit(0);
  }

  if (command === '--schema') {
    console.log('\n📋 Database Schema SQL:\n');
    console.log(getSchemaSQL());
    console.log('\n💡 Copy this SQL and run in Supabase Dashboard → SQL Editor\n');
    process.exit(0);
  }

  if (command === '--rls') {
    console.log('\n🔒 RLS Policies SQL:\n');
    console.log(getRLSPoliciesSQL());
    console.log('\n💡 Copy this SQL and run in Supabase Dashboard → SQL Editor\n');
    process.exit(0);
  }

  if (command === '--instructions') {
    console.log(getSetupInstructions());
    process.exit(0);
  }

  // Run full initialization
  try {
    await initializeSupabase();
    
    console.log('\n🎉 Initialization complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Check the logs above for any warnings');
    console.log('2. If schema creation failed, run: npm run init:supabase --schema');
    console.log('3. Test your app: npm run dev');
    console.log('\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.log('\n💡 Try manual setup:');
    console.log('  npm run init:supabase --schema');
    console.log('  npm run init:supabase --rls');
    console.log('\n');
    process.exit(1);
  }
}).catch((error) => {
  console.error('Failed to load initialization module:', error);
  process.exit(1);
});
