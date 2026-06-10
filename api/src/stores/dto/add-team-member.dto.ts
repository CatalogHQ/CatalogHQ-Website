import { IsIn, IsString, Validate } from 'class-validator';
import { IsNigerianPhoneConstraint } from '../../common/validators/nigerian-phone.validator';

export class AddTeamMemberDto {
  @IsString()
  @Validate(IsNigerianPhoneConstraint)
  phone!: string;

  @IsIn(['fulfiller'])
  role!: 'fulfiller';
}
