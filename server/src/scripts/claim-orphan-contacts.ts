/**
 * Optional one-shot script. Assigns all Contact rows with NULL user_id to a
 * specified user. Useful when migrating pre-tenant-boundary data onto a real
 * account.
 *
 * Usage:
 *   cd server
 *   npx tsx src/scripts/claim-orphan-contacts.ts <user-email>
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: tsx claim-orphan-contacts.ts <user-email>');
    process.exit(1);
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user with email ${email}. Sign up first.`);
    process.exit(1);
  }
  const result = await prisma.contact.updateMany({
    where: { userId: null },
    data: { userId: user.id },
  });
  console.log(`[claim] Assigned ${result.count} orphan contact(s) to ${email}.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
