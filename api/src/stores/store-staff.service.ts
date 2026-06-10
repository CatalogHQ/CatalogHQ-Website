import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoreStaffService {
  constructor(private readonly prisma: PrismaService) {}

  async listMembers(storeId: string) {
    const members = await this.prisma.storeMember.findMany({
      where: { storeId },
      orderBy: { createdAt: 'asc' },
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: members.map((member) => member.userId) } },
      select: { id: true, phone: true },
    });
    const phoneByUserId = new Map(users.map((user) => [user.id, user.phone]));

    return members.map((member) => ({
      id: member.id,
      userId: member.userId,
      phone: phoneByUserId.get(member.userId) ?? '',
      role: member.role,
      createdAt: member.createdAt.toISOString(),
    }));
  }

  async addMember(storeId: string, phone: string, role: 'fulfiller' | 'owner') {
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new NotFoundException('User with this phone was not found.');
    }

    if (user.id === storeId && role !== 'owner') {
      throw new BadRequestException('Store owner already has access.');
    }

    return this.prisma.storeMember.upsert({
      where: { storeId_userId: { storeId, userId: user.id } },
      create: { storeId, userId: user.id, role },
      update: { role },
    });
  }

  async removeMember(storeId: string, memberId: string) {
    const member = await this.prisma.storeMember.findFirst({
      where: { id: memberId, storeId },
    });
    if (!member) throw new NotFoundException('Team member not found.');
    if (member.role === 'owner') {
      throw new BadRequestException('Cannot remove store owner.');
    }
    await this.prisma.storeMember.delete({ where: { id: memberId } });
    return { success: true };
  }

  async listActivity(storeId: string, limit = 50) {
    return this.prisma.activityLog.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
