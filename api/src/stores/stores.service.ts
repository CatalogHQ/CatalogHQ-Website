import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Store, VendorVerificationStatus } from '@prisma/client';
import { VENDOR_VERIFICATION_DECIDED_EVENT } from '../admin/events/admin.events';
import { VendorVerificationDecidedEvent } from '../admin/events/vendor-verification-decided.event';
import { normalizePhone } from '../common/phone.util';
import { slugify } from '../common/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { AshlabNinVerificationService } from '../verification/ashlab-nin-verification.service';
import {
  NIN_NAME_MISMATCH_MESSAGE,
  ninIdentityMatchesVendor,
} from '../verification/nin-identity.util';
import { StoreSetupDto } from './dto/store-setup.dto';
import { PublicStoreDto, StoreDto, toPublicStoreDto, toStoreDto } from './stores.mapper';

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ninVerification: AshlabNinVerificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private hasIdentityChanged(
    existing: Store | null,
    identity: {
      nin: string;
      legalFirstName: string;
      legalLastName: string;
    },
  ): boolean {
    if (!existing) {
      return true;
    }

    return (
      existing.nin !== identity.nin ||
      (existing.legalFirstName ?? '') !== identity.legalFirstName ||
      (existing.legalLastName ?? '') !== identity.legalLastName
    );
  }

  private applyVerificationOnIdentityChange(
    existing: Store | null,
    identity: {
      nin: string;
      legalFirstName: string;
      legalLastName: string;
    },
  ): Pick<
    Store,
    'verificationStatus' | 'verificationSubmittedAt' | 'verifiedAt' | 'rejectionReason'
  > {
    const identityChanged = this.hasIdentityChanged(existing, identity);

    let verificationStatus = existing?.verificationStatus ?? 'unsubmitted';
    let verificationSubmittedAt = existing?.verificationSubmittedAt ?? null;
    let verifiedAt = existing?.verifiedAt ?? null;
    let rejectionReason = existing?.rejectionReason ?? null;

    if (identityChanged && verificationStatus === 'verified') {
      verificationStatus = 'pending';
      verifiedAt = null;
      verificationSubmittedAt = new Date();
      rejectionReason = null;
    } else if (identityChanged && verificationStatus === 'rejected') {
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
    const legalFirstName = dto.legalFirstName.trim();
    const legalLastName = dto.legalLastName.trim();
    const verification = this.applyVerificationOnIdentityChange(existing, {
      nin,
      legalFirstName,
      legalLastName,
    });

    return {
      vendorId,
      slug: slugify(dto.slug),
      businessName: dto.businessName.trim(),
      legalFirstName,
      legalLastName,
      bio: dto.bio.trim(),
      whatsapp: normalizePhone(dto.whatsapp),
      nin,
      category: dto.category.trim(),
      address: dto.address.trim(),
      city: dto.city.trim(),
      state: dto.state.trim(),
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

  private async assertNinNotLinkedToAnotherVendor(
    nin: string,
    vendorId: string,
  ): Promise<void> {
    const duplicate = await this.prisma.store.findFirst({
      where: {
        nin,
        NOT: { vendorId },
      },
      select: { vendorId: true },
    });

    if (duplicate) {
      throw new ConflictException(
        'This NIN is already linked to another vendor account.',
      );
    }
  }

  private async resolveVerificationAfterNinCheck(
    vendorId: string,
    identity: {
      nin: string;
      legalFirstName: string;
      legalLastName: string;
    },
    existing: Store | null,
    currentStatus: VendorVerificationStatus,
  ): Promise<
    Pick<
      Store,
      'verificationStatus' | 'verificationSubmittedAt' | 'verifiedAt' | 'rejectionReason'
    >
  > {
    const identityChanged = this.hasIdentityChanged(existing, identity);
    const shouldVerify =
      this.ninVerification.isConfigured() &&
      (identityChanged || currentStatus !== VendorVerificationStatus.verified);

    if (!shouldVerify) {
      if (currentStatus === VendorVerificationStatus.verified) {
        return {
          verificationStatus: VendorVerificationStatus.verified,
          verificationSubmittedAt: existing?.verificationSubmittedAt ?? null,
          verifiedAt: existing?.verifiedAt ?? null,
          rejectionReason: null,
        };
      }

      return {
        verificationStatus: VendorVerificationStatus.pending,
        verificationSubmittedAt: new Date(),
        verifiedAt: null,
        rejectionReason: null,
      };
    }

    const result = await this.ninVerification.verify(identity.nin);

    if (result.status === 'verified') {
      if (
        !ninIdentityMatchesVendor(
          {
            legalFirstName: identity.legalFirstName,
            legalLastName: identity.legalLastName,
          },
          result.data,
        )
      ) {
        this.eventEmitter.emit(
          VENDOR_VERIFICATION_DECIDED_EVENT,
          new VendorVerificationDecidedEvent(
            vendorId,
            false,
            NIN_NAME_MISMATCH_MESSAGE,
          ),
        );
        return {
          verificationStatus: VendorVerificationStatus.rejected,
          verificationSubmittedAt: new Date(),
          verifiedAt: null,
          rejectionReason: NIN_NAME_MISMATCH_MESSAGE,
        };
      }

      this.eventEmitter.emit(
        VENDOR_VERIFICATION_DECIDED_EVENT,
        new VendorVerificationDecidedEvent(vendorId, true),
      );
      return {
        verificationStatus: VendorVerificationStatus.verified,
        verificationSubmittedAt: new Date(),
        verifiedAt: new Date(),
        rejectionReason: null,
      };
    }

    if (result.status === 'not_found' || result.status === 'invalid') {
      this.eventEmitter.emit(
        VENDOR_VERIFICATION_DECIDED_EVENT,
        new VendorVerificationDecidedEvent(vendorId, false, result.message),
      );
      return {
        verificationStatus: VendorVerificationStatus.rejected,
        verificationSubmittedAt: new Date(),
        verifiedAt: null,
        rejectionReason: result.message,
      };
    }

    if (result.status === 'rate_limited') {
      throw new HttpException(result.message, HttpStatus.TOO_MANY_REQUESTS);
    }

    if (result.status === 'payment_required') {
      throw new ServiceUnavailableException(result.message);
    }

    return {
      verificationStatus: VendorVerificationStatus.pending,
      verificationSubmittedAt: new Date(),
      verifiedAt: null,
      rejectionReason: null,
    };
  }

  async completeSetup(vendorId: string, dto: StoreSetupDto): Promise<StoreDto> {
    const existing = await this.prisma.store.findUnique({ where: { vendorId } });
    const data = this.buildStoreData(vendorId, dto, existing);

    if (await this.isSlugTaken(data.slug, vendorId)) {
      throw new ConflictException('This store link is already taken.');
    }

    await this.assertNinNotLinkedToAnotherVendor(data.nin, vendorId);

    const verification = await this.resolveVerificationAfterNinCheck(
      vendorId,
      {
        nin: data.nin,
        legalFirstName: data.legalFirstName,
        legalLastName: data.legalLastName,
      },
      existing,
      data.verificationStatus ?? VendorVerificationStatus.unsubmitted,
    );

    const {
      verificationStatus,
      verificationSubmittedAt,
      verifiedAt,
      rejectionReason,
    } = verification;

    const store = await this.prisma.store.upsert({
      where: { vendorId },
      create: {
        ...data,
        setupComplete: true,
        verificationStatus,
        verificationSubmittedAt,
        verifiedAt,
        rejectionReason,
      },
      update: {
        ...data,
        setupComplete: true,
        verificationStatus,
        verificationSubmittedAt,
        verifiedAt,
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
