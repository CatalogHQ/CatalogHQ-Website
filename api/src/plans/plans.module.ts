import { Module } from '@nestjs/common';
import { PlanCatalogService } from './plan-catalog.service';
import { PlanEntitlementService } from './plan-entitlement.service';
import { PlansController } from './plans.controller';

@Module({
  controllers: [PlansController],
  providers: [PlanCatalogService, PlanEntitlementService],
  exports: [PlanCatalogService, PlanEntitlementService],
})
export class PlansModule {}
