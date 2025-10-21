// TODO: Fix Pipedream SDK imports - the server SDK exports are not available yet
// This functionality is temporarily disabled until the correct SDK version is available

// Stub implementations for type compatibility
export const pd = {
  createConnectToken: async ({ external_user_id }: { external_user_id: string }) => {
    throw new Error('Pipedream SDK not configured');
  },
  getAccounts: async ({ external_user_id, include_credentials }: { external_user_id: string; include_credentials: boolean }) => {
    throw new Error('Pipedream SDK not configured');
  },
};

// Create a token for a specific user
export const serverConnectTokenCreate = async ({
  external_user_id,
}: {
  external_user_id: string;
}) => {
  // Stub implementation - returns mock data for build compatibility
  console.warn('⚠️ Pipedream SDK is not properly configured');
  return {
    token: 'mock-token',
    expires_at: new Date().toISOString(),
    connect_link_url: 'https://pipedream.com',
  };
};

// Fetch account access token
export const getAccountInfo = async ({
  accountId,
  external_user_id,
}: {
  accountId: string;
  external_user_id: string;
}) => {
  console.warn('⚠️ Pipedream SDK is not properly configured');
  return { account: null };
};
