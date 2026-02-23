import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

export const slidingTabRouter = createTRPCRouter({
    // 分页查询滑动标签管理列表
    list: publicProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where = {};

            // 获取总数
            const total = await ctx.db.slidingTab.count({ where });

            // 获取分页数据，按sequence排序
            const data = await ctx.db.slidingTab.findMany({
                where,
                orderBy: [{ sequence: 'asc' }],
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

    // 获取所有滑动标签（不分页，用于前台展示）
    getAll: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.slidingTab.findMany({
            where: {},
            orderBy: [{ sequence: 'asc' }],
        });
    }),

    // 根据ID获取单个滑动标签
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const slidingTab = await ctx.db.slidingTab.findUnique({
                where: { id: input.id },
            });

            if (!slidingTab) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '滑动标签不存在',
                });
            }

            return slidingTab;
        }),

    // 新增滑动标签
    create: protectedProcedure
        .input(
            z.object({
                image: z.string().min(1, '图片URL不能为空'),
                text: z.string().min(1, '标签文字不能为空'),
                link: z.string().min(1, '链接URL不能为空'),
                channels: z.array(z.string()).min(1, '至少选择一个渠道'),
                sequence: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 如果没有指定序号，自动计算下一个序号
            let sequence = input.sequence;
            if (sequence === undefined) {
                // 查找当前最大的序号
                const maxSequenceTab = await ctx.db.slidingTab.findFirst({
                    orderBy: { sequence: 'desc' },
                    select: { sequence: true },
                });
                // 如果没有标签，从1开始；否则最大序号+1
                sequence = (maxSequenceTab?.sequence ?? 0) + 1;
            }

            const slidingTab = await ctx.db.slidingTab.create({
                data: {
                    image: input.image,
                    text: input.text,
                    link: input.link,
                    channels: input.channels,
                    sequence: sequence,
                },
            });

            return {
                success: true,
                message: '新增滑动标签成功',
                data: slidingTab,
            };
        }),

    // 更新滑动标签
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                image: z.string().min(1, '图片URL不能为空'),
                text: z.string().min(1, '标签文字不能为空'),
                link: z.string().min(1, '链接URL不能为空'),
                channels: z.array(z.string()).min(1, '至少选择一个渠道'),
                sequence: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, image, text, link, channels, sequence } = input;

            // 检查滑动标签是否存在
            const existingTab = await ctx.db.slidingTab.findUnique({
                where: { id },
            });

            if (!existingTab) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '滑动标签不存在',
                });
            }

            const slidingTab = await ctx.db.slidingTab.update({
                where: { id },
                data: {
                    image,
                    text,
                    link,
                    channels,
                    ...(sequence !== undefined && { sequence }),
                },
            });

            return {
                success: true,
                message: '更新滑动标签成功',
                data: slidingTab,
            };
        }),

    // 删除单个滑动标签
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 检查滑动标签是否存在
            const slidingTab = await ctx.db.slidingTab.findUnique({
                where: { id: input.id },
            });

            if (!slidingTab) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '滑动标签不存在',
                });
            }

            await ctx.db.slidingTab.delete({
                where: { id: input.id },
            });

            return {
                success: true,
                message: '删除滑动标签成功',
            };
        }),

    // 调整滑动标签序号 (上移)
    moveUp: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const slidingTab = await ctx.db.slidingTab.findUnique({
                where: { id: input.id },
            });

            if (!slidingTab) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '滑动标签不存在',
                });
            }

            // 找到上一个滑动标签（sequence比当前小的最大值）
            const previousTab = await ctx.db.slidingTab.findFirst({
                where: {
                    sequence: {
                        lt: slidingTab.sequence,
                    },
                },
                orderBy: {
                    sequence: 'desc',
                },
            });

            if (!previousTab) {
                return {
                    success: false,
                    message: '已经是第一条了',
                };
            }

            // 交换序号
            await ctx.db.$transaction([
                ctx.db.slidingTab.update({
                    where: { id: slidingTab.id },
                    data: { sequence: previousTab.sequence },
                }),
                ctx.db.slidingTab.update({
                    where: { id: previousTab.id },
                    data: { sequence: slidingTab.sequence },
                }),
            ]);

            return {
                success: true,
                message: '上移成功',
            };
        }),

    // 调整滑动标签序号 (下移)
    moveDown: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const slidingTab = await ctx.db.slidingTab.findUnique({
                where: { id: input.id },
            });

            if (!slidingTab) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '滑动标签不存在',
                });
            }

            // 找到下一个滑动标签（sequence比当前大的最小值）
            const nextTab = await ctx.db.slidingTab.findFirst({
                where: {
                    sequence: {
                        gt: slidingTab.sequence,
                    },
                },
                orderBy: {
                    sequence: 'asc',
                },
            });

            if (!nextTab) {
                return {
                    success: false,
                    message: '已经是最后一条了',
                };
            }

            // 交换序号
            await ctx.db.$transaction([
                ctx.db.slidingTab.update({
                    where: { id: slidingTab.id },
                    data: { sequence: nextTab.sequence },
                }),
                ctx.db.slidingTab.update({
                    where: { id: nextTab.id },
                    data: { sequence: slidingTab.sequence },
                }),
            ]);

            return {
                success: true,
                message: '下移成功',
            };
        }),
});