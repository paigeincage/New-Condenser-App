import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'paige@condenser.app' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'paige@condenser.app',
      password: 'temp',
      name: 'Paige Beltran',
      company: 'Pulte Homes',
    },
  });
  console.log('Seeded user:', user.id, user.name);

  const count = await prisma.user.count();
  console.log('Total users:', count);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
