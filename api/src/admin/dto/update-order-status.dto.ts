import { OrderStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class AdminUpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
