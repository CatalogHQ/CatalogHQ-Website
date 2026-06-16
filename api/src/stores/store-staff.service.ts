import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { normalizeEmail } from '../common/email.util';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityAuditAction } from '../security/security-audit.actions';
import { SecurityAuditService } from '../security/security-audit.service';
import { VendorStoreAccessService } from './vendor-store-access.service';

@Injectable()
export class StoreStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vendorStoreAccess: VendorStoreAccessService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async listMembers(userId: string) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(userId);
    const members = await this.prisma.storeMember.findMany({
      where: { storeId },
      orderBy: { createdAt: 'asc' },
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: members.map((member) => member.userId) } },
      select: { id: true, email: true },
    });
    const emailByUserId = new Map(users.map((user) => [user.id, user.email]));

    return members.map((member) => ({
      id: member.id,
      userId: member.userId,
      email: emailByUserId.get(member.userId) ?? '',
      role: member.role,
      createdAt: member.createdAt.toISOString(),
    }));
  }

  async addMember(
    userId: string,
    email: string,
    role: 'fulfiller' | 'owner',
  ) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(userId);
    const normalized = normalizeEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });

    if (!user) {
      throw new NotFoundException('User with this email was not found.');
    }

    if (user.id === storeId && role !== 'owner') {
      throw new BadRequestException('Store owner already has access.');
    }

    const member = await this.prisma.storeMember.upsert({
      where: { storeId_userId: { storeId, userId: user.id } },
      create: { storeId, userId: user.id, role },
      update: { role },
    });

    const actor = await this.prisma.user.findUnique({ where: { id: userId } });
    await this.securityAudit.log({
      actorId: userId,
      actorEmail: actor?.email,
      action: SecurityAuditAction.VENDOR_TEAM_MEMBER_ADDED,
      targetType: 'store_member',
      targetId: member.id,
      metadata: { storeId, memberEmail: user.email, role },
    });

    return {
      id: member.id,
      userId: member.userId,
      email: user.email,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
    };
  }

  async removeMember(userId: string, memberId: string) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(userId);
    const member = await this.prisma.storeMember.findFirst({
      where: { id: memberId, storeId },
    });

    if (!member) {
      throw new NotFoundException('Team member not found.');
    }

    const deleted = await this.prisma.storeMember.deleteMany({
      where: { id: memberId, storeId },
    });
    if (deleted.count === 0) {
      throw new NotFoundException('Team member not found.');
    }

    const actor = await this.prisma.user.findUnique({ where: { id: userId } });
    await this.securityAudit.log({
      actorId: userId,
      actorEmail: actor?.email,
      action: SecurityAuditAction.VENDOR_TEAM_MEMBER_REMOVED,
      targetType: 'store_member',
      targetId: memberId,
      metadata: { storeId, removedUserId: member.userId },
    });
  }

  async listActivity(userId: string) {
    const storeId = await this.vendorStoreAccess.assertStoreOwner(userId);
    const logs = await this.prisma.activityLog.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      metadata: log.metadata as Record<string, unknown> | undefined,
      createdAt: log.createdAt.toISOString(),
    }));
  }
}
