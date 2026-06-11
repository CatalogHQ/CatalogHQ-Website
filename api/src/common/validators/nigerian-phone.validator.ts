import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidNigerianPhone } from '../phone.util';

@ValidatorConstraint({ name: 'isNigerianPhone', async: false })
export class IsNigerianPhoneConstraint implements ValidatorConstraintInterface {
  validate(phone: string) {
    return isValidNigerianPhone(phone);
  }

  defaultMessage() {
    return 'Enter a valid Nigerian phone number (e.g. 08012345678)';
  }
}
