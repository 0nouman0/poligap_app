import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { createGraphQLClient, queries } from "@/lib/supabase/graphql";
// import { KnowledgeFile, KnowledgeLink } from "@/utils/internal-knowledge.util";
import { toastSuccess, toastError } from "@/components/toast-varients";

// Types
export interface KnowledgeUploadRequest {
  external_user_id_internal: string;
  account_ids: string[];
  user_email: string;
  files: File[];
  websites: string[];
  youtubeLinks: string[];
  use_exa_ai: boolean;
}

export interface KnowledgeUploadResponse {
  status: string;
  message: string;
  data?: any;
}

// Knowledge data types
export interface KnowledgeItem {
  id: string;
  name: string;
  url?: string | null;
  status: string;
  uploaded_at: string;
}

export interface KnowledgeData {
  files: KnowledgeItem[];
  websites: KnowledgeItem[];
  youtubeLinks: KnowledgeItem[];
  is_enabled?: boolean;
}

// Delete request type
export interface KnowledgeDeleteRequest {
  itemId: string;
  external_user_id: string;
}

// Toggle knowledge request type
export interface KnowledgeToggleRequest {
  external_user_id: string;
  is_enabled: boolean;
}

// Toggle knowledge response type
export interface KnowledgeToggleResponse {
  message: string;
  is_enabled: boolean;
}

// Sitemap types
export interface SitemapUploadRequest {
  external_user_id: string;
  user_email: string;
  sitemap_url: string;
  sitemap_identifier: string;
  account_ids: string[];
  include_paths?: string[];
  exclude_paths?: string[];
}

export interface SitemapUploadResponse {
  status: string;
  message: string;
  data?: any;
}

export interface SitemapItem {
  id: string;
  sitemap_url: string;
  status: string;
  uploaded_at: string;
}

export interface SitemapData {
  sitemaps: SitemapItem[];
}

export interface SitemapDeleteRequest {
  itemId: string;
  external_user_id: string;
}

// Enhanced sitemap crawling request
export interface SitemapCrawlRequest {
  external_user_id: string;
  user_email: string;
  url: string;
  include_paths?: string[];
  exclude_paths?: string[];
  crawl_type: 'sitemap' | 'crawl' | 'individual';
  account_ids: string[];
}

export interface SitemapCrawlResponse {
  status: string;
  message: string;
  crawl_id?: string;
  pages_found?: number;
  data?: any;
}

// API function for upload (GraphQL)
const uploadKnowledge = async (
  data: KnowledgeUploadRequest
): Promise<KnowledgeUploadResponse> => {
  const supabase = createSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const gql = createGraphQLClient(sessionData.session?.access_token);

  const objects: any[] = [];
  // Map files as knowledge items (store names; file upload handled elsewhere if needed)
  data.files.forEach((file) => {
    objects.push({
      user_id: data.external_user_id_internal,
      account_ids: data.account_ids,
      source_type: "file",
      name: file.name,
      url: null,
      status: "queued",
    });
  });
  data.websites.forEach((site) => {
    objects.push({
      user_id: data.external_user_id_internal,
      account_ids: data.account_ids,
      source_type: "website",
      name: site,
      url: site,
      status: "queued",
    });
  });
  data.youtubeLinks.forEach((link) => {
    objects.push({
      user_id: data.external_user_id_internal,
      account_ids: data.account_ids,
      source_type: "youtube",
      name: link,
      url: link,
      status: "queued",
    });
  });

  await gql.request(queries.createKnowledgeItems, { objects });
  return { status: "ok", message: "Queued knowledge items for processing" };
};

// API function for fetching knowledge data (GraphQL)
const fetchKnowledge = async (userId: string): Promise<KnowledgeData> => {
  const supabase = createSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const gql = createGraphQLClient(sessionData.session?.access_token);
  const res: any = await gql.request(queries.getKnowledge, { userId });

  const items = (res?.knowledge_itemsCollection?.edges || []).map((e: any) => e.node);
  const settingsNode = res?.user_knowledge_settingsCollection?.edges?.[0]?.node;
  const is_enabled = settingsNode ? settingsNode.is_enabled : undefined;

  const files = items.filter((i: any) => i.source_type === "file").map((i: any) => ({
    id: i.id,
    name: i.name,
    url: i.url,
    status: i.status,
    uploaded_at: i.uploaded_at,
  }));
  const websites = items.filter((i: any) => i.source_type === "website").map((i: any) => ({
    id: i.id,
    name: i.name,
    url: i.url,
    status: i.status,
    uploaded_at: i.uploaded_at,
  }));
  const youtubeLinks = items.filter((i: any) => i.source_type === "youtube").map((i: any) => ({
    id: i.id,
    name: i.name,
    url: i.url,
    status: i.status,
    uploaded_at: i.uploaded_at,
  }));

  return { files, websites, youtubeLinks, is_enabled };
};

// API function for deleting knowledge item (GraphQL)
const deleteKnowledgeItem = async (
  data: KnowledgeDeleteRequest
): Promise<{ success: boolean; message: string }> => {
  const supabase = createSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const gql = createGraphQLClient(sessionData.session?.access_token);
  await gql.request(queries.softDeleteKnowledgeItem, { id: data.itemId });
  return { success: true, message: "Deleted" };
};

// API function for toggling knowledge (GraphQL)
const toggleKnowledge = async (
  data: KnowledgeToggleRequest
): Promise<KnowledgeToggleResponse> => {
  const supabase = createSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const gql = createGraphQLClient(sessionData.session?.access_token);
  const res: any = await gql.request(queries.toggleKnowledgeSettings, {
    user_id: data.external_user_id,
    is_enabled: data.is_enabled,
  });
  const node = res?.insertIntouser_knowledge_settingsCollection?.records?.[0];
  return { message: "Updated", is_enabled: node?.is_enabled ?? data.is_enabled };
};

// API function for uploading sitemap (GraphQL)
const uploadSitemap = async (
  data: SitemapUploadRequest
): Promise<SitemapUploadResponse> => {
  const supabase = createSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const gql = createGraphQLClient(sessionData.session?.access_token);
  await gql.request(queries.createSitemap, {
    object: {
      user_id: data.external_user_id,
      sitemap_url: data.sitemap_url,
      sitemap_identifier: data.sitemap_identifier,
      include_paths: data.include_paths ?? [],
      exclude_paths: data.exclude_paths ?? [],
      status: "pending",
    },
  });
  return { status: "ok", message: "Sitemap queued" };
};

// Enhanced API function for sitemap crawling with include/exclude paths (GraphQL placeholder)
const crawlSitemap = async (
  data: SitemapCrawlRequest
): Promise<SitemapCrawlResponse> => {
  // For now, insert a sitemap record representing a crawl request
  const supabase = createSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const gql = createGraphQLClient(sessionData.session?.access_token);
  const url = data.url;
  await gql.request(queries.createSitemap, {
    object: {
      user_id: data.external_user_id,
      sitemap_url: url,
      sitemap_identifier: data.crawl_type,
      include_paths: data.include_paths ?? [],
      exclude_paths: data.exclude_paths ?? [],
      status: "in_progress",
    },
  });
  return { status: "ok", message: "Crawl started", crawl_id: undefined };
};

// API function for fetching sitemaps (GraphQL)
const fetchSitemaps = async (
  userId: string,
  _userEmail: string
): Promise<SitemapData> => {
  const supabase = createSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const gql = createGraphQLClient(sessionData.session?.access_token);
  const res: any = await gql.request(queries.getSitemaps, { userId });
  const sitemaps = (res?.sitemapsCollection?.edges || []).map((e: any) => ({
    id: e.node.id,
    sitemap_url: e.node.sitemap_url,
    status: e.node.status,
    uploaded_at: e.node.uploaded_at,
  }));
  return { sitemaps };
};

// API function for deleting sitemap (GraphQL)
const deleteSitemap = async (
  data: SitemapDeleteRequest
): Promise<{ success: boolean; message: string }> => {
  const supabase = createSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const gql = createGraphQLClient(sessionData.session?.access_token);
  await gql.request(queries.softDeleteSitemap, { id: data.itemId });
  return { success: true, message: "Deleted" };
};

// Upload hook
export const useKnowledgeUpload = () => {
  return useMutation({
    mutationFn: uploadKnowledge,
    onSuccess: (data) => {
      console.log("Knowledge upload successful:", data);
      toastSuccess(
        "Knowledge Upload Successful",
        "Your knowledge base has been updated successfully."
      );
    },
    onError: (error: Error) => {
      console.error("Knowledge upload failed:", error);
      toastError(
        "Upload Failed",
        error.message || "Failed to upload knowledge base. Please try again."
      );
    },
  });
};

// Fetch hook
export const useKnowledgeData = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["knowledge", userId],
    queryFn: () => fetchKnowledge(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Delete hook
export const useKnowledgeDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteKnowledgeItem,
    onSuccess: (data, variables) => {
      console.log("Knowledge item deleted successfully:", data);
      toastSuccess(
        "Item Deleted",
        "Knowledge item has been deleted successfully."
      );

      // Invalidate and refetch knowledge data
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
    onError: (error: Error) => {
      console.error("Knowledge delete failed:", error);
      toastError(
        "Delete Failed",
        error.message || "Failed to delete knowledge item. Please try again."
      );
    },
  });
};

// Toggle knowledge hook with optimistic updates and debouncing
export const useKnowledgeToggle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleKnowledge,
    onMutate: async (newToggleData) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["knowledge"] });

      // Snapshot the previous value
      const previousKnowledge = queryClient.getQueryData(["knowledge"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["knowledge"], (old: any) => {
        if (old) {
          return {
            ...old,
            is_enabled: newToggleData.is_enabled,
          };
        }
        return old;
      });

      // Return a context object with the snapshotted value
      return { previousKnowledge };
    },
    onSuccess: (data) => {
      console.log("Knowledge toggle successful:", data);
      // The optimistic update will be automatically replaced with the real data
      // No need for additional invalidation since we're using optimistic updates
    },
    onError: (error: Error, variables, context) => {
      console.error("Knowledge toggle failed:", error);

      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousKnowledge) {
        queryClient.setQueryData(["knowledge"], context.previousKnowledge);
      }

      toastError(
        "Toggle Failed",
        error.message ||
          "Failed to update knowledge settings. Please try again."
      );
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
  });
};

// Sitemap upload hook
export const useSitemapUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadSitemap,
    onSuccess: (data) => {
      console.log("Sitemap upload successful:", data);
      toastSuccess(
        "Sitemap Upload Successful",
        "Your sitemap has been uploaded successfully."
      );

      // Invalidate and refetch sitemap data
      queryClient.invalidateQueries({ queryKey: ["sitemaps"] });
    },
    onError: (error: Error) => {
      console.error("Sitemap upload failed:", error);
      toastError(
        "Upload Failed",
        error.message || "Failed to upload sitemap. Please try again."
      );
    },
  });
};

// Fetch sitemaps hook
export const useSitemapsData = (
  userId: string | undefined,
  userEmail: string | undefined
) => {
  return useQuery({
    queryKey: ["sitemaps", userId, userEmail],
    queryFn: () => fetchSitemaps(userId!, userEmail!),
    enabled: !!userId && !!userEmail,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Delete sitemap hook
export const useSitemapDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSitemap,
    onSuccess: (data, variables) => {
      console.log("Sitemap deleted successfully:", data);
      toastSuccess("Sitemap Deleted", "Sitemap has been deleted successfully.");

      // Invalidate and refetch sitemap data
      queryClient.invalidateQueries({ queryKey: ["sitemaps"] });
    },
    onError: (error: Error) => {
      console.error("Sitemap delete failed:", error);
      toastError(
        "Delete Failed",
        error.message || "Failed to delete sitemap. Please try again."
      );
    },
  });
};

// Enhanced sitemap crawling hook
export const useSitemapCrawl = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: crawlSitemap,
    onSuccess: (data) => {
      console.log("Sitemap crawl successful:", data);
      toastSuccess(
        "Crawl Started",
        `Successfully started crawling. ${data.pages_found ? `Found ${data.pages_found} pages.` : ""}`
      );

      // Invalidate and refetch sitemap data
      queryClient.invalidateQueries({ queryKey: ["sitemaps"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
    onError: (error: Error) => {
      console.error("Sitemap crawl failed:", error);
      toastError(
        "Crawl Failed",
        error.message || "Failed to start crawling. Please try again."
      );
    },
  });
};
