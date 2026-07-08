import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || 'file:./dev.db'
});

async function main() {
  const units = ['Matriz', 'Filial', 'Serra Azul', 'Piso Forte', 'Cecafi RN'];

  console.log('Seeding units...');
  for (const unitName of units) {
    await prisma.unit.upsert({
      where: { name: unitName },
      update: {},
      create: {
        name: unitName,
        currentStatus: 'NORMAL',
      },
    });
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
