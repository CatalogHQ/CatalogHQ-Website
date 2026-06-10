export class ReviewInviteEvent {
  constructor(
    readonly orderId: string,
    readonly customerPhone: string,
    readonly paymentRef: string,
    readonly storeName: string,
  ) {}
}
