"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddUserDrawer from "./components/AddUserDrawer";

const PAGE_SIZE = 12;

export default function UsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async ({ page = 1, q = "" } = {}) => {
    setLoading(true);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      // Basic search on email or name using ilike
      // The project uses `profiles` table for user profiles (not `users`). Query that table.
      let builder = supabase.from("profiles").select("id, name, email, role, status", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
      if (q && q.trim()) {
        const like = `%${q.trim()}%`;
        builder = supabase
          .from("profiles")
          .select("id, name, email, role, status", { count: "exact" })
          .or(`email.ilike.${like},name.ilike.${like}`)
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);
      }

      const { data, error, count } = await builder;
      if (error) throw error;
      setUsers(data || []);
      setTotal(typeof count === "number" ? count : (data || []).length);
    } catch (e) {
      console.error("Failed to load users", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers({ page, q: query });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (v: string) => {
    setQuery(v);
    setPage(1);
    // debounce not implemented - keep simple for now
    fetchUsers({ page: 1, q: v });
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Users & Teams</h2>
        <div className="flex items-center gap-2">
          <Input placeholder="Search users (name or email)" value={query} onChange={(e) => handleSearch(e.target.value)} />
          <Button onClick={() => setOpenDrawer(true)}>Add User</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Role</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="py-2">{u.name || u.email}</td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2">{u.role || "user"}</td>
                    <td className="py-2">{u.status || "active"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">{total} users</div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
                <div className="text-sm">{page} / {totalPages}</div>
                <Button variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
              </div>
            </div>
          </>
        )}
      </div>

      <AddUserDrawer isOpen={openDrawer} onClose={() => setOpenDrawer(false)} onInvited={() => fetchUsers({ page, q: query })} />
    </div>
  );
}
