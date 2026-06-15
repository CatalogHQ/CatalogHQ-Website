import { IsString, Length, Matches } from 'class-validator';

export class EnableTotpDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  token!: string;
}
