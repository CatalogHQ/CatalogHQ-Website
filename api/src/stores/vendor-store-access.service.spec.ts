import { VendorStoreAccessService } from './vendor-store-access.service';

describe('VendorStoreAccessService', () => {
  const prisma = {
    store: { findUnique: jest.fn() },
    storeMember: { findFirst: jest.fn() },
  };

  const service = new VendorStoreAccessService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns owner access for store vendor', async () => {
    prisma.store.findUnique.mockResolvedValue({ vendorId: 'vendor-1' });

    await expect(service.resolveStoreId('vendor-1', ['owner'])).resolves.toBe(
      'vendor-1',
    );
  });

  it('returns fulfiller store id for team members', async () => {
    prisma.store.findUnique.mockResolvedValue(null);
    prisma.storeMember.findFirst.mockResolvedValue({
      storeId: 'vendor-1',
      role: 'fulfiller',
    });

    await expect(
      service.resolveStoreId('staff-1', ['owner', 'fulfiller']),
    ).resolves.toBe('vendor-1');
  });

  it('blocks fulfiller from owner-only actions', async () => {
    prisma.store.findUnique.mockResolvedValue(null);
    prisma.storeMember.findFirst.mockResolvedValue({
      storeId: 'vendor-1',
      role: 'fulfiller',
    });

    await expect(service.assertStoreOwner('staff-1')).rejects.toThrow(
      'You do not have access to this store.',
    );
  });
});
