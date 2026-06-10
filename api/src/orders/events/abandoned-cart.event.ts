export class AbandonedCartEvent {
  constructor(
    readonly cartId: string,
    readonly customerPhone: string,
    readonly storeId: string,
  ) {}
}
