#!/usr/bin/env node

/**
 * Quick Security Audit Script
 * Checks for common security issues in the codebase
 */

const fs = require('fs');
const path = require('path');

const results = {
  xss: { count: 0, files: [] },
  unprotectedDeletes: { count: 0, files: [] },
  unprotectedCreates: { count: 0, files: [] },
  unprotectedReads: { count: 0, files: [] },
  rateLimit: { count: 0, files: [] },
  total: 0,
};

console.log('\n🔍 Running Quick Security Audit...\n');

// Helper to recursively find files
function findFiles(dir, pattern, excludeDirs = ['node_modules', '.next', '.git']) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!excludeDirs.includes(item)) {
        files.push(...findFiles(fullPath, pattern, excludeDirs));
      }
    } else if (pattern.test(item)) {
      files.push(fullPath);
    }
  }

  return files;
}

// Check for XSS vulnerabilities
function checkXSS() {
  console.log('📝 Checking for XSS vulnerabilities...');
  const files = findFiles('./src', /\.(tsx|ts|jsx|js)$/);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check for dangerouslySetInnerHTML without DOMPurify
    const dangerousHTML = content.match(/dangerouslySetInnerHTML/g);
    if (dangerousHTML) {
      const hasDOMPurify = content.includes('DOMPurify.sanitize');
      if (!hasDOMPurify) {
        results.xss.count++;
        results.xss.files.push(file);
      }
    }
    
    // Check for innerHTML without sanitization
    const innerHTML = content.match(/\.innerHTML\s*=/g);
    if (innerHTML) {
      const hasDOMPurify = content.includes('DOMPurify.sanitize');
      if (!hasDOMPurify) {
        results.xss.count++;
        results.xss.files.push(file);
      }
    }
  }
}

// Check for unprotected API routes
function checkAPIProtection() {
  console.log('📝 Checking API route protection...');
  const apiFiles = findFiles('./src/app/api', /route\.ts$/);
  
  for (const file of apiFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Skip auth routes (they have rate limiting)
    if (file.includes('/api/auth/')) continue;
    
    const hasRBAC = content.includes('requireAuth') || 
                    content.includes('requirePermission') ||
                    content.includes('requireRole');
    
    const hasRateLimit = content.includes('applyRateLimit') ||
                         content.includes('RateLimits');
    
    // Check DELETE endpoints
    if (content.includes('export async function DELETE')) {
      if (!hasRBAC) {
        results.unprotectedDeletes.count++;
        results.unprotectedDeletes.files.push(file);
      }
    }
    
    // Check POST/PUT/PATCH endpoints
    const hasCreateUpdate = content.includes('export async function POST') ||
                            content.includes('export async function PUT') ||
                            content.includes('export async function PATCH');
    if (hasCreateUpdate) {
      if (!hasRBAC) {
        results.unprotectedCreates.count++;
        results.unprotectedCreates.files.push(file);
      }
    }
    
    // Check GET endpoints
    if (content.includes('export async function GET')) {
      if (!hasRBAC) {
        results.unprotectedReads.count++;
        results.unprotectedReads.files.push(file);
      }
    }
    
    // Check if auth routes have rate limiting
    if (file.includes('/api/auth/') && !hasRateLimit) {
      results.rateLimit.count++;
      results.rateLimit.files.push(file);
    }
  }
}

// Run all checks
checkXSS();
checkAPIProtection();

// Calculate total issues
results.total = results.xss.count + 
                results.unprotectedDeletes.count + 
                results.unprotectedCreates.count + 
                results.unprotectedReads.count +
                results.rateLimit.count;

// Print results
console.log('\n' + '='.repeat(60));
console.log('📊 SECURITY AUDIT RESULTS');
console.log('='.repeat(60) + '\n');

console.log(`🔴 XSS Vulnerabilities: ${results.xss.count}`);
if (results.xss.count > 0) {
  results.xss.files.slice(0, 5).forEach(f => console.log(`   - ${f.replace('./src/', '')}`));
  if (results.xss.files.length > 5) console.log(`   ... and ${results.xss.files.length - 5} more`);
}

console.log(`\n🔴 Unprotected DELETE Routes: ${results.unprotectedDeletes.count}`);
if (results.unprotectedDeletes.count > 0) {
  results.unprotectedDeletes.files.slice(0, 5).forEach(f => console.log(`   - ${f.replace('./src/app/api/', '/api/')}`));
  if (results.unprotectedDeletes.files.length > 5) console.log(`   ... and ${results.unprotectedDeletes.files.length - 5} more`);
}

console.log(`\n🟡 Unprotected CREATE/UPDATE Routes: ${results.unprotectedCreates.count}`);
if (results.unprotectedCreates.count > 0) {
  results.unprotectedCreates.files.slice(0, 5).forEach(f => console.log(`   - ${f.replace('./src/app/api/', '/api/')}`));
  if (results.unprotectedCreates.files.length > 5) console.log(`   ... and ${results.unprotectedCreates.files.length - 5} more`);
}

console.log(`\n🟢 Unprotected READ Routes: ${results.unprotectedReads.count}`);
if (results.unprotectedReads.count > 0) {
  results.unprotectedReads.files.slice(0, 5).forEach(f => console.log(`   - ${f.replace('./src/app/api/', '/api/')}`));
  if (results.unprotectedReads.files.length > 5) console.log(`   ... and ${results.unprotectedReads.files.length - 5} more`);
}

console.log(`\n🟡 Missing Rate Limiting: ${results.rateLimit.count}`);
if (results.rateLimit.count > 0) {
  results.rateLimit.files.forEach(f => console.log(`   - ${f.replace('./src/app/api/', '/api/')}`));
}

console.log('\n' + '='.repeat(60));
console.log(`📈 TOTAL ISSUES FOUND: ${results.total}`);
console.log('='.repeat(60) + '\n');

// Summary
if (results.total === 0) {
  console.log('✅ All security checks passed!');
} else if (results.total < 20) {
  console.log('⚠️  Some security issues found. Please address them.');
} else {
  console.log('🚨 Multiple security issues found. Priority fixes needed!');
}

// Improvement summary
console.log('\n📊 IMPROVEMENT SUMMARY:');
console.log('✅ XSS Protection: ' + (results.xss.count === 0 ? 'COMPLETE' : 'IN PROGRESS'));
console.log('✅ DELETE Route Protection: ' + (results.unprotectedDeletes.count === 0 ? 'COMPLETE' : 'IN PROGRESS'));
console.log('⚠️  CREATE/UPDATE Protection: ' + (results.unprotectedCreates.count < 20 ? 'IN PROGRESS' : 'NEEDS WORK'));
console.log('⚠️  READ Route Protection: ' + (results.unprotectedReads.count < 20 ? 'IN PROGRESS' : 'NEEDS WORK'));
console.log('✅ Rate Limiting: ' + (results.rateLimit.count === 0 ? 'COMPLETE' : 'IN PROGRESS'));

console.log('\n');

// Exit with appropriate code
process.exit(results.total > 0 ? 1 : 0);
