import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Store, VendorVerificationStatus } from '@prisma/client';
import { normalizePhone } from '../common/phone.util';
import { slugify } from '../common/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { StoreSetupDto } from './dto/store-setup.dto';
import { PublicStoreDto, StoreDto, toPublicStoreDto, toStoreDto } from './stores.mapper';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  private applyVerificationOnNinChange(
    existing: Store | null,
    nin: string,
  ): Pick<
    Store,
    'verificationStatus' | 'verificationSubmittedAt' | 'verifiedAt' | 'rejectionReason'
  > {
    const ninChanged = existing ? existing.nin !== nin : false;

    let verificationStatus = existing?.verificationStatus ?? 'unsubmitted';
    let verificationSubmittedAt = existing?.verificationSubmittedAt ?? null;
    let verifiedAt = existing?.verifiedAt ?? null;
    let rejectionReason = existing?.rejectionReason ?? null;

    if (ninChanged && verificationStatus === 'verified') {
      verificationStatus = 'pending';
      verifiedAt = null;
      verificationSubmittedAt = new Date();
      rejectionReason = null;
    } else if (ninChanged && verificationStatus === 'rejected') {
      verificationStatus = 'pending';
      verificationSubmittedAt = new Date();
      rejectionReason = null;
    }

    return {
      verificationStatus,
      verificationSubmittedAt,
      verifiedAt,
      rejectionReason,
    };
  }

  private buildStoreData(vendorId: string, dto: StoreSetupDto, existing: Store | null) {
    const nin = dto.nin.replace(/\D/g, '');
    const verification = this.applyVerificationOnNinChange(existing, nin);

    return {
      vendorId,
      slug: slugify(dto.slug),
      businessName: dto.businessName.trim(),
      bio: dto.bio.trim(),
      whatsapp: normalizePhone(dto.whatsapp),
      nin,
      category: dto.category?.trim() || null,
      city: dto.city?.trim() || null,
      state: dto.state?.trim() || null,
      setupComplete: existing?.setupComplete ?? false,
      ...verification,
    };
  }

  async isSlugTaken(slug: string, excludeVendorId?: string): Promise<boolean> {
    const normalized = slugify(slug);
    const store = await this.prisma.store.findUnique({
      where: { slug: normalized },
    });

    if (!store) return false;
    if (excludeVendorId && store.vendorId === excludeVendorId) return false;
    return true;
  }

  async getByVendorId(vendorId: string): Promise<StoreDto | null> {
    const store = await this.prisma.store.findUnique({ where: { vendorId } });
    return store ? toStoreDto(store) : null;
  }

  async getPublicBySlug(slug: string): Promise<PublicStoreDto | null> {
    const store = await this.prisma.store.findUnique({
      where: { slug: slugify(slug) },
      include: { vendor: true },
    });

    if (!store || !store.setupComplete) {
      return null;
    }

    return toPublicStoreDto(store, store.vendor.planTier);
  }

  async saveDraft(vendorId: string, dto: StoreSetupDto): Promise<StoreDto> {
    const existing = await this.prisma.store.findUnique({ where: { vendorId } });
    const data = this.buildStoreData(vendorId, dto, existing);

    if (await this.isSlugTaken(data.slug, vendorId)) {
      throw new ConflictException('This store link is already taken.');
    }

    const store = await this.prisma.store.upsert({
      where: { vendorId },
      create: data,
      update: data,
    });

    return toStoreDto(store);
  }

  async completeSetup(vendorId: string, dto: StoreSetupDto): Promise<StoreDto> {
    const existing = await this.prisma.store.findUnique({ where: { vendorId } });
    const data = this.buildStoreData(vendorId, dto, existing);

    if (await this.isSlugTaken(data.slug, vendorId)) {
      throw new ConflictException('This store link is already taken.');
    }

    let verificationStatus: VendorVerificationStatus =
      data.verificationStatus ?? 'unsubmitted';
    let verificationSubmittedAt = data.verificationSubmittedAt;
    let rejectionReason = data.rejectionReason;

    if (verificationStatus !== 'verified') {
      verificationStatus = 'pending';
      verificationSubmittedAt = verificationSubmittedAt ?? new Date();
      rejectionReason = null;
    }

    const store = await this.prisma.store.upsert({
      where: { vendorId },
      create: {
        ...data,
        setupComplete: true,
        verificationStatus,
        verificationSubmittedAt,
        rejectionReason,
      },
      update: {
        ...data,
        setupComplete: true,
        verificationStatus,
        verificationSubmittedAt,
        rejectionReason,
      },
    });

    return toStoreDto(store);
  }

  async getBySlugForVendor(slug: string): Promise<StoreDto> {
    const store = await this.prisma.store.findUnique({
      where: { slug: slugify(slug) },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return toStoreDto(store);
  }
}
