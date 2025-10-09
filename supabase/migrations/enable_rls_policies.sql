-- ================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ================================================
-- This migration enables RLS and creates comprehensive
-- security policies for multi-tenant data isolation
-- ================================================

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

-- ================================================
-- COMPANIES TABLE POLICIES
-- ================================================

-- Users can view their own company
CREATE POLICY "Users can view own company"
ON companies FOR SELECT
USING (
  id IN (
    SELECT company_id FROM members
    WHERE user_id = auth.uid() AND status = 'ACTIVE'
  )
);

-- Only owners can update company details
CREATE POLICY "Owners can update company"
ON companies FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM members
    WHERE members.company_id = companies.id
    AND members.user_id = auth.uid()
    AND members.role = 'owner'
    AND members.status = 'ACTIVE'
  )
);

-- Only system can insert companies (via service role)
CREATE POLICY "Service role can insert companies"
ON companies FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ================================================
-- USERS TABLE POLICIES
-- ================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (id = auth.uid());

-- Users can view profiles of members in their company
CREATE POLICY "Users can view company member profiles"
ON users FOR SELECT
USING (
  id IN (
    SELECT m1.user_id FROM members m1
    WHERE m1.company_id IN (
      SELECT m2.company_id FROM members m2
      WHERE m2.user_id = auth.uid() AND m2.status = 'ACTIVE'
    )
    AND m1.status = 'ACTIVE'
  )
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (id = auth.uid());

-- Service role can insert users
CREATE POLICY "Service role can insert users"
ON users FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ================================================
-- MEMBERS TABLE POLICIES (RBAC CORE)
-- ================================================

-- Users can view members in their company
CREATE POLICY "View company members"
ON members FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = auth.uid() AND status = 'ACTIVE'
  )
);

-- Admins and owners can manage members
CREATE POLICY "Admins/owners manage members"
ON members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND company_id = members.company_id
    AND role IN ('admin', 'owner')
    AND status = 'ACTIVE'
  )
);

-- ================================================
-- MEDIA TABLE POLICIES
-- ================================================

-- Users can view their own media
CREATE POLICY "Users can view own media"
ON media FOR SELECT
USING (user_id = auth.uid());

-- Users can view company media
CREATE POLICY "Users can view company media"
ON media FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = auth.uid() AND status = 'ACTIVE'
  )
);

-- Users can create their own media
CREATE POLICY "Users can create own media"
ON media FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own media
CREATE POLICY "Users can update own media"
ON media FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own media
CREATE POLICY "Users can delete own media"
ON media FOR DELETE
USING (user_id = auth.uid());

-- Admins can delete company media
CREATE POLICY "Admins can delete company media"
ON media FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND company_id = media.company_id
    AND role IN ('admin', 'owner')
    AND status = 'ACTIVE'
  )
);

-- ================================================
-- COMPANY_MEDIA TABLE POLICIES
-- ================================================

-- Users can view their company's media
CREATE POLICY "View company media"
ON company_media FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = auth.uid() AND status = 'ACTIVE'
  )
);

-- Admins can manage company media
CREATE POLICY "Admins manage company media"
ON company_media FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND company_id = company_media.company_id
    AND role IN ('admin', 'owner')
    AND status = 'ACTIVE'
  )
);

-- ================================================
-- AGENT_CONVERSATIONS TABLE POLICIES
-- ================================================

-- Users can view their own conversations
CREATE POLICY "View own conversations"
ON agent_conversations FOR SELECT
USING (enterprise_user_id = auth.uid());

-- Users can create their own conversations
CREATE POLICY "Create own conversations"
ON agent_conversations FOR INSERT
WITH CHECK (enterprise_user_id = auth.uid());

-- Users can update their own conversations
CREATE POLICY "Update own conversations"
ON agent_conversations FOR UPDATE
USING (enterprise_user_id = auth.uid());

-- Users can delete their own conversations
CREATE POLICY "Delete own conversations"
ON agent_conversations FOR DELETE
USING (enterprise_user_id = auth.uid());

-- ================================================
-- CHAT_MESSAGES TABLE POLICIES
-- ================================================

-- Users can view messages from their conversations
CREATE POLICY "View own messages"
ON chat_messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM agent_conversations
    WHERE enterprise_user_id = auth.uid()
  )
);

-- Users can create messages in their conversations
CREATE POLICY "Create own messages"
ON chat_messages FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT id FROM agent_conversations
    WHERE enterprise_user_id = auth.uid()
  )
);

-- Users can update their own messages
CREATE POLICY "Update own messages"
ON chat_messages FOR UPDATE
USING (
  conversation_id IN (
    SELECT id FROM agent_conversations
    WHERE enterprise_user_id = auth.uid()
  )
);

-- Users can delete their own messages
CREATE POLICY "Delete own messages"
ON chat_messages FOR DELETE
USING (
  conversation_id IN (
    SELECT id FROM agent_conversations
    WHERE enterprise_user_id = auth.uid()
  )
);

-- ================================================
-- RULEBASE TABLE POLICIES
-- ================================================

-- Users can view their own rulebases
CREATE POLICY "View own rulebases"
ON rulebase FOR SELECT
USING (user_id = auth.uid());

-- Users can view company rulebases
CREATE POLICY "View company rulebases"
ON rulebase FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = auth.uid() AND status = 'ACTIVE'
  )
);

-- Users can create their own rulebases
CREATE POLICY "Create own rulebases"
ON rulebase FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own rulebases
CREATE POLICY "Update own rulebases"
ON rulebase FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own rulebases
CREATE POLICY "Delete own rulebases"
ON rulebase FOR DELETE
USING (user_id = auth.uid());

-- Admins can manage company rulebases
CREATE POLICY "Admins manage company rulebases"
ON rulebase FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND company_id = rulebase.company_id
    AND role IN ('admin', 'owner')
    AND status = 'ACTIVE'
  )
);

-- ================================================
-- DOCUMENT_ANALYSIS TABLE POLICIES
-- ================================================

-- Users can view their own analyses
CREATE POLICY "View own analyses"
ON document_analysis FOR SELECT
USING (user_id = auth.uid());

-- Users can view company analyses
CREATE POLICY "View company analyses"
ON document_analysis FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = auth.uid() AND status = 'ACTIVE'
  )
);

-- Users can create their own analyses
CREATE POLICY "Create own analyses"
ON document_analysis FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own analyses
CREATE POLICY "Update own analyses"
ON document_analysis FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own analyses
CREATE POLICY "Delete own analyses"
ON document_analysis FOR DELETE
USING (user_id = auth.uid());

-- ================================================
-- AUDIT_LOGS TABLE POLICIES
-- ================================================

-- Users can view their own audit logs
CREATE POLICY "View own audit logs"
ON audit_logs FOR SELECT
USING (user_id = auth.uid());

-- Admins can view company audit logs
CREATE POLICY "Admins view company audit logs"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND company_id = audit_logs.company_id
    AND role IN ('admin', 'owner')
    AND status = 'ACTIVE'
  )
);

-- System can create audit logs
CREATE POLICY "Service role creates audit logs"
ON audit_logs FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'service_role' OR user_id = auth.uid());

-- ================================================
-- SEARCH_HISTORY TABLE POLICIES
-- ================================================

-- Users can view their own search history
CREATE POLICY "View own search history"
ON search_history FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own search history
CREATE POLICY "Create own search history"
ON search_history FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can delete their own search history
CREATE POLICY "Delete own search history"
ON search_history FOR DELETE
USING (user_id = auth.uid());

-- ================================================
-- FEEDBACK TABLE POLICIES
-- ================================================

-- Users can view their own feedback
CREATE POLICY "View own feedback"
ON feedback FOR SELECT
USING (user_id = auth.uid());

-- Admins can view company feedback
CREATE POLICY "Admins view company feedback"
ON feedback FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND company_id = feedback.company_id
    AND role IN ('admin', 'owner')
    AND status = 'ACTIVE'
  )
);

-- Users can create feedback
CREATE POLICY "Users create feedback"
ON feedback FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ================================================
-- HELPER FUNCTIONS FOR RBAC
-- ================================================

-- Function to check if user is admin/owner
CREATE OR REPLACE FUNCTION is_admin_or_owner(check_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND company_id = check_company_id
    AND role IN ('admin', 'owner')
    AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is in company
CREATE OR REPLACE FUNCTION is_company_member(check_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND company_id = check_company_id
    AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's company ID
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT company_id FROM members
    WHERE user_id = auth.uid() AND status = 'ACTIVE'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role in company
CREATE OR REPLACE FUNCTION get_user_role(check_company_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM members
    WHERE user_id = auth.uid()
    AND company_id = check_company_id
    AND status = 'ACTIVE'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Run these to verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Run these to list all policies:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Test RLS as a user:
-- SET ROLE authenticated;
-- SET request.jwt.claim.sub = '<user_uuid>';
-- SELECT * FROM users; -- Should only see own profile

COMMENT ON TABLE companies IS 'RLS Enabled: Users can only access their company data';
COMMENT ON TABLE users IS 'RLS Enabled: Users can view own profile and company member profiles';
COMMENT ON TABLE members IS 'RLS Enabled: Core RBAC table - controls all permissions';
COMMENT ON TABLE media IS 'RLS Enabled: Users can manage own media, admins can manage company media';
COMMENT ON TABLE agent_conversations IS 'RLS Enabled: Users can only access their own conversations';
COMMENT ON TABLE chat_messages IS 'RLS Enabled: Users can only access messages from their conversations';
COMMENT ON TABLE rulebase IS 'RLS Enabled: Users can manage own rulebases, view company rulebases';
COMMENT ON TABLE document_analysis IS 'RLS Enabled: Users can manage own analyses, view company analyses';
COMMENT ON TABLE audit_logs IS 'RLS Enabled: Users view own logs, admins view company logs';
COMMENT ON TABLE search_history IS 'RLS Enabled: Users can only access their own search history';
COMMENT ON TABLE feedback IS 'RLS Enabled: Users view own feedback, admins view company feedback';
