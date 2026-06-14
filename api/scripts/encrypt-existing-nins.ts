/**
 * One-time script to encrypt existing plaintext NINs.
 * Run from api/: npx ts-node scripts/encrypt-existing-nins.ts
 */
import { PrismaClient } from '@prisma/client';
import {
  encryptNIN,
  hashNIN,
  isEncryptedNIN,
} from '../src/lib/encryption';

const prisma = new PrismaClient();

async function main() {
  const stores = await prisma.store.findMany({
    select: { vendorId: true, nin: true },
  });

  console.log(`Processing ${stores.length} stores...`);

  for (const store of stores) {
    if (isEncryptedNIN(store.nin)) {
      console.log(`Store ${store.vendorId}: already encrypted, skipping`);
      continue;
    }

    const digits = store.nin.replace(/\D/g, '');
    await prisma.store.update({
      where: { vendorId: store.vendorId },
      data: {
        nin: encryptNIN(digits),
        ninHash: hashNIN(digits),
      },
    });
    console.log(`Store ${store.vendorId}: encrypted`);
  }

  console.log('Done.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
