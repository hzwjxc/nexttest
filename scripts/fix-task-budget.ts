import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始修复历史任务的totalBudget字段...\n');

  // 查找所有totalBudget为0但有积分申请的任务
  const tasks = await prisma.testTask.findMany({
    where: {
      isDeleted: false,
      totalBudget: 0,
    },
    include: {
      pointsApplications: {
        where: {
          status: {
            in: ['GENERAL_APPROVED', 'COMPLETED'],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

  console.log(`找到 ${tasks.length} 个需要修复的任务\n`);

  let fixedCount = 0;
  for (const task of tasks) {
    if (task.pointsApplications.length > 0) {
      const application = task.pointsApplications[0];
      await prisma.testTask.update({
        where: { id: task.id },
        data: {
          totalBudget: application.appliedPoints,
        },
      });
      console.log(`✓ 任务 "${task.title}" (ID: ${task.id})`);
      console.log(`  totalBudget: 0 -> ${application.appliedPoints}`);
      fixedCount++;
    }
  }

  console.log(`\n修复完成！共修复 ${fixedCount} 个任务`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

