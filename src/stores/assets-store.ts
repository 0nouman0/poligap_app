import { create } from 'zustand';

export interface Asset {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadDate: string;
  tags: string[];
  category: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  userId?: string;
}

interface AssetsState {
  assets: Asset[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheTimeout: number;
  allTags: string[];
  
  // Actions
  fetchAssets: (userId?: string, force?: boolean) => Promise<void>;
  addAsset: (asset: Asset) => void;
  updateAsset: (assetId: string, updates: Partial<Asset>) => void;
  deleteAsset: (assetId: string) => void;
  deleteMultipleAssets: (assetIds: string[]) => void;
  updateAssetTags: (assetId: string, tags: string[]) => void;
  clearAssets: () => void;
  
  // Filters
  getAssetsByCategory: (category: string) => Asset[];
  getAssetsByTag: (tag: string) => Asset[];
  getAssetsByType: (type: string) => Asset[];
  searchAssets: (query: string) => Asset[];
  
  // Cache validation
  isCacheValid: () => boolean;
}

export const useAssetsStore = create<AssetsState>((set, get) => ({
  assets: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  allTags: [],

  isCacheValid: () => {
    const { lastFetched, cacheTimeout } = get();
    if (!lastFetched) return false;
    return Date.now() - lastFetched < cacheTimeout;
  },

  fetchAssets: async (userId?: string, force = false) => {
    const { isCacheValid, assets } = get();
    
    // Use cache if valid and not forcing refresh
    if (!force && isCacheValid() && assets.length > 0) {
      console.log('✅ Using cached assets');
      return;
    }

    set({ isLoading: true, error: null });
    console.log('🔄 Fetching fresh assets from API');

    try {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      
      const url = params.toString() ? `/api/assets?${params.toString()}` : '/api/assets';
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch assets');
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.assets)) {
        // Extract all unique tags
        const tags = new Set<string>();
        data.assets.forEach((asset: Asset) => {
          asset.tags?.forEach(tag => tags.add(tag));
        });
        
        set({ 
          assets: data.assets, 
          allTags: Array.from(tags),
          isLoading: false,
          lastFetched: Date.now(),
          error: null
        });
        console.log('✅ Cached', data.assets.length, 'assets');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch assets';
      console.error('❌ Error fetching assets:', errorMessage);
      set({ error: errorMessage, isLoading: false });
    }
  },

  addAsset: (asset: Asset) => {
    set((state) => {
      // Update tags
      const newTags = new Set(state.allTags);
      asset.tags?.forEach(tag => newTags.add(tag));
      
      return {
        assets: [asset, ...state.assets],
        allTags: Array.from(newTags)
      };
    });
    console.log('➕ Asset added to store:', asset._id);
  },

  updateAsset: (assetId: string, updates: Partial<Asset>) => {
    set((state) => {
      const updatedAssets = state.assets.map((asset) =>
        asset._id === assetId ? { ...asset, ...updates } : asset
      );
      
      // Update tags if changed
      if (updates.tags) {
        const newTags = new Set(state.allTags);
        updates.tags.forEach(tag => newTags.add(tag));
        return {
          assets: updatedAssets,
          allTags: Array.from(newTags)
        };
      }
      
      return { assets: updatedAssets };
    });
    console.log('✏️ Asset updated in store:', assetId);
  },

  deleteAsset: (assetId: string) => {
    set((state) => ({
      assets: state.assets.filter((asset) => asset._id !== assetId)
    }));
    console.log('🗑️ Asset deleted from store:', assetId);
  },

  deleteMultipleAssets: (assetIds: string[]) => {
    set((state) => ({
      assets: state.assets.filter((asset) => !assetIds.includes(asset._id))
    }));
    console.log('🗑️ Multiple assets deleted from store:', assetIds.length);
  },

  updateAssetTags: (assetId: string, tags: string[]) => {
    set((state) => {
      const updatedAssets = state.assets.map((asset) =>
        asset._id === assetId ? { ...asset, tags } : asset
      );
      
      // Update allTags
      const newTags = new Set(state.allTags);
      tags.forEach(tag => newTags.add(tag));
      
      return {
        assets: updatedAssets,
        allTags: Array.from(newTags)
      };
    });
    console.log('🏷️ Asset tags updated in store:', assetId);
  },

  clearAssets: () => {
    set({ assets: [], allTags: [], lastFetched: null, error: null });
    console.log('🧹 Assets cleared from store');
  },

  // Filter methods
  getAssetsByCategory: (category: string) => {
    return get().assets.filter((asset) => asset.category === category);
  },

  getAssetsByTag: (tag: string) => {
    return get().assets.filter((asset) => asset.tags?.includes(tag));
  },

  getAssetsByType: (type: string) => {
    return get().assets.filter((asset) => asset.mimetype.startsWith(type));
  },

  searchAssets: (query: string) => {
    const lowerQuery = query.toLowerCase();
    return get().assets.filter((asset) => 
      asset.originalName.toLowerCase().includes(lowerQuery) ||
      asset.description?.toLowerCase().includes(lowerQuery) ||
      asset.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      asset.category.toLowerCase().includes(lowerQuery)
    );
  },
}));
