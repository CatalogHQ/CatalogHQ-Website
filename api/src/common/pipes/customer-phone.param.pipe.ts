import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { normalizePhone } from '../phone.util';

@Injectable()
export class CustomerPhoneParamPipe
  implements PipeTransform<string, string>
{
  transform(value: string): string {
    const trimmed = value?.trim();

    if (!trimmed || trimmed.length < 10) {
      throw new BadRequestException('Invalid customer phone.');
    }

    return normalizePhone(trimmed);
  }
}
