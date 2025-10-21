"use client";

import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive" | "secondary" | "outline" | "ghost" | "link";
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  // Optional dual-checks
  requireAcknowledge?: boolean; // checkbox
  acknowledgeLabel?: string;
  confirmKeyword?: string; // e.g., "DELETE"
}

export function ConfirmDialog({
  open,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  confirmVariant = "destructive",
  onConfirm,
  onCancel,
  requireAcknowledge = false,
  acknowledgeLabel = "I understand this cannot be undone",
  confirmKeyword,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [ack, setAck] = useState(false);
  const [keyword, setKeyword] = useState("");

  const canConfirm = useMemo(() => {
    if (requireAcknowledge && !ack) return false;
    if (confirmKeyword && keyword.trim().toUpperCase() !== confirmKeyword.toUpperCase()) return false;
    return !loading;
  }, [requireAcknowledge, ack, confirmKeyword, keyword, loading]);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {(requireAcknowledge || confirmKeyword) && (
          <div className="space-y-3 py-2">
            {requireAcknowledge && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-muted-foreground/30"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                />
                {acknowledgeLabel}
              </label>
            )}
            {confirmKeyword && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Type {`"${confirmKeyword}"`} to confirm
                </label>
                <input
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={confirmKeyword}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm} disabled={!canConfirm}>
            {loading ? "Please wait…" : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
