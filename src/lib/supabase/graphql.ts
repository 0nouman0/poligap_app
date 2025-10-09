/**
 * Supabase GraphQL Client
 * 
 * Use GraphQL for all data loading (REST only for auth)
 */

import { GraphQLClient } from 'graphql-request';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GraphQL endpoint
const graphqlEndpoint = `${SUPABASE_URL}/graphql/v1`;

// Create GraphQL client
export const graphqlClient = new GraphQLClient(graphqlEndpoint, {
  headers: {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  },
});

// Authenticated client factory
export function createAuthenticatedGraphQLClient(token: string) {
  return new GraphQLClient(graphqlEndpoint, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

// =====================================================
// QUERIES
// =====================================================

export const QUERIES = {
  // Get user by ID
  GET_USER: `
    query GetUser($userId: String!) {
      usersCollection(filter: { user_id: { eq: $userId } }) {
        edges {
          node {
            id
            user_id
            email
            name
            profile_image
            status
            company_name
            designation
            created_at
          }
        }
      }
    }
  `,

  // Get user conversations
  GET_USER_CONVERSATIONS: `
    query GetUserConversations($userId: String!) {
      agent_conversationsCollection(
        filter: { enterprise_user_id: { eq: $userId }, status: { eq: "active" } }
        orderBy: { updated_at: DescNullsLast }
      ) {
        edges {
          node {
            id
            chat_name
            summary
            created_at
            updated_at
          }
        }
      }
    }
  `,

  // Get conversation messages
  GET_CONVERSATION_MESSAGES: `
    query GetMessages($conversationId: String!) {
      chat_messagesCollection(
        filter: { conversation_id: { eq: $conversationId } }
        orderBy: { created_at: AscNullsFirst }
      ) {
        edges {
          node {
            id
            message_id
            user_query
            ai_response
            message_type
            images
            videos
            created_at
          }
        }
      }
    }
  `,

  // Get user rulebases
  GET_USER_RULEBASES: `
    query GetRulebases($userId: String!) {
      rulebaseCollection(
        filter: { user_id: { eq: $userId }, active: { eq: true } }
        orderBy: { created_at: DescNullsLast }
      ) {
        edges {
          node {
            id
            name
            description
            tags
            source_type
            file_name
            created_at
          }
        }
      }
    }
  `,

  // Get company media
  GET_COMPANY_MEDIA: `
    query GetMedia($companyId: String!) {
      mediaCollection(
        filter: { company_id: { eq: $companyId }, status: { eq: "ACTIVE" } }
        orderBy: { created_at: DescNullsLast }
      ) {
        edges {
          node {
            id
            file_url
            file_name
            file_type
            file_size
            uploaded_by
            created_at
          }
        }
      }
    }
  `,

  // Get document analyses
  GET_DOCUMENT_ANALYSES: `
    query GetAnalyses($userId: String!) {
      document_analysisCollection(
        filter: { user_id: { eq: $userId } }
        orderBy: { created_at: DescNullsLast }
      ) {
        edges {
          node {
            id
            title
            compliance_standard
            score
            metrics
            created_at
          }
        }
      }
    }
  `,

  // Get audit logs
  GET_AUDIT_LOGS: `
    query GetAuditLogs($userId: String!, $limit: Int = 50) {
      audit_logsCollection(
        filter: { user_id: { eq: $userId } }
        orderBy: { created_at: DescNullsLast }
        first: $limit
      ) {
        edges {
          node {
            id
            action
            entity_type
            entity_id
            metadata
            created_at
          }
        }
      }
    }
  `,
};

// =====================================================
// MUTATIONS
// =====================================================

export const MUTATIONS = {
  // Create conversation
  CREATE_CONVERSATION: `
    mutation CreateConversation($input: agent_conversationsInsertInput!) {
      insertIntoagent_conversationsCollection(objects: [$input]) {
        records {
          id
          chat_name
          status
          created_at
        }
      }
    }
  `,

  // Create message
  CREATE_MESSAGE: `
    mutation CreateMessage($input: chat_messagesInsertInput!) {
      insertIntochat_messagesCollection(objects: [$input]) {
        records {
          id
          message_id
          user_query
          ai_response
          created_at
        }
      }
    }
  `,

  // Create rulebase
  CREATE_RULEBASE: `
    mutation CreateRulebase($input: rulebaseInsertInput!) {
      insertIntorulebaseCollection(objects: [$input]) {
        records {
          id
          name
          description
          created_at
        }
      }
    }
  `,

  // Update rulebase
  UPDATE_RULEBASE: `
    mutation UpdateRulebase($id: UUID!, $input: rulebaseUpdateInput!) {
      updateru lebaseCollection(filter: { id: { eq: $id } }, set: $input) {
        records {
          id
          name
          description
          updated_at
        }
      }
    }
  `,

  // Create audit log
  CREATE_AUDIT_LOG: `
    mutation CreateAuditLog($input: audit_logsInsertInput!) {
      insertIntoaudit_logsCollection(objects: [$input]) {
        records {
          id
          action
          created_at
        }
      }
    }
  `,
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Execute GraphQL query
export async function executeQuery<T = any>(
  query: string,
  variables?: any,
  token?: string
): Promise<T> {
  try {
    const client = token
      ? createAuthenticatedGraphQLClient(token)
      : graphqlClient;

    const data = await client.request<T>(query, variables);
    return data;
  } catch (error: any) {
    console.error('GraphQL Error:', error);
    throw error;
  }
}

// Execute GraphQL mutation
export async function executeMutation<T = any>(
  mutation: string,
  variables: any,
  token?: string
): Promise<T> {
  try {
    const client = token
      ? createAuthenticatedGraphQLClient(token)
      : graphqlClient;

    const data = await client.request<T>(mutation, variables);
    return data;
  } catch (error: any) {
    console.error('GraphQL Mutation Error:', error);
    throw error;
  }
}

// Transform edge-based response to flat array
export function transformEdges<T>(edges: any[]): T[] {
  return edges?.map((edge: any) => edge.node) || [];
}

// =====================================================
// TYPED QUERY FUNCTIONS
// =====================================================

export async function getUserById(userId: string, token?: string) {
  const data = await executeQuery(QUERIES.GET_USER, { userId }, token);
  const edges = (data as any)?.usersCollection?.edges || [];
  return transformEdges(edges)[0] || null;
}

export async function getUserConversations(userId: string, token?: string) {
  const data = await executeQuery(QUERIES.GET_USER_CONVERSATIONS, { userId }, token);
  const edges = (data as any)?.agent_conversationsCollection?.edges || [];
  return transformEdges(edges);
}

export async function getConversationMessages(conversationId: string, token?: string) {
  const data = await executeQuery(QUERIES.GET_CONVERSATION_MESSAGES, { conversationId }, token);
  const edges = (data as any)?.chat_messagesCollection?.edges || [];
  return transformEdges(edges);
}

export async function getUserRulebases(userId: string, token?: string) {
  const data = await executeQuery(QUERIES.GET_USER_RULEBASES, { userId }, token);
  const edges = (data as any)?.rulebaseCollection?.edges || [];
  return transformEdges(edges);
}

export async function getCompanyMedia(companyId: string, token?: string) {
  const data = await executeQuery(QUERIES.GET_COMPANY_MEDIA, { companyId }, token);
  const edges = (data as any)?.mediaCollection?.edges || [];
  return transformEdges(edges);
}

export async function getDocumentAnalyses(userId: string, token?: string) {
  const data = await executeQuery(QUERIES.GET_DOCUMENT_ANALYSES, { userId }, token);
  const edges = (data as any)?.document_analysisCollection?.edges || [];
  return transformEdges(edges);
}

export async function getAuditLogs(userId: string, limit = 50, token?: string) {
  const data = await executeQuery(QUERIES.GET_AUDIT_LOGS, { userId, limit }, token);
  const edges = (data as any)?.audit_logsCollection?.edges || [];
  return transformEdges(edges);
}
