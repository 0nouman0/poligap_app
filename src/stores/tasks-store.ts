import { create } from 'zustand';

export interface Task {
  _id: string;
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  assignee?: string;
  category?: string;
  source?: 'compliance' | 'contract' | 'manual';
  sourceRef?: Record<string, any>;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheTimeout: number;
  
  // Actions
  fetchTasks: (userId: string, force?: boolean) => Promise<void>;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  clearTasks: () => void;
  
  // Filters
  getTasksByStatus: (status: Task['status']) => Task[];
  getTasksByPriority: (priority: Task['priority']) => Task[];
  getTasksBySource: (source: Task['source']) => Task[];
  getOverdueTasks: () => Task[];
  searchTasks: (query: string) => Task[];
  
  // Cache validation
  isCacheValid: () => boolean;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes

  isCacheValid: () => {
    const { lastFetched, cacheTimeout } = get();
    if (!lastFetched) return false;
    return Date.now() - lastFetched < cacheTimeout;
  },

  fetchTasks: async (userId: string, force = false) => {
    const { isCacheValid, tasks } = get();
    
    // Use cache if valid and not forcing refresh
    if (!force && isCacheValid() && tasks.length > 0) {
      console.log('✅ Using cached tasks');
      return;
    }

    set({ isLoading: true, error: null });
    console.log('🔄 Fetching fresh tasks from API for userId:', userId);

    try {
      const params = new URLSearchParams();
      params.set('userId', userId);
      
      const response = await fetch(`/api/tasks?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch tasks');
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.tasks)) {
        // Deduplicate tasks
        const byKey = new Map<string, Task>();
        for (const t of data.tasks) {
          const task = {
            ...t,
            id: t._id || t.id,
            status: t.status === 'in-progress' ? 'pending' : t.status
          };
          const key = task.sourceRef && (task.sourceRef.resultId || task.sourceRef.gapId)
            ? `${task.source || 'unknown'}:${task.title}:${task.sourceRef.resultId || ''}:${task.sourceRef.gapId || ''}`
            : (task._id || task.id || `${task.title}:${task.dueDate || ''}`);
          if (!byKey.has(key)) byKey.set(key, task);
        }
        
        const uniqueTasks = Array.from(byKey.values());
        
        set({ 
          tasks: uniqueTasks, 
          isLoading: false,
          lastFetched: Date.now(),
          error: null
        });
        console.log('✅ Cached', uniqueTasks.length, 'tasks');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
      console.error('❌ Error fetching tasks:', errorMessage);
      set({ error: errorMessage, isLoading: false });
    }
  },

  addTask: (task: Task) => {
    set((state) => ({
      tasks: [task, ...state.tasks]
    }));
    console.log('➕ Task added to store:', task._id || task.id);
  },

  updateTask: (taskId: string, updates: Partial<Task>) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        (task._id === taskId || task.id === taskId) ? { ...task, ...updates } : task
      )
    }));
    console.log('✏️ Task updated in store:', taskId);
  },

  deleteTask: (taskId: string) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task._id !== taskId && task.id !== taskId)
    }));
    console.log('🗑️ Task deleted from store:', taskId);
  },

  clearTasks: () => {
    set({ tasks: [], lastFetched: null, error: null });
    console.log('🧹 Tasks cleared from store');
  },

  // Filter methods
  getTasksByStatus: (status: Task['status']) => {
    return get().tasks.filter((task) => task.status === status);
  },

  getTasksByPriority: (priority: Task['priority']) => {
    return get().tasks.filter((task) => task.priority === priority);
  },

  getTasksBySource: (source: Task['source']) => {
    return get().tasks.filter((task) => task.source === source);
  },

  getOverdueTasks: () => {
    const now = new Date();
    return get().tasks.filter((task) => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < now && task.status !== 'completed';
    });
  },

  searchTasks: (query: string) => {
    const lowerQuery = query.toLowerCase();
    return get().tasks.filter((task) => 
      task.title.toLowerCase().includes(lowerQuery) ||
      task.description?.toLowerCase().includes(lowerQuery) ||
      task.category?.toLowerCase().includes(lowerQuery)
    );
  },
}));
