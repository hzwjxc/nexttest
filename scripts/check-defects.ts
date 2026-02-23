import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDefects() {
  try {
    // 查询所有缺陷
    const allDefects = await prisma.defect.findMany({
      take: 10,
      include: {
        user: {
          select: {
            name: true,
          },
        },
        testCase: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('=== 缺陷数据检查 ===');
    console.log('总数:', allDefects.length);
    console.log('\n缺陷列表:');

    allDefects.forEach((defect, index) => {
      console.log(`\n${index + 1}. ID: ${defect.id}`);
      console.log(`   标题: ${defect.title}`);
      console.log(`   状态: ${defect.status}`);
      console.log(`   类型: ${defect.type}`);
      console.log(`   提交人: ${defect.user?.name || '未知'}`);
      console.log(`   用例: ${defect.testCase?.title || '未知'}`);
      console.log(`   创建时间: ${defect.createdAt}`);
    });

    // 按状态统计
    const statusCount = await prisma.defect.groupBy({
      by: ['status'],
      _count: true,
    });

    console.log('\n=== 按状态统计 ===');
    statusCount.forEach((item) => {
      console.log(`${item.status}: ${item._count}`);
    });

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDefects();
