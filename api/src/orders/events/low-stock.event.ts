export class LowStockEvent {
  constructor(
    readonly vendorPhone: string,
    readonly productName: string,
    readonly stock: number,
  ) {}
}
