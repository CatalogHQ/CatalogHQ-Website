export type SecurityAuditCategory =
  | "all"
  | "auth"
  | "admin"
  | "payment"
  | "subscription"
  | "vendor";

export type SecurityAuditLogEntry = {
  id: string;
  action: string;
  actorId?: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  ipAddress?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type SecurityAuditLogList = {
  items: SecurityAuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
};

export type ListSecurityAuditParams = {
  limit?: number;
  offset?: number;
  action?: string;
  search?: string;
  category?: SecurityAuditCategory;
};
