import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

// 任务管理列表查询输入
const TaskManagementListInput = z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(10),
    status: z.enum([
        'SAVED',
        'PREPARING',
        'DEPT_REWARD_REVIEW',
        'GENERAL_REWARD_REVIEW',
        'PENDING_PUBLISH',
        'EXECUTING',
        'EXECUTION_ENDED',
        'ACCOUNTING_COMPLETED',
        'REWARD_DISTRIBUTION_REVIEW',
        'PENDING_REWARD_DISTRIBUTION',
        'COMPLETED',
    ]).optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
    taskName: z.string().optional(),
});

export const taskManagementRouter = createTRPCRouter({
    // 获取任务管理列表
    list: protectedProcedure
        .input(TaskManagementListInput)
        .query(async ({ ctx, input }) => {
            const { page, pageSize, status, taskName } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {
                isDeleted: false,
            };

            if (status) {
                where.status = status;
            }

            if (taskName) {
                where.title = {
                    contains: taskName,
                    mode: 'insensitive',
                };
            }

            // 查询总数
            const total = await ctx.db.testTask.count({ where });

            // 查询列表
            const items = await ctx.db.testTask.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            orders: true,
                            defects: true, // 缺陷总数
                        },
                    },
                },
            });

            // 获取创建者信息
            const creatorIds = items.map(item => item.createdBy);
            const creators = await ctx.db.user.findMany({
                where: { id: { in: creatorIds } },
                select: { id: true, name: true },
            });

            const creatorMap = Object.fromEntries(
                creators.map(c => [c.id, c.name])
            );

            // 格式化返回数据
            const formattedItems = items.map(item => ({
                id: item.id,
                title: item.title,
                publishTime: item.createdAt,
                resultTime: item.endTime,
                creatorName: creatorMap[item.createdBy] || '未知',
                maxParticipants: item.maxParticipants,
                currentParticipants: item.currentParticipants,
                defectTotal: item._count.defects, // 缺陷总数
                rewardPoints: Math.round(item.totalBudget || 0), // 奖励积分（使用TestTask.totalBudget）
            }));

            return {
                success: true,
                data: formattedItems,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                },
            };
        }),
});

