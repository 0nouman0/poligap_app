import { GraphQLClient } from 'graphql-request'

const GRAPHQL_ENDPOINT = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`

export function createGraphQLClient(accessToken?: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
  })
}

// GraphQL queries
export const queries = {
  // Profile queries
  getProfile: `
    query GetProfile($id: UUID!) {
      profilesCollection(filter: { id: { eq: $id } }) {
        edges {
          node {
            id
            email
            name
            unique_id
            country
            dob
            mobile
            profile_image
            banner
            about
            status
            designation
            role
            member_status
            company_name
            reporting_manager
            created_by
            created_at
            updated_at
            profile_created_on
          }
        }
      }
    }
  `,

  deleteConversation: `
    mutation DeleteConversation($id: UUID!) {
      updateagent_conversationsCollection(
        filter: { id: { eq: $id } }
        set: { status: "deleted", updated_at: "now()" }
      ) {
        records {
          id
          status
          updated_at
        }
      }
    }
  `,

  updateProfile: `
    mutation UpdateProfile(
      $id: UUID!
      $name: String
      $mobile: String
      $dob: String
      $country: String
      $designation: String
      $about: String
      $profile_image: String
      $banner: JSON
      $company_name: String
    ) {
      updateprofilesCollection(
        filter: { id: { eq: $id } }
        set: {
          name: $name
          mobile: $mobile
          dob: $dob
          country: $country
          designation: $designation
          about: $about
          profile_image: $profile_image
          banner: $banner
          company_name: $company_name
          updated_at: "now()"
        }
      ) {
        records {
          id
          email
          name
          profile_image
          banner
          updated_at
        }
      }
    }
  `,

  // Chat/Conversation queries
  getConversations: `
    query GetConversations($userId: UUID!) {
      agent_conversationsCollection(
        filter: { user_id: { eq: $userId } }
        orderBy: { created_at: DescNullsLast }
      ) {
        edges {
          node {
            id
            chat_name
            summary
            status
            created_at
            updated_at
          }
        }
      }
    }
  `,

  createConversation: `
    mutation CreateConversation(
      $chat_name: String!
      $user_id: UUID!
      $company_id: UUID
    ) {
      insertIntoagent_conversationsCollection(
        objects: [{
          chat_name: $chat_name
          user_id: $user_id
          company_id: $company_id
          status: "active"
        }]
      ) {
        records {
          id
          chat_name
          created_at
        }
      }
    }
  `,

  getMessages: `
    query GetMessages($conversationId: UUID!) {
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
            tool_calls
            extra_data
            images
            videos
            created_at
          }
        }
      }
    }
  `,

  createMessage: `
    mutation CreateMessage(
      $conversation_id: UUID!
      $message_id: String!
      $user_query: String!
      $message_type: String!
      $ai_response: String
      $tool_calls: JSON
      $extra_data: JSON
      $images: [String!]
      $videos: [String!]
    ) {
      insertIntochat_messagesCollection(
        objects: [{
          conversation_id: $conversation_id
          message_id: $message_id
          user_query: $user_query
          ai_response: $ai_response
          message_type: $message_type
          tool_calls: $tool_calls
          extra_data: $extra_data
          images: $images
          videos: $videos
        }]
      ) {
        records {
          id
          message_id
          created_at
        }
      }
    }
  `,

  updateMessage: `
    mutation UpdateMessage(
      $message_id: String!
      $ai_response: String
      $tool_calls: JSON
      $extra_data: JSON
      $images: [String!]
      $videos: [String!]
    ) {
      updatechat_messagesCollection(
        filter: { message_id: { eq: $message_id } }
        set: {
          ai_response: $ai_response
          tool_calls: $tool_calls
          extra_data: $extra_data
          images: $images
          videos: $videos
          updated_at: "now()"
        }
      ) {
        records {
          id
          message_id
          updated_at
        }
      }
    }
  `,

  // Rulebase queries
  getRules: `
    query GetRules($userId: UUID!) {
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
            file_content
            active
            created_at
            updated_at
          }
        }
      }
    }
  `,

  createRule: `
    mutation CreateRule(
      $name: String!
      $description: String
      $tags: [String!]
      $source_type: String
      $file_name: String
      $file_content: String
      $user_id: UUID!
      $company_id: UUID
    ) {
      insertIntorulebaseCollection(
        objects: [{
          name: $name
          description: $description
          tags: $tags
          source_type: $source_type
          file_name: $file_name
          file_content: $file_content
          user_id: $user_id
          company_id: $company_id
          active: true
        }]
      ) {
        records {
          id
          name
          description
          tags
          source_type
          file_name
          active
          created_at
          updated_at
        }
      }
    }
  `,

  updateRule: `
    mutation UpdateRule(
      $id: UUID!
      $name: String
      $description: String
      $tags: [String!]
      $active: Boolean
    ) {
      updaterulebaseCollection(
        filter: { id: { eq: $id } }
        set: {
          name: $name
          description: $description
          tags: $tags
          active: $active
          updated_at: "now()"
        }
      ) {
        records {
          id
          name
          description
          tags
          active
          updated_at
        }
      }
    }
  `,

  deleteRule: `
    mutation DeleteRule($id: UUID!) {
      updaterulebaseCollection(
        filter: { id: { eq: $id } }
        set: {
          active: false
          updated_at: "now()"
        }
      ) {
        records {
          id
          active
        }
      }
    }
  `,

  // Audit logs
  getAuditLogs: `
    query GetAuditLogs($userId: UUID!) {
      audit_logsCollection(
        filter: { user_id: { eq: $userId } }
        orderBy: { created_at: DescNullsLast }
        first: 50
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

  createAuditLog: `
    mutation CreateAuditLog(
      $user_id: UUID!
      $company_id: UUID
      $action: String!
      $entity_type: String
      $entity_id: String
      $metadata: JSON
    ) {
      insertIntoaudit_logsCollection(
        objects: [{
          user_id: $user_id
          company_id: $company_id
          action: $action
          entity_type: $entity_type
          entity_id: $entity_id
          metadata: $metadata
        }]
      ) {
        records {
          id
          created_at
        }
      }
    }
  `,

  // Tasks
  getTasks: `
    query GetTasks($userId: UUID!) {
      tasksCollection(
        filter: { user_id: { eq: $userId } }
        orderBy: { created_at: DescNullsLast }
      ) {
        edges {
          node {
            id
            title
            description
            status
            priority
            due_date
            assignee
            category
            source
            source_ref
            created_at
            updated_at
          }
        }
      }
    }
  `,

  createTask: `
    mutation CreateTask(
      $title: String!
      $description: String
      $status: String
      $priority: String
      $due_date: String
      $assignee: String
      $category: String
      $source: String
      $source_ref: JSON
      $user_id: UUID!
    ) {
      insertIntotasksCollection(
        objects: [{
          title: $title
          description: $description
          status: $status
          priority: $priority
          due_date: $due_date
          assignee: $assignee
          category: $category
          source: $source
          source_ref: $source_ref
          user_id: $user_id
        }]
      ) {
        records {
          id
          title
          created_at
        }
      }
    }
  `,

  // Document Analysis
  createDocumentAnalysis: `
    mutation CreateDocumentAnalysis(
      $user_id: UUID!
      $company_id: UUID
      $document_id: String!
      $title: String
      $compliance_standard: String
      $score: Float
      $metrics: JSON
    ) {
      insertIntodocument_analysisCollection(
        objects: [{
          user_id: $user_id
          company_id: $company_id
          document_id: $document_id
          title: $title
          compliance_standard: $compliance_standard
          score: $score
          metrics: $metrics
        }]
      ) {
        records {
          id
          created_at
        }
      }
    }
  `,

  getDocumentAnalysis: `
    query GetDocumentAnalysis($userId: UUID!) {
      document_analysisCollection(
        filter: { user_id: { eq: $userId } }
        orderBy: { created_at: DescNullsLast }
        first: 50
      ) {
        edges {
          node {
            id
            document_id
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

  // Knowledge
  getKnowledge: `
    query GetKnowledge($userId: UUID!) {
      knowledge_itemsCollection(
        filter: { user_id: { eq: $userId }, status: { neq: "deleted" } }
        orderBy: { uploaded_at: DescNullsLast }
      ) {
        edges {
          node {
            id
            name
            url
            source_type
            status
            uploaded_at
          }
        }
      }
      user_knowledge_settingsCollection(filter: { user_id: { eq: $userId } }) {
        edges { node { user_id is_enabled updated_at } }
      }
    }
  `,

  createKnowledgeItems: `
    mutation CreateKnowledgeItems($objects: [knowledge_itemsInsertInput!]!) {
      insertIntoknowledge_itemsCollection(objects: $objects) {
        records { id name source_type status uploaded_at }
      }
    }
  `,

  softDeleteKnowledgeItem: `
    mutation SoftDeleteKnowledgeItem($id: UUID!) {
      updateknowledge_itemsCollection(
        filter: { id: { eq: $id } }
        set: { status: "deleted", uploaded_at: "now()" }
      ) {
        records { id status uploaded_at }
      }
    }
  `,

  toggleKnowledgeSettings: `
    mutation ToggleKnowledgeSettings($user_id: UUID!, $is_enabled: Boolean!) {
      insertIntouser_knowledge_settingsCollection(
        objects: [{ user_id: $user_id, is_enabled: $is_enabled, updated_at: "now()" }]
        onConflict: { updateColumns: [is_enabled, updated_at] }
      ) {
        records { user_id is_enabled updated_at }
      }
    }
  `,

  // Sitemaps
  getSitemaps: `
    query GetSitemaps($userId: UUID!) {
      sitemapsCollection(
        filter: { user_id: { eq: $userId }, status: { neq: "deleted" } }
        orderBy: { uploaded_at: DescNullsLast }
      ) {
        edges {
          node {
            id
            sitemap_url
            sitemap_identifier
            include_paths
            exclude_paths
            status
            uploaded_at
          }
        }
      }
    }
  `,

  createSitemap: `
    mutation CreateSitemap($object: sitemapsInsertInput!) {
      insertIntositemapsCollection(objects: [$object]) {
        records { id sitemap_url sitemap_identifier status uploaded_at }
      }
    }
  `,

  softDeleteSitemap: `
    mutation SoftDeleteSitemap($id: UUID!) {
      updatesitemapsCollection(
        filter: { id: { eq: $id } }
        set: { status: "deleted", uploaded_at: "now()" }
      ) {
        records { id status uploaded_at }
      }
    }
  `,

  // Org/Companies
  getUserCompanies: `
    query GetUserCompanies($userId: UUID!) {
      user_companiesCollection(filter: { user_id: { eq: $userId } }) {
        edges {
          node {
            role
            company_id
            company: companies {
              id
              name
              enable_knowledge_base
              created_at
            }
          }
        }
      }
    }
  `,

  getUserDetails: `
    query GetUserDetails($userId: UUID!) {
      profilesCollection(filter: { id: { eq: $userId } }) {
        edges { node { id email name } }
      }
    }
  `,
}
