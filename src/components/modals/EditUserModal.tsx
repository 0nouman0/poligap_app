"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserCompany } from "@/types/user-management";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: UserCompany | null;
  companyId: string;
  onUserUpdated?: () => void;
  currentUserEmail?: string;
  isCurrentUserAdmin?: boolean;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  member,
  companyId,
  onUserUpdated,
  currentUserEmail,
  isCurrentUserAdmin = false,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    designation: "",
    role: "",
    status: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Populate form when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        name: member.user?.name || "",
        email: member.user?.email || "",
        designation: member.user?.designation || "",
        role: member.role || "",
        status: member.status || "active",
      });
    }
  }, [member]);

  // Check if current user is editing themselves
  const isEditingSelf = member?.user?.email === currentUserEmail && !isCurrentUserAdmin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !companyId) return;

    setIsLoading(true);
    try {
      // Update user profile
      const profileResponse = await fetch(`/api/users/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: member.user_id,
          name: formData.name,
          designation: formData.designation,
        }),
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to update user profile");
      }

      // Update member role if changed and user is not editing themselves (or is admin)
      if (!isEditingSelf && formData.role !== member.role) {
        const roleResponse = await fetch(`/api/members/update-role`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: companyId,
            member_user_id: member.user_id,
            new_role: formData.role,
          }),
        });

        if (!roleResponse.ok) {
          throw new Error("Failed to update user role");
        }
      }

      // Update member status if changed and user is not editing themselves (or is admin)
      if (!isEditingSelf && formData.status !== member.status) {
        const statusResponse = await fetch(`/api/members/update-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: companyId,
            member_user_id: member.user_id,
            status: formData.status,
          }),
        });

        if (!statusResponse.ok) {
          throw new Error("Failed to update user status");
        }
      }

      toast.success("User updated successfully");
      
      // Invalidate queries to refresh the members list
      queryClient.invalidateQueries({ 
        queryKey: ["members", companyId] 
      });
      
      onClose();
      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setFormData({
      name: "",
      email: "",
      designation: "",
      role: "",
      status: "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and permissions.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="col-span-3 bg-gray-50 dark:bg-gray-800"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="designation" className="text-right">
                Designation
              </Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                className="col-span-3"
                placeholder="e.g. Software Developer"
              />
            </div>
            
            {/* Only show Role field if admin or editing another user */}
            {!isEditingSelf && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="company_admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Only show Status field if admin or editing another user */}
            {!isEditingSelf && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
