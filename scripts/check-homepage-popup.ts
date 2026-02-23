import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const popups = await prisma.homepagePopup.findMany({
        orderBy: { sequence: 'asc' }
    });

    console.log('当前首页弹窗数据 (' + popups.length + ' 条):');
    console.log('='.repeat(60));

    popups.forEach((item, i) => {
        console.log(`\n${i + 1}. [${item.type}] ${item.title}`);
        console.log(`   内容: ${item.content || '无'}`);
        console.log(`   链接: ${item.link || '无'}`);
        console.log(`   启用状态: ${item.isActive ? '✅ 已启用' : '❌ 未启用'}`);
        console.log(`   有效期: ${item.startTime.toLocaleDateString()} ~ ${item.endTime.toLocaleDateString()}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
