import { z } from 'zod';
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from '@/server/api/trpc';

export const testerRouter = createTRPCRouter({
    // 获取众测人员列表
    list: publicProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
                keyword: z.string().optional(), // 搜索关键词（姓名、手机号、OA账号）
                role: z.string().optional(), // 角色筛选
                status: z.string().optional(), // 状态筛选
                tags: z
                    .array(
                        z.object({
                            tagId: z.string(),
                            value: z.string(),
                        })
                    )
                    .optional(), // 标签筛选
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, keyword, role, status, tags } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: any = {};

            // 关键词搜索
            if (keyword) {
                where.OR = [
                    { name: { contains: keyword } },
                    { phone: { contains: keyword } },
                    { oaId: { contains: keyword } },
                ];
            }

            // 角色筛选
            if (role) {
                where.roles = {
                    has: role,
                };
            }

            // 状态筛选
            if (status) {
                where.status = status === 'ACTIVE';
            }

            // 标签筛选
            if (tags && tags.length > 0) {
                where.tags = {
                    some: {
                        OR: tags.map((tag) => ({
                            tagId: tag.tagId,
                            value: tag.value,
                        })),
                    },
                };
            }

            // 查询总数
            const total = await ctx.db.user.count({ where });

            // 查询列表
            const list = await ctx.db.user.findMany({
                where,
                skip,
                take: pageSize,
                include: {
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            return {
                list,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    // 获取众测人员详情
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const tester = await ctx.db.user.findUnique({
                where: { id: input.id },
                include: {
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                },
            });

            if (!tester) {
                throw new Error('众测人员不存在');
            }

            return tester;
        }),

    // 创建众测人员
    create: protectedProcedure
        .input(
            z.object({
                name: z.string().optional(),
                phone: z.string(),
                oaId: z.string().optional(),
                department: z.string().optional(),
                position: z.string().optional(),
                roles: z.array(z.string()).default(['TESTER']),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { phone, oaId, ...userData } = input;

            // Create or update user
            const tester = await ctx.db.user.upsert({
                where: { phone },
                create: {
                    phone,
                    oaId,
                    ...userData,
                },
                update: {
                    oaId,
                    ...userData,
                },
            });

            return tester;
        }),

    // 更新众测人员
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                oaId: z.string().optional(),
                department: z.string().optional(),
                position: z.string().optional(),
                roles: z.array(z.string()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            const tester = await ctx.db.user.update({
                where: { id },
                data,
            });

            return tester;
        }),

    // 删除众测人员
    delete: protectedProcedure
        .input(z.string())
        .mutation(async ({ ctx, input }) => {
            await ctx.db.user.update({
                where: { id: input },
                data: { isDeleted: true },
            });

            return { success: true };
        }),

    // 启用/禁用众测人员
    toggleStatus: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                status: z.boolean(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 更新用户状态
            await ctx.db.user.update({
                where: { id: input.id },
                data: { status: input.status },
            });

            return { success: true };
        }),

    // 设置角色
    setRole: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                roles: z.array(z.string()),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const tester = await ctx.db.user.update({
                where: { id: input.id },
                data: { roles: input.roles },
            });

            return tester;
        }),

    // 设置标签
    setTags: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                tags: z.array(
                    z.object({
                        tagId: z.string(),
                        value: z.string(),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 删除旧标签
            await ctx.db.testingUserTag.deleteMany({
                where: { userId: input.id },
            });

            // 添加新标签
            if (input.tags.length > 0) {
                await ctx.db.testingUserTag.createMany({
                    data: input.tags.map((tag) => ({
                        userId: input.id,
                        tagId: tag.tagId,
                        value: tag.value,
                    })),
                });
            }

            return { success: true };
        }),

    // 导入标签
    importTagUsers: protectedProcedure
        .input(
            z.object({
                tagId: z.string(),
                tagValue: z.string(),
                identifiers: z.array(z.string()), // 手机号或OA账号列表
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { tagId, tagValue, identifiers } = input;

            // 验证标签是否存在
            const tag = await ctx.db.testingTag.findUnique({
                where: { id: tagId },
            });

            if (!tag) {
                throw new Error('标签不存在');
            }

            // 查找匹配的用户
            const users = await ctx.db.user.findMany({
                where: {
                    OR: [
                        { phone: { in: identifiers } },
                        { oaId: { in: identifiers } },
                    ],
                },
                select: {
                    id: true,
                    phone: true,
                },
            });

            if (users.length === 0) {
                throw new Error('未找到匹配的用户');
            }

            // 批量添加标签
            const tagRecords = users.map((user) => ({
                userId: user.id,
                tagId: tagId,
                value: tagValue,
            }));

            // 使用 createMany 批量插入,跳过已存在的记录
            await ctx.db.testingUserTag.createMany({
                data: tagRecords,
                skipDuplicates: true,
            });

            return {
                success: true,
                total: identifiers.length,
                matched: users.length,
                added: users.length,
            };
        }),
});
