import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

export const testSystemRouter = createTRPCRouter({
    // 分页查询系统列表，支持按系统名称搜索
    list: publicProcedure
        .input(
            z.object({
                name: z.string().optional(), // 系统名称搜索
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
            })
        )
        .query(async ({ ctx, input }) => {
            const { name, page, pageSize } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where = {
                ...(name && {
                    name: {
                        contains: name,
                    },
                }),
            };

            // 获取总数
            const total = await ctx.db.testSystem.count({ where });

            // 获取分页数据
            const data = await ctx.db.testSystem.findMany({
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

    // 获取所有系统（不分页，用于下拉选择）
    getAll: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.testSystem.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
            },
        });
    }),

    // 根据ID获取单个系统
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const system = await ctx.db.testSystem.findUnique({
                where: { id: input.id },
            });

            if (!system) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '系统不存在',
                });
            }

            return system;
        }),

    // 新增系统
    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1, '系统名称不能为空').max(100, '系统名称不能超过100个字符'),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 检查系统名称是否已存在
            const existingSystem = await ctx.db.testSystem.findUnique({
                where: { name: input.name },
            });

            if (existingSystem) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: '系统名称已存在',
                });
            }

            const system = await ctx.db.testSystem.create({
                data: {
                    name: input.name,
                },
            });

            return {
                success: true,
                message: '新增系统成功',
                data: system,
            };
        }),

    // 更新系统
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1, '系统名称不能为空').max(100, '系统名称不能超过100个字符'),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, name } = input;

            // 检查系统是否存在
            const existingSystem = await ctx.db.testSystem.findUnique({
                where: { id },
            });

            if (!existingSystem) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '系统不存在',
                });
            }

            // 检查系统名称是否与其他系统重复
            const duplicateSystem = await ctx.db.testSystem.findFirst({
                where: {
                    name,
                    id: { not: id },
                },
            });

            if (duplicateSystem) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: '系统名称已存在',
                });
            }

            const system = await ctx.db.testSystem.update({
                where: { id },
                data: { name },
            });

            return {
                success: true,
                message: '更新系统成功',
                data: system,
            };
        }),

    // 删除单个系统
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 检查系统是否存在
            const system = await ctx.db.testSystem.findUnique({
                where: { id: input.id },
            });

            if (!system) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '系统不存在',
                });
            }

            await ctx.db.testSystem.delete({
                where: { id: input.id },
            });

            return {
                success: true,
                message: '删除系统成功',
            };
        }),

    // 批量删除系统
    deleteMany: protectedProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            if (input.ids.length === 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '请选择要删除的系统',
                });
            }

            const result = await ctx.db.testSystem.deleteMany({
                where: { id: { in: input.ids } },
            });

            return {
                success: true,
                message: `成功删除 ${result.count} 个系统`,
                count: result.count,
            };
        }),
});
