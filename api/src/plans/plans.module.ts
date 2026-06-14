import { Module } from '@nestjs/common';
import { PlanCatalogService } from './plan-catalog.service';
import { PlansController } from './plans.controller';

@Module({
  controllers: [PlansController],
  providers: [PlanCatalogService],
  exports: [PlanCatalogService],
})
export class PlansModule {}
