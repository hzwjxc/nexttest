import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const workbenchRouter = createTRPCRouter({
    // 获取积分明细列表
    getPointsDetails: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
                keyword: z.string().optional(),
                type: z.enum(['ALL', 'EARN', 'WITHDRAW']).default('ALL'),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                taskId: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, keyword, type, startDate, endDate, taskId } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {
                status: 'COMPLETED',
            };

            // 类型筛选
            if (type !== 'ALL') {
                where.type = type;
            }

            // 关键词搜索（搜索用户名称、手机号、任务名称）
            if (keyword) {
                where.OR = [
                    {
                        user: {
                            OR: [
                                { name: { contains: keyword, mode: 'insensitive' } },
                                { phone: { contains: keyword } },
                            ],
                        },
                    },
                    {
                        description: { contains: keyword, mode: 'insensitive' },
                    },
                ];
            }

            // 日期筛选
            if (startDate) {
                const startDateTime = new Date(startDate + 'T00:00:00.000Z');
                where.createdAt = {
                    ...where.createdAt,
                    gte: startDateTime,
                };
            }

            if (endDate) {
                const endDateTime = new Date(endDate + 'T23:59:59.999Z');
                where.createdAt = {
                    ...where.createdAt,
                    lte: endDateTime,
                };
            }

            // 任务筛选 - 通过relatedId关联到Reward表
            if (taskId) {
                where.relatedId = {
                    in: await ctx.db.reward.findMany({
                        where: { taskId },
                        select: { id: true },
                    }).then(rewards => rewards.map(r => r.id)),
                };
            }

            // 查询总数
            const total = await ctx.db.pointTransaction.count({ where });

            // 查询列表
            const transactions = await ctx.db.pointTransaction.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
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

            // 获取关联任务信息
            const transactionsWithDetails = await Promise.all(
                transactions.map(async (transaction) => {
                    let taskTitle = '-';
                    let taskIdResult: string | null = null;
                    let orderId: string | null = null;
                    let rewardType = '-';

                    // 通过relatedId查找奖励记录，进而获取任务信息和奖励类型
                    if (transaction.relatedId) {
                        const reward = await ctx.db.reward.findUnique({
                            where: { id: transaction.relatedId },
                            include: {
                                task: {
                                    select: {
                                        title: true,
                                        id: true,
                                    },
                                },
                            },
                        });

                        if (reward) {
                            if (reward.task) {
                                taskTitle = reward.task.title;
                                taskIdResult = reward.task.id;
                            }

                            // 映射奖励类型
                            const rewardTypeMap: Record<string, string> = {
                                'EXECUTION': '执行分',
                                'DEFECT': '缺陷奖励',
                                'SUGGESTION': '建议奖励',
                                'BONUS': '补充奖励',
                                'TASK_COMPLETION': '任务完成奖励',
                            };
                            rewardType = rewardTypeMap[reward.type] || reward.type;

                            // 查找订单ID作为订单编号
                            const order = await ctx.db.testTaskOrder.findFirst({
                                where: {
                                    userId: transaction.userId,
                                    taskId: reward.taskId,
                                },
                                select: {
                                    id: true,
                                },
                            });

                            orderId = order?.id || null;
                        }
                    } else {
                        // 没有relatedId，根据交易类型判断
                        if (transaction.type === 'WITHDRAW') {
                            rewardType = '积分兑换';
                        } else if (transaction.type === 'EARN') {
                            // EARN类型且无relatedId，说明是手动补充奖励
                            rewardType = '补充奖励';
                        } else {
                            rewardType = '其他';
                        }
                    }

                    return {
                        id: transaction.id,
                        userName: transaction.user?.name || '未知用户',
                        phoneNumber: transaction.user?.phone || '-',
                        points: transaction.points,
                        type: transaction.type,
                        typeName: rewardType,
                        taskTitle,
                        taskId: taskIdResult,
                        orderId,
                        createdAt: transaction.createdAt,
                        description: transaction.description,
                    };
                })
            );

            return {
                data: transactionsWithDetails,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                },
            };
        }),

    // 补充奖励 - 单人奖励
    addSingleReward: protectedProcedure
        .input(
            z.object({
                name: z.string().optional(),
                phone: z.string().min(1, '请输入手机号'),
                taskId: z.string().optional(),
                points: z.number().min(0),
                reason: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { name, phone, taskId, points, reason } = input;

            // 通过手机号查找用户
            const user = await ctx.db.user.findUnique({
                where: { phone },
            });

            if (!user) {
                throw new Error('用户不存在');
            }

            // 如果提供了姓名，验证是否匹配
            if (name && user.name !== name) {
                throw new Error(`手机号与姓名不匹配，该手机号对应的用户姓名为：${user.name}`);
            }

            let rewardId: string | null = null;

            // 如果提供了任务ID，创建Reward记录
            if (taskId) {
                const reward = await ctx.db.reward.create({
                    data: {
                        userId: user.id,
                        taskId: taskId,
                        points: points,
                        type: 'BONUS',
                        status: 'ISSUED',
                    },
                });
                rewardId = reward.id;
            }

            // 创建积分交易记录
            const transaction = await ctx.db.pointTransaction.create({
                data: {
                    userId: user.id,
                    points,
                    type: 'EARN',
                    description: reason || null,
                    relatedId: rewardId,
                    status: 'COMPLETED',
                },
            });

            // 更新用户积分
            await ctx.db.user.update({
                where: { id: user.id },
                data: {
                    availablePoints: { increment: points },
                    totalPoints: { increment: points },
                },
            });

            return {
                success: true,
                message: '奖励发放成功',
                data: transaction,
            };
        }),

    // 批量导入奖励
    importRewards: protectedProcedure
        .input(
            z.object({
                rewards: z.array(
                    z.object({
                        phone: z.string(),
                        points: z.number().min(0),
                        reason: z.string().optional(),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { rewards } = input;
            const results: Array<{ phone: string; success: boolean; message: string }> = [];

            for (const reward of rewards) {
                try {
                    // 查找用户
                    const user = await ctx.db.user.findUnique({
                        where: { phone: reward.phone },
                    });

                    if (!user) {
                        results.push({
                            phone: reward.phone,
                            success: false,
                            message: '用户不存在',
                        });
                        continue;
                    }

                    // 创建积分交易记录
                    await ctx.db.pointTransaction.create({
                        data: {
                            userId: user.id,
                            points: reward.points,
                            type: 'EARN',
                            description: reward.reason || null,
                            status: 'COMPLETED',
                        },
                    });

                    // 更新用户积分
                    await ctx.db.user.update({
                        where: { id: user.id },
                        data: {
                            availablePoints: { increment: reward.points },
                            totalPoints: { increment: reward.points },
                        },
                    });

                    results.push({
                        phone: reward.phone,
                        success: true,
                        message: '奖励发放成功',
                    });
                } catch (error) {
                    results.push({
                        phone: reward.phone,
                        success: false,
                        message: error instanceof Error ? error.message : '发放失败',
                    });
                }
            }

            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;

            return {
                success: true,
                message: `成功发放 ${successCount} 条，失败 ${failCount} 条`,
                data: results,
            };
        }),

    // 获取工作台统计数据
    getStats: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // 获取当前用户信息
        const user = await ctx.db.user.findUnique({
            where: { id: userId },
            select: {
                availablePoints: true,
            },
        });

        // 我发起的任务统计
        const [
            totalCreatedTasks,
            completedCreatedTasks,
            pendingCreatedTasks,
        ] = await Promise.all([
            // 共计：所有我发起的任务
            ctx.db.testTask.count({
                where: {
                    createdBy: userId,
                    isDeleted: false,
                },
            }),
            // 已结束：状态为已完成的任务
            ctx.db.testTask.count({
                where: {
                    createdBy: userId,
                    isDeleted: false,
                    status: 'COMPLETED',
                },
            }),
            // 未结束：其他状态的任务
            ctx.db.testTask.count({
                where: {
                    createdBy: userId,
                    isDeleted: false,
                    status: {
                        not: 'COMPLETED',
                    },
                },
            }),
        ]);

        // 待审核缺陷/建议统计
        const pendingReviewCount = await ctx.db.defect.count({
            where: {
                status: {
                    in: ['SUBMITTED', 'REVIEWING'],
                },
            },
        });

        // 缺陷/建议管理统计 - 获取有效的缺陷和建议数量
        const [validDefectsCount, validSuggestionsCount] = await Promise.all([
            // 有效缺陷共计
            ctx.db.defect.count({
                where: {
                    type: 'BUG',
                    status: 'APPROVED',
                },
            }),
            // 有效建议共计
            ctx.db.defect.count({
                where: {
                    type: 'SUGGESTION',
                    status: 'APPROVED',
                },
            }),
        ]);

        // 注册用户数
        const registeredUsersCount = await ctx.db.user.count({
            where: {
                isDeleted: false,
            },
        });

        return {
            // 我发起的任务
            createdTasks: {
                total: totalCreatedTasks,
                completed: completedCreatedTasks,
                pending: pendingCreatedTasks,
            },
            // 待审核缺陷/建议
            pendingReview: {
                total: pendingReviewCount,
            },
            // 缺陷/建议管理
            defectManagement: {
                validDefects: validDefectsCount,
                validSuggestions: validSuggestionsCount,
            },
            // 注册用户
            registeredUsers: {
                total: registeredUsersCount,
            },
            // 剩余积分
            remainingPoints: {
                total: user?.availablePoints ?? 0,
            },
        };
    }),
});

