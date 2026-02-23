import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

export const homepagePopupRouter = createTRPCRouter({
    // 分页查询首页弹窗列表
    list: publicProcedure
        .input(
            z.object({
                type: z.string().optional(), // 弹窗类型 (IMAGE, TEXT)
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
                isActive: z.boolean().optional(), // 是否启用
            })
        )
        .query(async ({ ctx, input }) => {
            const { type, page, pageSize, isActive } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {};
            
            if (type) {
                where.type = type;
            }
            
            if (isActive !== undefined) {
                where.isActive = isActive;
            }

            // 获取总数
            const total = await ctx.db.homepagePopup.count({ where });

            // 获取分页数据，按sequence排序
            const data = await ctx.db.homepagePopup.findMany({
                where,
                orderBy: [{ sequence: 'asc' }, { createdAt: 'desc' }],
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

    // 获取所有启用的首页弹窗（用于前台展示）
    getAllActive: protectedProcedure
        .input(
            z.object({
                type: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const { type } = input;
            
            const where: any = {
                isActive: true,
                startTime: {
                    lte: new Date(),
                },
                endTime: {
                    gte: new Date(),
                }
            };
            
            if (type) {
                where.type = type;
            }

            // 获取所有启用且在时间范围内的弹窗
            const popups = await ctx.db.homepagePopup.findMany({
                where,
                orderBy: [{ sequence: 'asc' }, { createdAt: 'desc' }],
            });

            // 获取用户已读的弹窗ID列表
            const readRecords = await ctx.db.homepagePopupReadRecord.findMany({
                where: {
                    userId,
                    popupId: {
                        in: popups.map(p => p.id),
                    },
                },
                select: {
                    popupId: true,
                },
            });

            const readPopupIds = new Set(readRecords.map(r => r.popupId));

            // 只返回未读的弹窗
            return popups.filter(popup => !readPopupIds.has(popup.id));
        }),

    // 根据ID获取单个首页弹窗
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const homepagePopup = await ctx.db.homepagePopup.findUnique({
                where: { id: input.id },
            });

            if (!homepagePopup) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '首页弹窗不存在',
                });
            }

            return homepagePopup;
        }),

    // 新增首页弹窗
    create: protectedProcedure
        .input(
            z.object({
                type: z.string(), // IMAGE 或 TEXT
                title: z.string().min(1, '弹窗标题不能为空'),
                image: z.string().optional(), // 图片弹窗必填
                content: z.string().optional(), // 文字弹窗必填
                link: z.string().optional(),
                startTime: z.date(),
                endTime: z.date(),
                sequence: z.number().optional(),
                isActive: z.boolean().default(true),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { type, title, image, content, link, startTime, endTime, sequence, isActive } = input;

            // 验证必填字段
            if (type === 'IMAGE' && !image) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '图片弹窗必须上传图片',
                });
            }

            if (type === 'TEXT' && !content) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '文字弹窗必须填写内容摘要',
                });
            }

            // 验证时间
            if (startTime >= endTime) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '起始时间必须早于关闭时间',
                });
            }

            // 如果没有指定序号，自动计算下一个序号
            let nextSequence = sequence;
            if (sequence === undefined) {
                const maxSequencePopup = await ctx.db.homepagePopup.findFirst({
                    where: { type },
                    orderBy: { sequence: 'desc' },
                    select: { sequence: true },
                });
                nextSequence = (maxSequencePopup?.sequence ?? 0) + 1;
            }

            const homepagePopup = await ctx.db.homepagePopup.create({
                data: {
                    type,
                    title,
                    image: image || null,
                    content: content || null,
                    link: link || null,
                    startTime,
                    endTime,
                    sequence: nextSequence!,
                    isActive,
                },
            });

            return {
                success: true,
                message: '新增首页弹窗成功',
                data: homepagePopup,
            };
        }),

    // 更新首页弹窗
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                type: z.string().optional(),
                title: z.string().min(1, '弹窗标题不能为空').optional(),
                image: z.string().optional(),
                content: z.string().optional(),
                link: z.string().optional(),
                startTime: z.date().optional(),
                endTime: z.date().optional(),
                sequence: z.number().optional(),
                isActive: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...updateData } = input;

            // 检查首页弹窗是否存在
            const existingPopup = await ctx.db.homepagePopup.findUnique({
                where: { id },
            });

            if (!existingPopup) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '首页弹窗不存在',
                });
            }

            // 验证必填字段
            const popupType = updateData.type || existingPopup.type;
            if (popupType === 'IMAGE' && updateData.image === '') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '图片弹窗必须上传图片',
                });
            }

            if (popupType === 'TEXT' && updateData.content === '') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '文字弹窗必须填写内容摘要',
                });
            }

            // 验证时间
            const startTime = updateData.startTime || existingPopup.startTime;
            const endTime = updateData.endTime || existingPopup.endTime;
            if (startTime && endTime && startTime >= endTime) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '起始时间必须早于关闭时间',
                });
            }

            const homepagePopup = await ctx.db.homepagePopup.update({
                where: { id },
                data: {
                    ...updateData,
                    image: updateData.image !== undefined ? updateData.image || null : undefined,
                    content: updateData.content !== undefined ? updateData.content || null : undefined,
                    link: updateData.link !== undefined ? updateData.link || null : undefined,
                },
            });

            return {
                success: true,
                message: '更新首页弹窗成功',
                data: homepagePopup,
            };
        }),

    // 删除首页弹窗
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 检查首页弹窗是否存在
            const homepagePopup = await ctx.db.homepagePopup.findUnique({
                where: { id: input.id },
            });

            if (!homepagePopup) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '首页弹窗不存在',
                });
            }

            await ctx.db.homepagePopup.delete({
                where: { id: input.id },
            });

            return {
                success: true,
                message: '删除首页弹窗成功',
            };
        }),

    // 调整首页弹窗序号 (上移)
    moveUp: protectedProcedure
        .input(z.object({ id: z.string(), type: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { id, type } = input;
            
            const homepagePopup = await ctx.db.homepagePopup.findUnique({
                where: { id },
            });

            if (!homepagePopup) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '首页弹窗不存在',
                });
            }

            // 找到同类型的上一个弹窗（sequence比当前小的最大值）
            const previousPopup = await ctx.db.homepagePopup.findFirst({
                where: {
                    type,
                    sequence: {
                        lt: homepagePopup.sequence,
                    },
                },
                orderBy: {
                    sequence: 'desc',
                },
            });

            if (!previousPopup) {
                return {
                    success: false,
                    message: '已经是第一条了',
                };
            }

            // 交换序号
            await ctx.db.$transaction([
                ctx.db.homepagePopup.update({
                    where: { id: homepagePopup.id },
                    data: { sequence: previousPopup.sequence },
                }),
                ctx.db.homepagePopup.update({
                    where: { id: previousPopup.id },
                    data: { sequence: homepagePopup.sequence },
                }),
            ]);

            return {
                success: true,
                message: '上移成功',
            };
        }),

    // 调整首页弹窗序号 (下移)
    moveDown: protectedProcedure
        .input(z.object({ id: z.string(), type: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { id, type } = input;
            
            const homepagePopup = await ctx.db.homepagePopup.findUnique({
                where: { id },
            });

            if (!homepagePopup) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '首页弹窗不存在',
                });
            }

            // 找到同类型的下一个弹窗（sequence比当前大的最小值）
            const nextPopup = await ctx.db.homepagePopup.findFirst({
                where: {
                    type,
                    sequence: {
                        gt: homepagePopup.sequence,
                    },
                },
                orderBy: {
                    sequence: 'asc',
                },
            });

            if (!nextPopup) {
                return {
                    success: false,
                    message: '已经是最后一条了',
                };
            }

            // 交换序号
            await ctx.db.$transaction([
                ctx.db.homepagePopup.update({
                    where: { id: homepagePopup.id },
                    data: { sequence: nextPopup.sequence },
                }),
                ctx.db.homepagePopup.update({
                    where: { id: nextPopup.id },
                    data: { sequence: homepagePopup.sequence },
                }),
            ]);

            return {
                success: true,
                message: '下移成功',
            };
        }),

    // 启用/禁用首页弹窗
    toggleStatus: protectedProcedure
        .input(z.object({ id: z.string(), isActive: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const { id, isActive } = input;

            // 检查首页弹窗是否存在
            const homepagePopup = await ctx.db.homepagePopup.findUnique({
                where: { id },
            });

            if (!homepagePopup) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '首页弹窗不存在',
                });
            }

            const updatedPopup = await ctx.db.homepagePopup.update({
                where: { id },
                data: { isActive },
            });

            return {
                success: true,
                message: `${isActive ? '启用' : '禁用'}首页弹窗成功`,
                data: updatedPopup,
            };
        }),
});