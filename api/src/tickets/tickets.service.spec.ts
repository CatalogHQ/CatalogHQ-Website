import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { TicketStatus, TicketType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from './tickets.service';
import { TICKET_RESOLVED_EVENT } from './events/ticket.events';

describe('TicketsService', () => {
  const prisma = {
    supportTicket: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    store: { findUnique: jest.fn() },
  };

  const eventEmitter = { emit: jest.fn() };

  let service: TicketsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(TicketsService);
  });

  it('creates a public customer ticket', async () => {
    prisma.supportTicket.create.mockResolvedValue({
      id: 'ticket-1',
      subject: 'Help',
      description: 'Need help with order',
      type: TicketType.customer,
      status: TicketStatus.open,
      priority: 'medium',
      contactName: 'Ada',
      contactPhone: '08012345678',
      contactEmail: null,
      storeName: null,
      orderRef: null,
      createdAt: new Date('2026-06-08T10:00:00.000Z'),
      updatedAt: new Date('2026-06-08T10:00:00.000Z'),
    });

    const ticket = await service.createPublic({
      subject: 'Help',
      description: 'Need help with order',
      contactName: 'Ada',
      contactPhone: '08012345678',
    });

    expect(ticket.id).toBe('ticket-1');
    expect(prisma.supportTicket.create).toHaveBeenCalled();
  });

  it('resolves a ticket and emits event', async () => {
    prisma.supportTicket.findUnique.mockResolvedValue({
      id: 'ticket-1',
      subject: 'Help',
      status: TicketStatus.open,
      contactPhone: '08012345678',
    });
    prisma.supportTicket.update.mockResolvedValue({
      id: 'ticket-1',
      subject: 'Help',
      description: 'Need help with order',
      type: TicketType.customer,
      status: TicketStatus.resolved,
      priority: 'medium',
      contactName: 'Ada',
      contactPhone: '08012345678',
      contactEmail: null,
      storeName: null,
      orderRef: null,
      vendorId: null,
      createdAt: new Date('2026-06-08T10:00:00.000Z'),
      updatedAt: new Date('2026-06-08T10:00:00.000Z'),
    });

    await service.updateByAdmin('ticket-1', { status: TicketStatus.resolved });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      TICKET_RESOLVED_EVENT,
      expect.objectContaining({ ticketId: 'ticket-1' }),
    );
  });

  it('throws when ticket is missing', async () => {
    prisma.supportTicket.findUnique.mockResolvedValue(null);

    await expect(
      service.updateByAdmin('missing', { status: TicketStatus.resolved }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
