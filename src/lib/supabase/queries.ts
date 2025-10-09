import { createClient } from './server';

// ============================================
// COMPANIES
// ============================================
export async function getCompany(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('company_id', companyId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createCompany(company: {
  company_id: string;
  name: string;
  enable_knowledge_base?: boolean;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('companies')
    .insert([company])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// USERS
// ============================================
export async function getUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserByEmail(email: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createUser(user: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .insert([user])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUser(userId: string, updates: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// MEMBERS
// ============================================
export async function getCompanyMembers(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('members')
    .select(`
      *,
      user:users(*)
    `)
    .eq('company_id', companyId)
    .eq('status', 'ACTIVE');
  
  if (error) throw error;
  return data;
}

export async function createMember(member: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('members')
    .insert([member])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// AGENT CONVERSATIONS
// ============================================
export async function getConversation(conversationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('agent_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserConversations(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('agent_conversations')
    .select('*')
    .eq('enterprise_user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createConversation(conversation: {
  chat_name: string;
  company_id: string;
  enterprise_user_id: string;
  agent_id?: string;
  summary?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('agent_conversations')
    .insert([conversation])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateConversation(conversationId: string, updates: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('agent_conversations')
    .update(updates)
    .eq('id', conversationId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// CHAT MESSAGES
// ============================================
export async function getChatMessages(conversationId: string, limit = 100) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

export async function createChatMessage(message: {
  conversation_id: string;
  message_id: string;
  user_query: string;
  message_type: 'user' | 'ai';
  ai_response?: string;
  tool_calls?: any[];
  extra_data?: any;
  images?: string[];
  videos?: string[];
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([message])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateChatMessage(messageId: string, updates: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .update(updates)
    .eq('message_id', messageId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// RULEBASE
// ============================================
export async function getRulebase(rulebaseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rulebase')
    .select('*')
    .eq('id', rulebaseId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserRulebases(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rulebase')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getCompanyRulebases(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rulebase')
    .select('*')
    .eq('company_id', companyId)
    .eq('active', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createRulebase(rulebase: {
  name: string;
  description?: string;
  tags?: string[];
  source_type?: 'text' | 'file';
  file_name?: string;
  file_content?: string;
  user_id?: string;
  company_id?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rulebase')
    .insert([rulebase])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateRulebase(rulebaseId: string, updates: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rulebase')
    .update(updates)
    .eq('id', rulebaseId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteRulebase(rulebaseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rulebase')
    .update({ active: false })
    .eq('id', rulebaseId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// DOCUMENT ANALYSIS
// ============================================
export async function getDocumentAnalysis(analysisId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('document_analysis')
    .select('*')
    .eq('id', analysisId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserDocumentAnalyses(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('document_analysis')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createDocumentAnalysis(analysis: {
  user_id: string;
  company_id: string;
  document_id: string;
  title?: string;
  compliance_standard?: string;
  score?: number;
  metrics?: any;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('document_analysis')
    .insert([analysis])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// AUDIT LOGS
// ============================================
export async function createAuditLog(log: {
  user_id: string;
  company_id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: any;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .insert([log])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserAuditLogs(userId: string, limit = 50) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

// ============================================
// MEDIA
// ============================================
export async function getMedia(mediaId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('id', mediaId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getCompanyMedia(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createMedia(media: {
  file_url?: string;
  file_name: string;
  file_type: string;
  file_size?: string;
  company_id: string;
  uploaded_by: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('media')
    .insert([media])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// SEARCH HISTORY
// ============================================
export async function createSearchHistory(history: {
  enterprise_user_id: string;
  company_id: string;
  text: any[];
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('search_history')
    .insert([history])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// FEEDBACK
// ============================================
export async function createFeedback(feedback: {
  user_id: string;
  company_id: string;
  satisfaction: string;
  text?: string;
}) {
  const supabase = await createClient();
  const { data, error} = await supabase
    .from('feedback')
    .insert([feedback])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
