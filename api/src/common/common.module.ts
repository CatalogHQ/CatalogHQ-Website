import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { AdminGuard } from './guards/admin.guard';
import { OriginGuard } from './guards/origin.guard';

@Module({
  providers: [
    AdminGuard,
    OriginGuard,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: OriginGuard,
    },
  ],
  exports: [AdminGuard, OriginGuard],
})
export class CommonModule {}
