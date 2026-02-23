import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('开始创建系统公告测试数据...');

    // 创建一条系统公告
    const announcement = await prisma.announcement.create({
        data: {
            title: '尊敬的用户',
            content: '欢迎使用众测平台！请及时完成任务，积极参与测试活动，赢取丰厚奖励。如有任何问题，请联系客服。',
            isActive: true,
            sort: 1,
            startTime: new Date('2024-01-01'),
            endTime: new Date('2030-12-31'),
        },
    });

    console.log('✅ 创建系统公告:', announcement);

    // 创建第二条公告
    const announcement2 = await prisma.announcement.create({
        data: {
            title: '系统维护通知',
            content: '本平台将于本周日凌晨2:00-4:00进行系统维护，期间可能影响部分功能使用，敬请谅解。',
            isActive: true,
            sort: 2,
            startTime: new Date('2024-01-01'),
            endTime: new Date('2030-12-31'),
        },
    });

    console.log('✅ 创建系统公告:', announcement2);

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
