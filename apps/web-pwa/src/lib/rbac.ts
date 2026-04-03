export const ROLE_ACCESS: Record<string, string[]> = {
  super_admin: [
    "/dashboard",
    "/dashboard/construction",
    "/dashboard/finance",
    "/dashboard/import",
    "/dashboard/pos",
    "/dashboard/construction/projects",
    "/dashboard/reports",
    "/dashboard/settings",
  ],
  admin: [
    "/dashboard",
    "/dashboard/construction",
    "/dashboard/finance",
    "/dashboard/import",
    "/dashboard/pos",
    "/dashboard/construction/projects",
    "/dashboard/reports",
    "/dashboard/settings",
  ],
  maker: [
    "/dashboard",
    "/dashboard/construction",
    "/dashboard/finance",
    "/dashboard/import",
    "/dashboard/pos",
    "/dashboard/construction/projects",
    "/dashboard/reports",
    "/dashboard/settings",
  ],
  checker: [
    "/dashboard",
    "/dashboard/finance",
    "/dashboard/reports",
    "/dashboard/settings",
  ],
  viewer: [
    "/dashboard",
    "/dashboard/reports",
    "/dashboard/settings",
  ],
  worker: [
    "/dashboard",
    "/dashboard/construction",
    "/dashboard/pos",
    "/dashboard/settings",
  ],
};

export function normalizeRoleName(role: string | null | undefined): string {
  return (role || "viewer").trim().toLowerCase();
}
