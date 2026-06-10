import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class UpsertStockLocationDto {
  @IsString()
  @MinLength(2)
  locationName!: string;

  @IsInt()
  @Min(0)
  stock!: number;
}
