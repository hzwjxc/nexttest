import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('检查 Session 表数据...\n');

    // 获取所有会话
    const sessions = await prisma.session.findMany({
        take: 10,
        orderBy: { expires: 'desc' },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
        },
    });

    console.log(`找到 ${sessions.length} 条会话记录\n`);

    sessions.forEach((session, index) => {
        console.log(`会话 ${index + 1}:`);
        console.log(`  用户: ${session.user.name || '未设置'} (${session.user.phone || '无手机号'})`);
        console.log(`  过期时间: ${session.expires}`);
        console.log(`  是否过期: ${session.expires < new Date() ? '是' : '否'}`);
        console.log('');
    });

    // 统计总会话数
    const totalSessions = await prisma.session.count();
    console.log(`总会话数: ${totalSessions}`);

    // 统计有会话的用户数
    const usersWithSessions = await prisma.user.count({
        where: {
            sessions: {
                some: {},
            },
        },
    });
    console.log(`有会话记录的用户数: ${usersWithSessions}`);

    // 统计总用户数
    const totalUsers = await prisma.user.count({
        where: { isDeleted: false },
    });
    console.log(`总用户数: ${totalUsers}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
