import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

// 标签组类型
export const tagCategorySchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, '标签组名称不能为空'),
    type: z.string().optional(), // 标签组类型，如 '城市'、'等级' 等
    tags: z.array(z.string()).default([]), // 标签数组
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export const tagManagementRouter = createTRPCRouter({
    // 获取所有标签组
    list: publicProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
                name: z.string().optional(), // 可选的名称搜索
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, name } = input;
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
            const total = await ctx.db.testingTag.count({ where });

            // 获取分页数据
            const data = await ctx.db.testingTag.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
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

    // 获取所有标签组（不分页）
    getAll: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.testingTag.findMany({
            where: { isActive: true },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }),

    // 获取所有标签及其用户数量（用于任务发布）
    getAllWithUserCount: publicProcedure.query(async ({ ctx }) => {
        const tags = await ctx.db.testingTag.findMany({
            where: { isActive: true },
            include: {
                users: {
                    select: {
                        userId: true,
                        value: true,
                    }
                }, // 获取所有关联的用户标签
            },
            orderBy: {
                category: 'asc',
            },
        });

        // 按 category 分组，并解析 rules 字段
        const groupedTags = tags.reduce((acc, tag) => {
            if (!acc[tag.category]) {
                acc[tag.category] = [];
            }

            // 解析 rules 字段获取标签选项
            const tagOptions = tag.rules ? JSON.parse(tag.rules) as string[] : [];

            // 为每个标签选项统计用户数量
            tagOptions.forEach((option) => {
                const userIds = tag.users
                    .filter((userTag) => userTag.value === option)
                    .map((userTag) => userTag.userId);

                acc[tag.category].push({
                    id: `${tag.id}_${option}`, // 组合ID：标签组ID_选项值
                    tagId: tag.id, // 原始标签组ID
                    name: option, // 标签选项名称
                    value: option, // 标签选项值
                    category: tag.category,
                    description: tag.description,
                    userCount: userIds.length,
                    userIds: userIds, // 用户ID列表，用于去重
                });
            });

            return acc;
        }, {} as Record<string, Array<{
            id: string;
            tagId: string;
            name: string;
            value: string;
            category: string;
            description: string | null;
            userCount: number;
            userIds: string[];
        }>>);

        return groupedTags;
    }),

    // 根据标签选项获取用户清单
    getUsersByTags: publicProcedure
        .input(
            z.object({
                tagSelections: z.array(
                    z.object({
                        tagId: z.string(),
                        value: z.string(),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { tagSelections } = input;

            if (tagSelections.length === 0) {
                return [];
            }

            // 获取所有匹配的用户标签
            const userTags = await ctx.db.testingUserTag.findMany({
                where: {
                    OR: tagSelections.map((selection) => ({
                        tagId: selection.tagId,
                        value: selection.value,
                    })),
                },
                include: {
                    user: true,
                    tag: {
                        select: {
                            name: true,
                            category: true,
                        },
                    },
                },
            });

            // 按用户ID分组，收集每个用户的所有标签
            const userMap = new Map<
                string,
                {
                    id: string;
                    name: string | null;
                    phone: string | null;
                    oaId: string | null;
                    organization: string | null;
                    department: string | null;
                    subDepartment: string | null;
                    totalPoints: number;
                    availablePoints: number;
                    activityCount: number;
                    lastLoginIp: string | null;
                    createdAt: Date;
                    status: boolean;
                    tags: Array<{ category: string; name: string; value: string }>;
                }
            >();

            userTags.forEach((userTag) => {
                const userId = userTag.userId;
                if (!userMap.has(userId)) {
                    userMap.set(userId, {
                        id: userId,
                        name: userTag.user.name,
                        phone: userTag.user.phone,
                        oaId: userTag.user.oaId,
                        organization: userTag.user.organization,
                        department: userTag.user.department,
                        subDepartment: userTag.user.subDepartment,
                        totalPoints: userTag.user.totalPoints,
                        availablePoints: userTag.user.availablePoints,
                        activityCount: userTag.user.activityCount,
                        lastLoginIp: userTag.user.lastLoginIp,
                        createdAt: userTag.user.createdAt,
                        status: userTag.user.status,
                        tags: [],
                    });
                }

                const user = userMap.get(userId)!;
                user.tags.push({
                    category: userTag.tag.category,
                    name: userTag.tag.name,
                    value: userTag.value || '',
                });
            });

            return Array.from(userMap.values());
        }),

    // 根据ID获取单个标签组
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const tag = await ctx.db.testingTag.findUnique({
                where: { id: input.id },
            });

            if (!tag) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '标签组不存在',
                });
            }

            return tag;
        }),

    // 新增标签组
    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1, '标签组名称不能为空'),
                category: z.string().min(1, '标签分类不能为空'),
                description: z.string().optional(),
                rules: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 检查标签组名称是否已存在
            const existingTag = await ctx.db.testingTag.findUnique({
                where: { name: input.name },
            });

            if (existingTag) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: '标签组名称已存在',
                });
            }

            const tag = await ctx.db.testingTag.create({
                data: {
                    name: input.name,
                    category: input.category,
                    description: input.description,
                    rules: input.rules,
                },
            });

            return {
                success: true,
                message: '新增标签组成功',
                data: tag,
            };
        }),

    // 更新标签组
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1, '标签组名称不能为空'),
                category: z.string().min(1, '标签分类不能为空'),
                description: z.string().optional(),
                rules: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, name, category, description, rules } = input;

            // 检查标签组是否存在
            const existingTag = await ctx.db.testingTag.findUnique({
                where: { id },
            });

            if (!existingTag) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '标签组不存在',
                });
            }

            // 如果名称改变，检查新名称是否已被使用
            if (name !== existingTag.name) {
                const duplicateTag = await ctx.db.testingTag.findUnique({
                    where: { name },
                });

                if (duplicateTag) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: '标签组名称已存在',
                    });
                }
            }

            const tag = await ctx.db.testingTag.update({
                where: { id },
                data: {
                    name,
                    category,
                    description: description || null,
                    rules: rules || null,
                },
            });

            return {
                success: true,
                message: '更新标签组成功',
                data: tag,
            };
        }),

    // 删除标签组
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 检查标签组是否存在
            const tag = await ctx.db.testingTag.findUnique({
                where: { id: input.id },
            });

            if (!tag) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '标签组不存在',
                });
            }

            // 检查是否有用户关联此标签
            const userCount = await ctx.db.testingUserTag.count({
                where: { tagId: input.id },
            });

            if (userCount > 0) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: `有 ${userCount} 个用户关联此标签，无法删除`,
                });
            }

            await ctx.db.testingTag.delete({
                where: { id: input.id },
            });

            return {
                success: true,
                message: '删除标签组成功',
            };
        }),

    // 启用/禁用标签组
    toggleActive: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const tag = await ctx.db.testingTag.findUnique({
                where: { id: input.id },
            });

            if (!tag) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '标签组不存在',
                });
            }

            const updatedTag = await ctx.db.testingTag.update({
                where: { id: input.id },
                data: { isActive: !tag.isActive },
            });

            return {
                success: true,
                message: updatedTag.isActive ? '已启用' : '已禁用',
                data: updatedTag,
            };
        }),
});
