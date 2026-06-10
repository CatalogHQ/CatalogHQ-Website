export class OrderStatusUpdatedEvent {
  constructor(
    readonly customerPhone: string,
    readonly paymentRef: string,
    readonly status: string,
    readonly storeName: string,
  ) {}
}
