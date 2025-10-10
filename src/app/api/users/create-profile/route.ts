import { NextRequest, NextResponse } from 'next/server';
import { createGraphQLClient, queries } from '@/lib/supabase/graphql';

export async function POST(request: NextRequest) {
  try {
    const { id, email, name } = await request.json();

    if (!id || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: id, email, name' },
        { status: 400 }
      );
    }

    // Use service role key to create profile (bypasses RLS)
    const client = createGraphQLClient(process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const mutation = `
      mutation CreateProfile($id: UUID!, $email: String!, $name: String!) {
        insertIntoprofilesCollection(
          objects: [{
            id: $id
            email: $email
            name: $name
            unique_id: $email
            status: "ACTIVE"
          }]
        ) {
          records {
            id
            email
            name
            created_at
          }
        }
      }
    `;

    const data: any = await client.request(mutation, {
      id,
      email,
      name,
    });

    const profile = data?.insertIntoprofilesCollection?.records?.[0];

    if (!profile) {
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });

  } catch (error: any) {
    console.error('Profile creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create profile' },
      { status: 500 }
    );
  }
}
