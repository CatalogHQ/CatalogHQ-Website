import { IsArray, IsEnum, IsUUID } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class BulkUpdateOrdersDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orderIds!: string[];

  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
