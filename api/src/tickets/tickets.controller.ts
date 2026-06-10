import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketsService } from './tickets.service';

@Controller('support/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  createPublic(@Body() dto: CreateTicketDto) {
    return this.ticketsService.createPublic(dto);
  }

  @Post('vendor')
  createVendor(@CurrentUser() user: User, @Body() dto: CreateTicketDto) {
    return this.ticketsService.createVendor(user.id, dto);
  }
}
