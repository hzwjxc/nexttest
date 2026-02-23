import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('检查参与率和反馈率统计所需的数据...\n');

    // 检查用户总数
    const totalUsers = await prisma.user.count({
        where: { isDeleted: false }
    });
    console.log(`总注册用户数: ${totalUsers}`);

    // 检查参与测试的用户数
    const participatingUsers = await prisma.user.count({
        where: {
            isDeleted: false,
            taskOrders: {
                some: {
                    startedAt: { not: null }
                }
            }
        }
    });
    console.log(`参与测试的用户数: ${participatingUsers}`);

    // 检查总任务数
    const totalTasks = await prisma.testTask.count({
        where: { isDeleted: false }
    });
    console.log(`总任务数: ${totalTasks}`);

    // 检查总缺陷数
    const totalDefects = await prisma.defect.count();
    console.log(`总缺陷数: ${totalDefects}`);

    // 检查有效缺陷数
    const validDefects = await prisma.defect.count({
        where: {
            status: 'APPROVED'
        }
    });
    console.log(`有效缺陷数: ${validDefects}`);

    // 计算参与率和反馈率
    const participationRate = totalUsers > 0 
        ? Math.round((participatingUsers / totalUsers) * 10000) / 100 
        : 0;
    
    const feedbackRate = totalDefects > 0 
        ? Math.round((validDefects / totalDefects) * 10000) / 100 
        : 0;

    console.log(`\n计算结果:`);
    console.log(`用户参测率: ${participationRate}%`);
    console.log(`有效反馈率: ${feedbackRate}%`);

    // 显示一些示例数据
    console.log('\n示例参与用户:');
    const sampleUsers = await prisma.user.findMany({
        where: {
            isDeleted: false,
            taskOrders: {
                some: {
                    startedAt: { not: null }
                }
            }
        },
        include: {
            taskOrders: {
                where: {
                    startedAt: { not: null }
                },
                select: {
                    id: true,
                    startedAt: true,
                    task: {
                        select: {
                            title: true
                        }
                    }
                }
            }
        },
        take: 3
    });

    sampleUsers.forEach(user => {
        console.log(`- ${user.name || user.phone || '未知用户'}`);
        user.taskOrders.forEach(order => {
            console.log(`  领取任务: ${order.task?.title || '未知任务'} (${order.startedAt})`);
        });
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
