import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import { IsNigerianPhoneConstraint } from '../../common/validators/nigerian-phone.validator';

export class StoreSetupDto {
  @IsString()
  @MinLength(2, { message: 'Business name must be at least 2 characters' })
  @MaxLength(80, { message: 'Business name is too long' })
  businessName!: string;

  @IsString()
  @MinLength(10, { message: 'Tell customers a bit more about your business' })
  @MaxLength(300, { message: 'Bio must be at most 300 characters' })
  bio!: string;

  @IsString()
  @Validate(IsNigerianPhoneConstraint)
  whatsapp!: string;

  @IsString()
  @Matches(/^\d{11}$/, { message: 'NIN must be exactly 11 digits' })
  nin!: string;

  @IsString()
  @MinLength(3, { message: 'Store link must be at least 3 characters' })
  @MaxLength(50, { message: 'Store link must be at most 50 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Use lowercase letters, numbers, and hyphens only',
  })
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;
}
