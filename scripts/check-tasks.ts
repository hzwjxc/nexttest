import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 查询所有未删除的任务，按创建时间排序
  const tasks = await prisma.testTask.findMany({
    where: {
      isDeleted: false,
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      status: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  console.log('最近10条任务记录：');
  console.log('='.repeat(80));

  tasks.forEach((task, index) => {
    console.log(`${index + 1}. ${task.title}`);
    console.log(`   ID: ${task.id}`);
    console.log(`   状态: ${task.status}`);
    console.log(`   创建时间: ${task.createdAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
    console.log(`   ISO时间: ${task.createdAt.toISOString()}`);
    console.log('');
  });

  // 查询1月27日的任务
  const startDate = new Date('2026-01-27');
  const endDate = new Date('2026-01-27');
  endDate.setHours(23, 59, 59, 999);

  console.log('\n查询条件：');
  console.log(`开始时间: ${startDate.toISOString()}`);
  console.log(`结束时间: ${endDate.toISOString()}`);
  console.log('='.repeat(80));

  const jan27Tasks = await prisma.testTask.findMany({
    where: {
      isDeleted: false,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      status: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`\n1月27日的任务数量: ${jan27Tasks.length}`);
  jan27Tasks.forEach((task, index) => {
    console.log(`${index + 1}. ${task.title}`);
    console.log(`   创建时间: ${task.createdAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
    console.log('');
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
