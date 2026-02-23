import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defects = await prisma.defect.findMany({
    where: {
      status: {
        in: ['SUBMITTED', 'REVIEWING'],
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('待判定缺陷数量:', defects.length);
  console.log(JSON.stringify(defects, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
