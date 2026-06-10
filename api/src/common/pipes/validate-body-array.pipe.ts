import {
  BadRequestException,
  Injectable,
  PipeTransform,
  Type,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export function ValidateBodyArrayPipe<T extends object>(
  itemType: Type<T>,
): Type<PipeTransform> {
  @Injectable()
  class MixinValidateBodyArrayPipe implements PipeTransform {
    async transform(value: unknown): Promise<T[]> {
      if (!Array.isArray(value)) {
        throw new BadRequestException('Expected an array body.');
      }

      const items = plainToInstance(itemType, value);
      const validationErrors = await Promise.all(
        items.map((item) => validate(item, { whitelist: true })),
      );

      const messages = validationErrors
        .flat()
        .flatMap((error) => Object.values(error.constraints ?? {}));

      if (messages.length > 0) {
        throw new BadRequestException(messages.join(', '));
      }

      return items;
    }
  }

  return MixinValidateBodyArrayPipe;
}
