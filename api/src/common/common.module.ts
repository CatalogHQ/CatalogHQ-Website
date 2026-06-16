import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { AdminGuard } from './guards/admin.guard';
import { AdminSetupGuard } from './guards/admin-setup.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { OriginGuard } from './guards/origin.guard';

@Module({
  providers: [
    AdminGuard,
    AdminSetupGuard,
    OriginGuard,
    CsrfGuard,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: OriginGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
  exports: [AdminGuard, AdminSetupGuard, OriginGuard, CsrfGuard],
})
export class CommonModule {}
