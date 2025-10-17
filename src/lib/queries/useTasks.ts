import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Task = {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  status: "pending" | "completed";
  priority: "critical" | "high" | "medium" | "low";
  dueDate?: string;
  category?: string;
  source?: "manual" | "compliance" | "contract";
  sourceRef?: Record<string, any>;
  createdAt?: string;
};

async function fetchTasks(userId: string): Promise<Task[]> {
  const res = await fetch(`/api/tasks?userId=${encodeURIComponent(userId)}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({ tasks: [] }));
  if (Array.isArray(data)) return data as Task[];
  if (Array.isArray((data as any).tasks)) return (data as any).tasks as Task[];
  return [];
}

export function useTasksList(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["tasks", userId],
    queryFn: () => fetchTasks(userId as string),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: [],
  });
}

export function useCreateTask(userId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Task, "id" | "_id">) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to create task");
      }
      return data?.task as Task;
    },
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: ["tasks", userId] });
    },
  });
}

export function useUpdateTask(userId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to update task");
      }
      return true;
    },
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: ["tasks", userId] });
    },
  });
}

export function useDeleteTask(userId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete task");
      }
      return true;
    },
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: ["tasks", userId] });
    },
  });
}
