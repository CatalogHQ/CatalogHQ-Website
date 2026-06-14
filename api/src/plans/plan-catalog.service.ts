import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PlanTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_PLAN_CATALOG,
  getDefaultPlanCatalogEntry,
} from './plan-catalog.defaults';
import { PlanCatalogDto, toPlanCatalogDto } from './plan-catalog.mapper';

export type UpdatePlanCatalogInput = {
  name?: string;
  monthlyPriceKobo?: number;
  priceSubtext?: string;
  tagline?: string;
  cta?: string;
  popular?: boolean;
  productLimit?: number;
  active?: boolean;
  featureBullets?: string[];
  sortOrder?: number;
};

@Injectable()
export class PlanCatalogService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSeeded();
  }

  async ensureSeeded(): Promise<void> {
    for (const plan of DEFAULT_PLAN_CATALOG) {
      await this.prisma.planCatalogEntry.upsert({
        where: { tier: plan.tier },
        create: {
          tier: plan.tier,
          name: plan.name,
          monthlyPriceKobo: plan.monthlyPriceKobo,
          priceSubtext: plan.priceSubtext,
          tagline: plan.tagline,
          cta: plan.cta,
          popular: plan.popular,
          productLimit: plan.productLimit,
          active: plan.active,
          featureBullets: plan.featureBullets,
          sortOrder: plan.sortOrder,
        },
        update: {},
      });
    }
  }

  async listPublicCatalog(): Promise<PlanCatalogDto[]> {
    await this.ensureSeeded();
    const entries = await this.prisma.planCatalogEntry.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    return entries.map(toPlanCatalogDto);
  }

  async listAdminCatalog(): Promise<PlanCatalogDto[]> {
    await this.ensureSeeded();
    const entries = await this.prisma.planCatalogEntry.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return entries.map(toPlanCatalogDto);
  }

  async getProductLimit(tier: PlanTier): Promise<number> {
    await this.ensureSeeded();
    const entry = await this.prisma.planCatalogEntry.findUnique({
      where: { tier },
    });

    if (!entry) {
      return getDefaultPlanCatalogEntry(tier).productLimit;
    }

    return entry.productLimit;
  }

  async updatePlan(
    tier: PlanTier,
    input: UpdatePlanCatalogInput,
  ): Promise<PlanCatalogDto> {
    await this.ensureSeeded();

    const existing = await this.prisma.planCatalogEntry.findUnique({
      where: { tier },
    });

    if (!existing) {
      throw new NotFoundException('Plan not found.');
    }

    const updated = await this.prisma.planCatalogEntry.update({
      where: { tier },
      data: {
        name: input.name?.trim(),
        monthlyPriceKobo: input.monthlyPriceKobo,
        priceSubtext: input.priceSubtext?.trim(),
        tagline: input.tagline?.trim(),
        cta: input.cta?.trim(),
        popular: input.popular,
        productLimit: input.productLimit,
        active: input.active,
        featureBullets: input.featureBullets,
        sortOrder: input.sortOrder,
      },
    });

    return toPlanCatalogDto(updated);
  }

  async resetPlanDefaults(tier: PlanTier): Promise<PlanCatalogDto> {
    const defaults = getDefaultPlanCatalogEntry(tier);

    const updated = await this.prisma.planCatalogEntry.upsert({
      where: { tier },
      create: {
        tier: defaults.tier,
        name: defaults.name,
        monthlyPriceKobo: defaults.monthlyPriceKobo,
        priceSubtext: defaults.priceSubtext,
        tagline: defaults.tagline,
        cta: defaults.cta,
        popular: defaults.popular,
        productLimit: defaults.productLimit,
        active: defaults.active,
        featureBullets: defaults.featureBullets,
        sortOrder: defaults.sortOrder,
      },
      update: {
        name: defaults.name,
        monthlyPriceKobo: defaults.monthlyPriceKobo,
        priceSubtext: defaults.priceSubtext,
        tagline: defaults.tagline,
        cta: defaults.cta,
        popular: defaults.popular,
        productLimit: defaults.productLimit,
        active: defaults.active,
        featureBullets: defaults.featureBullets,
        sortOrder: defaults.sortOrder,
      },
    });

    return toPlanCatalogDto(updated);
  }
}
