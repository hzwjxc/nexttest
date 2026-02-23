import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始更新公告时间字段...');

  // 查找所有 startTime 或 endTime 为空的公告
  const announcements = await prisma.announcement.findMany({
    where: {
      OR: [
        { startTime: null },
        { endTime: null },
      ],
    },
  });

  console.log(`找到 ${announcements.length} 条需要更新的公告`);

  // 为每条公告设置默认时间
  for (const announcement of announcements) {
    await prisma.announcement.update({
      where: { id: announcement.id },
      data: {
        // 如果 startTime 为空，使用创建时间
        startTime: announcement.startTime || announcement.createdAt,
        // 如果 endTime 为空，使用创建时间 + 30 天
        endTime: announcement.endTime || new Date(announcement.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`更新公告: ${announcement.title}`);
  }

  console.log('更新完成！');
}

main()
  .catch((e) => {
    console.error('更新失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
