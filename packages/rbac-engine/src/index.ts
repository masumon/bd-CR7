export type Role = "admin" | "maker" | "checker" | "viewer";

export type ApprovalRecord = {
  createdBy: string;
  approvedBy?: string;
  status: "pending" | "approved" | "rejected";
};

export function canPerform(role: Role, action: "create" | "approve" | "view"): boolean {
  if (role === "admin") return true;
  if (action === "view") return true;
  if (action === "create") return role === "maker";
  return role === "checker";
}

export function validateDualApproval(record: ApprovalRecord): boolean {
  if (record.status === "pending") return true;
  return Boolean(record.approvedBy) && record.createdBy !== record.approvedBy;
}
