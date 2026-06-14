import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlansModule } from '../plans/plans.module';
import { StoresModule } from '../stores/stores.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [AuthModule, StoresModule, PlansModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
