import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class DeliveryZoneDto {
  @IsString()
  @MinLength(2)
  id!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsInt()
  @Min(0)
  fee!: number;
}
