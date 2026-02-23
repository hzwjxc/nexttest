import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

export const carouselRouter = createTRPCRouter({
    // 分页查询轮播图管理列表
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
            const total = await ctx.db.carousel.count({ where });

            // 获取分页数据，按sequence排序，相同sequence按publishTime降序
            const data = await ctx.db.carousel.findMany({
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

    // 获取所有轮播图（不分页，用于前台展示）
    getAll: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.carousel.findMany({
            where: {},
            orderBy: [{ sequence: 'asc' }],
        });
    }),

    // 根据ID获取单个轮播图
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const carousel = await ctx.db.carousel.findUnique({
                where: { id: input.id },
            });

            if (!carousel) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '轮播图不存在',
                });
            }

            return carousel;
        }),

    // 新增轮播图
    create: protectedProcedure
        .input(
            z.object({
                image: z.string().min(1, '图片URL不能为空'),
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
                const maxSequenceCarousel = await ctx.db.carousel.findFirst({
                    orderBy: { sequence: 'desc' },
                    select: { sequence: true },
                });
                // 如果没有文章，从1开始；否则最大序号+1
                sequence = (maxSequenceCarousel?.sequence ?? 0) + 1;
            }

            const carousel = await ctx.db.carousel.create({
                data: {
                    image: input.image,
                    link: input.link,
                    channels: input.channels,
                    sequence: sequence,
                },
            });

            return {
                success: true,
                message: '新增轮播图成功',
                data: carousel,
            };
        }),

    // 更新轮播图
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                image: z.string().min(1, '图片URL不能为空'),
                link: z.string().min(1, '链接URL不能为空'),
                channels: z.array(z.string()).min(1, '至少选择一个渠道'),
                sequence: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, image, link, channels, sequence } = input;

            // 检查轮播图是否存在
            const existingCarousel = await ctx.db.carousel.findUnique({
                where: { id },
            });

            if (!existingCarousel) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '轮播图不存在',
                });
            }

            const carousel = await ctx.db.carousel.update({
                where: { id },
                data: {
                    image,
                    link,
                    channels,
                    ...(sequence !== undefined && { sequence }),
                },
            });

            return {
                success: true,
                message: '更新轮播图成功',
                data: carousel,
            };
        }),

    // 删除单个轮播图
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 检查轮播图是否存在
            const carousel = await ctx.db.carousel.findUnique({
                where: { id: input.id },
            });

            if (!carousel) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '轮播图不存在',
                });
            }

            await ctx.db.carousel.delete({
                where: { id: input.id },
            });

            return {
                success: true,
                message: '删除轮播图成功',
            };
        }),

    // 调整轮播图序号 (上移)
    moveUp: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const carousel = await ctx.db.carousel.findUnique({
                where: { id: input.id },
            });

            if (!carousel) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '轮播图不存在',
                });
            }

            // 找到上一个轮播图（sequence比当前小的最大值）
            const previousCarousel = await ctx.db.carousel.findFirst({
                where: {
                    sequence: {
                        lt: carousel.sequence,
                    },
                },
                orderBy: {
                    sequence: 'desc',
                },
            });

            if (!previousCarousel) {
                return {
                    success: false,
                    message: '已经是第一条了',
                };
            }

            // 交换序号
            await ctx.db.$transaction([
                ctx.db.carousel.update({
                    where: { id: carousel.id },
                    data: { sequence: previousCarousel.sequence },
                }),
                ctx.db.carousel.update({
                    where: { id: previousCarousel.id },
                    data: { sequence: carousel.sequence },
                }),
            ]);

            return {
                success: true,
                message: '上移成功',
            };
        }),

    // 调整轮播图序号 (下移)
    moveDown: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const carousel = await ctx.db.carousel.findUnique({
                where: { id: input.id },
            });

            if (!carousel) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '轮播图不存在',
                });
            }

            // 找到下一个轮播图（sequence比当前大的最小值）
            const nextCarousel = await ctx.db.carousel.findFirst({
                where: {
                    sequence: {
                        gt: carousel.sequence,
                    },
                },
                orderBy: {
                    sequence: 'asc',
                },
            });

            if (!nextCarousel) {
                return {
                    success: false,
                    message: '已经是最后一条了',
                };
            }

            // 交换序号
            await ctx.db.$transaction([
                ctx.db.carousel.update({
                    where: { id: carousel.id },
                    data: { sequence: nextCarousel.sequence },
                }),
                ctx.db.carousel.update({
                    where: { id: nextCarousel.id },
                    data: { sequence: carousel.sequence },
                }),
            ]);

            return {
                success: true,
                message: '下移成功',
            };
        }),
});
