import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PlanTier } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { PlanCatalogService } from './plan-catalog.service';

@Controller('plans')
export class PlansController {
  constructor(private readonly planCatalogService: PlanCatalogService) {}

  @Public()
  @Get('catalog')
  getPublicCatalog() {
    return this.planCatalogService.listPublicCatalog();
  }
}
