#!/bin/bash

# Run the chat tables migration
# Usage: ./run-migration.sh

echo "🚀 Running chat tables migration..."

# Database connection from your env
DB_URL="postgresql://postgres:rwe2EUX9zpx_wqj!hem@db.uzbozldsdzsfytsteqlb.supabase.co:5432/postgres?sslmode=require"

# Run the migration
psql "$DB_URL" -f RUN_THIS_IN_SUPABASE.sql

echo "✅ Migration complete! Check output above for any errors."
