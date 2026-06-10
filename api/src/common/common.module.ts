import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { AdminGuard } from './guards/admin.guard';

@Module({
  providers: [
    AdminGuard,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [AdminGuard],
})
export class CommonModule {}
