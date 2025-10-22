"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddUserDrawer from "./components/AddUserDrawer";

const PAGE_SIZE = 12;

<<<<<<< HEAD
export default function UsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
=======
import { useCompanyStore } from "@/stores/company-store";
import { useUserStore } from "@/stores/user-store";
import { useMember } from "@/hooks/useMember";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterList } from "@mui/icons-material";
import { formatGlobalDate } from "@/utils/date.util";
>>>>>>> 9d8323b9f028ed1e550937b0567b974ab274f1e1

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

<<<<<<< HEAD
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);
=======
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(target)
      ) {
        setShowFilterDropdown(false);
      }
    }

    if (showFilterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterDropdown]);

  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const companyId = selectedCompany?.companyId;
  const currentUserRole = selectedCompany?.role;
  const { userData } = useUserStore();

  const {
    data: teamMembers = [],
    error,
    isLoading,
  } = useMember(companyId || ""); // or skip fetching if companyId is falsy

  console.log("teamMembers   ======> ", teamMembers);
  console.log("currentUserRole   ======> ", currentUserRole);

  // Helper to get unique values for a given filter category
  function getUniqueFilterValues(category: string) {
    const values = new Set<string>();
    teamMembers.forEach((member) => {
      switch (category) {
        case "Status":
          // Status property not available in TeamMember type - using role as fallback
          if (member.role) values.add(member.role);
          break;
        case "Role":
          if (member.role) values.add(member.role);
          break;
        case "Reporting Manager":
          if (member.reportingManager?.name)
            values.add(member.reportingManager.name);
          break;
        case "Created By":
          if (member.createdBy?.name) values.add(member.createdBy.name);
          break;
        case "Created On":
          if (member.createdAt) {
            const dateStr = formatGlobalDate(member.createdAt);
            values.add(dateStr);
          }
          break;
        default:
          break;
      }
    });
    return Array.from(values);
  }

  // Filtered people based on search and filter dropdown
  const filteredPeople = teamMembers.filter((person) => {
    const matchesSearch = person.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Apply filter dropdown if selected
    let matchesFilter = true;
    if (selectedFilterCategory && selectedFilterValue) {
      switch (selectedFilterCategory) {
        case "Status":
          matchesFilter = person.status === selectedFilterValue;
          break;
        case "Role":
          matchesFilter = person.role === selectedFilterValue;
          break;
        case "Reporting Manager":
          matchesFilter = person.reportingManager?.name === selectedFilterValue;
          break;
        case "Created By":
          matchesFilter = person.createdBy?.name === selectedFilterValue;
          break;
        case "Created On":
          const createdOnStr = person.createdAt
            ? formatGlobalDate(person.createdAt)
            : "N/A";
          matchesFilter = createdOnStr === selectedFilterValue;
          break;
        default:
          matchesFilter = true;
      }
    }

    return matchesSearch && matchesFilter;
  });

  // Dynamic user counts
  const totalUsers = teamMembers.length;
  const activeUsers = teamMembers.filter((m) => m.status === "ACTIVE").length;

  // Sorting logic
  const sortedPeople = useMemo(() => {
    if (sortBy === "relevance") return filteredPeople;
    const sorted = [...filteredPeople];
    if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "designation") {
      sorted.sort((a, b) =>
        (a.designation || "").localeCompare(b.designation || "")
      );
    } else if (sortBy === "createdAt") {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return sorted;
  }, [filteredPeople, sortBy]);

  // Sort Owners to the top only after filtering and sorting
  const sortedAndFilteredPeople = useMemo(() => {
    return [...sortedPeople].sort((a, b) => {
      if (a.role === "Owner" && b.role !== "Owner") return -1;
      if (a.role !== "Owner" && b.role === "Owner") return 1;
      return 0;
    });
  }, [sortedPeople]);

  function getInitials(name: string): string {
    if (!name) return "";

    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase();
  }
>>>>>>> 9d8323b9f028ed1e550937b0567b974ab274f1e1

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
<<<<<<< HEAD
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
=======
          <Table className="bg-background rounded-lg border-t border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400">
            <TableHeader className="text-13">
              <TableRow className="border-b border-gray-100 dark:border-gray-700 hover:bg-transparent h-7">
                <TableHead className="font-medium py-0 text-gray-500 dark:text-gray-100 h-7">
                  Name
                </TableHead>
                <TableHead className="font-medium py-0 text-gray-500 dark:text-gray-100 h-7">
                  Status
                </TableHead>
                <TableHead className="font-medium py-0 text-gray-500 dark:text-gray-100 h-7">
                  Role
                </TableHead>
                <TableHead className="font-medium py-0 text-gray-500 dark:text-gray-100 h-7">
                  Reporting Manager
                </TableHead>
                <TableHead className="font-medium py-0 text-gray-500 dark:text-gray-100 h-7">
                  Created By
                </TableHead>
                <TableHead className="font-medium py-0 text-gray-500 dark:text-gray-100 h-7">
                  Created On
                </TableHead>
                {/* <TableHead className="px-4 py-3"></TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 3 }).map((_, idx) => (
                    <TableRow
                      key={"skeleton-" + idx}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-transparent"
                    >
                      <TableCell className="px-3 py-1">
                        <div className="flex items-center gap-3 min-w-0">
                          <Skeleton className="h-8 w-8" />
                          <div className="min-w-0 w-full">
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="px-3 py-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="px-3 py-1">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="px-3 py-1">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="px-3 py-1 hidden lg:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="px-3 py-1 hidden lg:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                : sortedAndFilteredPeople.map((member) => (
                    <TableRow
                      key={member._id.toString()}
                      className="text-13 border-b border-gray-100 dark:border-gray-700 hover:bg-transparent"
                    >
                      <TableCell className="px-3 py-1">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={member.profileImage || "/placeholder.svg"}
                              alt={member.name}
                            />
                            <AvatarFallback
                              className={`text-white font-medium bg-green-400`}
                            >
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-900 dark:text-gray-100">
                                {member.name}
                              </span>
                              {member.email === userData?.email && (
                                <Badge className="bg-white dark:bg-background text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-[4px] px-1 py-0.5 text-xs font-medium card-border">
                                  You
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground truncate">
                              {member.email || "-"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-1">
                        <Badge
                          variant="secondary"
                          className="bg-[#acdc79] text-[#25301b] dark:bg-[#25301b] dark:text-[#acdc79]"
                        >
                          {member.status
                            ? member.status.charAt(0).toUpperCase() +
                              member.status.slice(1).toLowerCase()
                            : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-1">
                        <span className="text-gray-900 dark:text-gray-100">
                          {member?.role === "Owner"
                            ? "Org Owner"
                            : member?.role === "Admin"
                            ? "Org Admin"
                            : member?.role}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-1">
                        <span className="text-gray-900 dark:text-gray-100">
                          {member.reportingManager?.name || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-1 hidden lg:table-cell">
                        <span className="text-gray-900 dark:text-gray-100">
                          {member.createdBy?.name || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-1 hidden lg:table-cell">
                        <span className="text-gray-900 dark:text-gray-100">
                          {member.createdAt
                            ? formatGlobalDate(member.createdAt)
                                .replace(/(\w+)\s+(\d+)/, "$1, $2")
                            : "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
>>>>>>> 9d8323b9f028ed1e550937b0567b974ab274f1e1

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
