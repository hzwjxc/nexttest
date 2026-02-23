import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

export const invitationRewardRouter = createTRPCRouter({
    // 分页查询邀请有奖列表
    list: publicProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
                isActive: z.boolean().optional(), // 是否开启
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, isActive } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {};
            
            if (isActive !== undefined) {
                where.isActive = isActive;
            }

            // 获取总数
            const total = await ctx.db.invitationReward.count({ where });

            // 获取分页数据，按sequence排序
            const data = await ctx.db.invitationReward.findMany({
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

    // 根据ID获取单个邀请有奖活动
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const invitationReward = await ctx.db.invitationReward.findUnique({
                where: { id: input.id },
            });

            if (!invitationReward) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '邀请有奖活动不存在',
                });
            }

            return invitationReward;
        }),

    // 新增邀请有奖活动
    create: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1, '活动标题不能为空'),
                system: z.string().min(1, '请选择系统'),
                personTags: z.array(z.string()).min(1, '请选择人员标签'),
                selectedTagIds: z.array(z.string()).optional(),
                expectedInviteCount: z.number().optional(),
                startTime: z.date(),
                endTime: z.date(),
                posterImage: z.string().min(1, '请上传海报图片'),
                isActive: z.boolean().default(true),
                sequence: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { title, system, personTags = [], selectedTagIds = [], expectedInviteCount = 0, startTime, endTime, posterImage, isActive, sequence } = input;

            // 验证时间
            if (startTime >= endTime) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '开始时间必须早于结束时间',
                });
            }

            // 如果没有指定序号，自动计算下一个序号
            let nextSequence = sequence;
            if (sequence === undefined) {
                const maxSequenceReward = await ctx.db.invitationReward.findFirst({
                    orderBy: { sequence: 'desc' },
                    select: { sequence: true },
                });
                nextSequence = (maxSequenceReward?.sequence ?? 0) + 1;
            }

            const invitationReward = await ctx.db.invitationReward.create({
                data: {
                    title,
                    system,
                    personTags,
                    selectedTagIds,
                    expectedInviteCount,
                    startTime,
                    endTime,
                    posterImage,
                    isActive,
                    sequence: nextSequence!,
                },
            });

            return {
                success: true,
                message: '新增邀请有奖活动成功',
                data: invitationReward,
            };
        }),

    // 更新邀请有奖活动
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string().min(1, '活动标题不能为空').optional(),
                system: z.string().min(1, '请选择系统').optional(),
                personTags: z.array(z.string()).optional(),
                selectedTagIds: z.array(z.string()).optional(),
                expectedInviteCount: z.number().optional(),
                startTime: z.date().optional(),
                endTime: z.date().optional(),
                posterImage: z.string().min(1, '请上传海报图片').optional(),
                isActive: z.boolean().optional(),
                sequence: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, personTags, selectedTagIds, expectedInviteCount, ...otherUpdateData } = input;

            // 检查邀请有奖活动是否存在
            const existingReward = await ctx.db.invitationReward.findUnique({
                where: { id },
            });

            if (!existingReward) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '邀请有奖活动不存在',
                });
            }

            // 验证时间
            const startTime = otherUpdateData.startTime || existingReward.startTime;
            const endTime = otherUpdateData.endTime || existingReward.endTime;
            if (startTime && endTime && startTime >= endTime) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '开始时间必须早于结束时间',
                });
            }

            // 构建更新数据对象
            const updateData: any = { ...otherUpdateData };
            if (personTags !== undefined) {
                updateData.personTags = personTags;
            }
            if (selectedTagIds !== undefined) {
                updateData.selectedTagIds = selectedTagIds;
            }
            if (expectedInviteCount !== undefined) {
                updateData.expectedInviteCount = expectedInviteCount;
            }

            const invitationReward = await ctx.db.invitationReward.update({
                where: { id },
                data: updateData,
            });

            return {
                success: true,
                message: '更新邀请有奖活动成功',
                data: invitationReward,
            };
        }),

    // 删除邀请有奖活动
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 检查邀请有奖活动是否存在
            const invitationReward = await ctx.db.invitationReward.findUnique({
                where: { id: input.id },
            });

            if (!invitationReward) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '邀请有奖活动不存在',
                });
            }

            await ctx.db.invitationReward.delete({
                where: { id: input.id },
            });

            return {
                success: true,
                message: '删除邀请有奖活动成功',
            };
        }),

    // 调整邀请有奖活动序号 (上移)
    moveUp: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { id } = input;
            
            const invitationReward = await ctx.db.invitationReward.findUnique({
                where: { id },
            });

            if (!invitationReward) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '邀请有奖活动不存在',
                });
            }

            // 找到上一个活动（sequence比当前小的最大值）
            const previousReward = await ctx.db.invitationReward.findFirst({
                where: {
                    sequence: {
                        lt: invitationReward.sequence,
                    },
                },
                orderBy: {
                    sequence: 'desc',
                },
            });

            if (!previousReward) {
                return {
                    success: false,
                    message: '已经是第一条了',
                };
            }

            // 交换序号
            await ctx.db.$transaction([
                ctx.db.invitationReward.update({
                    where: { id: invitationReward.id },
                    data: { sequence: previousReward.sequence },
                }),
                ctx.db.invitationReward.update({
                    where: { id: previousReward.id },
                    data: { sequence: invitationReward.sequence },
                }),
            ]);

            return {
                success: true,
                message: '上移成功',
            };
        }),

    // 调整邀请有奖活动序号 (下移)
    moveDown: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { id } = input;
            
            const invitationReward = await ctx.db.invitationReward.findUnique({
                where: { id },
            });

            if (!invitationReward) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '邀请有奖活动不存在',
                });
            }

            // 找到下一个活动（sequence比当前大的最小值）
            const nextReward = await ctx.db.invitationReward.findFirst({
                where: {
                    sequence: {
                        gt: invitationReward.sequence,
                    },
                },
                orderBy: {
                    sequence: 'asc',
                },
            });

            if (!nextReward) {
                return {
                    success: false,
                    message: '已经是最后一条了',
                };
            }

            // 交换序号
            await ctx.db.$transaction([
                ctx.db.invitationReward.update({
                    where: { id: invitationReward.id },
                    data: { sequence: nextReward.sequence },
                }),
                ctx.db.invitationReward.update({
                    where: { id: nextReward.id },
                    data: { sequence: invitationReward.sequence },
                }),
            ]);

            return {
                success: true,
                message: '下移成功',
            };
        }),

    // 启用/禁用邀请有奖活动
    toggleStatus: protectedProcedure
        .input(z.object({ id: z.string(), isActive: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const { id, isActive } = input;

            // 检查邀请有奖活动是否存在
            const invitationReward = await ctx.db.invitationReward.findUnique({
                where: { id },
            });

            if (!invitationReward) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '邀请有奖活动不存在',
                });
            }

            const updatedReward = await ctx.db.invitationReward.update({
                where: { id },
                data: { isActive },
            });

            return {
                success: true,
                message: `${isActive ? '启用' : '禁用'}邀请有奖活动成功`,
                data: updatedReward,
            };
        }),
});