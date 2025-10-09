#!/usr/bin/env node

/**
 * Final RBAC Batch - Add auth to remaining utility routes
 */

const fs = require('fs');

const files = [
  'src/app/api/analytics/seed/route.ts',
  'src/app/api/analytics/seed-dashboard/route.ts',
  'src/app/api/assets/resolve/route.ts',
  'src/app/api/check-users/route.ts',
  'src/app/api/create-test-user/route.ts',
  'src/app/api/email-notifier/send/route.ts',
  'src/app/api/ensure-user/route.ts',
  'src/app/api/extract-basic/route.ts',
  'src/app/api/health/mongodb/route.ts',
  'src/app/api/idea-analyzer/analyze/route.ts',
  'src/app/api/knowledge-base/enable/route.ts',
  'src/app/api/log/route.ts',
  'src/app/api/n8n-email-webhook/route.ts',
  'src/app/api/pd/route.ts',
  'src/app/api/pipedream/accessToken/route.ts',
  'src/app/api/rulebase/seed/route.ts',
  'src/app/api/supabase/init/route.ts',
  'src/app/api/users/signin/route.ts',
  'src/app/api/users/signout/route.ts',
  'src/app/api/users/signup/route.ts',
];

let successCount = 0;
let skipCount = 0;

console.log('🔒 Final RBAC Batch Processing\n');

for (const filePath of files) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  Skip: ${filePath} (not found)`);
      skipCount++;
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Skip if already has RBAC or is an auth route with rate limiting
    if (content.includes('requireAuth') || content.includes('requirePermission') || content.includes('applyRateLimit')) {
      console.log(`⏭️  Skip: ${filePath} (already protected)`);
      skipCount++;
      continue;
    }

    let modified = false;

    // Add import
    if (!content.includes("from '@/lib/rbac'")) {
      const lines = content.split('\n');
      let lastImportIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ') && !lines[i].includes('type ')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex >= 0) {
        lines.splice(lastImportIndex + 1, 0, "import { requireAuth } from '@/lib/rbac';");
        content = lines.join('\n');
        modified = true;
      }
    }

    // Add requireAuth() to handlers
    const handlers = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    
    for (const method of handlers) {
      const regex = new RegExp(`(export async function ${method}\\([^)]*\\)\\s*\\{\\s*try\\s*\\{)`, 'g');
      
      if (regex.test(content)) {
        content = content.replace(
          new RegExp(`(export async function ${method}\\([^)]*\\)\\s*\\{\\s*try\\s*\\{)`, 'g'),
          `$1\n    // Require authentication\n    await requireAuth();\n    `
        );
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Updated: ${filePath}`);
      successCount++;
    } else {
      console.log(`⏭️  Skip: ${filePath} (no changes needed)`);
      skipCount++;
    }

  } catch (error) {
    console.log(`❌ Error: ${filePath} - ${error.message}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`✅ Successfully Updated: ${successCount}`);
console.log(`⏭️  Skipped: ${skipCount}`);
console.log('='.repeat(60));
console.log('\n🎉 Final batch complete!');
