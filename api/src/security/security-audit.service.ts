import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ListSecurityAuditQueryDto,
} from './dto/list-security-audit-query.dto';
import {
  SecurityAuditLogDto,
  toSecurityAuditLogDto,
} from './security-audit.mapper';

export type SecurityAuditInput = {
  actorId?: string;
  actorEmail?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
};

@Injectable()
export class SecurityAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: SecurityAuditInput): Promise<void> {
    await this.prisma.securityAuditLog.create({
      data: {
        actorId: input.actorId,
        actorEmail: input.actorEmail,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        ipAddress: input.ipAddress,
      },
    });
  }

  async list(query: ListSecurityAuditQueryDto): Promise<{
    items: SecurityAuditLogDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const where = this.buildListWhere(query);

    const [rows, total] = await Promise.all([
      this.prisma.securityAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.securityAuditLog.count({ where }),
    ]);

    return {
      items: rows.map(toSecurityAuditLogDto),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  private buildListWhere(
    query: ListSecurityAuditQueryDto,
  ): Prisma.SecurityAuditLogWhereInput {
    const where: Prisma.SecurityAuditLogWhereInput = {};

    if (query.action?.trim()) {
      where.action = query.action.trim();
    } else if (query.category !== 'all') {
      where.action = {
        startsWith: `${query.category}.`,
      };
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { actorEmail: { contains: term, mode: 'insensitive' } },
        { targetId: { contains: term, mode: 'insensitive' } },
        { ipAddress: { contains: term } },
      ];
    }

    return where;
  }
}
