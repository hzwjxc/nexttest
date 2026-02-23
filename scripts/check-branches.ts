import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBranches() {
  try {
    // 获取所有不同的分行名称
    const users = await prisma.user.findMany({
      where: {
        isDeleted: false,
        organization: {
          not: null
        }
      },
      select: {
        organization: true,
      },
      distinct: ['organization']
    });

    // 过滤掉空值并排序
    const branches = users
      .map(user => user.organization)
      .filter((org): org is string => org !== null && org !== undefined && org.trim() !== '')
      .sort();

    console.log('数据库中的所有分行:');
    console.log('====================');
    branches.forEach((branch, index) => {
      console.log(`${index + 1}. ${branch}`);
    });
    console.log('====================');
    console.log(`总计: ${branches.length} 个分行`);

  } catch (error) {
    console.error('查询分行数据时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBranches();
