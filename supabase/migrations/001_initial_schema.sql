-- Poligap MongoDB to Supabase Migration
-- Phase 1: Initial Schema Setup
-- Created: 2025-10-09

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- COMPANIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  enable_knowledge_base BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for company lookups
CREATE INDEX idx_companies_company_id ON companies(company_id);

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  unique_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  country TEXT,
  dob TEXT,
  mobile TEXT,
  profile_image TEXT,
  profile_created_on TEXT,
  about TEXT,
  banner_image TEXT,
  banner_color TEXT,
  banner_type TEXT,
  banner_y_offset INTEGER,
  designation TEXT,
  role TEXT,
  member_status TEXT,
  company_name TEXT,
  reporting_manager_name TEXT,
  reporting_manager_email TEXT,
  created_by_name TEXT,
  created_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user lookups
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_unique_id ON users(unique_id);
CREATE INDEX idx_users_status ON users(status);

-- ============================================
-- MEMBERS TABLE (User-Company Junction)
-- ============================================
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'owner')),
  designation TEXT,
  department TEXT,
  reporting_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reporting_manager_name TEXT,
  reporting_manager_email TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Indexes for member lookups
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_company_id ON members(company_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_role ON members(role);

-- ============================================
-- MEDIA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_url TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size TEXT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DELETED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for media lookups
CREATE INDEX idx_media_company_id ON media(company_id);
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_media_status ON media(status);

-- ============================================
-- COMPANY_MEDIA (Junction Table)
-- ============================================
CREATE TABLE IF NOT EXISTS company_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, media_id)
);

CREATE INDEX idx_company_media_company ON company_media(company_id);
CREATE INDEX idx_company_media_media ON company_media(media_id);

-- ============================================
-- AGENT_CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_name TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  enterprise_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID,
  summary TEXT DEFAULT 'This is a summary of the conversation',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for conversation lookups
CREATE INDEX idx_agent_conversations_company ON agent_conversations(company_id);
CREATE INDEX idx_agent_conversations_user ON agent_conversations(enterprise_user_id);
CREATE INDEX idx_agent_conversations_status ON agent_conversations(status);

-- ============================================
-- CHAT_MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL UNIQUE,
  user_query TEXT NOT NULL,
  ai_response TEXT,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'ai')),
  tool_calls JSONB DEFAULT '[]'::jsonb,
  extra_data JSONB,
  images TEXT[],
  videos TEXT[],
  audio JSONB,
  response_audio JSONB,
  streaming_error BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for message lookups
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(conversation_id, created_at);
CREATE INDEX idx_chat_messages_message_id ON chat_messages(message_id);

-- ============================================
-- RULEBASE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rulebase (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  source_type TEXT DEFAULT 'text' CHECK (source_type IN ('text', 'file')),
  file_name TEXT,
  file_content TEXT,
  active BOOLEAN DEFAULT true,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for rulebase lookups
CREATE INDEX idx_rulebase_user_id ON rulebase(user_id, active);
CREATE INDEX idx_rulebase_company_id ON rulebase(company_id, active);
CREATE INDEX idx_rulebase_name_desc ON rulebase USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ============================================
-- DOCUMENT_ANALYSIS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS document_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  title TEXT,
  compliance_standard TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for document analysis lookups
CREATE INDEX idx_document_analysis_user ON document_analysis(user_id);
CREATE INDEX idx_document_analysis_company ON document_analysis(company_id);
CREATE INDEX idx_document_analysis_doc_id ON document_analysis(document_id);

-- ============================================
-- AUDIT_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit log lookups
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- SEARCH_HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enterprise_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  text JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for search history lookups
CREATE INDEX idx_search_history_user ON search_history(enterprise_user_id);
CREATE INDEX idx_search_history_company ON search_history(company_id);

-- ============================================
-- FEEDBACK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  satisfaction TEXT NOT NULL,
  text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for feedback lookups
CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_company ON feedback(company_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_conversations_updated_at BEFORE UPDATE ON agent_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rulebase_updated_at BEFORE UPDATE ON rulebase
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_analysis_updated_at BEFORE UPDATE ON document_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_logs_updated_at BEFORE UPDATE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_search_history_updated_at BEFORE UPDATE ON search_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rulebase ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies (these will be refined based on auth requirements)
-- For now, allowing authenticated users to access their own data

-- Companies: Users can read companies they're members of
CREATE POLICY "Users can view their companies" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM members WHERE user_id = auth.uid()
    )
  );

-- Users: Users can view their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Members: Users can view members of their companies
CREATE POLICY "Users can view company members" ON members
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM members WHERE user_id = auth.uid()
    )
  );

-- Chat messages: Users can view their own conversations
CREATE POLICY "Users can view their chat messages" ON chat_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM agent_conversations WHERE enterprise_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their chat messages" ON chat_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM agent_conversations WHERE enterprise_user_id = auth.uid()
    )
  );

-- Agent conversations: Users can manage their own conversations
CREATE POLICY "Users can view their conversations" ON agent_conversations
  FOR SELECT USING (enterprise_user_id = auth.uid());

CREATE POLICY "Users can insert their conversations" ON agent_conversations
  FOR INSERT WITH CHECK (enterprise_user_id = auth.uid());

CREATE POLICY "Users can update their conversations" ON agent_conversations
  FOR UPDATE USING (enterprise_user_id = auth.uid());

-- Rulebase: Users can manage their company's rulebases
CREATE POLICY "Users can view company rulebases" ON rulebase
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM members WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Users can insert rulebases" ON rulebase
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM members WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

-- Document analysis: Users can view their company's analyses
CREATE POLICY "Users can view company document analyses" ON document_analysis
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM members WHERE user_id = auth.uid()
    )
  );

-- Media: Users can view their company's media
CREATE POLICY "Users can view company media" ON media
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM members WHERE user_id = auth.uid()
    )
  );

-- Audit logs: Users can view their own audit logs
CREATE POLICY "Users can view their audit logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- Search history: Users can manage their own search history
CREATE POLICY "Users can view their search history" ON search_history
  FOR SELECT USING (enterprise_user_id = auth.uid());

CREATE POLICY "Users can insert their search history" ON search_history
  FOR INSERT WITH CHECK (enterprise_user_id = auth.uid());

-- Feedback: Users can manage their own feedback
CREATE POLICY "Users can view their feedback" ON feedback
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert feedback" ON feedback
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
