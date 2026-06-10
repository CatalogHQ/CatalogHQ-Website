export class TicketResolvedEvent {
  constructor(
    readonly ticketId: string,
    readonly contactPhone: string,
    readonly subject: string,
  ) {}
}
