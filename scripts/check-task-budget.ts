import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 查询所有未删除的任务，包含totalBudget等字段
  const tasks = await prisma.testTask.findMany({
    where: {
      isDeleted: false,
    },
    select: {
      id: true,
      title: true,
      totalBudget: true,
      executionPoints: true,
      createdAt: true,
      rewardConfig: {
        select: {
          totalBudget: true,
          executionPoints: true,
        },
      },
      _count: {
        select: {
          defects: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  console.log('最近10条任务的积分信息：');
  console.log('='.repeat(80));

  tasks.forEach((task, index) => {
    console.log(`${index + 1}. ${task.title}`);
    console.log(`   ID: ${task.id}`);
    console.log(`   TestTask.totalBudget: ${task.totalBudget}`);
    console.log(`   TestTask.executionPoints: ${task.executionPoints}`);
    console.log(`   RewardConfig.totalBudget: ${task.rewardConfig?.totalBudget || 'null'}`);
    console.log(`   RewardConfig.executionPoints: ${task.rewardConfig?.executionPoints || 'null'}`);
    console.log(`   缺陷总数: ${task._count.defects}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

