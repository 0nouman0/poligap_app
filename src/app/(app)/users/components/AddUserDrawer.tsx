"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onInvited?: () => void;
};

export default function AddUserDrawer({ isOpen, onClose, onInvited }: Props) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendInvite = async () => {
    setError(null);
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      // Normalize email to lowercase
      const normalizedEmail = email.trim().toLowerCase();
      // Insert into an invitations table if you have one
      const payload = { email: normalizedEmail, role };
      const { data, error: upsertErr } = await supabase.from("invitations").insert([payload]).select().single();
      if (upsertErr) {
        // If invitations table doesn't exist, fall back to profiles table with minimal data
        const { error: profileErr } = await supabase.from("profiles").insert([{ email: normalizedEmail, role }]);
        if (profileErr) throw profileErr;
      }
      setEmail("");
      setRole("user");
      onClose();
      // notify parent to refresh list
      if (onInvited) onInvited();
    } catch (e: any) {
      console.error("Failed to invite user", e);
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="user or admin" />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <DialogFooter>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button onClick={sendInvite} disabled={loading}>{loading ? "Sending..." : "Send Invite"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
