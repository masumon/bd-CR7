export const CORE_MAIN_DASHBOARD_PATHS = [
  "/dashboard",
  "/dashboard/construction/projects",
  "/dashboard/finance",
  "/dashboard/workforce",
  "/dashboard/materials",
  "/dashboard/evidence",
  "/dashboard/reports",
  "/dashboard/audit",
  "/dashboard/contractor",
  "/dashboard/settings",
] as const;

export const NON_CORE_DASHBOARD_PREFIXES = [
  "/dashboard/import",
  "/dashboard/pos",
  "/dashboard/crm",
  "/dashboard/inventory",
] as const;
