import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

// 积分申请状态枚举
const PointsApplicationStatus = z.enum([
    'PENDING',
    'DEPT_APPROVED',
    'DEPT_REJECTED',
    'GENERAL_APPROVED',
    'GENERAL_REJECTED',
    'COMPLETED',
]);

// 创建积分申请输入
const CreatePointsApplicationInput = z.object({
    taskId: z.string(),
    appliedPoints: z.number().min(0),
    isManualInput: z.boolean().default(false),
    participationRate: z.number().optional(),
    validFeedbackRate: z.number().optional(),
    pointsPerFeedback: z.number().optional(),
    participantCount: z.number().optional(),
    executionScore: z.number().optional(),
    rewardRule: z.string().optional(),
    reason: z.string().optional(),
});

// 积分申请列表查询输入
const PointsApplicationListInput = z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(10),
    keyword: z.string().optional(),
    status: PointsApplicationStatus.optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

// 审核操作输入
const ReviewPointsApplicationInput = z.object({
    id: z.string(),
    comment: z.string().optional(),
});

export const pointsApplicationRouter = createTRPCRouter({
    // 创建积分申请
    create: protectedProcedure
        .input(CreatePointsApplicationInput)
        .mutation(async ({ ctx, input }) => {
            const {
                taskId,
                appliedPoints,
                isManualInput,
                participationRate,
                validFeedbackRate,
                pointsPerFeedback,
                participantCount,
                executionScore,
                rewardRule,
                reason,
            } = input;

            // 检查任务是否存在
            const task = await ctx.db.testTask.findUnique({
                where: { id: taskId },
            });

            if (!task) {
                throw new Error('任务不存在');
            }

            // 检查任务状态是否允许申请积分
            if (task.status !== 'PREPARING') {
                throw new Error('只有准备中的任务才能申请积分');
            }

            // 创建积分申请
            const application = await ctx.db.pointsApplication.create({
                data: {
                    taskId,
                    appliedPoints,
                    isManualInput,
                    participationRate,
                    validFeedbackRate,
                    pointsPerFeedback,
                    participantCount,
                    executionScore,
                    rewardRule,
                    reason,
                    status: 'PENDING',
                    applicantId: ctx.session.user.id,
                    applicantName: ctx.session.user.name,
                },
            });

            // 更新任务状态为部门经理积分审核中
            await ctx.db.testTask.update({
                where: { id: taskId },
                data: {
                    status: 'DEPT_REWARD_REVIEW',
                },
            });

            return {
                success: true,
                message: '积分申请已提交',
                data: application,
            };
        }),

    // 获取积分申请列表
    list: protectedProcedure
        .input(PointsApplicationListInput)
        .query(async ({ ctx, input }) => {
            const { page, pageSize, keyword, status, startDate, endDate } =
                input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {};

            if (keyword) {
                where.task = {
                    OR: [
                        { title: { contains: keyword, mode: 'insensitive' } },
                        { system: { contains: keyword, mode: 'insensitive' } },
                    ],
                };
            }

            if (status) {
                where.status = status;
            }

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

            // 查询总数
            const total = await ctx.db.pointsApplication.count({ where });

            // 查询列表
            const items = await ctx.db.pointsApplication.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    task: {
                        include: {
                            testCases: true,
                            rewardConfig: true,
                        },
                    },
                },
            });

            // 为状态为REWARD_DISTRIBUTION_REVIEW、PENDING_REWARD_DISTRIBUTION、COMPLETED的任务获取缺陷统计
            const itemsWithStats = await Promise.all(
                items.map(async (item) => {
                    if (
                        [
                            'REWARD_DISTRIBUTION_REVIEW',
                            'PENDING_REWARD_DISTRIBUTION',
                            'COMPLETED',
                        ].includes(item.task.status)
                    ) {
                        // 获取任务的执行积分和奖励配置
                        const rewardConfig = item.task.rewardConfig;
                        const executionPoints = item.task.executionPoints || 0;

                        // 统计执行分获得人数（已通过的缺陷/建议的提交人去重）
                        const executionCountResult =
                            await ctx.db.defect.groupBy({
                                by: ['userId'],
                                where: {
                                    taskId: item.taskId,
                                    status: 'APPROVED',
                                },
                            });
                        const executionCount = executionCountResult.length;

                        // 统计各等级的缺陷数量
                        const defectCounts = await ctx.db.defect.groupBy({
                            by: ['severity'],
                            where: {
                                taskId: item.taskId,
                                type: 'BUG',
                                status: 'APPROVED',
                                severity: { not: null },
                            },
                            _count: true,
                        });

                        // 统计各等级的建议数量
                        const suggestionCounts = await ctx.db.defect.groupBy({
                            by: ['suggestionLevel'],
                            where: {
                                taskId: item.taskId,
                                type: 'SUGGESTION',
                                status: 'APPROVED',
                                suggestionLevel: { not: null },
                            },
                            _count: true,
                        });

                        // 转换统计结果为易于前端使用的格式
                        const defectStats: any = {
                            executionCount,
                            executionScore: executionPoints,
                            critical: 0,
                            major: 0,
                            normal: 0,
                            minor: 0,
                            excellent: 0,
                            good: 0,
                            valid: 0,
                        };

                        defectCounts.forEach((item) => {
                            switch (item.severity) {
                                case 'CRITICAL':
                                    defectStats.critical = item._count;
                                    break;
                                case 'MAJOR':
                                    defectStats.major = item._count;
                                    break;
                                case 'MINOR':
                                    defectStats.normal = item._count;
                                    break;
                                case 'TRIVIAL':
                                    defectStats.minor = item._count;
                                    break;
                            }
                        });

                        suggestionCounts.forEach((item) => {
                            switch (item.suggestionLevel) {
                                case 'EXCELLENT_SPECIAL':
                                    defectStats.excellent = item._count;
                                    break;
                                case 'EXCELLENT':
                                    defectStats.good = item._count;
                                    break;
                                case 'VALID':
                                    defectStats.valid = item._count;
                                    break;
                            }
                        });

                        // 获取数据字典用于计算积分
                        const { getDictionaryItems } = await import(
                            '@/server/api/utils/dictionaryValidator'
                        );
                        const [severityItems, suggestionItems] =
                            await Promise.all([
                                getDictionaryItems(ctx.db, 'DEFECT_SEVERITY'),
                                getDictionaryItems(ctx.db, 'SUGGESTION_LEVEL'),
                            ]);

                        // 计算总积分并构建详细的计算公式
                        let totalPoints = executionCount * executionPoints;
                        const formulaParts: string[] = [
                            `${executionCount}*${executionPoints}`,
                        ];

                        // 加上缺陷积分
                        defectCounts.forEach((item) => {
                            if (item.severity && item._count > 0) {
                                const severityItem = severityItems.find(
                                    (s) => s.code === item.severity
                                );
                                if (severityItem && severityItem.value) {
                                    const points = parseInt(severityItem.value);
                                    totalPoints += points * item._count;
                                    formulaParts.push(
                                        `${item._count}*${points}`
                                    );
                                }
                            }
                        });

                        // 加上建议积分
                        suggestionCounts.forEach((item) => {
                            if (item.suggestionLevel && item._count > 0) {
                                const suggestionItem = suggestionItems.find(
                                    (s) => s.code === item.suggestionLevel
                                );
                                if (suggestionItem && suggestionItem.value) {
                                    const points = parseInt(
                                        suggestionItem.value
                                    );
                                    totalPoints += points * item._count;
                                    formulaParts.push(
                                        `${item._count}*${points}`
                                    );
                                }
                            }
                        });

                        defectStats.calculation = `${formulaParts.join('+')}=${totalPoints}`;

                        return {
                            ...item,
                            task: {
                                ...item.task,
                                defectStats,
                            },
                        };
                    }
                    return item;
                })
            );

            // 根据当前时间计算实时状态
            const now = new Date();
            const formattedItems = itemsWithStats.map((item) => {
                if (item.task) {
                    let displayStatus = item.task.status;
                    // 如果状态是执行中但已过期，显示为执行结束
                    if (
                        item.task.status === 'EXECUTING' &&
                        item.task.endTime < now
                    ) {
                        displayStatus = 'EXECUTION_ENDED';
                    }
                    return {
                        ...item,
                        task: {
                            ...item.task,
                            status: displayStatus,
                        },
                    };
                }
                return item;
            });

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

    // 获取积分申请详情
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const application = await ctx.db.pointsApplication.findUnique({
                where: { id: input.id },
                include: {
                    task: {
                        include: {
                            testCases: true,
                            rewardConfig: true,
                        },
                    },
                },
            });

            if (!application) {
                throw new Error('积分申请不存在');
            }

            // 根据当前时间计算实时状态
            let formattedApplication = application;
            if (application.task) {
                const now = new Date();
                let displayStatus = application.task.status;
                // 如果状态是执行中但已过期，显示为执行结束
                if (
                    application.task.status === 'EXECUTING' &&
                    application.task.endTime < now
                ) {
                    displayStatus = 'EXECUTION_ENDED';
                }
                formattedApplication = {
                    ...application,
                    task: {
                        ...application.task,
                        status: displayStatus,
                    },
                };
            }

            return {
                success: true,
                data: formattedApplication,
            };
        }),

    // 部门经理审核通过
    approveDept: protectedProcedure
        .input(ReviewPointsApplicationInput)
        .mutation(async ({ ctx, input }) => {
            const { id, comment } = input;

            const application = await ctx.db.pointsApplication.findUnique({
                where: { id },
            });

            if (!application) {
                throw new Error('积分申请不存在');
            }

            if (application.status !== 'PENDING') {
                throw new Error('该申请不在待审核状态');
            }

            const updated = await ctx.db.pointsApplication.update({
                where: { id },
                data: {
                    status: 'DEPT_APPROVED',
                    deptReviewerId: ctx.session.user.id,
                    deptReviewerName: ctx.session.user.name,
                    deptReviewComment: comment,
                    deptReviewedAt: new Date(),
                },
            });

            // 更新任务状态为总经理积分审核中
            await ctx.db.testTask.update({
                where: { id: application.taskId },
                data: {
                    status: 'GENERAL_REWARD_REVIEW',
                },
            });

            return {
                success: true,
                message: '部门经理审核通过',
                data: updated,
            };
        }),

    // 部门经理审核驳回
    rejectDept: protectedProcedure
        .input(ReviewPointsApplicationInput)
        .mutation(async ({ ctx, input }) => {
            const { id, comment } = input;

            const application = await ctx.db.pointsApplication.findUnique({
                where: { id },
                include: { task: true },
            });

            if (!application) {
                throw new Error('积分申请不存在');
            }

            if (application.status !== 'PENDING') {
                throw new Error('该申请不在待审核状态');
            }

            if (!comment) {
                throw new Error('驳回时必须填写驳回原因');
            }

            const updated = await ctx.db.pointsApplication.update({
                where: { id },
                data: {
                    status: 'DEPT_REJECTED',
                    deptReviewerId: ctx.session.user.id,
                    deptReviewerName: ctx.session.user.name,
                    deptReviewComment: comment,
                    deptReviewedAt: new Date(),
                },
            });

            // 更新任务状态回到准备中
            await ctx.db.testTask.update({
                where: { id: application.taskId },
                data: {
                    status: 'PREPARING',
                },
            });

            return {
                success: true,
                message: '已驳回',
                data: updated,
            };
        }),

    // 总经理审核通过
    approveGeneral: protectedProcedure
        .input(ReviewPointsApplicationInput)
        .mutation(async ({ ctx, input }) => {
            const { id, comment } = input;

            const application = await ctx.db.pointsApplication.findUnique({
                where: { id },
                include: { task: true },
            });

            if (!application) {
                throw new Error('积分申请不存在');
            }

            if (application.status !== 'DEPT_APPROVED') {
                throw new Error('该申请未通过部门经理审核');
            }

            const updated = await ctx.db.pointsApplication.update({
                where: { id },
                data: {
                    status: 'GENERAL_APPROVED',
                    generalReviewerId: ctx.session.user.id,
                    generalReviewerName: ctx.session.user.name,
                    generalReviewComment: comment,
                    generalReviewedAt: new Date(),
                },
            });

            // 更新任务状态为待发布，并设置总预算
            await ctx.db.testTask.update({
                where: { id: application.taskId },
                data: {
                    status: 'PENDING_PUBLISH',
                    totalBudget: application.appliedPoints, // 设置总预算为申请的积分
                },
            });

            return {
                success: true,
                message: '总经理审核通过，待发布',
                data: updated,
            };
        }),

    // 总经理审核驳回
    rejectGeneral: protectedProcedure
        .input(ReviewPointsApplicationInput)
        .mutation(async ({ ctx, input }) => {
            const { id, comment } = input;

            const application = await ctx.db.pointsApplication.findUnique({
                where: { id },
                include: { task: true },
            });

            if (!application) {
                throw new Error('积分申请不存在');
            }

            if (application.status !== 'DEPT_APPROVED') {
                throw new Error('该申请未通过部门经理审核');
            }

            if (!comment) {
                throw new Error('驳回时必须填写驳回原因');
            }

            const updated = await ctx.db.pointsApplication.update({
                where: { id },
                data: {
                    status: 'GENERAL_REJECTED',
                    generalReviewerId: ctx.session.user.id,
                    generalReviewerName: ctx.session.user.name,
                    generalReviewComment: comment,
                    generalReviewedAt: new Date(),
                },
            });

            // 更新任务状态回到准备中
            await ctx.db.testTask.update({
                where: { id: application.taskId },
                data: {
                    status: 'PREPARING',
                },
            });

            return {
                success: true,
                message: '已驳回',
                data: updated,
            };
        }),

    // 获取积分申请统计
    getStats: protectedProcedure.query(async ({ ctx }) => {
        const [
            pending,
            deptApproved,
            deptRejected,
            generalApproved,
            generalRejected,
            completed,
        ] = await Promise.all([
            ctx.db.pointsApplication.count({
                where: { status: 'PENDING' },
            }),
            ctx.db.pointsApplication.count({
                where: { status: 'DEPT_APPROVED' },
            }),
            ctx.db.pointsApplication.count({
                where: { status: 'DEPT_REJECTED' },
            }),
            ctx.db.pointsApplication.count({
                where: { status: 'GENERAL_APPROVED' },
            }),
            ctx.db.pointsApplication.count({
                where: { status: 'GENERAL_REJECTED' },
            }),
            ctx.db.pointsApplication.count({
                where: { status: 'COMPLETED' },
            }),
        ]);

        return {
            success: true,
            data: {
                pending,
                deptApproved,
                deptRejected,
                generalApproved,
                generalRejected,
                completed,
                total:
                    pending +
                    deptApproved +
                    deptRejected +
                    generalApproved +
                    generalRejected +
                    completed,
            },
        };
    }),

    // 积分发放审核通过
    approveRewardDistribution: protectedProcedure
        .input(z.object({ taskId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { taskId } = input;

            const task = await ctx.db.testTask.findUnique({
                where: { id: taskId },
            });

            if (!task) {
                throw new Error('任务不存在');
            }

            if (task.status !== 'REWARD_DISTRIBUTION_REVIEW') {
                throw new Error('该任务不在积分发放审核状态');
            }

            // 更新任务状态为待发放积分
            const updated = await ctx.db.testTask.update({
                where: { id: taskId },
                data: {
                    status: 'PENDING_REWARD_DISTRIBUTION',
                },
            });

            return {
                success: true,
                message: '审核通过，待发放积分',
                data: updated,
            };
        }),

    // 积分发放审核拒绝
    rejectRewardDistribution: protectedProcedure
        .input(z.object({ taskId: z.string(), reason: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
            const { taskId, reason } = input;

            const task = await ctx.db.testTask.findUnique({
                where: { id: taskId },
            });

            if (!task) {
                throw new Error('任务不存在');
            }

            if (task.status !== 'REWARD_DISTRIBUTION_REVIEW') {
                throw new Error('该任务不在积分发放审核状态');
            }

            // 更新任务状态回到核算完成
            const updated = await ctx.db.testTask.update({
                where: { id: taskId },
                data: {
                    status: 'ACCOUNTING_COMPLETED',
                    rewardDistributionReason: reason
                        ? `审核不通过: ${reason}`
                        : task.rewardDistributionReason,
                },
            });

            return {
                success: true,
                message: '审核不通过，任务退回核算完成状态',
                data: updated,
            };
        }),
});
