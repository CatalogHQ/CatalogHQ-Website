import { IsString, Length, Matches } from 'class-validator';

export class OrderRefQueryDto {
  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/)
  phone!: string;
}
