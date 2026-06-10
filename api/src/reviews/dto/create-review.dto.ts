import { IsInt, IsString, Max, Min, MinLength, Validate } from 'class-validator';
import { IsNigerianPhoneConstraint } from '../../common/validators/nigerian-phone.validator';

export class CreateReviewDto {
  @IsString()
  @MinLength(2)
  buyerName!: string;

  @IsString()
  @Validate(IsNigerianPhoneConstraint)
  customerPhone!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @MinLength(10)
  comment!: string;
}
