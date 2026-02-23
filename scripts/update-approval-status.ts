import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating TestTask approval status...\n');

  // 更新所有 NULL 的审批状态为 PENDING
  const result = await prisma.testTask.updateMany({
    where: {
      isDeleted: false,
      OR: [
        { deptApprovalStatus: null },
        { generalApprovalStatus: null },
      ],
    },
    data: {
      deptApprovalStatus: 'PENDING',
      generalApprovalStatus: 'PENDING',
    },
  });

  console.log(`Updated ${result.count} tasks`);

  // 验证更新结果
  const pending = await prisma.testTask.count({
    where: {
      isDeleted: false,
      OR: [
        { deptApprovalStatus: 'PENDING' },
        { generalApprovalStatus: 'PENDING' },
      ],
    },
  });

  console.log(`\nTasks with PENDING status: ${pending}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
