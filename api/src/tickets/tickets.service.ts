import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TicketStatus, TicketType } from '@prisma/client';
import { normalizePhone } from '../common/phone.util';
import { sanitizeUserText } from '../common/sanitize.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketResolvedEvent } from './events/ticket-resolved.event';
import { TICKET_RESOLVED_EVENT } from './events/ticket.events';
import { SupportTicketDto, toTicketDto } from './tickets.mapper';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createPublic(dto: CreateTicketDto): Promise<SupportTicketDto> {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        subject: sanitizeUserText(dto.subject),
        description: sanitizeUserText(dto.description),
        type: TicketType.customer,
        contactName: dto.contactName.trim(),
        contactPhone: normalizePhone(dto.contactPhone),
        contactEmail: dto.contactEmail?.trim() || null,
        orderRef: dto.orderRef?.trim() || null,
      },
    });

    return toTicketDto(ticket);
  }

  async createVendor(
    vendorId: string,
    dto: CreateTicketDto,
  ): Promise<SupportTicketDto> {
    const store = await this.prisma.store.findUnique({
      where: { vendorId },
    });

    const ticket = await this.prisma.supportTicket.create({
      data: {
        subject: sanitizeUserText(dto.subject),
        description: sanitizeUserText(dto.description),
        type: TicketType.vendor,
        contactName: dto.contactName.trim(),
        contactPhone: normalizePhone(dto.contactPhone),
        contactEmail: dto.contactEmail?.trim() || null,
        orderRef: dto.orderRef?.trim() || null,
        storeName: store?.businessName ?? null,
        vendorId,
      },
    });

    return toTicketDto(ticket);
  }

  async updateByAdmin(
    ticketId: string,
    dto: UpdateTicketDto,
  ): Promise<SupportTicketDto> {
    const existing = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!existing) {
      throw new NotFoundException('Ticket not found.');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: dto.status,
        priority: dto.priority,
      },
    });

    if (
      dto.status === TicketStatus.resolved &&
      existing.status !== TicketStatus.resolved
    ) {
      this.eventEmitter.emit(
        TICKET_RESOLVED_EVENT,
        new TicketResolvedEvent(
          updated.id,
          updated.contactPhone,
          updated.subject,
        ),
      );
    }

    return toTicketDto(updated);
  }
}
