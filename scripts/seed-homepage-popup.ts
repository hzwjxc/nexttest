import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('开始创建首页弹窗测试数据...');

    // 创建一条文字类型的首页通知
    const textPopup = await prisma.homepagePopup.create({
        data: {
            type: 'TEXT',
            title: '系统通知',
            content: '尊敬的用户，欢迎使用众测平台！请及时完成任务，积极参与测试活动，赢取丰厚奖励。如有任何问题，请联系客服。',
            link: 'https://example.com/help',
            startTime: new Date('2024-01-01'),
            endTime: new Date('2030-12-31'),
            sequence: 1,
            isActive: true,
        },
    });

    console.log('✅ 创建文字弹窗:', textPopup);

    // 创建一条图片类型的首页弹窗（可选）
    const imagePopup = await prisma.homepagePopup.create({
        data: {
            type: 'IMAGE',
            title: '活动通知',
            content: '新春活动火热进行中',
            image: '/images/task-hall/banner.jpg',
            link: 'https://example.com/activity',
            startTime: new Date('2024-01-01'),
            endTime: new Date('2030-12-31'),
            sequence: 2,
            isActive: true,
        },
    });

    console.log('✅ 创建图片弹窗:', imagePopup);

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
