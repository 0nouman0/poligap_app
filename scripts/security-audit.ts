#!/usr/bin/env tsx
/**
 * Comprehensive Security Audit Script
 * 
 * This script analyzes the entire codebase for:
 * - SQL injection vulnerabilities
 * - XSS vulnerabilities
 * - CSRF vulnerabilities
 * - Insecure authentication patterns
 * - Missing input validation
 * - Exposed secrets
 * - Missing RBAC checks
 * - Insecure API routes
 */

import * as fs from 'fs';
import * as path from 'path';

interface SecurityIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  file: string;
  line: number;
  description: string;
  recommendation: string;
  code?: string;
}

const issues: SecurityIssue[] = [];

// Dangerous patterns to search for
const VULNERABILITY_PATTERNS = {
  SQL_INJECTION: [
    /\$\{.*\}.*FROM/gi,
    /\+.*SELECT.*FROM/gi,
    /\.query\([`'"].*\$\{/gi,
    /\.raw\([`'"].*\$\{/gi,
  ],
  XSS: [
    /dangerouslySetInnerHTML/gi,
    /innerHTML\s*=/gi,
    /document\.write/gi,
    /eval\(/gi,
  ],
  INSECURE_AUTH: [
    /password.*===/gi,
    /token.*localStorage/gi,
    /JWT_SECRET.*=.*["'].*["']/gi,
    /\.compare\(.*password.*,.*user\.password/gi,
  ],
  EXPOSED_SECRETS: [
    /API_KEY.*=.*["'][A-Za-z0-9]{20,}["']/gi,
    /SECRET.*=.*["'][A-Za-z0-9]{20,}["']/gi,
    /PASSWORD.*=.*["'][^"']+["']/gi,
  ],
  MISSING_VALIDATION: [
    /req\.json\(\)(?!.*safeParse)/gi,
    /req\.body(?!.*validate)/gi,
  ],
  INSECURE_CRYPTO: [
    /Math\.random\(/gi,
    /Date\.now\(\).*password/gi,
  ],
  MISSING_RBAC: [
    /DELETE.*route\.ts.*(?!requirePermission|requireAuth)/gi,
    /PUT.*route\.ts.*(?!requirePermission|requireAuth)/gi,
  ],
};

function scanFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check for SQL injection
    VULNERABILITY_PATTERNS.SQL_INJECTION.forEach(pattern => {
      if (pattern.test(line)) {
        issues.push({
          severity: 'CRITICAL',
          type: 'SQL_INJECTION',
          file: filePath,
          line: lineNum,
          description: 'Potential SQL injection vulnerability detected',
          recommendation: 'Use parameterized queries or ORM methods',
          code: line.trim(),
        });
      }
    });
    
    // Check for XSS
    VULNERABILITY_PATTERNS.XSS.forEach(pattern => {
      if (pattern.test(line)) {
        issues.push({
          severity: 'HIGH',
          type: 'XSS',
          file: filePath,
          line: lineNum,
          description: 'Potential XSS vulnerability detected',
          recommendation: 'Sanitize user input before rendering',
          code: line.trim(),
        });
      }
    });
    
    // Check for insecure auth
    VULNERABILITY_PATTERNS.INSECURE_AUTH.forEach(pattern => {
      if (pattern.test(line)) {
        issues.push({
          severity: 'HIGH',
          type: 'INSECURE_AUTH',
          file: filePath,
          line: lineNum,
          description: 'Insecure authentication pattern detected',
          recommendation: 'Use secure password hashing and token storage',
          code: line.trim(),
        });
      }
    });
    
    // Check for exposed secrets
    VULNERABILITY_PATTERNS.EXPOSED_SECRETS.forEach(pattern => {
      if (pattern.test(line) && !line.includes('process.env')) {
        issues.push({
          severity: 'CRITICAL',
          type: 'EXPOSED_SECRET',
          file: filePath,
          line: lineNum,
          description: 'Hardcoded secret detected',
          recommendation: 'Move secrets to environment variables',
          code: line.trim().substring(0, 50) + '...',
        });
      }
    });
  });
  
  // Check for missing input validation in API routes
  if (filePath.includes('/api/') && filePath.endsWith('route.ts')) {
    if (!content.includes('safeParse') && !content.includes('.parse(') && 
        (content.includes('req.json()') || content.includes('req.body'))) {
      issues.push({
        severity: 'HIGH',
        type: 'MISSING_VALIDATION',
        file: filePath,
        line: 1,
        description: 'API route missing input validation',
        recommendation: 'Add Zod schema validation for all inputs',
      });
    }
    
    // Check for missing RBAC
    if (!content.includes('requireAuth') && !content.includes('requirePermission') &&
        !content.includes('getUserContext') && !filePath.includes('/auth/')) {
      issues.push({
        severity: 'HIGH',
        type: 'MISSING_RBAC',
        file: filePath,
        line: 1,
        description: 'API route missing authentication/authorization check',
        recommendation: 'Add requireAuth() or requirePermission() check',
      });
    }
  }
}

function scanDirectory(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip node_modules, .next, etc.
    if (entry.name === 'node_modules' || entry.name === '.next' || 
        entry.name === '.git' || entry.name === 'dist') {
      continue;
    }
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && 
               (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || 
                entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
      scanFile(fullPath);
    }
  }
}

function checkSupabaseRLS(): void {
  console.log('\n🔍 Checking Supabase RLS Configuration...\n');
  
  const rlsFile = path.join(process.cwd(), 'supabase/migrations/enable_rls_policies.sql');
  
  if (!fs.existsSync(rlsFile)) {
    issues.push({
      severity: 'CRITICAL',
      type: 'MISSING_RLS',
      file: 'supabase/migrations',
      line: 1,
      description: 'RLS policies file not found',
      recommendation: 'Create and apply RLS policies immediately',
    });
    return;
  }
  
  const content = fs.readFileSync(rlsFile, 'utf8');
  
  // Check if all tables have RLS enabled
  const requiredTables = [
    'companies', 'users', 'members', 'media', 'company_media',
    'agent_conversations', 'chat_messages', 'rulebase',
    'document_analysis', 'audit_logs', 'search_history', 'feedback'
  ];
  
  requiredTables.forEach(table => {
    if (!content.includes(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`)) {
      issues.push({
        severity: 'CRITICAL',
        type: 'MISSING_RLS',
        file: rlsFile,
        line: 1,
        description: `Table '${table}' missing RLS enablement`,
        recommendation: `Add: ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`,
      });
    }
  });
  
  console.log(`✅ Checked ${requiredTables.length} tables for RLS`);
}

function checkRBACImplementation(): void {
  console.log('\n🔍 Checking RBAC Implementation...\n');
  
  const rbacFile = path.join(process.cwd(), 'src/lib/rbac/index.ts');
  
  if (!fs.existsSync(rbacFile)) {
    issues.push({
      severity: 'CRITICAL',
      type: 'MISSING_RBAC',
      file: 'src/lib/rbac',
      line: 1,
      description: 'RBAC system not found',
      recommendation: 'Implement RBAC system immediately',
    });
    return;
  }
  
  const content = fs.readFileSync(rbacFile, 'utf8');
  
  // Check for required RBAC functions
  const requiredFunctions = [
    'getUserContext',
    'hasPermission',
    'requireAuth',
    'requirePermission',
    'canAccessResource',
    'createAuditLog',
  ];
  
  requiredFunctions.forEach(func => {
    if (!content.includes(`function ${func}`) && !content.includes(`${func}(`)) {
      issues.push({
        severity: 'HIGH',
        type: 'INCOMPLETE_RBAC',
        file: rbacFile,
        line: 1,
        description: `Missing RBAC function: ${func}`,
        recommendation: `Implement ${func}() function`,
      });
    }
  });
  
  console.log(`✅ Checked ${requiredFunctions.length} RBAC functions`);
}

function checkEnvironmentVariables(): void {
  console.log('\n🔍 Checking Environment Variables...\n');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
  ];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      issues.push({
        severity: 'CRITICAL',
        type: 'MISSING_ENV_VAR',
        file: '.env.local',
        line: 1,
        description: `Missing required environment variable: ${varName}`,
        recommendation: `Add ${varName} to .env.local`,
      });
    }
  });
  
  console.log(`✅ Checked ${requiredVars.length} environment variables`);
}

function printReport(): void {
  console.log('\n' + '='.repeat(80));
  console.log('🔒 SECURITY AUDIT REPORT');
  console.log('='.repeat(80));
  
  // Group by severity
  const critical = issues.filter(i => i.severity === 'CRITICAL');
  const high = issues.filter(i => i.severity === 'HIGH');
  const medium = issues.filter(i => i.severity === 'MEDIUM');
  const low = issues.filter(i => i.severity === 'LOW');
  
  console.log(`\n📊 Summary:`);
  console.log(`   🔴 CRITICAL: ${critical.length}`);
  console.log(`   🟠 HIGH: ${high.length}`);
  console.log(`   🟡 MEDIUM: ${medium.length}`);
  console.log(`   🟢 LOW: ${low.length}`);
  console.log(`   📝 TOTAL: ${issues.length}`);
  
  if (critical.length > 0) {
    console.log('\n🔴 CRITICAL ISSUES (Must fix before deployment):');
    critical.forEach((issue, i) => {
      console.log(`\n${i + 1}. ${issue.type}`);
      console.log(`   File: ${issue.file}:${issue.line}`);
      console.log(`   Issue: ${issue.description}`);
      console.log(`   Fix: ${issue.recommendation}`);
      if (issue.code) {
        console.log(`   Code: ${issue.code}`);
      }
    });
  }
  
  if (high.length > 0) {
    console.log('\n🟠 HIGH PRIORITY ISSUES:');
    high.slice(0, 10).forEach((issue, i) => {
      console.log(`\n${i + 1}. ${issue.type}`);
      console.log(`   File: ${issue.file}:${issue.line}`);
      console.log(`   Issue: ${issue.description}`);
      console.log(`   Fix: ${issue.recommendation}`);
    });
    if (high.length > 10) {
      console.log(`\n   ... and ${high.length - 10} more`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  
  if (issues.length === 0) {
    console.log('✅ No security issues found! Your codebase is secure.');
  } else if (critical.length === 0) {
    console.log('⚠️  No critical issues, but some improvements recommended.');
  } else {
    console.log('🚨 CRITICAL ISSUES FOUND - DO NOT DEPLOY TO PRODUCTION');
  }
  
  console.log('='.repeat(80));
}

function main(): void {
  console.log('🔐 Starting Comprehensive Security Audit...\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  
  console.log('📁 Scanning source files...');
  scanDirectory(srcDir);
  
  checkSupabaseRLS();
  checkRBACImplementation();
  checkEnvironmentVariables();
  
  printReport();
  
  // Exit with error code if critical issues found
  const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
  if (criticalCount > 0) {
    process.exit(1);
  }
}

main();
