import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking TestTask data...\n');

  // 检查总数
  const total = await prisma.testTask.count({
    where: { isDeleted: false }
  });
  console.log(`Total TestTasks (not deleted): ${total}`);

  // 检查各审批状态的数量
  const pending = await prisma.testTask.count({
    where: {
      isDeleted: false,
      OR: [
        { deptApprovalStatus: 'PENDING' },
        { generalApprovalStatus: 'PENDING' },
      ],
    },
  });
  console.log(`Pending approval: ${pending}`);

  const approved = await prisma.testTask.count({
    where: {
      isDeleted: false,
      deptApprovalStatus: 'APPROVED',
      generalApprovalStatus: 'APPROVED',
    },
  });
  console.log(`Approved: ${approved}`);

  const rejected = await prisma.testTask.count({
    where: {
      isDeleted: false,
      OR: [
        { deptApprovalStatus: 'REJECTED' },
        { generalApprovalStatus: 'REJECTED' },
      ],
    },
  });
  console.log(`Rejected: ${rejected}\n`);

  // 显示所有任务的审批状态
  const tasks = await prisma.testTask.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      title: true,
      deptApprovalStatus: true,
      generalApprovalStatus: true,
      status: true,
    },
    take: 10,
  });

  console.log('Sample tasks:');
  tasks.forEach(task => {
    console.log(`- ${task.title}`);
    console.log(`  Dept: ${task.deptApprovalStatus || 'NULL'}, General: ${task.generalApprovalStatus || 'NULL'}, Status: ${task.status}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
