import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorStoreAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertStoreOwner(userId: string): Promise<string> {
    const store = await this.prisma.store.findUnique({
      where: { vendorId: userId },
      select: { vendorId: true },
    });

    if (!store) {
      throw new ForbiddenException('Only the store owner can perform this action.');
    }

    return store.vendorId;
  }
}
