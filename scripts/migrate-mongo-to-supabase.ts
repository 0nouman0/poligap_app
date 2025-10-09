/**
 * MongoDB to Supabase Data Migration Script
 * 
 * This script migrates data from MongoDB collections to Supabase PostgreSQL tables.
 * 
 * Usage:
 *   npx ts-node scripts/migrate-mongo-to-supabase.ts [--collection=<name>] [--dry-run] [--limit=<number>]
 * 
 * Options:
 *   --collection=<name>  Migrate only specific collection (companies, users, rulebase, etc.)
 *   --dry-run            Preview migration without writing data
 *   --limit=<number>     Limit number of records per collection (for testing)
 *   --skip=<number>      Skip first N records (for batch processing)
 * 
 * Examples:
 *   # Dry run - preview all migrations
 *   npx ts-node scripts/migrate-mongo-to-supabase.ts --dry-run
 * 
 *   # Migrate only rulebase collection with limit
 *   npx ts-node scripts/migrate-mongo-to-supabase.ts --collection=rulebase --limit=100
 * 
 *   # Migrate all data
 *   npx ts-node scripts/migrate-mongo-to-supabase.ts
 */

import { MongoClient, ObjectId } from 'mongodb';
import { createClient } from '@supabase/supabase-js';

// =====================================================
// CONFIGURATION
// =====================================================

const MONGODB_URI = process.env.MONGODB_URI || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BATCH_SIZE = 100; // Records per batch insert

// =====================================================
// TYPES
// =====================================================

interface MigrationOptions {
  collection?: string;
  dryRun: boolean;
  limit?: number;
  skip?: number;
}

interface MigrationResult {
  collection: string;
  mongoCount: number;
  migratedCount: number;
  errors: string[];
  duration: number;
}

// =====================================================
// UTILITIES
// =====================================================

function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {
    dryRun: false,
  };

  args.forEach(arg => {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--collection=')) {
      options.collection = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--skip=')) {
      options.skip = parseInt(arg.split('=')[1], 10);
    }
  });

  return options;
}

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warn: '\x1b[33m',    // Yellow
  };
  const reset = '\x1b[0m';
  const icons = {
    info: 'ℹ',
    success: '✓',
    error: '✗',
    warn: '⚠',
  };

  console.log(`${colors[type]}${icons[type]} ${message}${reset}`);
}

// =====================================================
// DATA TRANSFORMERS
// =====================================================

function transformCompany(doc: any) {
  return {
    company_id: doc._id?.toString() || doc.companyId?.toString(),
    name: doc.name || doc.companyName || 'Unknown Company',
    enable_knowledge_base: doc.enableKnowledgeBase || false,
    created_at: doc.createdAt || new Date(),
    updated_at: doc.updatedAt || new Date(),
  };
}

function transformUser(doc: any) {
  return {
    user_id: doc._id?.toString() || doc.userId?.toString(),
    email: doc.email,
    name: doc.name || 'User',
    unique_id: doc.uniqueId || `user_${doc._id?.toString()}`,
    status: doc.status || 'ACTIVE',
    country: doc.country || null,
    dob: doc.dob || null,
    mobile: doc.mobile || null,
    profile_image: doc.profileImage || null,
    about: doc.about || null,
    designation: doc.designation || null,
    company_name: doc.companyName || null,
    profile_created_on: doc.profileCreatedOn || doc.createdAt || new Date(),
    created_at: doc.createdAt || new Date(),
    updated_at: doc.updatedAt || new Date(),
  };
}

function transformMember(doc: any) {
  return {
    user_id: doc.userId?.toString() || doc.enterpriseUserId?.toString(),
    company_id: doc.companyId?.toString(),
    role: doc.role || 'member',
    status: doc.status || 'ACTIVE',
    joined_at: doc.joinedAt || doc.createdAt || new Date(),
    created_at: doc.createdAt || new Date(),
    updated_at: doc.updatedAt || new Date(),
  };
}

function transformConversation(doc: any) {
  return {
    chat_name: doc.chatName || 'Conversation',
    company_id: doc.companyId?.toString(),
    enterprise_user_id: doc.enterpriseUserId?.toString(),
    agent_id: doc.agentId || null,
    summary: doc.summary || null,
    status: doc.status || 'active',
    created_at: doc.createdAt || new Date(),
    updated_at: doc.updatedAt || new Date(),
  };
}

function transformChatMessage(doc: any) {
  return {
    conversation_id: doc.conversationId?.toString(),
    message_id: doc.messageId || doc._id?.toString(),
    user_query: doc.userQuery || doc.query || '',
    ai_response: doc.aiResponse || doc.response || null,
    message_type: doc.messageType || 'user',
    tool_calls: doc.toolCalls || null,
    extra_data: doc.extraData || null,
    images: doc.images || null,
    videos: doc.videos || null,
    created_at: doc.createdAt || new Date(),
    updated_at: doc.updatedAt || new Date(),
  };
}

function transformRulebase(doc: any) {
  return {
    name: doc.name,
    description: doc.description || null,
    tags: doc.tags || null,
    source_type: doc.sourceType || 'text',
    file_name: doc.fileName || null,
    file_content: doc.fileContent || null,
    user_id: doc.userId?.toString() || null,
    company_id: doc.companyId?.toString() || null,
    active: doc.active !== false,
    created_at: doc.createdAt || new Date(),
    updated_at: doc.updatedAt || new Date(),
  };
}

function transformDocumentAnalysis(doc: any) {
  return {
    user_id: doc.userId?.toString(),
    company_id: doc.companyId?.toString(),
    document_id: doc.documentId?.toString() || doc._id?.toString(),
    title: doc.title || 'Document Analysis',
    compliance_standard: doc.complianceStandard || null,
    score: doc.score || null,
    metrics: doc.metrics || null,
    created_at: doc.createdAt || new Date(),
    updated_at: doc.updatedAt || new Date(),
  };
}

function transformAuditLog(doc: any) {
  return {
    user_id: doc.userId?.toString(),
    company_id: doc.companyId?.toString(),
    action: doc.action,
    entity_type: doc.entityType || null,
    entity_id: doc.entityId?.toString() || null,
    metadata: doc.metadata || null,
    created_at: doc.createdAt || new Date(),
  };
}

function transformMedia(doc: any) {
  return {
    file_url: doc.fileUrl || doc.url || null,
    file_name: doc.fileName || doc.name || 'Unknown',
    file_type: doc.fileType || doc.mimeType || 'application/octet-stream',
    file_size: doc.fileSize?.toString() || null,
    company_id: doc.companyId?.toString(),
    uploaded_by: doc.uploadedBy?.toString() || doc.userId?.toString(),
    status: doc.status || 'ACTIVE',
    created_at: doc.createdAt || new Date(),
    updated_at: doc.updatedAt || new Date(),
  };
}

function transformSearchHistory(doc: any) {
  return {
    enterprise_user_id: doc.enterpriseUserId?.toString(),
    company_id: doc.companyId?.toString(),
    text: doc.text || [],
    created_at: doc.createdAt || new Date(),
  };
}

function transformFeedback(doc: any) {
  return {
    user_id: doc.userId?.toString(),
    company_id: doc.companyId?.toString(),
    satisfaction: doc.satisfaction || 'neutral',
    text: doc.text || null,
    created_at: doc.createdAt || new Date(),
  };
}

// =====================================================
// MIGRATION MAPPINGS
// =====================================================

const MIGRATION_MAP = {
  companies: {
    supabaseTable: 'companies',
    transformer: transformCompany,
    uniqueKey: 'company_id',
  },
  users: {
    supabaseTable: 'users',
    transformer: transformUser,
    uniqueKey: 'user_id',
  },
  members: {
    supabaseTable: 'members',
    transformer: transformMember,
    uniqueKey: null, // Composite key: user_id + company_id
  },
  agentConversations: {
    supabaseTable: 'agent_conversations',
    transformer: transformConversation,
    uniqueKey: null, // Auto-generated ID
  },
  chatMessages: {
    supabaseTable: 'chat_messages',
    transformer: transformChatMessage,
    uniqueKey: 'message_id',
  },
  rulebase: {
    supabaseTable: 'rulebase',
    transformer: transformRulebase,
    uniqueKey: null, // Auto-generated ID
  },
  documentAnalyses: {
    supabaseTable: 'document_analysis',
    transformer: transformDocumentAnalysis,
    uniqueKey: null, // Auto-generated ID
  },
  auditLogs: {
    supabaseTable: 'audit_logs',
    transformer: transformAuditLog,
    uniqueKey: null, // Auto-generated ID
  },
  media: {
    supabaseTable: 'media',
    transformer: transformMedia,
    uniqueKey: null, // Auto-generated ID
  },
  searchHistory: {
    supabaseTable: 'search_history',
    transformer: transformSearchHistory,
    uniqueKey: null, // Auto-generated ID
  },
  feedback: {
    supabaseTable: 'feedback',
    transformer: transformFeedback,
    uniqueKey: null, // Auto-generated ID
  },
};

// =====================================================
// MIGRATION LOGIC
// =====================================================

async function migrateCollection(
  mongoCollection: string,
  mongoDb: any,
  supabase: any,
  options: MigrationOptions
): Promise<MigrationResult> {
  const startTime = Date.now();
  const result: MigrationResult = {
    collection: mongoCollection,
    mongoCount: 0,
    migratedCount: 0,
    errors: [],
    duration: 0,
  };

  const config = MIGRATION_MAP[mongoCollection as keyof typeof MIGRATION_MAP];
  if (!config) {
    result.errors.push(`No migration config found for ${mongoCollection}`);
    return result;
  }

  try {
    // Get MongoDB collection
    const collection = mongoDb.collection(mongoCollection);
    
    // Count total documents
    result.mongoCount = await collection.countDocuments();
    log(`Found ${result.mongoCount} documents in ${mongoCollection}`, 'info');

    if (result.mongoCount === 0) {
      log(`Skipping ${mongoCollection} - no documents found`, 'warn');
      return result;
    }

    // Fetch documents with pagination
    const query = {};
    const limit = options.limit || result.mongoCount;
    const skip = options.skip || 0;

    const cursor = collection.find(query).skip(skip).limit(limit);
    const documents = await cursor.toArray();

    log(`Processing ${documents.length} documents from ${mongoCollection}...`, 'info');

    if (options.dryRun) {
      log('DRY RUN - Sample transformed document:', 'info');
      console.log(JSON.stringify(config.transformer(documents[0]), null, 2));
      result.migratedCount = documents.length;
      return result;
    }

    // Transform and batch insert
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      const transformedBatch = batch.map(doc => {
        try {
          return config.transformer(doc);
        } catch (error) {
          result.errors.push(`Transform error for doc ${doc._id}: ${error}`);
          return null;
        }
      }).filter(Boolean);

      if (transformedBatch.length === 0) continue;

      // Insert batch into Supabase
      const { data, error } = await supabase
        .from(config.supabaseTable)
        .upsert(transformedBatch, {
          onConflict: config.uniqueKey || undefined,
        });

      if (error) {
        result.errors.push(`Batch insert error: ${error.message}`);
        log(`Batch ${i}-${i + batch.length} failed: ${error.message}`, 'error');
      } else {
        result.migratedCount += transformedBatch.length;
        log(`Migrated batch ${i}-${i + batch.length} (${transformedBatch.length} records)`, 'success');
      }
    }
  } catch (error: any) {
    result.errors.push(`Collection migration error: ${error.message}`);
    log(`Error migrating ${mongoCollection}: ${error.message}`, 'error');
  }

  result.duration = Date.now() - startTime;
  return result;
}

// =====================================================
// MAIN MIGRATION FUNCTION
// =====================================================

async function main() {
  log('🚀 MongoDB to Supabase Migration Tool', 'info');
  log('========================================\n', 'info');

  const options = parseArgs();
  
  if (options.dryRun) {
    log('🔍 DRY RUN MODE - No data will be written', 'warn');
  }

  // Validate environment variables
  if (!MONGODB_URI) {
    log('Error: MONGODB_URI environment variable not set', 'error');
    process.exit(1);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    log('Error: Supabase environment variables not set', 'error');
    log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY', 'error');
    process.exit(1);
  }

  // Connect to MongoDB
  log('Connecting to MongoDB...', 'info');
  const mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  const mongoDb = mongoClient.db();
  log('Connected to MongoDB', 'success');

  // Connect to Supabase
  log('Connecting to Supabase...', 'info');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  log('Connected to Supabase', 'success');

  // Determine collections to migrate
  const collectionsToMigrate = options.collection 
    ? [options.collection]
    : Object.keys(MIGRATION_MAP);

  log(`\n📦 Migrating ${collectionsToMigrate.length} collection(s)...\n`, 'info');

  // Migrate each collection
  const results: MigrationResult[] = [];
  for (const collection of collectionsToMigrate) {
    log(`\n${'='.repeat(60)}`, 'info');
    log(`Migrating: ${collection}`, 'info');
    log('='.repeat(60), 'info');

    const result = await migrateCollection(
      collection,
      mongoDb,
      supabase,
      options
    );
    results.push(result);
  }

  // Print summary
  log(`\n${'='.repeat(60)}`, 'info');
  log('📊 MIGRATION SUMMARY', 'info');
  log('='.repeat(60), 'info');

  let totalMongo = 0;
  let totalMigrated = 0;
  let totalErrors = 0;

  results.forEach(result => {
    totalMongo += result.mongoCount;
    totalMigrated += result.migratedCount;
    totalErrors += result.errors.length;

    const status = result.errors.length === 0 ? '✓' : '⚠';
    log(
      `${status} ${result.collection}: ${result.migratedCount}/${result.mongoCount} migrated (${(result.duration / 1000).toFixed(2)}s)`,
      result.errors.length === 0 ? 'success' : 'warn'
    );

    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        log(`  → ${error}`, 'error');
      });
    }
  });

  log('', 'info');
  log(`Total MongoDB records: ${totalMongo}`, 'info');
  log(`Total migrated: ${totalMigrated}`, totalMigrated === totalMongo ? 'success' : 'warn');
  log(`Total errors: ${totalErrors}`, totalErrors === 0 ? 'success' : 'error');

  // Cleanup
  await mongoClient.close();
  log('\n✓ Migration complete!', 'success');
}

// =====================================================
// RUN MIGRATION
// =====================================================

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
