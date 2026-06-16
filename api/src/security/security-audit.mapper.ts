import { SecurityAuditLog } from '@prisma/client';

export type SecurityAuditLogDto = {
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

const SENSITIVE_METADATA_KEYS = new Set([
  'password',
  'token',
  'secret',
  'refreshToken',
  'accessToken',
]);

function sanitizeMetadata(
  value: unknown,
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(input)) {
    const normalizedKey = key.toLowerCase();
    if (
      SENSITIVE_METADATA_KEYS.has(normalizedKey) ||
      normalizedKey.includes('password') ||
      normalizedKey.includes('token') ||
      normalizedKey.includes('secret')
    ) {
      output[key] = '[redacted]';
      continue;
    }

    output[key] = entry;
  }

  return output;
}

export function toSecurityAuditLogDto(
  log: SecurityAuditLog,
): SecurityAuditLogDto {
  return {
    id: log.id,
    action: log.action,
    actorId: log.actorId ?? undefined,
    actorEmail: log.actorEmail ?? undefined,
    targetType: log.targetType ?? undefined,
    targetId: log.targetId ?? undefined,
    ipAddress: log.ipAddress ?? undefined,
    metadata: sanitizeMetadata(log.metadata),
    createdAt: log.createdAt.toISOString(),
  };
}
