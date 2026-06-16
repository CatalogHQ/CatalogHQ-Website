import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type VendorStoreRole = 'owner' | 'fulfiller';

export type VendorStoreAccess = {
  storeId: string;
  role: VendorStoreRole;
};

@Injectable()
export class VendorStoreAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveAccess(userId: string): Promise<VendorStoreAccess | null> {
    const owned = await this.prisma.store.findUnique({
      where: { vendorId: userId },
      select: { vendorId: true },
    });
    if (owned) {
      return { storeId: owned.vendorId, role: 'owner' };
    }

    const membership = await this.prisma.storeMember.findFirst({
      where: { userId },
      select: { storeId: true, role: true },
      orderBy: { createdAt: 'asc' },
    });

    if (membership?.role === 'fulfiller') {
      return { storeId: membership.storeId, role: 'fulfiller' };
    }

    return null;
  }

  async resolveStoreId(
    userId: string,
    allowedRoles: VendorStoreRole[],
  ): Promise<string> {
    const access = await this.resolveAccess(userId);
    if (!access || !allowedRoles.includes(access.role)) {
      throw new ForbiddenException('You do not have access to this store.');
    }
    return access.storeId;
  }

  async assertStoreOwner(userId: string): Promise<string> {
    return this.resolveStoreId(userId, ['owner']);
  }

  async requireStore(userId: string): Promise<string> {
    const access = await this.resolveAccess(userId);
    if (!access) {
      throw new NotFoundException('Store not found.');
    }
    return access.storeId;
  }
}
