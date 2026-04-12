"use client";

/**
 * UserManagementTab — Super Admin only user management panel.
 * Allows role assignment, activation/deactivation of users.
 */

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, UserCheck, UserX, RefreshCw, AlertCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { getErrorMessage } from "@/lib/errorUtils";

type ManagedUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  user_code: string | null;
};

const ASSIGNABLE_ROLES = ["super_admin", "admin", "supervisor", "engineer", "maker", "checker", "viewer", "worker"] as const;

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  supervisor: "Supervisor",
  engineer: "Engineer",
  maker: "Maker",
  checker: "Checker",
  viewer: "Viewer",
  worker: "Worker",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  admin: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  supervisor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  engineer: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  maker: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  checker: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  viewer: "bg-muted text-muted-foreground border-border",
  worker: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

export function UserManagementTab() {
  const token = useAuthStore((s) => s.token ?? undefined);
  const currentUserId = useAuthStore((s) => s.userId);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiClient<ManagedUser[]>("/api/users/list", { method: "GET" }, token);
      setUsers(data ?? []);
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const updateRole = async (userId: string, newRole: string) => {
    if (!token) return;
    setSaving(userId);
    setMessage("");
    setError("");
    try {
      await apiClient(
        `/api/users/${userId}/role`,
        { method: "PATCH", body: JSON.stringify({ role: newRole }) },
        token
      );
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      setMessage(`Role updated to ${ROLE_LABELS[newRole] ?? newRole}`);
    } catch (err) {
      setError(getErrorMessage(err) || "Role update failed");
    } finally {
      setSaving(null);
    }
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    if (!token) return;
    setSaving(userId);
    setMessage("");
    setError("");
    try {
      await apiClient(
        `/api/users/${userId}/status`,
        { method: "PATCH", body: JSON.stringify({ is_active: !isActive }) },
        token
      );
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !isActive } : u));
      setMessage(!isActive ? "User activated" : "User deactivated");
    } catch (err) {
      setError(getErrorMessage(err) || "Status update failed");
    } finally {
      setSaving(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!token) return;
    const confirmed = window.confirm("Delete this user permanently? / এই ব্যবহারকারীকে স্থায়ীভাবে ডিলিট করবেন?");
    if (!confirmed) return;

    setSaving(userId);
    setMessage("");
    setError("");
    try {
      await apiClient(`/api/users/${userId}`, { method: "DELETE" }, token);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setMessage("User deleted successfully");
    } catch (err) {
      setError(getErrorMessage(err) || "Delete failed");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            User Management / ব্যবহারকারী ব্যবস্থাপনা
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage roles and activate/deactivate users. Super Admin only.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void loadUsers()}
          className="h-8 gap-1.5 px-3 text-xs"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          {message}
        </div>
      )}

      <div className="space-y-2">
        {users.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/45 px-4 py-8 text-center text-xs text-muted-foreground">
            No users found / কোনো ব্যবহারকারী পাওয়া যায়নি
          </div>
        ) : (
          users.map((user) => {
            const isSelf = user.id === currentUserId;
            const isBusy = saving === user.id;
            const roleColor = ROLE_COLORS[user.role] ?? ROLE_COLORS.viewer;

            return (
              <div
                key={user.id}
                className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-sm font-bold text-primary">
                    {(user.full_name?.slice(0, 1) || user.email.slice(0, 1)).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.full_name || user.email}
                      {isSelf && <span className="ml-1.5 text-[10px] text-muted-foreground">(you)</span>}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleColor}`}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>

                  {/* Role selector */}
                  {!isSelf && (
                    <select
                      value={user.role}
                      disabled={isBusy}
                      onChange={(e) => void updateRole(user.id, e.target.value)}
                      className="h-8 rounded-xl border border-border/60 bg-background px-2 text-xs text-foreground outline-none disabled:opacity-50"
                      title="Change role"
                      aria-label="Change user role"
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  )}

                  {/* Activate/Deactivate */}
                  {!isSelf && (
                    <button
                      onClick={() => void toggleActive(user.id, user.is_active)}
                      disabled={isBusy}
                      className={`flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                        user.is_active
                          ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                          : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      }`}
                      title={user.is_active ? "Deactivate user" : "Activate user"}
                    >
                      {user.is_active ? (
                        <><UserX className="h-3.5 w-3.5" /> Deactivate</>
                      ) : (
                        <><UserCheck className="h-3.5 w-3.5" /> Activate</>
                      )}
                    </button>
                  )}

                  {!isSelf && (
                    <button
                      onClick={() => void deleteUser(user.id)}
                      disabled={isBusy}
                      className="flex h-8 items-center gap-1.5 rounded-xl border border-rose-500/30 px-2.5 text-[11px] font-medium text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
                      title="Delete user"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  )}

                  {/* Active badge */}
                  <span className={`flex h-2 w-2 rounded-full ${user.is_active ? "bg-emerald-400" : "bg-rose-500"}`} title={user.is_active ? "Active" : "Inactive"} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
