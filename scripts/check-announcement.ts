import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('检查系统公告数据...\n');

    // 获取所有启用的公告
    const announcements = await prisma.announcement.findMany({
        where: { isActive: true },
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });

    console.log(`找到 ${announcements.length} 条启用的系统公告:\n`);

    announcements.forEach((item, i) => {
        console.log(`${i + 1}. ${item.title}`);
        console.log(`   内容: ${item.content}`);
        console.log(`   排序: ${item.sort}`);
        console.log(`   有效期: ${item.startTime ? item.startTime.toLocaleDateString() : '无'} ~ ${item.endTime ? item.endTime.toLocaleDateString() : '无'}`);
        console.log('');
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
