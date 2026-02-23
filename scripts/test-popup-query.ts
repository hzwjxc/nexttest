import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const now = new Date();
    console.log('当前时间:', now.toISOString());
    console.log('='.repeat(60));

    // 模拟 API 查询条件
    const where = {
        isActive: true,
        type: 'TEXT',
        startTime: {
            lte: now,
        },
        endTime: {
            gte: now,
        }
    };

    const popups = await prisma.homepagePopup.findMany({
        where,
        orderBy: [{ sequence: 'asc' }, { createdAt: 'desc' }],
    });

    console.log(`\n查询到 ${popups.length} 条符合条件的 TEXT 类型弹窗:\n`);

    if (popups.length === 0) {
        console.log('❌ 没有符合条件的弹窗');
    } else {
        popups.forEach((item, i) => {
            console.log(`${i + 1}. [${item.type}] ${item.title}`);
            console.log(`   内容: ${item.content}`);
            console.log(`   开始时间: ${item.startTime.toISOString()}`);
            console.log(`   结束时间: ${item.endTime.toISOString()}`);
            console.log(`   启用: ${item.isActive}`);
            console.log('');
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
