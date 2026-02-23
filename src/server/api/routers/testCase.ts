import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

export const testCaseRouter = createTRPCRouter({
    // 分页查询用例列表，支持按用例名称和系统搜索
    list: publicProcedure
        .input(
            z.object({
                title: z.string().optional(), // 用例名称搜索
                system: z.string().optional(), // 系统筛选
                createdDate: z.string().optional(), // 创建日期筛选 (YYYY-MM-DD)
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
            })
        )
        .query(async ({ ctx, input }) => {
            const { title, system, createdDate, page, pageSize } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where = {
                isActive: true,
                ...(title && {
                    title: {
                        contains: title,
                    },
                }),
                ...(system && { system }),
                ...(createdDate && {
                    createdAt: {
                        gte: new Date(createdDate + 'T00:00:00.000Z'),
                        lt: new Date(
                            new Date(createdDate).getTime() + 24 * 60 * 60 * 1000
                        ),
                    },
                }),
            };

            // 获取总数
            const total = await ctx.db.testCase.count({ where });

            // 获取分页数据
            const data = await ctx.db.testCase.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            });

            return {
                data,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                },
            };
        }),

    // 根据ID获取单个用例
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const testCase = await ctx.db.testCase.findUnique({
                where: { id: input.id },
                include: {
                    testData: true,
                },
            });

            if (!testCase) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '用例不存在',
                });
            }

            return testCase;
        }),

    // 新增用例
    create: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1, '用例名称不能为空').max(200, '用例名称不能超过200个字符'),
                system: z.string().min(1, '所属系统不能为空'),
                precondition: z.string().optional(),
                testSteps: z.string().min(1, '测试步骤不能为空'), // JSON格式的字符串
                explanation: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 验证 testSteps 是否为有效 JSON
            try {
                JSON.parse(input.testSteps);
            } catch (e) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '测试步骤格式不正确',
                });
            }

            const testCase = await ctx.db.testCase.create({
                data: {
                    title: input.title,
                    system: input.system,
                    precondition: input.precondition,
                    testSteps: input.testSteps,
                    explanation: input.explanation,
                },
            });

            return {
                success: true,
                message: '新增用例成功',
                data: testCase,
            };
        }),

    // 更新用例
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string().min(1, '用例名称不能为空').max(200, '用例名称不能超过200个字符'),
                system: z.string().min(1, '所属系统不能为空'),
                precondition: z.string().optional(),
                testSteps: z.string().min(1, '测试步骤不能为空'),
                explanation: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            // 检查用例是否存在
            const existingCase = await ctx.db.testCase.findUnique({
                where: { id },
            });

            if (!existingCase) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '用例不存在',
                });
            }

            // 验证 testSteps 是否为有效 JSON
            try {
                JSON.parse(data.testSteps);
            } catch (e) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '测试步骤格式不正确',
                });
            }

            const testCase = await ctx.db.testCase.update({
                where: { id },
                data,
            });

            return {
                success: true,
                message: '更新用例成功',
                data: testCase,
            };
        }),

    // 删除单个用例
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 检查用例是否存在
            const testCase = await ctx.db.testCase.findUnique({
                where: { id: input.id },
            });

            if (!testCase) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '用例不存在',
                });
            }

            // 软删除：设置 isActive 为 false
            await ctx.db.testCase.update({
                where: { id: input.id },
                data: { isActive: false },
            });

            return {
                success: true,
                message: '删除用例成功',
            };
        }),

    // 批量删除用例
    deleteMany: protectedProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            if (input.ids.length === 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '请选择要删除的用例',
                });
            }

            // 软删除：设置 isActive 为 false
            const result = await ctx.db.testCase.updateMany({
                where: { id: { in: input.ids } },
                data: { isActive: false },
            });

            return {
                success: true,
                message: `成功删除 ${result.count} 个用例`,
                count: result.count,
            };
        }),

    // 保存用例附件
    saveAttachments: protectedProcedure
        .input(
            z.object({
                testCaseId: z.string(),
                attachments: z.array(z.string()), // 附件URL数组
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 检查用例是否存在
            const testCase = await ctx.db.testCase.findUnique({
                where: { id: input.testCaseId },
            });

            if (!testCase) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '用例不存在',
                });
            }

            // 更新附件
            const updated = await ctx.db.testCase.update({
                where: { id: input.testCaseId },
                data: {
                    attachments: input.attachments,
                },
            });

            return {
                success: true,
                message: '附件保存成功',
                data: updated,
            };
        }),

    // 获取用例附件
    getAttachments: publicProcedure
        .input(z.object({ testCaseId: z.string() }))
        .query(async ({ ctx, input }) => {
            const testCase = await ctx.db.testCase.findUnique({
                where: { id: input.testCaseId },
                select: {
                    id: true,
                    attachments: true,
                },
            });

            if (!testCase) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '用例不存在',
                });
            }

            return {
                success: true,
                data: testCase.attachments || [],
            };
        }),
});
