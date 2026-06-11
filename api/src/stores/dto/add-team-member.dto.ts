import { IsEmail, IsIn } from 'class-validator';

export class AddTeamMemberDto {
  @IsEmail()
  email!: string;

  @IsIn(['fulfiller'])
  role!: 'fulfiller';
}
