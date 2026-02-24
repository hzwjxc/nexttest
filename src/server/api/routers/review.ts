import { z } from 'zod';
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from '@/server/api/trpc';
import { randomBytes } from 'crypto';

// 任务状态枚举（完整的工作流状态）
const TaskStatus = z.enum([
    'SAVED', // 已保存
    'PREPARING', // 准备中
    'DEPT_REWARD_REVIEW', // 部门经理积分审核中
    'GENERAL_REWARD_REVIEW', // 总经理积分审核中
    'PENDING_PUBLISH', // 待发布
    'EXECUTING', // 执行中
    'EXECUTION_ENDED', // 执行结束
    'ACCOUNTING_COMPLETED', // 核算完成
    'REWARD_DISTRIBUTION_REVIEW', // 积分发放审核中
    'PENDING_REWARD_DISTRIBUTION', // 待发放积分
    'COMPLETED', // 已完成
]);

// 任务类型枚举
const TaskType = z.enum(['FUNCTIONAL', 'UX_SURVEY', 'INVITATION_REWARD']);

// 审核列表查询输入
const ReviewListInput = z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(10),
    keyword: z.string().optional(),
    status: TaskStatus.optional(),
    taskType: TaskType.optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

// 审核操作输入
const ReviewActionInput = z.object({
    id: z.string(),
    comment: z.string().optional(),
});

export const reviewRouter = createTRPCRouter({
    // 获取审核列表（基于TestTask表）
    list: protectedProcedure
        .input(ReviewListInput)
        .query(async ({ ctx, input }) => {
            const {
                page,
                pageSize,
                keyword,
                status,
                taskType,
                startDate,
                endDate,
            } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {
                isDeleted: false,
            };

            if (keyword) {
                where.OR = [
                    { title: { contains: keyword, mode: 'insensitive' } },
                    { system: { contains: keyword, mode: 'insensitive' } },
                ];
            }

            // 根据任务状态筛选
            if (status) {
                where.status = status;
            }

            if (taskType) {
                where.type = taskType;
            }

            if (startDate) {
                // 按UTC时间处理：2026-01-26 表示 UTC 2026-01-26 00:00:00
                const startDateTime = new Date(startDate + 'T00:00:00.000Z');
                where.createdAt = {
                    ...where.createdAt,
                    gte: startDateTime,
                };
            }

            if (endDate) {
                // 按UTC时间处理：2026-01-26 表示 UTC 2026-01-26 23:59:59.999
                const endDateTime = new Date(endDate + 'T23:59:59.999Z');
                where.createdAt = {
                    ...where.createdAt,
                    lte: endDateTime,
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
                    testCases: true,
                    rewardConfig: true,
                    pointsApplications: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                    defects: {
                        select: {
                            id: true,
                            status: true,
                            earnedPoints: true,
                        },
                    },
                    orders: {
                        select: {
                            id: true,
                            earnedPoints: true,
                            status: true,
                        },
                    },
                },
            });

            // 根据当前时间计算实时状态，并计算统计字段
            const now = new Date();
            const formattedItems = items.map((item) => {
                let displayStatus = item.status;
                // 如果状态是执行中但已过期，显示为执行结束
                if (item.status === 'EXECUTING' && item.endTime < now) {
                    displayStatus = 'EXECUTION_ENDED';
                }

                // 计算缺陷统计
                const validDefects = item.defects.filter(
                    (d) => d.status === 'APPROVED'
                ).length;
                const invalidDefects = item.defects.filter(
                    (d) =>
                        d.status === 'REJECTED' ||
                        d.status === 'DUPLICATE' ||
                        d.status === 'CLOSED'
                ).length;
                const pendingReviewDefects = item.defects.filter(
                    (d) =>
                        d.status === 'SUBMITTED' ||
                        d.status === 'REVIEWING' ||
                        d.status === 'TO_CONFIRM'
                ).length;

                // 计算待发放积分：所有已批准缺陷的 earnedPoints + 所有订单的执行积分
                const defectPoints = item.defects
                    .filter((d) => d.status === 'APPROVED')
                    .reduce((sum, d) => sum + (d.earnedPoints || 0), 0);
                const orderPoints = item.orders
                    .filter((o) => o.status === 'COMPLETED')
                    .reduce((sum, o) => sum + (o.earnedPoints || 0), 0);
                const pendingDistributionPoints = defectPoints + orderPoints;

                return {
                    ...item,
                    status: displayStatus,
                    validDefects,
                    invalidDefects,
                    pendingReviewDefects,
                    pendingDistributionPoints,
                };
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

    // 获取审核详情
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const task = await ctx.db.testTask.findUnique({
                where: { id: input.id },
                include: {
                    testCases: true,
                    rewardConfig: true,
                    notificationConfig: true,
                    pointsApplications: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                    defects: {
                        select: {
                            basePoints: true,
                        },
                    },
                },
            });

            if (!task) {
                throw new Error('任务不存在');
            }

            // 根据当前时间计算实时状态
            const now = new Date();
            let displayStatus = task.status;
            // 如果状态是执行中但已过期，显示为执行结束
            if (task.status === 'EXECUTING' && task.endTime < now) {
                displayStatus = 'EXECUTION_ENDED';
            }

            // 计算预计发放积分：所有缺陷的基础积分之和
            const expectedPoints = task.defects.reduce((sum, defect) => {
                return sum + (defect.basePoints || 0);
            }, 0);

            return {
                success: true,
                data: {
                    ...task,
                    expectedPoints, // 添加计算后的预计发放积分
                    status: displayStatus,
                },
            };
        }),

    // 部门经理积分审核通过
    approveDept: protectedProcedure
        .input(ReviewActionInput)
        .mutation(async ({ ctx, input }) => {
            const { id, comment } = input;

            const task = await ctx.db.testTask.findUnique({
                where: { id },
            });

            if (!task) {
                throw new Error('任务不存在');
            }

            if (task.status !== 'DEPT_REWARD_REVIEW') {
                throw new Error('该任务不在部门经理积分审核状态');
            }

            const updated = await ctx.db.testTask.update({
                where: { id },
                data: {
                    status: 'GENERAL_REWARD_REVIEW',
                    deptApprovalStatus: 'APPROVED',
                    deptApprovedBy: ctx.session.user.id,
                    deptApprovalComment: comment,
                    deptApprovedAt: new Date(),
                },
            });

            return {
                success: true,
                message: '部门经理积分审核通过，已提交总经理审核',
                data: updated,
            };
        }),

    // 部门经理积分审核驳回
    rejectDept: protectedProcedure
        .input(ReviewActionInput)
        .mutation(async ({ ctx, input }) => {
            const { id, comment } = input;

            const task = await ctx.db.testTask.findUnique({
                where: { id },
            });

            if (!task) {
                throw new Error('任务不存在');
            }

            if (task.status !== 'DEPT_REWARD_REVIEW') {
                throw new Error('该任务不在部门经理积分审核状态');
            }

            if (!comment) {
                throw new Error('驳回时必须填写驳回原因');
            }

            const updated = await ctx.db.testTask.update({
                where: { id },
                data: {
                    status: 'PREPARING',
                    deptApprovalStatus: 'REJECTED',
                    deptApprovedBy: ctx.session.user.id,
                    deptApprovalComment: comment,
                    deptApprovedAt: new Date(),
                },
            });

            return {
                success: true,
                message: '已驳回，任务退回准备中状态',
                data: updated,
            };
        }),

    // 总经理积分审核通过
    approveGeneral: protectedProcedure
        .input(ReviewActionInput)
        .mutation(async ({ ctx, input }) => {
            const { id, comment } = input;

            const task = await ctx.db.testTask.findUnique({
                where: { id },
            });

            if (!task) {
                throw new Error('任务不存在');
            }

            if (task.status !== 'GENERAL_REWARD_REVIEW') {
                throw new Error('该任务不在总经理积分审核状态');
            }

            const updated = await ctx.db.testTask.update({
                where: { id },
                data: {
                    status: 'PENDING_PUBLISH',
                    generalApprovalStatus: 'APPROVED',
                    generalApprovedBy: ctx.session.user.id,
                    generalApprovalComment: comment,
                    generalApprovedAt: new Date(),
                },
            });

            return {
                success: true,
                message: '总经理积分审核通过，任务待发布',
                data: updated,
            };
        }),

    // 总经理积分审核驳回
    rejectGeneral: protectedProcedure
        .input(ReviewActionInput)
        .mutation(async ({ ctx, input }) => {
            const { id, comment } = input;

            const task = await ctx.db.testTask.findUnique({
                where: { id },
            });

            if (!task) {
                throw new Error('任务不存在');
            }

            if (task.status !== 'GENERAL_REWARD_REVIEW') {
                throw new Error('该任务不在总经理积分审核状态');
            }

            if (!comment) {
                throw new Error('驳回时必须填写驳回原因');
            }

            const updated = await ctx.db.testTask.update({
                where: { id },
                data: {
                    status: 'PREPARING',
                    generalApprovalStatus: 'REJECTED',
                    generalApprovedBy: ctx.session.user.id,
                    generalApprovalComment: comment,
                    generalApprovedAt: new Date(),
                },
            });

            return {
                success: true,
                message: '已驳回，任务退回准备中状态',
                data: updated,
            };
        }),

    // 批量审核（部门经理积分审核）
    batchApproveDept: protectedProcedure
        .input(
            z.object({
                ids: z.array(z.string()),
                comment: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { ids, comment } = input;

            // 检查所有记录是否存在且状态为部门经理积分审核中
            const tasks = await ctx.db.testTask.findMany({
                where: {
                    id: { in: ids },
                    status: 'DEPT_REWARD_REVIEW',
                },
            });

            if (tasks.length !== ids.length) {
                throw new Error('部分任务不存在或不在部门经理积分审核状态');
            }

            // 批量更新
            await ctx.db.testTask.updateMany({
                where: { id: { in: ids } },
                data: {
                    status: 'GENERAL_REWARD_REVIEW',
                    deptApprovalStatus: 'APPROVED',
                    deptApprovedBy: ctx.session.user.id,
                    deptApprovalComment: comment,
                    deptApprovedAt: new Date(),
                },
            });

            return {
                success: true,
                message: `已批量审核通过 ${ids.length} 条任务`,
            };
        }),

    // 删除任务（软删除）
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { id } = input;

            const task = await ctx.db.testTask.findUnique({
                where: { id },
            });

            if (!task) {
                throw new Error('任务不存在');
            }

            // 软删除
            await ctx.db.testTask.update({
                where: { id },
                data: {
                    isDeleted: true,
                },
            });

            return {
                success: true,
                message: '删除成功',
            };
        }),

    // 发布任务
    publish: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { id } = input;

            const task = await ctx.db.testTask.findUnique({
                where: { id },
            });

            if (!task) {
                throw new Error('任务不存在');
            }

            if (task.status !== 'PENDING_PUBLISH') {
                throw new Error('该任务不在待发布状态');
            }

            const updated = await ctx.db.testTask.update({
                where: { id },
                data: {
                    status: 'EXECUTING',
                    publishedAt: new Date(),
                },
            });

            return {
                success: true,
                message: '任务已发布',
                data: updated,
            };
        }),

    // 获取审核统计
    getStats: protectedProcedure.query(async ({ ctx }) => {
        const [
            saved,
            preparing,
            deptRewardReview,
            generalRewardReview,
            pendingPublish,
            executing,
            executionEnded,
            accountingCompleted,
            rewardDistributionReview,
            pendingRewardDistribution,
            completed,
        ] = await Promise.all([
            // 已保存
            ctx.db.testTask.count({
                where: {
                    isDeleted: false,
                    status: 'SAVED',
                },
            }),
            // 准备中
            ctx.db.testTask.count({
                where: {
                    isDeleted: false,
                    status: 'PREPARING',
                },
            }),
            // 部门经理积分审核中
            ctx.db.testTask.count({
                where: {
                    isDeleted: false,
                    status: 'DEPT_REWARD_REVIEW',
                },
            }),
            // 总经理积分审核中
            ctx.db.testTask.count({
                where: {
                    isDeleted: false,
                    status: 'GENERAL_REWARD_REVIEW',
                },
            }),
            // 待发布
            ctx.db.testTask.count({
                where: {
                    isDeleted: false,
                    status: 'PENDING_PUBLISH',
                },
            }),
            // 执行中
            ctx.db.testTask.count({
                where: {
                    isDeleted: false,
                    status: 'EXECUTING',
                },
            }),
            // 执行结束
            ctx.db.testTask.count({
                where: {
                    isDeleted: false,
                    status: 'EXECUTION_ENDED',
                },
            }),
            // 核算完成
            ctx.db.testTask.count({
                where: {
                    isDeleted: false,
                    status: 'ACCOUNTING_COMPLETED',
                },
            }),
            // 积分发放审核中
            ctx.db.testTask.count({
                where: {
                    isDeleted: false,
                    status: 'REWARD_DISTRIBUTION_REVIEW',
                },
            }),
            // 待发放积分
            ctx.db.testTask.count({
                where: {
                    isDeleted: false,
                    status: 'PENDING_REWARD_DISTRIBUTION',
                },
            }),
            // 已完成
            ctx.db.testTask.count({
                where: {
                    isDeleted: false,
                    status: 'COMPLETED',
                },
            }),
        ]);

        return {
            success: true,
            data: {
                saved,
                preparing,
                deptRewardReview,
                generalRewardReview,
                pendingPublish,
                executing,
                executionEnded,
                accountingCompleted,
                rewardDistributionReview,
                pendingRewardDistribution,
                completed,
                total:
                    saved +
                    preparing +
                    deptRewardReview +
                    generalRewardReview +
                    pendingPublish +
                    executing +
                    executionEnded +
                    accountingCompleted +
                    rewardDistributionReview +
                    pendingRewardDistribution +
                    completed,
            },
        };
    }),

    // 获取任务订单列表
    getTaskOrders: protectedProcedure
        .input(
            z.object({
                taskId: z.string(),
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
                status: z
                    .enum([
                        'PENDING',
                        'IN_PROGRESS',
                        'SUBMITTED',
                        'COMPLETED',
                        'CANCELLED',
                    ])
                    .optional()
                    .or(z.literal(''))
                    .transform((val) => (val === '' ? undefined : val)),
                keyword: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { taskId, page, pageSize, status, keyword } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {
                taskId,
            };

            if (status) {
                where.status = status;
            }

            if (keyword) {
                where.OR = [
                    { id: { contains: keyword, mode: 'insensitive' } },
                    {
                        user: {
                            name: { contains: keyword, mode: 'insensitive' },
                        },
                    },
                ];
            }

            // 查询总数
            const total = await ctx.db.testTaskOrder.count({ where });

            // 查询订单列表
            const orders = await ctx.db.testTaskOrder.findMany({
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
                    task: {
                        select: {
                            executionPoints: true,
                        },
                    },
                    defects: {
                        select: {
                            id: true,
                            status: true,
                            type: true,
                            severity: true,
                            suggestionLevel: true,
                            earnedPoints: true,
                            duplicateGroupId: true,
                        },
                    },
                },
            });

            // 计算每个订单的统计信息
            const ordersWithStats = orders.map((order) => {
                const validDefects = order.defects.filter(
                    (d) => d.status === 'APPROVED'
                ).length;
                const invalidDefects = order.defects.filter(
                    (d) => d.status === 'REJECTED' || d.status === 'DUPLICATE'
                ).length;
                const pendingDefects = order.defects.filter(
                    (d) => d.status === 'SUBMITTED' || d.status === 'REVIEWING'
                ).length;

                // 计算缺陷积分：所有已批准缺陷的 earnedPoints 之和
                const defectPoints = order.defects
                    .filter((d) => d.status === 'APPROVED')
                    .reduce((sum, d) => sum + (d.earnedPoints || 0), 0);

                // 订单执行积分：如果勾选了（earnedPoints > 0），则发放任务配置的执行分
                const orderExecutionPoints =
                    order.earnedPoints > 0
                        ? (order.task?.executionPoints ?? 0)
                        : 0;

                // 重复缺陷执行积分：有 duplicateGroupId 的 APPROVED 缺陷，同一组中只有第一个之后的才算重复
                // 统计每个 duplicateGroupId 的数量，只计算超过1个的部分
                const duplicateGroups = new Map<string, number>();
                order.defects.forEach(d => {
                    if (d.status === 'APPROVED' && d.duplicateGroupId) {
                        duplicateGroups.set(
                            d.duplicateGroupId,
                            (duplicateGroups.get(d.duplicateGroupId) || 0) + 1
                        );
                    }
                });
                // 计算重复缺陷数量：每组总数-1（第一个不算重复）
                let duplicateDefectCount = 0;
                duplicateGroups.forEach(count => {
                    duplicateDefectCount += count - 1;
                });
                const duplicateExecutionPoints = duplicateDefectCount * (order.task?.executionPoints ?? 0);

                // 预计发放积分 = 缺陷积分 + 订单执行积分 + 重复缺陷执行积分
                const expectedPoints =
                    defectPoints +
                    orderExecutionPoints +
                    duplicateExecutionPoints;

                return {
                    ...order,
                    validDefects,
                    invalidDefects,
                    pendingDefects,
                    defectPoints, // 缺陷/建议积分
                    orderExecutionPoints, // 订单执行积分
                    duplicateExecutionPoints, // 重复缺陷执行积分
                    expectedPoints, // 预计发放积分
                };
            });

            return {
                success: true,
                data: ordersWithStats,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                },
            };
        }),

    // 更新订单执行积分（勾选/取消勾选）
    updateOrderExecutionPoints: protectedProcedure
        .input(
            z.object({
                orderId: z.string(),
                isChecked: z.boolean(), // true: 勾选（发放执行积分），false: 取消勾选（不发放）
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { orderId, isChecked } = input;

            const order = await ctx.db.testTaskOrder.findUnique({
                where: { id: orderId },
                include: {
                    task: {
                        select: {
                            executionPoints: true,
                        },
                    },
                    defects: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            if (!order) {
                throw new Error('订单不存在');
            }

            // 订单执行积分 = 任务配置的执行分（勾选后直接给固定分值，不乘以缺陷数量）
            const earnedPoints = isChecked
                ? (order.task?.executionPoints ?? 0)
                : 0;

            const updated = await ctx.db.testTaskOrder.update({
                where: { id: orderId },
                data: {
                    earnedPoints: earnedPoints,
                },
            });

            return {
                success: true,
                message: isChecked
                    ? '订单执行积分已发放'
                    : '订单执行积分已取消',
                data: updated,
            };
        }),

    // 获取订单详情
    getOrderById: protectedProcedure
        .input(z.object({ orderId: z.string() }))
        .query(async ({ ctx, input }) => {
            const order = await ctx.db.testTaskOrder.findUnique({
                where: { id: input.orderId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        },
                    },
                    task: {
                        include: {
                            testCases: {
                                include: {
                                    testData: true,
                                },
                            },
                        },
                    },
                    defects: {
                        include: {
                            testCase: true,
                            user: true,
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                    },
                },
            });

            if (!order) {
                throw new Error('订单不存在');
            }

            // 计算预计发放积分：所有缺陷的基础积分之和
            const expectedPoints = order.defects.reduce((sum, defect) => {
                return sum + (defect.basePoints || 0);
            }, 0);

            return {
                success: true,
                data: {
                    ...order,
                    expectedPoints, // 添加计算后的预计发放积分
                },
            };
        }),

    // 获取任务的所有缺陷
    getTaskDefects: protectedProcedure
        .input(
            z.object({
                taskId: z
                    .string()
                    .optional()
                    .or(z.literal(''))
                    .transform((val) => (val === '' ? undefined : val)),
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
                type: z
                    .enum(['BUG', 'SUGGESTION'])
                    .optional()
                    .or(z.literal(''))
                    .transform((val) => (val === '' ? undefined : val)),
                status: z
                    .enum([
                        'SUBMITTED',
                        'REVIEWING',
                        'APPROVED',
                        'REJECTED',
                        'DUPLICATE',
                        'CLOSED',
                    ])
                    .optional()
                    .or(z.literal(''))
                    .transform((val) => (val === '' ? undefined : val)),
                severity: z
                    .enum(['CRITICAL', 'MAJOR', 'MINOR', 'TRIVIAL', 'INVALID'])
                    .optional()
                    .or(z.literal(''))
                    .transform((val) => (val === '' ? undefined : val)),
                suggestionLevel: z
                    .enum([
                        'EXCELLENT_SPECIAL',
                        'EXCELLENT',
                        'VALID',
                        'INVALID',
                    ])
                    .optional()
                    .or(z.literal(''))
                    .transform((val) => (val === '' ? undefined : val)),
                testCaseId: z
                    .string()
                    .optional()
                    .or(z.literal(''))
                    .transform((val) => (val === '' ? undefined : val)),
                keyword: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const {
                taskId,
                page,
                pageSize,
                type,
                status,
                severity,
                suggestionLevel,
                testCaseId,
                keyword,
            } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {};

            // 只有指定了taskId才添加到查询条件中
            if (taskId) {
                where.taskId = taskId;
            }

            if (type) {
                where.type = type;
            }

            if (status) {
                where.status = status;
            }

            if (severity) {
                where.severity = severity;
            }

            if (suggestionLevel) {
                where.suggestionLevel = suggestionLevel;
            }

            if (testCaseId) {
                where.testCaseId = testCaseId;
            }

            if (keyword) {
                where.OR = [
                    { title: { contains: keyword, mode: 'insensitive' } },
                    { description: { contains: keyword, mode: 'insensitive' } },
                ];
            }

            // 查询总数
            const total = await ctx.db.defect.count({ where });

            // 查询缺陷列表
            const defects = await ctx.db.defect.findMany({
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
                    testCase: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    taskOrder: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            return {
                success: true,
                data: defects,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                },
            };
        }),

    // 获取任务的所有用例
    getTaskTestCases: protectedProcedure
        .input(
            z.object({
                taskId: z.string(),
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
            })
        )
        .query(async ({ ctx, input }) => {
            const { taskId, page, pageSize } = input;
            const skip = (page - 1) * pageSize;

            // 获取任务及其关联的用例
            const task = await ctx.db.testTask.findUnique({
                where: { id: taskId },
                include: {
                    testCases: {
                        skip,
                        take: pageSize,
                        orderBy: { createdAt: 'asc' },
                        include: {
                            defects: {
                                where: {
                                    taskId,
                                },
                                select: {
                                    id: true,
                                    type: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!task) {
                throw new Error('任务不存在');
            }

            // 获取总数
            const total = await ctx.db.testCase.count({
                where: {
                    tasks: {
                        some: {
                            id: taskId,
                        },
                    },
                },
            });

            // 格式化数据，添加序号和缺陷统计
            const formattedCases = task.testCases.map((testCase, index) => {
                const defectCount = testCase.defects.length;
                const bugCount = testCase.defects.filter(
                    (d) => d.type === 'BUG'
                ).length;
                const suggestionCount = testCase.defects.filter(
                    (d) => d.type === 'SUGGESTION'
                ).length;

                return {
                    id: testCase.id,
                    sequence: skip + index + 1,
                    caseNumber: testCase.id.substring(0, 14).toUpperCase(),
                    system: testCase.system,
                    caseName: testCase.title,
                    defectCount: `${bugCount}/${suggestionCount}`,
                    property: testCase.type || '功能测试',
                    action: '查看详情',
                };
            });

            return {
                success: true,
                data: formattedCases,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                },
            };
        }),

    // 生成业务判定访问令牌
    generateBusinessJudgmentToken: protectedProcedure
        .input(
            z.object({
                taskId: z.string(),
                expiryDays: z.number().min(1).max(30).default(7), // 默认7天有效
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { taskId, expiryDays } = input;

            // 验证任务是否存在
            const task = await ctx.db.testTask.findUnique({
                where: { id: taskId },
            });

            if (!task) {
                throw new Error('任务不存在');
            }

            // 生成随机令牌
            const token = randomBytes(32).toString('hex');

            // 计算过期时间
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiryDays);

            // 创建令牌记录
            const tokenRecord = await ctx.db.businessJudgmentToken.create({
                data: {
                    token,
                    taskId,
                    expiresAt,
                    createdBy: ctx.session.user.id,
                },
            });

            // 生成访问链接
            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            const accessUrl = `${baseUrl}/business-judgment?token=${token}`;

            return {
                success: true,
                message: '访问链接生成成功',
                data: {
                    token: tokenRecord.token,
                    accessUrl,
                    expiresAt: tokenRecord.expiresAt,
                    taskId: tokenRecord.taskId,
                },
            };
        }),

    // 验证业务判定令牌（公开接口）
    verifyBusinessJudgmentToken: publicProcedure
        .input(z.object({ token: z.string() }))
        .query(async ({ ctx, input }) => {
            const { token } = input;

            // 查找令牌
            const tokenRecord = await ctx.db.businessJudgmentToken.findUnique({
                where: { token },
                include: {
                    task: {
                        include: {
                            testCases: true,
                        },
                    },
                },
            });

            if (!tokenRecord) {
                return {
                    success: false,
                    message: '无效的访问令牌',
                };
            }

            // 检查是否已撤销
            if (tokenRecord.isRevoked) {
                return {
                    success: false,
                    message: '该访问链接已被撤销',
                };
            }

            // 检查是否过期
            if (new Date() > tokenRecord.expiresAt) {
                return {
                    success: false,
                    message: '访问链接已过期',
                };
            }

            return {
                success: true,
                message: '令牌验证成功',
                data: {
                    taskId: tokenRecord.taskId,
                    task: tokenRecord.task,
                },
            };
        }),

    // 撤销业务判定令牌
    revokeBusinessJudgmentToken: protectedProcedure
        .input(z.object({ token: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { token } = input;

            const tokenRecord = await ctx.db.businessJudgmentToken.findUnique({
                where: { token },
            });

            if (!tokenRecord) {
                throw new Error('令牌不存在');
            }

            // 撤销令牌
            await ctx.db.businessJudgmentToken.update({
                where: { token },
                data: {
                    isRevoked: true,
                },
            });

            return {
                success: true,
                message: '访问链接已撤销',
            };
        }),

    // 获取任务的所有访问令牌
    getTaskTokens: protectedProcedure
        .input(z.object({ taskId: z.string() }))
        .query(async ({ ctx, input }) => {
            const { taskId } = input;

            const tokens = await ctx.db.businessJudgmentToken.findMany({
                where: { taskId },
                orderBy: { createdAt: 'desc' },
            });

            return {
                success: true,
                data: tokens,
            };
        }),

    // 核算完成 - 导入核算结果后更新任务状态
    completeAccounting: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { id } = input;

            const task = await ctx.db.testTask.findUnique({
                where: { id },
            });

            if (!task) {
                throw new Error('任务不存在');
            }

            // 检查任务是否可以进行核算
            // 支持的状态：EXECUTION_ENDED（执行结束）或 EXECUTING（执行中但已过期）
            const now = new Date();
            const isExecutable =
                task.status === 'EXECUTION_ENDED' ||
                (task.status === 'EXECUTING' && task.endTime < now);

            if (!isExecutable) {
                throw new Error('该任务不在执行结束状态，无法完成核算');
            }

            const updated = await ctx.db.testTask.update({
                where: { id },
                data: {
                    status: 'ACCOUNTING_COMPLETED',
                    accountingCompletedAt: new Date(),
                },
            });

            return {
                success: true,
                message: '核算完成',
                data: updated,
            };
        }),

    // 积分发放申请 - 从核算完成状态提交到积分发放审核中
    applyRewardDistribution: protectedProcedure
        .input(
            z.object({
                taskId: z.string(),
                reason: z.string().min(1, '请输入事由'),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { taskId, reason } = input;

            const task = await ctx.db.testTask.findUnique({
                where: { id: taskId },
            });

            if (!task) {
                throw new Error('任务不存在');
            }

            if (task.status !== 'ACCOUNTING_COMPLETED') {
                throw new Error('该任务不在核算完成状态，无法申请积分发放');
            }

            // 更新任务状态为积分发放审核中
            const updated = await ctx.db.testTask.update({
                where: { id: taskId },
                data: {
                    status: 'REWARD_DISTRIBUTION_REVIEW',
                    rewardDistributionReason: reason,
                    rewardDistributionAppliedAt: new Date(),
                    rewardDistributionAppliedBy: ctx.session.user.id,
                },
            });

            return {
                success: true,
                message: '积分发放申请已提交',
                data: updated,
            };
        }),

    // 确认发放积分 - 从待发放积分状态到已完成
    confirmDistribution: protectedProcedure
        .input(z.object({ taskId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { taskId } = input;

            const task = await ctx.db.testTask.findUnique({
                where: { id: taskId },
                include: {
                    defects: {
                        where: {
                            status: 'APPROVED',
                        },
                        select: {
                            id: true,
                            userId: true,
                            earnedPoints: true,
                        },
                    },
                },
            });

            if (!task) {
                throw new Error('任务不存在');
            }

            if (task.status !== 'PENDING_REWARD_DISTRIBUTION') {
                throw new Error('该任务不在待发放积分状态');
            }

            // 使用事务确保积分发放和状态更新的原子性
            const result = await ctx.db.$transaction(async (tx) => {
                // 1. 为每个已通过的缺陷/建议发放积分给提交用户
                for (const defect of task.defects) {
                    const points = defect.earnedPoints || 0;

                    if (points > 0) {
                        // 更新用户积分
                        await tx.user.update({
                            where: { id: defect.userId },
                            data: {
                                totalPoints: { increment: points },
                                availablePoints: { increment: points },
                                experience: { increment: points },
                            },
                        });

                        // 创建奖励记录
                        const reward = await tx.reward.create({
                            data: {
                                userId: defect.userId,
                                taskId: taskId,
                                defectId: defect.id,
                                points: points,
                                type: 'TASK_COMPLETION',
                                status: 'ISSUED',
                            },
                        });

                        // 创建积分交易记录
                        await tx.pointTransaction.create({
                            data: {
                                userId: defect.userId,
                                points: points,
                                type: 'EARN',
                                relatedId: reward.id,
                                description: `任务「${task.title}」积分发放`,
                                status: 'COMPLETED',
                            },
                        });
                    }
                }

                // 2. 更新任务状态为已完成
                const updated = await tx.testTask.update({
                    where: { id: taskId },
                    data: {
                        status: 'COMPLETED',
                    },
                });

                return updated;
            });

            return {
                success: true,
                message: '积分发放完成',
                data: result,
            };
        }),
});
