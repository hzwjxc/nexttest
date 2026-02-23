import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('检查滑动标签数据...\n');

    // 获取所有滑动标签
    const tabs = await prisma.slidingTab.findMany({
        orderBy: [{ sequence: 'asc' }],
    });

    console.log(`找到 ${tabs.length} 条滑动标签:\n`);

    tabs.forEach((item, i) => {
        console.log(`${i + 1}. ${item.text}`);
        console.log(`   图片: ${item.image}`);
        console.log(`   链接: ${item.link}`);
        console.log(`   渠道: ${item.channels.join(', ')}`);
        console.log(`   序号: ${item.sequence}`);
        console.log('');
    });

    // 筛选 PC 端渠道
    const pcTabs = tabs.filter(tab => tab.channels.includes('PC'));
    console.log(`PC端渠道标签数量: ${pcTabs.length}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
