import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('开始创建滑动标签测试数据...');

    // 创建快捷入口标签
    const tabs = [
        {
            image: '/images/task-hall/task-icon.png',
            text: '操作指南',
            link: '/crowdsource/help',
            channels: ['PC', 'MINI_PROGRAM'],
            sequence: 1,
        },
        {
            image: '/images/task-hall/jinbi.png',
            text: '积分规则',
            link: '/crowdsource/points',
            channels: ['PC', 'MINI_PROGRAM'],
            sequence: 2,
        },
        {
            image: '/images/personalCenter/point-icon.png',
            text: '蓝信客服',
            link: 'https://customer-service.example.com',
            channels: ['PC', 'MINI_PROGRAM'],
            sequence: 3,
        },
        {
            image: '/images/task-hall/level.png',
            text: '排行榜',
            link: '/crowdsource/academy/rankingList',
            channels: ['PC', 'MINI_PROGRAM'],
            sequence: 4,
        },
        {
            image: '/images/task-hall/logo.png',
            text: '学院',
            link: '/crowdsource/academy',
            channels: ['PC', 'MINI_PROGRAM'],
            sequence: 5,
        },
        {
            image: '/images/task-hall/setting.png',
            text: '设置',
            link: '/crowdsource/settings',
            channels: ['PC'],
            sequence: 6,
        },
    ];

    for (const tab of tabs) {
        const created = await prisma.slidingTab.create({
            data: tab,
        });
        console.log(`✅ 创建滑动标签: ${created.text}`);
    }

    console.log('\n✅ 所有测试数据创建完成！');
}

main()
    .catch((e) => {
        console.error('❌ 创建测试数据失败:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
