#!/usr/bin/env node

/**
 * Automated RBAC Addition Script
 * Adds requireAuth() to all unprotected route handlers
 */

const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/all-chat-history/inbox/route.ts',
  'src/app/api/all-chat-history/trash/route.ts',
  'src/app/api/analytics/dashboard/route.ts',
  'src/app/api/analytics/searches/series/route.ts',
  'src/app/api/analytics/searches/top/route.ts',
  'src/app/api/chat-history/save-batch/route.ts',
  'src/app/api/chat-history/save-message/route.ts',
  'src/app/api/compliance-analysis/route.ts',
  'src/app/api/contract-analyze/route.ts',
  'src/app/api/extract-document/route.ts',
  'src/app/api/extract-pdf/route.ts',
  'src/app/api/extract-simple/route.ts',
  'src/app/api/extract-text/route.ts',
  'src/app/api/flagged-issues/route.ts',
  'src/app/api/knowledge-base/overview/route.ts',
  'src/app/api/knowledge-base/train-card/route.ts',
  'src/app/api/knowledge-base/upload-media/route.ts',
  'src/app/api/law-scanner/query/route.ts',
  'src/app/api/parse-document/route.ts',
  'src/app/api/policy-generator/generate/route.ts',
  'src/app/api/rulebase/upload/route.ts',
  'src/app/api/s3/upload/route.ts',
  'src/app/api/search/route.ts',
  'src/app/api/template-audit-logs/route.ts',
  'src/app/api/users/get-member/route.ts',
  'src/app/api/users/get-user/route.ts',
  'src/app/api/users/profile-fallback/route.ts',
  'src/app/api/users/profile-simple/route.ts',
  'src/app/api/users/user-details/route.ts',
  'src/app/api/ai-chat/edit-conversation/route.ts',
  'src/app/api/ai-chat/generate-title/route.ts',
  'src/app/api/export-pdf/route.ts',
  'src/app/api/company/members/member-details/route.ts',
];

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

console.log('🔒 Starting Automated RBAC Addition\n');

for (const filePath of files) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  Skip: ${filePath} (not found)`);
      skipCount++;
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Skip if already has RBAC
    if (content.includes('requireAuth') || content.includes('requirePermission')) {
      console.log(`⏭️  Skip: ${filePath} (already protected)`);
      skipCount++;
      continue;
    }

    let modified = false;

    // Step 1: Add import if not present
    if (!content.includes("from '@/lib/rbac'")) {
      // Find the last import statement
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

    // Step 2: Add requireAuth() to each handler
    const handlers = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    
    for (const method of handlers) {
      const handlerRegex = new RegExp(
        `export async function ${method}\\([^)]*\\)\\s*\\{\\s*try\\s*\\{`,
        'g'
      );
      
      if (handlerRegex.test(content)) {
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
    errorCount++;
  }
}

console.log('\n' + '='.repeat(60));
console.log('📊 RBAC Addition Summary');
console.log('='.repeat(60));
console.log(`✅ Successfully Updated: ${successCount}`);
console.log(`⏭️  Skipped: ${skipCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log('='.repeat(60));

if (errorCount === 0) {
  console.log('\n🎉 All files processed successfully!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some files had errors. Please review.');
  process.exit(1);
}
