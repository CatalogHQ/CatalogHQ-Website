import { Module } from '@nestjs/common';
import { AshlabNinVerificationService } from './ashlab-nin-verification.service';

@Module({
  providers: [AshlabNinVerificationService],
  exports: [AshlabNinVerificationService],
})
export class VerificationModule {}
