export class VendorVerificationDecidedEvent {
  constructor(
    readonly vendorId: string,
    readonly approved: boolean,
    readonly reason?: string,
  ) {}
}
