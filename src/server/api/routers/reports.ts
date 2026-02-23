import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const reportsRouter = createTRPCRouter({
    // 获取用户基础统计数据
    getUserStats: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                timeRange: z.enum(['day', 'month']).default('month'),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate, timeRange } = input;

            // 构建查询条件
            const userWhere: any = {
                isDeleted: false,
            };
            const activeUserWhere: any = {
                isDeleted: false,
            };

            // 日期范围筛选
            if (startDate || endDate) {
                userWhere.createdAt = {};
                activeUserWhere.updatedAt = {};
                if (startDate) {
                    const start = new Date(startDate);
                    userWhere.createdAt.gte = start;
                    activeUserWhere.updatedAt.gte = start;
                }
                if (endDate) {
                    const end = new Date(endDate + 'T23:59:59.999Z');
                    userWhere.createdAt.lte = end;
                    activeUserWhere.updatedAt.lte = end;
                }
            }

            // 获取统计数据
            const [totalUsers, newUsers, activeUsers] = await Promise.all([
                // 累计注册用户数
                ctx.db.user.count({ where: userWhere }),
                // 新增注册用户数（基于创建时间）
                ctx.db.user.count({
                    where: {
                        ...userWhere,
                        createdAt: userWhere.createdAt, // 使用相同的日期筛选
                    },
                }),
                // 活跃用户数（基于更新时间）
                ctx.db.user.count({
                    where: {
                        ...activeUserWhere,
                        updatedAt: activeUserWhere.updatedAt, // 使用相同的日期筛选
                    },
                }),
            ]);

            return {
                cumulativeUsers: totalUsers,
                newUsers: newUsers,
                activeUsers: activeUsers,
                activeUsersByChannel: {
                    miniProgram: Math.floor(activeUsers * 0.45), // 假设45%来自小程序
                    pc: Math.ceil(activeUsers * 0.55), // 假设55%来自PC端
                },
            };
        }),

    // 获取所有分行名称
    getAllBranches: protectedProcedure.query(async ({ ctx }) => {
        const users = await ctx.db.user.findMany({
            where: {
                isDeleted: false,
                organization: {
                    not: null,
                },
                NOT: {
                    organization: '',
                },
            },
            select: {
                organization: true,
            },
            distinct: ['organization'],
        });

        // 过滤掉空值并排序
        const branches = users
            .map((user) => user.organization)
            .filter(
                (org): org is string =>
                    org !== null && org !== undefined && org.trim() !== ''
            )
            .sort();

        return branches;
    }),

    // 获取活动参与统计数据
    getActivityStats: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            // 构建查询条件
            const taskOrderWhere: any = {
                startedAt: {
                    not: null,
                },
            };
            const defectWhere: any = {};

            // 日期范围筛选
            if (startDate || endDate) {
                taskOrderWhere.startedAt = {};
                defectWhere.createdAt = {};
                if (startDate) {
                    const start = new Date(startDate);
                    taskOrderWhere.startedAt.gte = start;
                    defectWhere.createdAt.gte = start;
                }
                if (endDate) {
                    const end = new Date(endDate + 'T23:59:59.999Z');
                    taskOrderWhere.startedAt.lte = end;
                    defectWhere.createdAt.lte = end;
                }
            }

            // 获取任务相关统计数据
            const [taskAcceptanceCount, taskAcceptanceUsers] =
                await Promise.all([
                    // 任务领取人次
                    ctx.db.testTaskOrder.count({ where: taskOrderWhere }),
                    // 任务领取人数（去重用户数）
                    ctx.db.testTaskOrder.groupBy({
                        by: ['userId'],
                        where: taskOrderWhere,
                        _count: true,
                    }),
                ]);

            // 获取缺陷相关统计数据
            const [defectReportCount, defectReportUsers, validDefectCount] =
                await Promise.all([
                    // 提报缺陷人次
                    ctx.db.defect.count({ where: defectWhere }),
                    // 提报缺陷人数（去重用户数）
                    ctx.db.defect.groupBy({
                        by: ['userId'],
                        where: defectWhere,
                        _count: true,
                    }),
                    // 提报有效缺陷数（状态为APPROVED的缺陷）
                    ctx.db.defect.count({
                        where: {
                            ...defectWhere,
                            status: 'APPROVED',
                        },
                    }),
                ]);

            return {
                taskAcceptanceCount: taskAcceptanceCount,
                taskAcceptancePeople: taskAcceptanceUsers.length,
                defectReportCount: defectReportCount,
                defectReportPeople: defectReportUsers.length,
                validDefectCount: validDefectCount,
            };
        }),

    // 获取累计注册用户列表
    getCumulativeUsers: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(15),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, startDate, endDate } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {
                isDeleted: false,
            };

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取总数
            const total = await ctx.db.user.count({ where });

            // 获取用户列表
            const users = await ctx.db.user.findMany({
                where,
                orderBy: { createdAt: 'asc' },
                skip,
                take: pageSize,
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    organization: true,
                    createdAt: true,
                },
            });

            return {
                data: users.map((user, index) => ({
                    id: skip + index + 1,
                    username: user.name || '未设置',
                    organization: user.organization || '未设置',
                    phone: user.phone || '未设置',
                    registrationTime: user.createdAt.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                    }),
                })),
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 导出累计注册用户数据
    exportCumulativeUsers: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            // 构建查询条件
            const where: any = {
                isDeleted: false,
            };

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取所有用户数据（不分页）
            const users = await ctx.db.user.findMany({
                where,
                orderBy: { createdAt: 'asc' },
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    organization: true,
                    createdAt: true,
                },
            });

            return users.map((user, index) => ({
                id: index + 1,
                username: user.name || '未设置',
                organization: user.organization || '未设置',
                phone: user.phone || '未设置',
                registrationTime: user.createdAt.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                }),
            }));
        }),

    // 获取新注册用户列表
    getNewUsers: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(15),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, startDate, endDate } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {
                isDeleted: false,
            };

            // 日期范围筛选 - 新注册用户需要有明确的日期范围
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取总数
            const total = await ctx.db.user.count({ where });

            // 获取用户列表
            const users = await ctx.db.user.findMany({
                where,
                orderBy: { createdAt: 'desc' }, // 新注册用户按创建时间倒序
                skip,
                take: pageSize,
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    organization: true,
                    createdAt: true,
                },
            });

            return {
                data: users.map((user, index) => ({
                    id: skip + index + 1,
                    username: user.name || '未设置',
                    organization: user.organization || '未设置',
                    phone: user.phone || '未设置',
                    registrationTime: user.createdAt.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                    }),
                })),
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 导出新注册用户数据
    exportNewUsers: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            // 构建查询条件
            const where: any = {
                isDeleted: false,
            };

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取所有用户数据（不分页）
            const users = await ctx.db.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    organization: true,
                    createdAt: true,
                },
            });

            return users.map((user, index) => ({
                id: index + 1,
                username: user.name || '未设置',
                organization: user.organization || '未设置',
                phone: user.phone || '未设置',
                registrationTime: user.createdAt.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                }),
            }));
        }),

    // 获取活跃用户列表（基于用户更新时间判断活跃度）
    getActiveUsers: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(15),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, startDate, endDate } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件 - 基于 updatedAt 字段判断活跃度
            const where: any = {
                isDeleted: false,
            };

            // 日期范围筛选
            if (startDate || endDate) {
                where.updatedAt = {};
                if (startDate) {
                    where.updatedAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.updatedAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取总数
            const total = await ctx.db.user.count({ where });

            // 获取用户列表
            const users = await ctx.db.user.findMany({
                where,
                orderBy: { updatedAt: 'desc' }, // 按最后活跃时间倒序
                skip,
                take: pageSize,
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    organization: true,
                    updatedAt: true,
                },
            });

            return {
                data: users.map((user, index) => ({
                    id: skip + index + 1,
                    username: user.name || '未设置',
                    organization: user.organization || '未设置',
                    phone: user.phone || '未设置',
                    lastLoginTime: user.updatedAt.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                    }),
                    lastLoginChannel: 'PC端', // 默认PC端，后续可扩展
                })),
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 导出活跃用户数据
    exportActiveUsers: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            // 构建查询条件 - 基于 updatedAt 字段判断活跃度
            const where: any = {
                isDeleted: false,
            };

            // 日期范围筛选
            if (startDate || endDate) {
                where.updatedAt = {};
                if (startDate) {
                    where.updatedAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.updatedAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取所有用户数据（不分页）
            const users = await ctx.db.user.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    organization: true,
                    updatedAt: true,
                },
            });

            return users.map((user, index) => ({
                id: index + 1,
                username: user.name || '未设置',
                organization: user.organization || '未设置',
                phone: user.phone || '未设置',
                lastLoginTime: user.updatedAt.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                }),
                lastLoginChannel: 'PC端',
            }));
        }),

    // 获取任务领取人次列表
    getTaskAcceptance: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(15),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, startDate, endDate } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {
                startedAt: {
                    not: null,
                },
            };

            // 日期范围筛选
            if (startDate || endDate) {
                where.startedAt = {};
                if (startDate) {
                    where.startedAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.startedAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取总数
            const total = await ctx.db.testTaskOrder.count({ where });

            // 获取任务订单列表
            const taskOrders = await ctx.db.testTaskOrder.findMany({
                where,
                orderBy: { startedAt: 'desc' },
                skip,
                take: pageSize,
                include: {
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    task: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            });

            return {
                data: taskOrders.map((order, index) => ({
                    id: skip + index + 1,
                    username: order.user?.name || '未设置',
                    organization: order.user?.organization || '未设置',
                    phone: order.user?.phone || '未设置',
                    acceptanceTime:
                        order.startedAt?.toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false,
                        }) || '',
                    taskNumber: order.task?.id || '',
                    taskName: order.task?.title || '未设置',
                })),
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 导出任务领取人次数据
    exportTaskAcceptance: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            // 构建查询条件
            const where: any = {
                startedAt: {
                    not: null,
                },
            };

            // 日期范围筛选
            if (startDate || endDate) {
                where.startedAt = {};
                if (startDate) {
                    where.startedAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.startedAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取所有任务订单数据（不分页）
            const taskOrders = await ctx.db.testTaskOrder.findMany({
                where,
                orderBy: { startedAt: 'desc' },
                include: {
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    task: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            });

            return taskOrders.map((order, index) => ({
                id: index + 1,
                username: order.user?.name || '未设置',
                organization: order.user?.organization || '未设置',
                phone: order.user?.phone || '未设置',
                acceptanceTime:
                    order.startedAt?.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                    }) || '',
                taskNumber: order.task?.id || '',
                taskName: order.task?.title || '未设置',
            }));
        }),

    // 获取任务领取人数列表（按用户去重，显示每个用户最后的领取记录）
    getTaskAcceptancePeople: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(15),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, startDate, endDate } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {
                startedAt: {
                    not: null,
                },
            };

            // 日期范围筛选
            if (startDate || endDate) {
                where.startedAt = {};
                if (startDate) {
                    where.startedAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.startedAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取所有符合条件的用户ID（去重）
            const userOrders = await ctx.db.testTaskOrder.findMany({
                where,
                orderBy: { startedAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    task: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            });

            // 按用户ID分组，获取每个用户的最后一条记录
            const userMap = new Map();
            userOrders.forEach((order) => {
                const userId = order.userId;
                if (
                    !userMap.has(userId) ||
                    new Date(order.startedAt!) >
                        new Date(userMap.get(userId).startedAt!)
                ) {
                    userMap.set(userId, order);
                }
            });

            // 转换为数组并排序
            const uniqueUsers = Array.from(userMap.values()).sort(
                (a, b) =>
                    new Date(b.startedAt!).getTime() -
                    new Date(a.startedAt!).getTime()
            );

            // 分页处理
            const total = uniqueUsers.length;
            const paginatedUsers = uniqueUsers.slice(skip, skip + pageSize);

            return {
                data: paginatedUsers.map((order, index) => ({
                    id: skip + index + 1,
                    username: order.user?.name || '未设置',
                    organization: order.user?.organization || '未设置',
                    phone: order.user?.phone || '未设置',
                    lastAcceptanceTime:
                        order.startedAt?.toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false,
                        }) || '',
                    lastTaskNumber: order.task?.id || '',
                    lastTaskName: order.task?.title || '未设置',
                })),
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 导出任务领取人数数据
    exportTaskAcceptancePeople: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            // 构建查询条件
            const where: any = {
                startedAt: {
                    not: null,
                },
            };

            // 日期范围筛选
            if (startDate || endDate) {
                where.startedAt = {};
                if (startDate) {
                    where.startedAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.startedAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取所有符合条件的用户订单
            const userOrders = await ctx.db.testTaskOrder.findMany({
                where,
                orderBy: { startedAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    task: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            });

            // 按用户ID分组，获取每个用户的最后一条记录
            const userMap = new Map();
            userOrders.forEach((order) => {
                const userId = order.userId;
                if (
                    !userMap.has(userId) ||
                    new Date(order.startedAt!) >
                        new Date(userMap.get(userId).startedAt!)
                ) {
                    userMap.set(userId, order);
                }
            });

            // 转换为数组并按最后领取时间排序
            const uniqueUsers = Array.from(userMap.values()).sort(
                (a, b) =>
                    new Date(b.startedAt!).getTime() -
                    new Date(a.startedAt!).getTime()
            );

            return uniqueUsers.map((order, index) => ({
                id: index + 1,
                username: order.user?.name || '未设置',
                organization: order.user?.organization || '未设置',
                phone: order.user?.phone || '未设置',
                lastAcceptanceTime:
                    order.startedAt?.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                    }) || '',
                lastTaskNumber: order.task?.id || '',
                lastTaskName: order.task?.title || '未设置',
            }));
        }),

    // 获取提报缺陷人次列表
    getDefectReportCount: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(15),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, startDate, endDate } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {};

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取总数
            const total = await ctx.db.defect.count({ where });

            // 获取缺陷列表
            const defects = await ctx.db.defect.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
                select: {
                    id: true,
                    status: true,
                    type: true,
                    title: true,
                    description: true,
                    severity: true,
                    suggestionLevel: true,
                    earnedPoints: true,
                    duplicateGroupId: true,
                    steps: true,
                    reviewComment: true,
                    supplementaryExplanation: true,
                    createdAt: true,
                    attachments: true,
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    task: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    testCase: {
                        select: {
                            title: true,
                        },
                    },
                },
            });

            // 获取数据字典映射
            const { getDictionaryItems } = await import(
                '@/server/api/utils/dictionaryValidator'
            );
            const [severityItems, suggestionItems] = await Promise.all([
                getDictionaryItems(ctx.db, 'DEFECT_SEVERITY'),
                getDictionaryItems(ctx.db, 'SUGGESTION_LEVEL'),
            ]);

            // 获取等级显示文本的函数
            const getLevelDisplayText = (defect: any) => {
                if (defect.type === 'BUG' && defect.severity) {
                    const item = severityItems.find(
                        (i: any) => i.code === defect.severity
                    );
                    return item?.label || defect.severity;
                } else if (
                    defect.type === 'SUGGESTION' &&
                    defect.suggestionLevel
                ) {
                    const item = suggestionItems.find(
                        (i: any) => i.code === defect.suggestionLevel
                    );
                    return item?.label || defect.suggestionLevel;
                }
                return '未判定';
            };

            return {
                data: defects.map((defect, index) => ({
                    id: skip + index + 1,
                    username: defect.user?.name || '未设置',
                    organization: defect.user?.organization || '未设置',
                    phone: defect.user?.phone || '未设置',
                    reportTime: defect.createdAt.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                    }),
                    taskNumber: defect.task?.id || '',
                    taskName: defect.task?.title || '未设置',
                    defectName: defect.title || '未设置',
                    judgmentResult: getLevelDisplayText(defect),
                    judgmentOpinion: defect.reviewComment || '',
                })),
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 导出提报缺陷人次数据
    exportDefectReportCount: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            // 构建查询条件
            const where: any = {};

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取所有缺陷数据（不分页）
            const defects = await ctx.db.defect.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    task: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    testCase: {
                        select: {
                            title: true,
                        },
                    },
                },
            });

            // 获取数据字典映射
            const { getDictionaryItems } = await import(
                '@/server/api/utils/dictionaryValidator'
            );
            const [severityItems, suggestionItems] = await Promise.all([
                getDictionaryItems(ctx.db, 'DEFECT_SEVERITY'),
                getDictionaryItems(ctx.db, 'SUGGESTION_LEVEL'),
            ]);

            // 获取等级显示文本的函数
            const getLevelDisplayText = (defect: any) => {
                if (defect.type === 'BUG' && defect.severity) {
                    const item = severityItems.find(
                        (i: any) => i.code === defect.severity
                    );
                    return item?.label || defect.severity;
                } else if (
                    defect.type === 'SUGGESTION' &&
                    defect.suggestionLevel
                ) {
                    const item = suggestionItems.find(
                        (i: any) => i.code === defect.suggestionLevel
                    );
                    return item?.label || defect.suggestionLevel;
                }
                return '未判定';
            };

            return defects.map((defect, index) => ({
                id: index + 1,
                username: defect.user?.name || '未设置',
                organization: defect.user?.organization || '未设置',
                phone: defect.user?.phone || '未设置',
                reportTime: defect.createdAt.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                }),
                taskNumber: defect.task?.id || '',
                taskName: defect.task?.title || '未设置',
                defectName: defect.title || '未设置',
                judgmentResult: getLevelDisplayText(defect),
                judgmentOpinion: defect.reviewComment || '',
            }));
        }),

    // 获取提报缺陷人数列表（按用户去重，显示每个用户最后的提报记录）
    getDefectReportPeople: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(15),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, startDate, endDate } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {};

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取所有符合条件的缺陷记录
            const defects = await ctx.db.defect.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    task: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    testCase: {
                        select: {
                            title: true,
                        },
                    },
                },
            });

            // 按用户ID分组，获取每个用户的最后一条记录
            const userMap = new Map();
            defects.forEach((defect) => {
                const userId = defect.userId;
                if (
                    !userMap.has(userId) ||
                    new Date(defect.createdAt) >
                        new Date(userMap.get(userId).createdAt)
                ) {
                    userMap.set(userId, defect);
                }
            });

            // 转换为数组并按最后提报时间排序
            const uniqueUsers = Array.from(userMap.values()).sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            );

            // 分页处理
            const total = uniqueUsers.length;
            const paginatedUsers = uniqueUsers.slice(skip, skip + pageSize);

            // 获取数据字典映射
            const { getDictionaryItems } = await import(
                '@/server/api/utils/dictionaryValidator'
            );
            const [severityItems, suggestionItems] = await Promise.all([
                getDictionaryItems(ctx.db, 'DEFECT_SEVERITY'),
                getDictionaryItems(ctx.db, 'SUGGESTION_LEVEL'),
            ]);

            // 获取等级显示文本的函数
            const getLevelDisplayText = (defect: any) => {
                if (defect.type === 'BUG' && defect.severity) {
                    const item = severityItems.find(
                        (i: any) => i.code === defect.severity
                    );
                    return item?.label || defect.severity;
                } else if (
                    defect.type === 'SUGGESTION' &&
                    defect.suggestionLevel
                ) {
                    const item = suggestionItems.find(
                        (i: any) => i.code === defect.suggestionLevel
                    );
                    return item?.label || defect.suggestionLevel;
                }
                return '未判定';
            };

            return {
                data: paginatedUsers.map((defect, index) => ({
                    id: skip + index + 1,
                    username: defect.user?.name || '未设置',
                    organization: defect.user?.organization || '未设置',
                    phone: defect.user?.phone || '未设置',
                    lastReportTime: defect.createdAt.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                    }),
                    lastTaskNumber: defect.task?.id || '',
                    lastTaskName: defect.task?.title || '未设置',
                    lastDefectName: defect.title || '未设置',
                    lastJudgmentResult: getLevelDisplayText(defect),
                    lastJudgmentOpinion: defect.reviewComment || '',
                })),
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 导出提报缺陷人数数据
    exportDefectReportPeople: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            // 构建查询条件
            const where: any = {};

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取所有缺陷数据
            const defects = await ctx.db.defect.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    task: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    testCase: {
                        select: {
                            title: true,
                        },
                    },
                },
            });

            // 按用户ID分组，获取每个用户的最后一条记录
            const userMap = new Map();
            defects.forEach((defect) => {
                const userId = defect.userId;
                if (
                    !userMap.has(userId) ||
                    new Date(defect.createdAt) >
                        new Date(userMap.get(userId).createdAt)
                ) {
                    userMap.set(userId, defect);
                }
            });

            // 转换为数组并按最后提报时间排序
            const uniqueUsers = Array.from(userMap.values()).sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            );

            // 获取数据字典映射
            const { getDictionaryItems } = await import(
                '@/server/api/utils/dictionaryValidator'
            );
            const [severityItems, suggestionItems] = await Promise.all([
                getDictionaryItems(ctx.db, 'DEFECT_SEVERITY'),
                getDictionaryItems(ctx.db, 'SUGGESTION_LEVEL'),
            ]);

            // 获取等级显示文本的函数
            const getLevelDisplayText = (defect: any) => {
                if (defect.type === 'BUG' && defect.severity) {
                    const item = severityItems.find(
                        (i: any) => i.code === defect.severity
                    );
                    return item?.label || defect.severity;
                } else if (
                    defect.type === 'SUGGESTION' &&
                    defect.suggestionLevel
                ) {
                    const item = suggestionItems.find(
                        (i: any) => i.code === defect.suggestionLevel
                    );
                    return item?.label || defect.suggestionLevel;
                }
                return '未判定';
            };

            return uniqueUsers.map((defect, index) => ({
                id: index + 1,
                username: defect.user?.name || '未设置',
                organization: defect.user?.organization || '未设置',
                phone: defect.user?.phone || '未设置',
                lastReportTime: defect.createdAt.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                }),
                lastTaskNumber: defect.task?.id || '',
                lastTaskName: defect.task?.title || '未设置',
                lastDefectName: defect.title || '未设置',
                lastJudgmentResult: getLevelDisplayText(defect),
                lastJudgmentOpinion: defect.reviewComment || '',
            }));
        }),

    // 获取提报有效缺陷数列表（只显示状态为APPROVED的缺陷）
    getValidDefectCount: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(15),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, startDate, endDate } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件 - 只查询已批准的缺陷
            const where: any = {
                status: 'APPROVED',
            };

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取总数
            const total = await ctx.db.defect.count({ where });

            // 获取有效缺陷列表
            const defects = await ctx.db.defect.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
                select: {
                    id: true,
                    status: true,
                    type: true,
                    title: true,
                    description: true,
                    severity: true,
                    suggestionLevel: true,
                    earnedPoints: true,
                    duplicateGroupId: true,
                    steps: true,
                    reviewComment: true,
                    supplementaryExplanation: true,
                    createdAt: true,
                    attachments: true,
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    task: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    testCase: {
                        select: {
                            title: true,
                        },
                    },
                },
            });

            // 获取数据字典映射
            const { getDictionaryItems } = await import(
                '@/server/api/utils/dictionaryValidator'
            );
            const [severityItems, suggestionItems] = await Promise.all([
                getDictionaryItems(ctx.db, 'DEFECT_SEVERITY'),
                getDictionaryItems(ctx.db, 'SUGGESTION_LEVEL'),
            ]);

            // 获取等级显示文本的函数
            const getLevelDisplayText = (defect: any) => {
                if (defect.type === 'BUG' && defect.severity) {
                    const item = severityItems.find(
                        (i: any) => i.code === defect.severity
                    );
                    return item?.label || defect.severity;
                } else if (
                    defect.type === 'SUGGESTION' &&
                    defect.suggestionLevel
                ) {
                    const item = suggestionItems.find(
                        (i: any) => i.code === defect.suggestionLevel
                    );
                    return item?.label || defect.suggestionLevel;
                }
                return '未判定';
            };

            return {
                data: defects.map((defect, index) => ({
                    id: skip + index + 1,
                    username: defect.user?.name || '未设置',
                    organization: defect.user?.organization || '未设置',
                    phone: defect.user?.phone || '未设置',
                    reportTime: defect.createdAt.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                    }),
                    taskNumber: defect.task?.id || '',
                    taskName: defect.task?.title || '未设置',
                    defectName: defect.title || '未设置',
                    judgmentResult: getLevelDisplayText(defect),
                    judgmentOpinion: defect.reviewComment || '',
                })),
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 获取缺陷明细列表
    getDefectDetails: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(15),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                defectType: z.enum(['BUG', 'SUGGESTION']).optional(),
                status: z
                    .enum(['SUBMITTED', 'REVIEWING', 'APPROVED', 'REJECTED'])
                    .optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, startDate, endDate, defectType, status } =
                input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {};

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 缺陷类型筛选
            if (defectType) {
                where.type = defectType;
            }

            // 状态筛选
            if (status) {
                where.status = status;
            }

            // 获取总数
            const total = await ctx.db.defect.count({ where });

            // 获取缺陷列表
            const defects = await ctx.db.defect.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
                select: {
                    id: true,
                    status: true,
                    type: true,
                    title: true,
                    description: true,
                    severity: true,
                    suggestionLevel: true,
                    earnedPoints: true,
                    duplicateGroupId: true,
                    steps: true,
                    reviewComment: true,
                    supplementaryExplanation: true,
                    createdAt: true,
                    attachments: true,
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    task: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    testCase: {
                        select: {
                            title: true,
                        },
                    },
                },
            });

            // 获取数据字典映射
            const { getDictionaryItems } = await import(
                '@/server/api/utils/dictionaryValidator'
            );
            const [severityItems, suggestionItems] = await Promise.all([
                getDictionaryItems(ctx.db, 'DEFECT_SEVERITY'),
                getDictionaryItems(ctx.db, 'SUGGESTION_LEVEL'),
            ]);

            // 获取等级显示文本的函数
            const getLevelDisplayText = (defect: any) => {
                if (defect.type === 'BUG' && defect.severity) {
                    const item = severityItems.find(
                        (i: any) => i.code === defect.severity
                    );
                    return item?.label || defect.severity;
                } else if (
                    defect.type === 'SUGGESTION' &&
                    defect.suggestionLevel
                ) {
                    const item = suggestionItems.find(
                        (i: any) => i.code === defect.suggestionLevel
                    );
                    return item?.label || defect.suggestionLevel;
                }
                return '未判定';
            };

            // 获取状态显示文本
            const getStatusDisplayText = (status: string) => {
                const statusMap: Record<string, string> = {
                    SUBMITTED: '已提交',
                    REVIEWING: '判定中',
                    TO_CONFIRM: '待确认',
                    APPROVED: '已通过',
                    REJECTED: '无效',
                    DUPLICATE: '重复',
                    CLOSED: '已关闭',
                };
                return statusMap[status] || status;
            };

            return {
                data: defects.map((defect, index) => ({
                    id: skip + index + 1,
                    defectNumber: defect.id,
                    taskName: defect.task?.title || '未设置',
                    submitter: defect.user?.name || '未设置',
                    submitTime: defect.createdAt.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                    }),
                    statusCode: defect.status, // 添加原始状态码
                    status: getStatusDisplayText(defect.status),
                    type: defect.type, // 添加缺陷类型
                    severity: defect.severity, // 添加 BUG 等级（原始值）
                    suggestionLevel: defect.suggestionLevel, // 添加建议等级（原始值）
                    title: defect.title || '未设置',
                    description: defect.description || '',
                    points: defect.earnedPoints || 0,
                    duplicateCount: defect.duplicateGroupId ? 1 : 0,
                    duplicateGroupId: defect.duplicateGroupId, // 添加这一行
                    testCase: defect.testCase?.title || '未设置',
                    relatedSteps: defect.steps || '',
                    reviewComment: defect.reviewComment || '',
                    supplement: defect.supplementaryExplanation || '',
                    deviceModel: '未设置',
                    osVersion: '未设置',
                    attachments: defect.attachments || [], // 添加附件字段
                })),
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 导出缺陷明细数据
    exportDefectDetails: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                defectType: z.enum(['BUG', 'SUGGESTION']).optional(),
                status: z
                    .enum(['SUBMITTED', 'REVIEWING', 'APPROVED', 'REJECTED'])
                    .optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate, defectType, status } = input;

            // 构建查询条件
            const where: any = {};

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 缺陷类型筛选
            if (defectType) {
                where.type = defectType;
            }

            // 状态筛选
            if (status) {
                where.status = status;
            }

            // 获取所有缺陷数据（不分页）
            const defects = await ctx.db.defect.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    status: true,
                    type: true,
                    title: true,
                    description: true,
                    severity: true,
                    suggestionLevel: true,
                    earnedPoints: true,
                    duplicateGroupId: true,
                    steps: true,
                    reviewComment: true,
                    supplementaryExplanation: true,
                    createdAt: true,
                    attachments: true,
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    task: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    testCase: {
                        select: {
                            title: true,
                        },
                    },
                },
            });

            // 获取数据字典映射
            const { getDictionaryItems } = await import(
                '@/server/api/utils/dictionaryValidator'
            );
            const [severityItems, suggestionItems] = await Promise.all([
                getDictionaryItems(ctx.db, 'DEFECT_SEVERITY'),
                getDictionaryItems(ctx.db, 'SUGGESTION_LEVEL'),
            ]);

            // 获取等级显示文本的函数
            const getLevelDisplayText = (defect: any) => {
                if (defect.type === 'BUG' && defect.severity) {
                    const item = severityItems.find(
                        (i: any) => i.code === defect.severity
                    );
                    return item?.label || defect.severity;
                } else if (
                    defect.type === 'SUGGESTION' &&
                    defect.suggestionLevel
                ) {
                    const item = suggestionItems.find(
                        (i: any) => i.code === defect.suggestionLevel
                    );
                    return item?.label || defect.suggestionLevel;
                }
                return '未判定';
            };

            // 获取状态显示文本
            const getStatusDisplayText = (status: string) => {
                const statusMap: Record<string, string> = {
                    SUBMITTED: '已提交',
                    REVIEWING: '判定中',
                    TO_CONFIRM: '待确认',
                    APPROVED: '已通过',
                    REJECTED: '无效',
                    DUPLICATE: '重复',
                    CLOSED: '已关闭',
                };
                return statusMap[status] || status;
            };

            return defects.map((defect, index) => ({
                id: index + 1,
                defectNumber: defect.id,
                taskName: defect.task?.title || '未设置',
                submitter: defect.user?.name || '未设置',
                submitTime: defect.createdAt.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                }),
                statusCode: defect.status, // 添加原始状态码
                status: getStatusDisplayText(defect.status),
                type: defect.type, // 添加缺陷类型
                severity: defect.severity, // 添加 BUG 等级（原始值）
                suggestionLevel: defect.suggestionLevel, // 添加建议等级（原始值）
                title: defect.title || '未设置',
                description: defect.description || '',
                points: defect.earnedPoints || 0,
                duplicateCount: defect.duplicateGroupId ? 1 : 0,
                testCase: defect.testCase?.title || '未设置',
                relatedSteps: defect.steps || '',
                reviewComment: defect.reviewComment || '',
                supplement: defect.supplementaryExplanation || '',
                deviceModel: '未设置',
                osVersion: '未设置',
                attachments: defect.attachments || [], // 添加附件字段
            }));
        }),

    // 导出提报有效缺陷数数据
    exportValidDefectCount: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            // 构建查询条件 - 只查询已批准的缺陷
            const where: any = {
                status: 'APPROVED',
            };

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取所有有效缺陷数据（不分页）
            const defects = await ctx.db.defect.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    task: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    testCase: {
                        select: {
                            title: true,
                        },
                    },
                },
            });

            // 获取数据字典映射
            const { getDictionaryItems } = await import(
                '@/server/api/utils/dictionaryValidator'
            );
            const [severityItems, suggestionItems] = await Promise.all([
                getDictionaryItems(ctx.db, 'DEFECT_SEVERITY'),
                getDictionaryItems(ctx.db, 'SUGGESTION_LEVEL'),
            ]);

            // 获取等级显示文本的函数
            const getLevelDisplayText = (defect: any) => {
                if (defect.type === 'BUG' && defect.severity) {
                    const item = severityItems.find(
                        (i: any) => i.code === defect.severity
                    );
                    return item?.label || defect.severity;
                } else if (
                    defect.type === 'SUGGESTION' &&
                    defect.suggestionLevel
                ) {
                    const item = suggestionItems.find(
                        (i: any) => i.code === defect.suggestionLevel
                    );
                    return item?.label || defect.suggestionLevel;
                }
                return '未判定';
            };

            return defects.map((defect, index) => ({
                id: index + 1,
                username: defect.user?.name || '未设置',
                organization: defect.user?.organization || '未设置',
                phone: defect.user?.phone || '未设置',
                reportTime: defect.createdAt.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                }),
                taskNumber: defect.task?.id || '',
                taskName: defect.task?.title || '未设置',
                defectName: defect.title || '未设置',
                judgmentResult: getLevelDisplayText(defect),
                judgmentOpinion: defect.reviewComment || '',
            }));
        }),

    // 获取用户增长趋势数据（用于折线图）
    getUserGrowthTrend: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                timeRange: z.enum(['day', 'month']).default('month'),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate, timeRange } = input;

            // 计算时间范围
            let start = new Date();
            let end = new Date();

            if (startDate) {
                start = new Date(startDate);
            } else {
                // 默认显示最近12个月
                start.setMonth(start.getMonth() - 11);
            }

            if (endDate) {
                end = new Date(endDate);
            }

            // 生成时间点数据
            const timePoints = [];
            const currentDate = new Date(start);

            if (timeRange === 'month') {
                // 按月生成数据点
                while (currentDate <= end) {
                    timePoints.push(new Date(currentDate));
                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
            } else {
                // 按日生成数据点（最多显示30天）
                let dayCount = 0;
                while (currentDate <= end && dayCount < 30) {
                    timePoints.push(new Date(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                    dayCount++;
                }
            }

            // 获取每个时间点的累计用户数和新增用户数
            const trendData = [];
            let cumulativeCount = 0;

            for (let i = 0; i < timePoints.length; i++) {
                const pointDate = timePoints[i];
                const nextPointDate =
                    i < timePoints.length - 1
                        ? timePoints[i + 1]
                        : new Date(
                              pointDate.getTime() +
                                  (timeRange === 'month' ? 30 : 1) *
                                      24 *
                                      60 *
                                      60 *
                                      1000
                          );

                // 查询该时间段内的用户数据
                const usersInPeriod = await ctx.db.user.findMany({
                    where: {
                        isDeleted: false,
                        createdAt: {
                            gte: pointDate,
                            lt: nextPointDate,
                        },
                    },
                    select: {
                        id: true,
                        createdAt: true,
                    },
                });

                const newCount = usersInPeriod.length;
                cumulativeCount += newCount;

                // 格式化时间显示
                const timeLabel =
                    timeRange === 'month'
                        ? `${pointDate.getMonth() + 1}月`
                        : `${pointDate.getMonth() + 1}-${pointDate.getDate()}`;

                trendData.push({
                    time: timeLabel,
                    cumulativeUsers: cumulativeCount,
                    newUsers: newCount,
                });
            }

            return trendData;
        }),

    // 获取用户活跃度趋势数据
    getUserActivityTrend: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                timeRange: z.enum(['day', 'month']).default('month'),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate, timeRange } = input;

            // 计算时间范围
            let start = new Date();
            let end = new Date();

            if (startDate) {
                start = new Date(startDate);
            } else {
                // 默认显示最近12个月
                start.setMonth(start.getMonth() - 11);
            }

            if (endDate) {
                end = new Date(endDate);
            }

            // 生成时间点数据
            const timePoints = [];
            const currentDate = new Date(start);

            if (timeRange === 'month') {
                // 按月生成数据点
                while (currentDate <= end) {
                    timePoints.push(new Date(currentDate));
                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
            } else {
                // 按日生成数据点（最多显示30天）
                let dayCount = 0;
                while (currentDate <= end && dayCount < 30) {
                    timePoints.push(new Date(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                    dayCount++;
                }
            }

            // 获取每个时间点的活跃用户数
            const trendData = [];

            for (let i = 0; i < timePoints.length; i++) {
                const pointDate = timePoints[i];
                const nextPointDate =
                    i < timePoints.length - 1
                        ? timePoints[i + 1]
                        : new Date(
                              pointDate.getTime() +
                                  (timeRange === 'month' ? 30 : 1) *
                                      24 *
                                      60 *
                                      60 *
                                      1000
                          );

                // 查询该时间段内的活跃用户（基于updatedAt）
                const activeUsers = await ctx.db.user.findMany({
                    where: {
                        isDeleted: false,
                        updatedAt: {
                            gte: pointDate,
                            lt: nextPointDate,
                        },
                    },
                    select: {
                        id: true,
                        updatedAt: true,
                    },
                });

                const totalCount = activeUsers.length;
                // 假设渠道分布（可以根据实际需求调整）
                const miniProgramCount = Math.floor(totalCount * 0.45);
                const pcCount = totalCount - miniProgramCount;

                // 格式化时间显示
                const timeLabel =
                    timeRange === 'month'
                        ? `${pointDate.getMonth() + 1}月`
                        : `${pointDate.getMonth() + 1}-${pointDate.getDate()}`;

                trendData.push({
                    time: timeLabel,
                    total: totalCount,
                    miniProgram: miniProgramCount,
                    pc: pcCount,
                });
            }

            return trendData;
        }),

    /**
     * 获取参与率和反馈率统计数据
     */
    getParticipationStats: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                timeRange: z.enum(['day', 'month']).default('month'),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate, timeRange } = input;

            // 构建日期筛选条件
            const dateFilter: any = {};
            if (startDate || endDate) {
                if (startDate) {
                    // 开始日期使用00:00:00时间
                    dateFilter.gte = new Date(startDate + 'T00:00:00');
                }
                if (endDate) {
                    // 结束日期使用23:59:59时间，确保包含整天
                    dateFilter.lte = new Date(endDate + 'T23:59:59');
                } else {
                    // 如果指定了开始日期但没有指定结束日期，使用当前时间作为结束日期
                    dateFilter.lte = new Date();
                }
            } else {
                // 如果没有指定日期范围，根据timeRange设置默认范围
                const now = new Date();
                if (timeRange === 'day') {
                    // 日维度：默认查询最近30天
                    const thirtyDaysAgo = new Date(now);
                    thirtyDaysAgo.setDate(now.getDate() - 30);
                    dateFilter.gte = thirtyDaysAgo;
                } else {
                    // 月维度：默认查询最近12个月
                    const twelveMonthsAgo = new Date(now);
                    twelveMonthsAgo.setMonth(now.getMonth() - 11); // 11个月前（加上当前月共12个月）
                    dateFilter.gte = twelveMonthsAgo;
                }
                dateFilter.lte = now;
            }

            // 获取总注册用户数
            const totalUsers = await ctx.db.user.count({
                where:
                    dateFilter.gte || dateFilter.lte
                        ? {
                              createdAt: {
                                  gte: dateFilter.gte,
                                  lte: dateFilter.lte,
                              },
                          }
                        : {},
            });

            // 获取领取任务的用户数（有任务订单的用户）
            const usersWithOrders = await ctx.db.user.count({
                where:
                    dateFilter.gte || dateFilter.lte
                        ? {
                              taskOrders: {
                                  some: {
                                      startedAt: {
                                          gte: dateFilter.gte,
                                          lte: dateFilter.lte,
                                      },
                                  },
                              },
                          }
                        : {
                              taskOrders: {
                                  some: {},
                              },
                          },
            });

            // 获取提交了缺陷或建议的用户数（有缺陷提交记录的用户，且这些用户在指定时间范围内领取了任务）
            // 注意：这里需要找到那些在指定时间范围内领取任务且最终提交了缺陷的用户
            // 缺陷提交时间不需要限制在任务领取的时间范围内
            const usersWithDefects = await ctx.db.user.count({
                where:
                    dateFilter.gte || dateFilter.lte
                        ? {
                              taskOrders: {
                                  some: {
                                      startedAt: {
                                          gte: dateFilter.gte,
                                          lte: dateFilter.lte,
                                      },
                                  },
                              },
                              defects: {
                                  some: {},
                              },
                          }
                        : {
                              taskOrders: {
                                  some: {},
                              },
                              defects: {
                                  some: {},
                              },
                          },
            });

            // 获取总任务数
            const totalTasks = await ctx.db.testTask.count({
                where:
                    dateFilter.gte || dateFilter.lte
                        ? {
                              createdAt: {
                                  gte: dateFilter.gte,
                                  lte: dateFilter.lte,
                              },
                          }
                        : {},
            });

            // 获取总缺陷数
            const totalDefects = await ctx.db.defect.count({
                where:
                    dateFilter.gte || dateFilter.lte
                        ? {
                              createdAt: {
                                  gte: dateFilter.gte,
                                  lte: dateFilter.lte,
                              },
                          }
                        : {},
            });

            // 获取有效缺陷数（status为APPROVED）
            const validDefects = await ctx.db.defect.count({
                where:
                    dateFilter.gte || dateFilter.lte
                        ? {
                              status: 'APPROVED',
                              createdAt: {
                                  gte: dateFilter.gte,
                                  lte: dateFilter.lte,
                              },
                          }
                        : {
                              status: 'APPROVED',
                          },
            });

            // 计算参与率和反馈率
            const participationRate =
                usersWithOrders > 0
                    ? Math.round((usersWithDefects / usersWithOrders) * 10000) /
                      100
                    : 0;

            const feedbackRate =
                totalDefects > 0
                    ? Math.round((validDefects / totalDefects) * 10000) / 100
                    : 0;

            return {
                totalUsers,
                usersWithOrders,
                usersWithDefects,
                participationRate,
                totalTasks,
                totalDefects,
                validDefects,
                feedbackRate,
            };
        }),

    // 获取分行统计列表
    getBranchStatistics: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
                branchName: z.string().optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, branchName, startDate, endDate } = input;
            const skip = (page - 1) * pageSize;

            // 构建日期筛选条件
            const dateFilter: any = {};
            if (startDate || endDate) {
                if (startDate) {
                    dateFilter.gte = new Date(startDate + 'T00:00:00');
                }
                if (endDate) {
                    dateFilter.lte = new Date(endDate + 'T23:59:59');
                }
            }

            // 获取所有用户，按机构分组
            const users = await ctx.db.user.findMany({
                where: {
                    isDeleted: false,
                    organization: branchName
                        ? { contains: branchName }
                        : undefined,
                },
                select: {
                    id: true,
                    organization: true,
                    createdAt: true,
                    updatedAt: true,
                    taskOrders: {
                        where:
                            dateFilter.gte || dateFilter.lte
                                ? {
                                      startedAt: {
                                          gte: dateFilter.gte,
                                          lte: dateFilter.lte,
                                      },
                                  }
                                : {},
                        select: {
                            id: true,
                            userId: true,
                            startedAt: true,
                        },
                    },
                    defects: {
                        where:
                            dateFilter.gte || dateFilter.lte
                                ? {
                                      createdAt: {
                                          gte: dateFilter.gte,
                                          lte: dateFilter.lte,
                                      },
                                  }
                                : {},
                        select: {
                            id: true,
                            userId: true,
                            status: true,
                            createdAt: true,
                        },
                    },
                },
            });

            // 按机构分组统计
            const branchMap = new Map<string, any>();

            users.forEach((user) => {
                const org = user.organization || '未设置';
                if (!branchMap.has(org)) {
                    branchMap.set(org, {
                        branchName: org,
                        cumulativeUsers: 0,
                        newUsers: 0,
                        activeUsersTotal: 0,
                        activeUsersMiniProgram: 0, // 假设50%来自小程序
                        activeUsersPC: 0, // 假设50%来自PC端
                        taskAcceptanceCount: 0,
                        taskAcceptancePeople: new Set(),
                        defectReportCount: 0,
                        defectReportPeople: new Set(),
                        validDefectCount: 0,
                        userSet: new Set(), // 用于统计累计用户
                        newUserSet: new Set(), // 用于统计新增用户
                        activeUserSet: new Set(), // 用于统计活跃用户
                    });
                }

                const branchData = branchMap.get(org);

                // 累计用户统计
                branchData.userSet.add(user.id);
                branchData.cumulativeUsers = branchData.userSet.size;

                // 新增用户统计（根据日期筛选）
                if (!dateFilter.gte || user.createdAt >= dateFilter.gte) {
                    if (!dateFilter.lte || user.createdAt <= dateFilter.lte) {
                        branchData.newUserSet.add(user.id);
                        branchData.newUsers = branchData.newUserSet.size;
                    }
                }

                // 活跃用户统计（根据日期筛选）
                if (!dateFilter.gte || user.updatedAt >= dateFilter.gte) {
                    if (!dateFilter.lte || user.updatedAt <= dateFilter.lte) {
                        branchData.activeUserSet.add(user.id);
                        branchData.activeUsersTotal =
                            branchData.activeUserSet.size;
                        // 假设渠道分布
                        branchData.activeUsersMiniProgram = Math.floor(
                            branchData.activeUsersTotal * 0.5
                        );
                        branchData.activeUsersPC =
                            branchData.activeUsersTotal -
                            branchData.activeUsersMiniProgram;
                    }
                }

                // 任务统计
                user.taskOrders.forEach((order) => {
                    branchData.taskAcceptanceCount++;
                    branchData.taskAcceptancePeople.add(order.userId);
                });

                // 缺陷统计
                user.defects.forEach((defect) => {
                    branchData.defectReportCount++;
                    branchData.defectReportPeople.add(defect.userId);
                    if (defect.status === 'APPROVED') {
                        branchData.validDefectCount++;
                    }
                });
            });

            // 转换为数组
            const branchStats = Array.from(branchMap.values()).map(
                (data, index) => ({
                    id: index + 1,
                    branchName: data.branchName,
                    cumulativeUsers: data.cumulativeUsers,
                    newUsers: data.newUsers,
                    activeUsersTotal: data.activeUsersTotal,
                    activeUsersMiniProgram: data.activeUsersMiniProgram,
                    activeUsersPC: data.activeUsersPC,
                    taskAcceptanceCount: data.taskAcceptanceCount,
                    taskAcceptancePeople: data.taskAcceptancePeople.size,
                    defectReportCount: data.defectReportCount,
                    defectReportPeople: data.defectReportPeople.size,
                    validDefectCount: data.validDefectCount,
                    participationRate:
                        data.taskAcceptancePeople.size > 0
                            ? Math.round(
                                  (data.defectReportPeople.size /
                                      data.taskAcceptancePeople.size) *
                                      10000
                              ) / 100
                            : 0,
                    validFeedbackRate:
                        data.defectReportCount > 0
                            ? Math.round(
                                  (data.validDefectCount /
                                      data.defectReportCount) *
                                      10000
                              ) / 100
                            : 0,
                })
            );

            // 按累计用户数降序排序
            branchStats.sort((a, b) => b.cumulativeUsers - a.cumulativeUsers);

            // 分页处理
            const total = branchStats.length;
            const paginatedData = branchStats.slice(skip, skip + pageSize);

            return {
                data: paginatedData,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 导出分行统计数据
    exportBranchStatistics: protectedProcedure
        .input(
            z.object({
                branchName: z.string().optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { branchName, startDate, endDate } = input;

            // 构建日期筛选条件
            const dateFilter: any = {};
            if (startDate || endDate) {
                if (startDate) {
                    dateFilter.gte = new Date(startDate + 'T00:00:00');
                }
                if (endDate) {
                    dateFilter.lte = new Date(endDate + 'T23:59:59');
                }
            }

            // 获取所有用户，按机构分组
            const users = await ctx.db.user.findMany({
                where: {
                    isDeleted: false,
                    organization: branchName
                        ? { contains: branchName }
                        : undefined,
                },
                select: {
                    id: true,
                    organization: true,
                    createdAt: true,
                    updatedAt: true,
                    taskOrders: {
                        where:
                            dateFilter.gte || dateFilter.lte
                                ? {
                                      startedAt: {
                                          gte: dateFilter.gte,
                                          lte: dateFilter.lte,
                                      },
                                  }
                                : {},
                        select: {
                            id: true,
                            userId: true,
                            startedAt: true,
                        },
                    },
                    defects: {
                        where:
                            dateFilter.gte || dateFilter.lte
                                ? {
                                      createdAt: {
                                          gte: dateFilter.gte,
                                          lte: dateFilter.lte,
                                      },
                                  }
                                : {},
                        select: {
                            id: true,
                            userId: true,
                            status: true,
                            createdAt: true,
                        },
                    },
                },
            });

            // 按机构分组统计
            const branchMap = new Map<string, any>();

            users.forEach((user) => {
                const org = user.organization || '未设置';
                if (!branchMap.has(org)) {
                    branchMap.set(org, {
                        branchName: org,
                        cumulativeUsers: 0,
                        newUsers: 0,
                        activeUsersTotal: 0,
                        activeUsersMiniProgram: 0,
                        activeUsersPC: 0,
                        taskAcceptanceCount: 0,
                        taskAcceptancePeople: new Set(),
                        defectReportCount: 0,
                        defectReportPeople: new Set(),
                        validDefectCount: 0,
                        userSet: new Set(),
                        newUserSet: new Set(),
                        activeUserSet: new Set(),
                    });
                }

                const branchData = branchMap.get(org);

                // 累计用户统计
                branchData.userSet.add(user.id);
                branchData.cumulativeUsers = branchData.userSet.size;

                // 新增用户统计
                if (!dateFilter.gte || user.createdAt >= dateFilter.gte) {
                    if (!dateFilter.lte || user.createdAt <= dateFilter.lte) {
                        branchData.newUserSet.add(user.id);
                        branchData.newUsers = branchData.newUserSet.size;
                    }
                }

                // 活跃用户统计
                if (!dateFilter.gte || user.updatedAt >= dateFilter.gte) {
                    if (!dateFilter.lte || user.updatedAt <= dateFilter.lte) {
                        branchData.activeUserSet.add(user.id);
                        branchData.activeUsersTotal =
                            branchData.activeUserSet.size;
                        branchData.activeUsersMiniProgram = Math.floor(
                            branchData.activeUsersTotal * 0.5
                        );
                        branchData.activeUsersPC =
                            branchData.activeUsersTotal -
                            branchData.activeUsersMiniProgram;
                    }
                }

                // 任务统计
                user.taskOrders.forEach((order) => {
                    branchData.taskAcceptanceCount++;
                    branchData.taskAcceptancePeople.add(order.userId);
                });

                // 缺陷统计
                user.defects.forEach((defect) => {
                    branchData.defectReportCount++;
                    branchData.defectReportPeople.add(defect.userId);
                    if (defect.status === 'APPROVED') {
                        branchData.validDefectCount++;
                    }
                });
            });

            // 转换为数组并排序
            const branchStats = Array.from(branchMap.values()).map(
                (data, index) => ({
                    id: index + 1,
                    branchName: data.branchName,
                    cumulativeUsers: data.cumulativeUsers,
                    newUsers: data.newUsers,
                    activeUsersTotal: data.activeUsersTotal,
                    activeUsersMiniProgram: data.activeUsersMiniProgram,
                    activeUsersPC: data.activeUsersPC,
                    taskAcceptanceCount: data.taskAcceptanceCount,
                    taskAcceptancePeople: data.taskAcceptancePeople.size,
                    defectReportCount: data.defectReportCount,
                    defectReportPeople: data.defectReportPeople.size,
                    validDefectCount: data.validDefectCount,
                    participationRate:
                        data.taskAcceptancePeople.size > 0
                            ? Math.round(
                                  (data.defectReportPeople.size /
                                      data.taskAcceptancePeople.size) *
                                      10000
                              ) / 100
                            : 0,
                    validFeedbackRate:
                        data.defectReportCount > 0
                            ? Math.round(
                                  (data.validDefectCount /
                                      data.defectReportCount) *
                                      10000
                              ) / 100
                            : 0,
                })
            );

            // 按累计用户数降序排序
            branchStats.sort((a, b) => b.cumulativeUsers - a.cumulativeUsers);

            return branchStats;
        }),

    // 获取任务统计列表
    getTaskStatistics: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
                taskName: z.string().optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, taskName, startDate, endDate } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {
                isDeleted: false,
            };

            if (taskName) {
                where.title = {
                    contains: taskName,
                    mode: 'insensitive',
                };
            }

            // 日期范围筛选（基于任务创建时间）
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate + 'T00:00:00');
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59');
                }
            }

            // 查询总数
            const total = await ctx.db.testTask.count({ where });

            // 查询任务列表
            const tasks = await ctx.db.testTask.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    orders: {
                        where: {
                            startedAt: {
                                not: null,
                            },
                        },
                        select: {
                            id: true,
                            userId: true,
                            startedAt: true,
                        },
                    },
                    defects: {
                        select: {
                            id: true,
                            userId: true,
                            status: true,
                        },
                    },
                },
            });

            // 格式化返回数据
            const formattedItems = tasks.map((task) => {
                // 统计任务领取人次（订单数）
                const taskAcceptanceCount = task.orders.length;

                // 统计任务领取人数（去重用户数）
                const uniqueUsers = new Set(task.orders.map((o) => o.userId));
                const taskAcceptancePeople = uniqueUsers.size;

                // 统计缺陷提报人次（缺陷总数）
                const defectReportCount = task.defects.length;

                // 统计缺陷提报人数（去重用户数）
                const uniqueDefectUsers = new Set(
                    task.defects.map((d) => d.userId)
                );
                const defectReportPeople = uniqueDefectUsers.size;

                // 统计有效缺陷数（状态为APPROVED）
                const validDefectCount = task.defects.filter(
                    (d) => d.status === 'APPROVED'
                ).length;

                // 奖励积分数（使用任务总预算）
                const rewardPoints = Math.round(task.totalBudget || 0);

                // 每缺陷奖励积分
                const pointsPerDefect =
                    validDefectCount > 0
                        ? Math.round(rewardPoints / validDefectCount)
                        : 0;

                // 用户参测率（提报缺陷人数 / 任务领取人数）
                const participationRate =
                    taskAcceptancePeople > 0
                        ? Math.round(
                              (defectReportPeople / taskAcceptancePeople) *
                                  10000
                          ) / 100
                        : 0;

                // 有效反馈率（有效缺陷数 / 缺陷提报人次）
                const validFeedbackRate =
                    defectReportCount > 0
                        ? Math.round(
                              (validDefectCount / defectReportCount) * 10000
                          ) / 100
                        : 0;

                return {
                    id: task.id,
                    taskName: task.title,
                    taskAcceptanceCount,
                    taskAcceptancePeople,
                    defectReportCount,
                    defectReportPeople,
                    validDefectCount,
                    rewardPoints,
                    pointsPerDefect,
                    participationRate,
                    validFeedbackRate,
                };
            });

            return {
                data: formattedItems,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 导出任务统计数据
    exportTaskStatistics: protectedProcedure
        .input(
            z.object({
                taskName: z.string().optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { taskName, startDate, endDate } = input;

            // 构建查询条件
            const where: any = {
                isDeleted: false,
            };

            if (taskName) {
                where.title = {
                    contains: taskName,
                    mode: 'insensitive',
                };
            }

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate + 'T00:00:00');
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59');
                }
            }

            // 查询所有任务（不分页）
            const tasks = await ctx.db.testTask.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    orders: {
                        where: {
                            startedAt: {
                                not: null,
                            },
                        },
                        select: {
                            id: true,
                            userId: true,
                            startedAt: true,
                        },
                    },
                    defects: {
                        select: {
                            id: true,
                            userId: true,
                            status: true,
                        },
                    },
                },
            });

            // 格式化返回数据
            return tasks.map((task, index) => {
                const taskAcceptanceCount = task.orders.length;
                const uniqueUsers = new Set(task.orders.map((o) => o.userId));
                const taskAcceptancePeople = uniqueUsers.size;
                const defectReportCount = task.defects.length;
                const uniqueDefectUsers = new Set(
                    task.defects.map((d) => d.userId)
                );
                const defectReportPeople = uniqueDefectUsers.size;
                const validDefectCount = task.defects.filter(
                    (d) => d.status === 'APPROVED'
                ).length;
                const rewardPoints = Math.round(task.totalBudget || 0);
                const pointsPerDefect =
                    validDefectCount > 0
                        ? Math.round(rewardPoints / validDefectCount)
                        : 0;
                const participationRate =
                    taskAcceptancePeople > 0
                        ? Math.round(
                              (defectReportPeople / taskAcceptancePeople) *
                                  10000
                          ) / 100
                        : 0;
                const validFeedbackRate =
                    defectReportCount > 0
                        ? Math.round(
                              (validDefectCount / defectReportCount) * 10000
                          ) / 100
                        : 0;

                return {
                    序号: index + 1,
                    任务名称: task.title,
                    任务领取人次: taskAcceptanceCount,
                    任务领取人数: taskAcceptancePeople,
                    缺陷提报人次: defectReportCount,
                    缺陷提报人数: defectReportPeople,
                    提报有效缺陷数: validDefectCount,
                    奖励积分数: rewardPoints,
                    每缺陷奖励积分: pointsPerDefect,
                    用户参测率: `${participationRate}%`,
                    有效反馈率: `${validFeedbackRate}%`,
                };
            });
        }),

    // 获取所有任务名称列表（用于筛选下拉框）
    getAllTaskNames: protectedProcedure.query(async ({ ctx }) => {
        const tasks = await ctx.db.testTask.findMany({
            where: {
                isDeleted: false,
            },
            select: {
                id: true,
                title: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return tasks.map((task) => ({
            id: task.id,
            name: task.title,
        }));
    }),

    // 获取整体统计数据
    getOverallStatistics: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            // 构建日期筛选条件
            const dateFilter: any = {};
            if (startDate || endDate) {
                if (startDate) {
                    dateFilter.gte = new Date(startDate + 'T00:00:00');
                }
                if (endDate) {
                    dateFilter.lte = new Date(endDate + 'T23:59:59');
                }
            }

            // 获取参测率和反馈率数据（复用已有的接口逻辑）
            const participationStats = await ctx.db.$transaction(async (tx) => {
                // 获取领取任务的用户数
                const usersWithOrders = await tx.user.count({
                    where:
                        dateFilter.gte || dateFilter.lte
                            ? {
                                  taskOrders: {
                                      some: {
                                          startedAt: {
                                              gte: dateFilter.gte,
                                              lte: dateFilter.lte,
                                          },
                                      },
                                  },
                              }
                            : {
                                  taskOrders: {
                                      some: {},
                                  },
                              },
                });

                // 获取提交了缺陷的用户数
                const usersWithDefects = await tx.user.count({
                    where:
                        dateFilter.gte || dateFilter.lte
                            ? {
                                  taskOrders: {
                                      some: {
                                          startedAt: {
                                              gte: dateFilter.gte,
                                              lte: dateFilter.lte,
                                          },
                                      },
                                  },
                                  defects: {
                                      some: {},
                                  },
                              }
                            : {
                                  taskOrders: {
                                      some: {},
                                  },
                                  defects: {
                                      some: {},
                                  },
                              },
                });

                // 获取总缺陷数
                const totalDefects = await tx.defect.count({
                    where:
                        dateFilter.gte || dateFilter.lte
                            ? {
                                  createdAt: {
                                      gte: dateFilter.gte,
                                      lte: dateFilter.lte,
                                  },
                              }
                            : {},
                });

                // 获取有效缺陷数
                const validDefects = await tx.defect.count({
                    where:
                        dateFilter.gte || dateFilter.lte
                            ? {
                                  status: 'APPROVED',
                                  createdAt: {
                                      gte: dateFilter.gte,
                                      lte: dateFilter.lte,
                                  },
                              }
                            : {
                                  status: 'APPROVED',
                              },
                });

                return {
                    usersWithOrders,
                    usersWithDefects,
                    totalDefects,
                    validDefects,
                };
            });

            // 计算参测率和反馈率
            const participationRate =
                participationStats.usersWithOrders > 0
                    ? Math.round(
                          (participationStats.usersWithDefects /
                              participationStats.usersWithOrders) *
                              10000
                      ) / 100
                    : 0;

            const validFeedbackRate =
                participationStats.totalDefects > 0
                    ? Math.round(
                          (participationStats.validDefects /
                              participationStats.totalDefects) *
                              10000
                      ) / 100
                    : 0;

            // 计算留存用户人数（定义：在指定时间范围内有活动的用户）
            const retentionUsers = await ctx.db.user.count({
                where:
                    dateFilter.gte || dateFilter.lte
                        ? {
                              isDeleted: false,
                              updatedAt: {
                                  gte: dateFilter.gte,
                                  lte: dateFilter.lte,
                              },
                          }
                        : {
                              isDeleted: false,
                          },
            });

            // 获取用户成长情况（按等级统计）
            const userGrowth = await ctx.db.user.groupBy({
                by: ['testingLevel'],
                where: {
                    isDeleted: false,
                },
                _count: true,
            });

            // 定义等级顺序和中文名称
            const levelOrder = [
                'LEVEL_1',
                'LEVEL_2',
                'LEVEL_3',
                'LEVEL_4',
                'LEVEL_5',
            ];
            const levelNames: Record<string, string> = {
                LEVEL_1: '入门',
                LEVEL_2: '铜牌',
                LEVEL_3: '银牌',
                LEVEL_4: '金牌',
                LEVEL_5: '钻石',
            };

            // 格式化用户成长数据
            const formattedUserGrowth = levelOrder.map((level) => {
                const data = userGrowth.find(
                    (item) => item.testingLevel === level
                );
                return {
                    level: levelNames[level] || level,
                    count: data?._count || 0,
                };
            });

            return {
                participationRate,
                validFeedbackRate,
                retentionUsers,
                userGrowth: formattedUserGrowth,
            };
        }),

    // 导出整体统计数据
    exportOverallStatistics: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            // 构建日期筛选条件
            const dateFilter: any = {};
            if (startDate || endDate) {
                if (startDate) {
                    dateFilter.gte = new Date(startDate + 'T00:00:00');
                }
                if (endDate) {
                    dateFilter.lte = new Date(endDate + 'T23:59:59');
                }
            }

            // 获取参测率和反馈率数据
            const participationStats = await ctx.db.$transaction(async (tx) => {
                const usersWithOrders = await tx.user.count({
                    where:
                        dateFilter.gte || dateFilter.lte
                            ? {
                                  taskOrders: {
                                      some: {
                                          startedAt: {
                                              gte: dateFilter.gte,
                                              lte: dateFilter.lte,
                                          },
                                      },
                                  },
                              }
                            : {
                                  taskOrders: {
                                      some: {},
                                  },
                              },
                });

                const usersWithDefects = await tx.user.count({
                    where:
                        dateFilter.gte || dateFilter.lte
                            ? {
                                  taskOrders: {
                                      some: {
                                          startedAt: {
                                              gte: dateFilter.gte,
                                              lte: dateFilter.lte,
                                          },
                                      },
                                  },
                                  defects: {
                                      some: {},
                                  },
                              }
                            : {
                                  taskOrders: {
                                      some: {},
                                  },
                                  defects: {
                                      some: {},
                                  },
                              },
                });

                const totalDefects = await tx.defect.count({
                    where:
                        dateFilter.gte || dateFilter.lte
                            ? {
                                  createdAt: {
                                      gte: dateFilter.gte,
                                      lte: dateFilter.lte,
                                  },
                              }
                            : {},
                });

                const validDefects = await tx.defect.count({
                    where:
                        dateFilter.gte || dateFilter.lte
                            ? {
                                  status: 'APPROVED',
                                  createdAt: {
                                      gte: dateFilter.gte,
                                      lte: dateFilter.lte,
                                  },
                              }
                            : {
                                  status: 'APPROVED',
                              },
                });

                return {
                    usersWithOrders,
                    usersWithDefects,
                    totalDefects,
                    validDefects,
                };
            });

            const participationRate =
                participationStats.usersWithOrders > 0
                    ? Math.round(
                          (participationStats.usersWithDefects /
                              participationStats.usersWithOrders) *
                              10000
                      ) / 100
                    : 0;

            const validFeedbackRate =
                participationStats.totalDefects > 0
                    ? Math.round(
                          (participationStats.validDefects /
                              participationStats.totalDefects) *
                              10000
                      ) / 100
                    : 0;

            const retentionUsers = await ctx.db.user.count({
                where:
                    dateFilter.gte || dateFilter.lte
                        ? {
                              isDeleted: false,
                              updatedAt: {
                                  gte: dateFilter.gte,
                                  lte: dateFilter.lte,
                              },
                          }
                        : {
                              isDeleted: false,
                          },
            });

            const userGrowth = await ctx.db.user.groupBy({
                by: ['testingLevel'],
                where: {
                    isDeleted: false,
                },
                _count: true,
            });

            const levelOrder = [
                'LEVEL_1',
                'LEVEL_2',
                'LEVEL_3',
                'LEVEL_4',
                'LEVEL_5',
            ];
            const levelNames: Record<string, string> = {
                LEVEL_1: '入门',
                LEVEL_2: '铜牌',
                LEVEL_3: '银牌',
                LEVEL_4: '金牌',
                LEVEL_5: '钻石',
            };

            const formattedUserGrowth = levelOrder.map((level) => {
                const data = userGrowth.find(
                    (item) => item.testingLevel === level
                );
                return {
                    等级: levelNames[level] || level,
                    用户数: data?._count || 0,
                };
            });

            return [
                {
                    指标: '用户参测率',
                    数值: `${participationRate}%`,
                },
                {
                    指标: '有效反馈率',
                    数值: `${validFeedbackRate}%`,
                },
                {
                    指标: '留存用户人数',
                    数值: retentionUsers,
                },
                {
                    指标: '用户成长情况',
                    数值: '',
                },
                ...formattedUserGrowth,
            ];
        }),

    // 获取用户明细列表
    getUserDetails: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, startDate, endDate } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {
                isDeleted: false,
            };

            // 日期范围筛选（基于注册时间）
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate + 'T00:00:00');
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59');
                }
            }

            // 查询总数
            const total = await ctx.db.user.count({ where });

            // 查询用户列表
            const users = await ctx.db.user.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    taskOrders: {
                        select: {
                            id: true,
                        },
                    },
                    defects: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            // 格式化返回数据
            const formattedItems = users.map((user) => {
                // 检查资料是否完善（有姓名、手机号、机构）
                const profileComplete = !!(
                    user.name &&
                    user.phone &&
                    user.organization
                );

                // 格式化时间为 YYYY-MM-DD HH:mm:ss
                const formatDateTime = (date: Date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    const seconds = String(date.getSeconds()).padStart(2, '0');
                    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                };

                // 最后登录时间
                const lastLoginTime = (user as any).lastLoginAt
                    ? formatDateTime((user as any).lastLoginAt)
                    : '从未登录';

                return {
                    id: user.id,
                    name: user.name || '未设置',
                    registrationTime: formatDateTime(user.createdAt),
                    lastLoginTime,
                    profileComplete: profileComplete ? '是' : '否',
                    projectCount: user.taskOrders.length,
                    defectSuggestionCount: user.defects.length,
                    totalPoints: user.totalPoints,
                    availablePoints: user.availablePoints,
                };
            });

            return {
                data: formattedItems,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 导出用户明细数据
    exportUserDetails: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            // 构建查询条件
            const where: any = {
                isDeleted: false,
            };

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate + 'T00:00:00');
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59');
                }
            }

            // 查询所有用户（不分页）
            const users = await ctx.db.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    taskOrders: {
                        select: {
                            id: true,
                        },
                    },
                    defects: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            // 格式化返回数据
            const formattedData = users.map((user, index) => {
                const profileComplete = !!(
                    user.name &&
                    user.phone &&
                    user.organization
                );

                // 最后登录时间
                const lastLoginTime = (user as any).lastLoginAt
                    ? (user as any).lastLoginAt.toLocaleString('zh-CN')
                    : '从未登录';

                return {
                    序号: index + 1,
                    姓名: user.name || '未设置',
                    注册时间: user.createdAt.toLocaleString('zh-CN'),
                    最后登录时间: lastLoginTime,
                    资料是否完善: profileComplete ? '是' : '否',
                    参与项目数: user.taskOrders.length,
                    '缺陷/建议数': user.defects.length,
                    总积分: user.totalPoints,
                    可用积分: user.availablePoints,
                };
            });

            return formattedData;
        }),

    // 获取任务明细列表
    getTaskDetails: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, startDate, endDate } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {
                isDeleted: false,
            };

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate + 'T00:00:00');
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59');
                }
            }

            // 统计总数
            const total = await ctx.db.testTask.count({ where });

            // 查询任务列表
            const tasks = await ctx.db.testTask.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    testCases: {
                        select: {
                            id: true,
                        },
                    },
                    orders: {
                        select: {
                            id: true,
                        },
                    },
                    defects: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            // 格式化时间
            const formatDateTime = (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            };

            // 格式化返回数据
            const formattedItems = tasks.map((task) => {
                return {
                    id: task.id,
                    taskNumber: task.id,
                    taskName: task.title,
                    publishTime: formatDateTime(task.createdAt),
                    caseCount: task.testCases.length,
                    participantCount: task.orders.length,
                    defectSuggestionCount: task.defects.length,
                    points: task.totalBudget || 0,
                };
            });

            return {
                data: formattedItems,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 导出任务明细数据
    exportTaskDetails: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            // 构建查询条件
            const where: any = {
                isDeleted: false,
            };

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate + 'T00:00:00');
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59');
                }
            }

            // 查询所有任务（不分页）
            const tasks = await ctx.db.testTask.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    testCases: {
                        select: {
                            id: true,
                        },
                    },
                    orders: {
                        select: {
                            id: true,
                        },
                    },
                    defects: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            // 格式化返回数据
            const formattedData = tasks.map((task, index) => {
                return {
                    序号: index + 1,
                    任务编号: task.id,
                    任务名称: task.title,
                    发布时间: task.createdAt.toLocaleString('zh-CN'),
                    用例数量: task.testCases.length,
                    参测人数: task.orders.length,
                    '缺陷/建议': task.defects.length,
                    积分: task.totalBudget || 0,
                };
            });

            return formattedData;
        }),

    // 获取订单明细数据
    getOrderDetails: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, startDate, endDate } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {};

            // 日期范围筛选（领取时间）
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate + 'T00:00:00');
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59');
                }
            }

            // 统计总数
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
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    defects: {
                        select: {
                            severity: true,
                        },
                    },
                },
            });

            // 格式化时间
            const formatDateTime = (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            };

            // 格式化返回数据
            const formattedItems = orders.map((order) => {
                // 统计各严重程度的缺陷数量
                const criticalCount = order.defects.filter(
                    (d) => d.severity === 'CRITICAL'
                ).length;
                const majorCount = order.defects.filter(
                    (d) => d.severity === 'MAJOR'
                ).length;
                const minorCount = order.defects.filter(
                    (d) => d.severity === 'MINOR'
                ).length;
                const trivialCount = order.defects.filter(
                    (d) => d.severity === 'TRIVIAL'
                ).length;

                return {
                    id: order.id,
                    name: order.user.name || '',
                    organization: order.user.organization || '',
                    phone: order.user.phone || '',
                    receiveTime: formatDateTime(order.createdAt),
                    defectSuggestionCount: order.defects.length,
                    critical: criticalCount,
                    severe: majorCount,
                    general1: minorCount,
                    general2: trivialCount,
                };
            });

            return {
                data: formattedItems,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 导出订单明细数据
    exportOrderDetails: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            // 构建查询条件
            const where: any = {};

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate + 'T00:00:00');
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59');
                }
            }

            // 查询所有订单（不分页）
            const orders = await ctx.db.testTaskOrder.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    defects: {
                        select: {
                            severity: true,
                        },
                    },
                },
            });

            // 格式化返回数据
            const formattedData = orders.map((order, index) => {
                // 统计各严重程度的缺陷数量
                const criticalCount = order.defects.filter(
                    (d) => d.severity === 'CRITICAL'
                ).length;
                const majorCount = order.defects.filter(
                    (d) => d.severity === 'MAJOR'
                ).length;
                const minorCount = order.defects.filter(
                    (d) => d.severity === 'MINOR'
                ).length;
                const trivialCount = order.defects.filter(
                    (d) => d.severity === 'TRIVIAL'
                ).length;

                return {
                    序号: index + 1,
                    姓名: order.user.name || '',
                    所属机构: order.user.organization || '',
                    手机号: order.user.phone || '',
                    领取时间: order.createdAt.toLocaleString('zh-CN'),
                    '提交问题/建议数': order.defects.length,
                    致命: criticalCount,
                    严重: majorCount,
                    一般1: minorCount,
                    一般2: trivialCount,
                };
            });

            return formattedData;
        }),

    // 获取积分明细列表
    getPointsDetails: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(15),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, startDate, endDate } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {};

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取总数
            const total = await ctx.db.pointTransaction.count({ where });

            // 获取积分交易记录列表
            const transactions = await ctx.db.pointTransaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
                select: {
                    id: true,
                    points: true,
                    type: true,
                    description: true,
                    createdAt: true,
                    userId: true,
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    relatedId: true,
                },
            });

            // 获取所有关联的奖励信息
            const rewardIds = transactions
                .filter((t) => t.relatedId)
                .map((t) => t.relatedId!)
                .filter((id) => id);

            const rewards = await ctx.db.reward.findMany({
                where: {
                    id: {
                        in: rewardIds,
                    },
                },
                select: {
                    id: true,
                    taskId: true,
                    task: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            });

            // 构建奖励映射
            const rewardMap = new Map<string, any>(
                rewards.map((r) => [r.id, r])
            );

            // 获积分类型映射
            const getPointsTypeLabel = (
                type: string,
                description: string
            ): string => {
                const typeMap: Record<string, string> = {
                    EARN: '积分获取',
                    REDEEM: '积分兑换',
                    WITHDRAW: '提现',
                };
                return description || typeMap[type] || type;
            };

            // 格式化返回数据
            return {
                data: transactions.map((transaction, index) => {
                    const reward = transaction.relatedId
                        ? rewardMap.get(transaction.relatedId)
                        : null;
                    return {
                        id: skip + index + 1,
                        userName: transaction.user?.name || '未设置',
                        organization:
                            transaction.user?.organization || '未设置',
                        phone: transaction.user?.phone || '未设置',
                        taskNumber: reward?.task?.id || '无',
                        taskName: reward?.task?.title || '无',
                        pointsAmount: Math.abs(transaction.points),
                        pointsType: getPointsTypeLabel(
                            transaction.type,
                            transaction.description || ''
                        ),
                        earnTime: transaction.createdAt.toLocaleString(
                            'zh-CN',
                            {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false,
                            }
                        ),
                    };
                }),
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 导出积分明细数据
    exportPointsDetails: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            // 构建查询条件
            const where: any = {};

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取所有积分交易记录（不分页）
            const transactions = await ctx.db.pointTransaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    points: true,
                    type: true,
                    description: true,
                    createdAt: true,
                    userId: true,
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    relatedId: true,
                },
            });

            // 获取所有关联的奖励信息
            const rewardIds = transactions
                .filter((t) => t.relatedId)
                .map((t) => t.relatedId!)
                .filter((id) => id);

            const rewards = await ctx.db.reward.findMany({
                where: {
                    id: {
                        in: rewardIds,
                    },
                },
                select: {
                    id: true,
                    taskId: true,
                    task: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            });

            // 构建奖励映射
            const rewardMap = new Map<string, any>(
                rewards.map((r) => [r.id, r])
            );

            // 获积分类型映射
            const getPointsTypeLabel = (
                type: string,
                description: string
            ): string => {
                const typeMap: Record<string, string> = {
                    EARN: '积分获取',
                    REDEEM: '积分兑换',
                    WITHDRAW: '提现',
                };
                return description || typeMap[type] || type;
            };

            // 格式化导出数据
            return transactions.map((transaction, index) => {
                const reward = transaction.relatedId
                    ? rewardMap.get(transaction.relatedId)
                    : null;
                return {
                    序号: index + 1,
                    姓名: transaction.user?.name || '未设置',
                    所属机构: transaction.user?.organization || '未设置',
                    手机号: transaction.user?.phone || '未设置',
                    任务编号: reward?.task?.id || '无',
                    任务名称: reward?.task?.title || '无',
                    积分: Math.abs(transaction.points),
                    积分奖励类型: getPointsTypeLabel(
                        transaction.type,
                        transaction.description || ''
                    ),
                    发放时间: transaction.createdAt.toLocaleString('zh-CN'),
                };
            });
        }),

    // 获取积分兑换明细数据
    getPointsExchangeDetails: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(15),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, startDate, endDate } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件 - 只查询积分兑换类型
            const where: any = {
                type: 'REDEEM',
            };

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取总数
            const total = await ctx.db.pointTransaction.count({ where });

            // 获取积分兑换交易记录
            const transactions = await ctx.db.pointTransaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
                select: {
                    id: true,
                    points: true,
                    type: true,
                    description: true,
                    status: true,
                    createdAt: true,
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                },
            });

            // 格式化返回数据
            return {
                data: transactions.map((transaction, index) => ({
                    id: skip + index + 1,
                    userName: transaction.user?.name || '未设置',
                    organization: transaction.user?.organization || '未设置',
                    phone: transaction.user?.phone || '未设置',
                    pointsUsed: Math.abs(transaction.points),
                    exchangeTime: transaction.createdAt.toLocaleString(
                        'zh-CN',
                        {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false,
                        }
                    ),
                    exchangeStatus:
                        transaction.status === 'COMPLETED'
                            ? '已完成'
                            : transaction.status === 'PENDING'
                              ? '处理中'
                              : transaction.status === 'FAILED'
                                ? '失败'
                                : transaction.status,
                })),
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 导出积分兑换明细数据
    exportPointsExchangeDetails: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { startDate, endDate } = input;

            // 构建查询条件 - 只查询积分兑换类型
            const where: any = {
                type: 'REDEEM',
            };

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取所有积分兑换交易记录（不分页）
            const transactions = await ctx.db.pointTransaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    points: true,
                    type: true,
                    description: true,
                    status: true,
                    createdAt: true,
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                },
            });

            // 格式化导出数据
            return transactions.map((transaction, index) => ({
                序号: index + 1,
                姓名: transaction.user?.name || '未设置',
                所属机构: transaction.user?.organization || '未设置',
                手机号: transaction.user?.phone || '未设置',
                使用积分: Math.abs(transaction.points),
                兑换时间: transaction.createdAt.toLocaleString('zh-CN'),
                兑换状态:
                    transaction.status === 'COMPLETED'
                        ? '已完成'
                        : transaction.status === 'PENDING'
                          ? '处理中'
                          : transaction.status === 'FAILED'
                            ? '失败'
                            : transaction.status,
            }));
        }),

    // 获取邀请有奖明细数据
    getInvitationRewardDetails: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(15),
                activityId: z.string().optional(),
                inviterKeyword: z.string().optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const {
                page,
                pageSize,
                activityId,
                inviterKeyword,
                startDate,
                endDate,
            } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {};

            // 活动筛选
            if (activityId) {
                where.rewardId = activityId;
            }

            // 推荐人关键词筛选（姓名或手机号）
            if (inviterKeyword) {
                where.inviter = {
                    OR: [
                        { name: { contains: inviterKeyword } },
                        { phone: { contains: inviterKeyword } },
                    ],
                };
            }

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取总数
            const total = await ctx.db.invitationRecord.count({ where });

            // 获取邀请记录列表
            const records = await ctx.db.invitationRecord.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
                include: {
                    inviter: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    invitee: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    invitationReward: {
                        select: {
                            title: true,
                        },
                    },
                },
            });

            // 格式化返回数据
            return {
                data: records.map((record, index) => ({
                    id: skip + index + 1,
                    inviterName: record.inviter?.name || '未设置',
                    inviterOrganization:
                        record.inviter?.organization || '未设置',
                    inviterPhone: record.inviter?.phone || '未设置',
                    inviteeName: record.invitee?.name || '未设置',
                    inviteeOrganization:
                        record.invitee?.organization || '未设置',
                    inviteePhone: record.invitee?.phone || '未设置',
                    activityName: record.invitationReward?.title || '未设置',
                    inviteeAcceptedTask: record.inviteeAcceptedTask
                        ? '是'
                        : '否',
                    inviteeSubmittedDefects: record.inviteeSubmittedDefects
                        ? '是'
                        : '否',
                })),
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 导出邀请有奖明细数据
    exportInvitationRewardDetails: protectedProcedure
        .input(
            z.object({
                activityId: z.string().optional(),
                inviterKeyword: z.string().optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { activityId, inviterKeyword, startDate, endDate } = input;

            // 构建查询条件
            const where: any = {};

            // 活动筛选
            if (activityId) {
                where.rewardId = activityId;
            }

            // 推荐人关键词筛选
            if (inviterKeyword) {
                where.inviter = {
                    OR: [
                        { name: { contains: inviterKeyword } },
                        { phone: { contains: inviterKeyword } },
                    ],
                };
            }

            // 日期范围筛选
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
                }
            }

            // 获取所有邀请记录（不分页）
            const records = await ctx.db.invitationRecord.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    inviter: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    invitee: {
                        select: {
                            name: true,
                            phone: true,
                            organization: true,
                        },
                    },
                    invitationReward: {
                        select: {
                            title: true,
                        },
                    },
                },
            });

            // 格式化导出数据
            return records.map((record, index) => ({
                序号: index + 1,
                推荐人姓名: record.inviter?.name || '未设置',
                推荐人所属机构: record.inviter?.organization || '未设置',
                推荐人手机号: record.inviter?.phone || '未设置',
                被推荐人姓名: record.invitee?.name || '未设置',
                被推荐人所属机构: record.invitee?.organization || '未设置',
                被推荐人手机号: record.invitee?.phone || '未设置',
                活动名称: record.invitationReward?.title || '未设置',
                被推荐人是否领取任务: record.inviteeAcceptedTask ? '是' : '否',
                被推荐人是否提报有效缺陷: record.inviteeSubmittedDefects
                    ? '是'
                    : '否',
            }));
        }),

    // 获取邀请有奖活动列表
    getInvitationActivities: protectedProcedure.query(async ({ ctx }) => {
        const activities = await ctx.db.invitationReward.findMany({
            where: {
                isActive: true,
            },
            orderBy: { sequence: 'desc' },
            select: {
                id: true,
                title: true,
            },
        });

        return activities;
    }),
});
