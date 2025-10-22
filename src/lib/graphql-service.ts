import { createClient } from '@/lib/supabase/server';
import { createGraphQLClient, queries } from '@/lib/supabase/graphql';
import { GraphQLClient } from 'graphql-request';

export class GraphQLService {
  private client: GraphQLClient | null = null;
  private accessToken?: string;
  private userId?: string;

  async init() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('Unauthorized');
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    this.accessToken = session?.access_token;
    this.userId = user.id;
    this.client = createGraphQLClient(this.accessToken);
    
    return user;
  }

  async query<T>(queryName: keyof typeof queries, variables?: any): Promise<T> {
    if (!this.client) await this.init();
    return this.client!.request<T>(queries[queryName], variables);
  }

  getUserId(): string {
    if (!this.userId) throw new Error('Service not initialized');
    return this.userId;
  }
}

// Helper function to extract nodes from GraphQL collection response
export function extractNodes<T>(collection: any): T[] {
  if (!collection?.edges) return [];
  return collection.edges.map((edge: any) => edge.node);
}

// Helper function to extract single node
export function extractNode<T>(collection: any): T | null {
  const nodes = extractNodes<T>(collection);
  return nodes.length > 0 ? nodes[0] : null;
}
