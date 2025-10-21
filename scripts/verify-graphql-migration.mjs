#!/usr/bin/env node
import 'dotenv/config';
import { GraphQLClient, gql } from 'graphql-request';
import { randomUUID } from 'crypto';

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  const client = new GraphQLClient(`${url}/graphql/v1`, {
    headers: {
      apikey: anon,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return client;
}

const Q = {
  createConversation: gql`
    mutation CreateConversation($chat_name: String!, $user_id: UUID!, $company_id: UUID) {
      insertIntoagent_conversationsCollection(objects: [{ chat_name: $chat_name, user_id: $user_id, company_id: $company_id, status: "active" }]) {
        records { id chat_name created_at }
      }
    }
  `,
  getConversations: gql`
    query GetConversations($userId: UUID!) {
      agent_conversationsCollection(filter: { user_id: { eq: $userId } }, orderBy: { created_at: DescNullsLast }) {
        edges { node { id chat_name status created_at updated_at } }
      }
    }
  `,
  createMessage: gql`
    mutation CreateMessage($conversation_id: UUID!, $message_id: String!, $user_query: String!, $message_type: String!, $ai_response: String, $tool_calls: JSON, $extra_data: JSON, $images: [String!], $videos: [String!]) {
      insertIntochat_messagesCollection(objects: [{ conversation_id: $conversation_id, message_id: $message_id, user_query: $user_query, ai_response: $ai_response, message_type: $message_type, tool_calls: $tool_calls, extra_data: $extra_data, images: $images, videos: $videos }]) {
        records { id message_id created_at }
      }
    }
  `,
  getMessages: gql`
    query GetMessages($conversationId: UUID!) {
      chat_messagesCollection(filter: { conversation_id: { eq: $conversationId } }, orderBy: { created_at: AscNullsFirst }) {
        edges { node { id message_id user_query ai_response message_type created_at } }
      }
    }
  `,
  deleteConversation: gql`
    mutation DeleteConversation($id: UUID!) {
      updateagent_conversationsCollection(filter: { id: { eq: $id } }, set: { status: "deleted", updated_at: "now()" }) {
        records { id status updated_at }
      }
    }
  `,
};

async function main() {
  const client = getClient();
  const userId = process.env.TEST_USER_ID;
  if (!userId) {
    throw new Error('Set TEST_USER_ID in env to a valid UUID from your profiles table.');
  }

  const chatName = `MigrationTest-${Date.now()}`;
  const createConv = await client.request(Q.createConversation, {
    chat_name: chatName,
    user_id: userId,
    company_id: null,
  });
  const conversationId = createConv.insertIntoagent_conversationsCollection.records[0].id;
  console.log('Created conversation:', conversationId);

  const msgId = randomUUID();
  await client.request(Q.createMessage, {
    conversation_id: conversationId,
    message_id: msgId,
    user_query: 'Hello GraphQL',
    ai_response: 'Hi there!',
    message_type: 'user',
    tool_calls: null,
    extra_data: null,
    images: [],
    videos: [],
  });
  console.log('Inserted message:', msgId);

  const msgs = await client.request(Q.getMessages, { conversationId });
  const count = msgs.chat_messagesCollection.edges.length;
  if (count < 1) throw new Error('No messages returned from GraphQL');
  console.log('Messages fetched:', count);

  await client.request(Q.deleteConversation, { id: conversationId });
  console.log('Soft-deleted conversation');

  const convs = await client.request(Q.getConversations, { userId });
  const found = convs.agent_conversationsCollection.edges.find(e => e.node.id === conversationId);
  if (!found || found.node.status !== 'deleted') throw new Error('Conversation not marked deleted');
  console.log('Verified conversation status deleted');

  console.log('✔ Migration GraphQL E2E test passed');
}

main().catch(err => {
  console.error('✖ Migration test failed:', err?.response?.errors || err.message || err);
  process.exit(1);
});
