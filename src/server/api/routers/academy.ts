import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

export const academyRouter = createTRPCRouter({
    // 分页查询众测学堂文章列表
    list: publicProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
                title: z.string().optional(), // 可选的标题搜索
                includeUnpublished: z.boolean().optional().default(false), // 是否包含未发布的文章（后台管理用）
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, title, includeUnpublished } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where: Record<string, unknown> = {
                isActive: true,
                // 前台展示时，只显示已到发布时间文章（精确到时分秒）
                ...(!includeUnpublished && {
                    publishTime: {
                        lte: new Date(),
                    },
                }),
                ...(title && {
                    title: {
                        contains: title,
                    },
                }),
            };

            // 获取总数
            const total = await ctx.db.academy.count({ where });

            // 获取分页数据，按sequence排序，相同sequence按publishTime降序
            const data = await ctx.db.academy.findMany({
                where,
                orderBy: [
                    { sequence: 'asc' },
                    { publishTime: 'desc' },
                ],
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

    // 获取所有文章（不分页，用于前台展示）
    getAll: publicProcedure.query(async ({ ctx }) => {
        const now = new Date();
        return ctx.db.academy.findMany({
            where: {
                isActive: true,
                // 只显示已到发布时间文章（精确到时分秒）
                publishTime: {
                    lte: now,
                },
            },
            orderBy: [
                { sequence: 'asc' },
                { publishTime: 'desc' },
            ],
        });
    }),

    // 根据ID获取单个文章
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const article = await ctx.db.academy.findUnique({
                where: { id: input.id },
            });

            if (!article) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '文章不存在',
                });
            }

            return article;
        }),

    // 新增文章
    create: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1, '文章标题不能为空').max(200, '文章标题不能超过200个字符'),
                content: z.string().min(1, '文章内容不能为空'),
                coverImage: z.string().min(1, '封面图片不能为空'),
                publishTime: z.string().min(1, '发布时间不能为空'),
                sequence: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 如果没有指定序号，自动计算下一个序号
            let sequence = input.sequence;
            if (sequence === undefined) {
                // 查找当前最大的序号
                const maxSequenceArticle = await ctx.db.academy.findFirst({
                    orderBy: { sequence: 'desc' },
                    select: { sequence: true },
                });
                // 如果没有文章，从1开始；否则最大序号+1
                sequence = (maxSequenceArticle?.sequence ?? 0) + 1;
            }

            const article = await ctx.db.academy.create({
                data: {
                    title: input.title,
                    content: input.content,
                    coverImage: input.coverImage,
                    publishTime: new Date(input.publishTime),
                    sequence: sequence,
                },
            });

            return {
                success: true,
                message: '新增文章成功',
                data: article,
            };
        }),

    // 更新文章
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string().min(1, '文章标题不能为空').max(200, '文章标题不能超过200个字符'),
                content: z.string().min(1, '文章内容不能为空'),
                coverImage: z.string().min(1, '封面图片不能为空'),
                publishTime: z.string().min(1, '发布时间不能为空'),
                sequence: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, title, content, coverImage, publishTime, sequence } = input;

            // 检查文章是否存在
            const existingArticle = await ctx.db.academy.findUnique({
                where: { id },
            });

            if (!existingArticle) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '文章不存在',
                });
            }

            const article = await ctx.db.academy.update({
                where: { id },
                data: {
                    title,
                    content,
                    coverImage,
                    publishTime: new Date(publishTime),
                    ...(sequence !== undefined && { sequence }),
                },
            });

            return {
                success: true,
                message: '更新文章成功',
                data: article,
            };
        }),

    // 删除单个文章
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 检查文章是否存在
            const article = await ctx.db.academy.findUnique({
                where: { id: input.id },
            });

            if (!article) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '文章不存在',
                });
            }

            await ctx.db.academy.delete({
                where: { id: input.id },
            });

            return {
                success: true,
                message: '删除文章成功',
            };
        }),

    // 调整文章序号 (上移)
    moveUp: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const article = await ctx.db.academy.findUnique({
                where: { id: input.id },
            });

            if (!article) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '文章不存在',
                });
            }

            // 找到上一个文章（sequence比当前小的最大值）
            const previousArticle = await ctx.db.academy.findFirst({
                where: {
                    sequence: {
                        lt: article.sequence,
                    },
                },
                orderBy: {
                    sequence: 'desc',
                },
            });

            if (!previousArticle) {
                return {
                    success: false,
                    message: '已经是第一条了',
                };
            }

            // 交换序号
            await ctx.db.$transaction([
                ctx.db.academy.update({
                    where: { id: article.id },
                    data: { sequence: previousArticle.sequence },
                }),
                ctx.db.academy.update({
                    where: { id: previousArticle.id },
                    data: { sequence: article.sequence },
                }),
            ]);

            return {
                success: true,
                message: '上移成功',
            };
        }),

    // 调整文章序号 (下移)
    moveDown: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const article = await ctx.db.academy.findUnique({
                where: { id: input.id },
            });

            if (!article) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '文章不存在',
                });
            }

            // 找到下一个文章（sequence比当前大的最小值）
            const nextArticle = await ctx.db.academy.findFirst({
                where: {
                    sequence: {
                        gt: article.sequence,
                    },
                },
                orderBy: {
                    sequence: 'asc',
                },
            });

            if (!nextArticle) {
                return {
                    success: false,
                    message: '已经是最后一条了',
                };
            }

            // 交换序号
            await ctx.db.$transaction([
                ctx.db.academy.update({
                    where: { id: article.id },
                    data: { sequence: nextArticle.sequence },
                }),
                ctx.db.academy.update({
                    where: { id: nextArticle.id },
                    data: { sequence: article.sequence },
                }),
            ]);

            return {
                success: true,
                message: '下移成功',
            };
        }),

    // 批量重新计算序号（修复序号为0的问题）
    reorderAll: protectedProcedure
        .mutation(async ({ ctx }) => {
            // 获取所有文章，按发布时间排序
            const articles = await ctx.db.academy.findMany({
                orderBy: [
                    { sequence: 'asc' },
                    { publishTime: 'desc' },
                ],
            });

            // 重新分配序号（从1开始）
            await ctx.db.$transaction(
                articles.map((article, index) =>
                    ctx.db.academy.update({
                        where: { id: article.id },
                        data: { sequence: index + 1 },
                    })
                )
            );

            return {
                success: true,
                message: `已重新排序 ${articles.length} 篇文章`,
                count: articles.length,
            };
        }),

    // 获取用户收藏的文章ID列表
    getFavoriteIds: protectedProcedure
        .query(async ({ ctx }) => {
            const userId = ctx.session.user.id;

            const favorites = await ctx.db.academyFavorite.findMany({
                where: { userId },
                select: { academyId: true },
            });

            return favorites.map(f => f.academyId);
        }),

    // 切换收藏状态
    toggleFavorite: protectedProcedure
        .input(z.object({ academyId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const { academyId } = input;

            // 检查文章是否存在
            const article = await ctx.db.academy.findUnique({
                where: { id: academyId },
            });

            if (!article) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '文章不存在',
                });
            }

            // 检查是否已经收藏
            const existingFavorite = await ctx.db.academyFavorite.findUnique({
                where: {
                    userId_academyId: {
                        userId,
                        academyId,
                    },
                },
            });

            if (existingFavorite) {
                // 已收藏，则取消收藏
                await ctx.db.academyFavorite.delete({
                    where: { id: existingFavorite.id },
                });

                return {
                    success: true,
                    isFavorite: false,
                    message: '已取消收藏',
                };
            } else {
                // 未收藏，则添加收藏
                await ctx.db.academyFavorite.create({
                    data: {
                        userId,
                        academyId,
                    },
                });

                return {
                    success: true,
                    isFavorite: true,
                    message: '收藏成功',
                };
            }
        }),

    // 获取我的收藏列表
    getMyFavorites: protectedProcedure
        .query(async ({ ctx }) => {
            const userId = ctx.session.user.id;

            const favorites = await ctx.db.academyFavorite.findMany({
                where: { userId },
                include: {
                    academy: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            return favorites.map(f => f.academy);
        }),

    // 获取积分排行榜
    getPointsRanking: publicProcedure
        .input(
            z.object({
                period: z.enum(['month', 'quarter', 'all']).default('month'),
                limit: z.number().min(1).max(100).default(15),
            })
        )
        .query(async ({ ctx, input }) => {
            const { period, limit } = input;

            // 计算时间范围
            const now = new Date();
            let startDate: Date | undefined;
            let endDate: Date;

            if (period === 'all') {
                // 总榜：不限制时间范围
                startDate = undefined;
                endDate = now;
            } else if (period === 'month') {
                // 上个月第一天
                const lastMonth = now.getMonth() - 1;
                const year = lastMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
                const month = lastMonth < 0 ? 11 : lastMonth;
                startDate = new Date(year, month, 1, 0, 0, 0, 0);

                // 上个月最后一天
                endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
            } else {
                // 上个季度第一天
                const currentQuarter = Math.floor(now.getMonth() / 3);
                const lastQuarter = currentQuarter - 1;

                if (lastQuarter < 0) {
                    // 去年第四季度
                    startDate = new Date(now.getFullYear() - 1, 9, 1, 0, 0, 0, 0); // 10月1日
                    endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999); // 12月31日
                } else {
                    // 今年的上个季度
                    const quarterStartMonth = lastQuarter * 3;
                    startDate = new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
                    endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999);
                }
            }

            // 使用原始SQL查询以避免TypeScript类型问题
            const pointsData = startDate
                ? await ctx.db.$queryRaw<Array<{ userId: string; totalPoints: number }>>`
                    SELECT "userId", SUM(points) as "totalPoints"
                    FROM "PointTransaction"
                    WHERE "createdAt" >= ${startDate}
                      AND "createdAt" <= ${endDate}
                      AND type = 'EARN'
                    GROUP BY "userId"
                    ORDER BY "totalPoints" DESC
                    LIMIT ${limit}
                `
                : await ctx.db.$queryRaw<Array<{ userId: string; totalPoints: number }>>`
                    SELECT "userId", SUM(points) as "totalPoints"
                    FROM "PointTransaction"
                    WHERE type = 'EARN'
                    GROUP BY "userId"
                    ORDER BY "totalPoints" DESC
                    LIMIT ${limit}
                `;

            // 获取用户详细信息
            const userIds = pointsData.map(p => p.userId);
            const users = await ctx.db.user.findMany({
                where: {
                    id: { in: userIds },
                },
                select: {
                    id: true,
                    name: true,
                    department: true,
                    organization: true,
                },
            });

            // 组装排行榜数据
            const ranking = pointsData.map((point, index) => {
                const user = users.find(u => u.id === point.userId);
                return {
                    id: point.userId,
                    rank: index + 1,
                    name: user?.name ?? '未知用户',
                    department: user?.department ?? user?.organization ?? '未知部门',
                    points: Number(point.totalPoints) ?? 0,
                    avatar: '/images/task-hall/avatar-big.png',
                };
            });

            return ranking;
        }),

    // 获取贡献排行榜（有效缺陷数）
    getContributionRanking: publicProcedure
        .input(
            z.object({
                period: z.enum(['month', 'quarter', 'all']).default('month'),
                limit: z.number().min(1).max(100).default(15),
            })
        )
        .query(async ({ ctx, input }) => {
            const { period, limit } = input;

            // 计算时间范围
            const now = new Date();
            let startDate: Date | undefined;
            let endDate: Date;

            if (period === 'all') {
                // 总榜：不限制时间范围
                startDate = undefined;
                endDate = now;
            } else if (period === 'month') {
                // 上个月第一天
                const lastMonth = now.getMonth() - 1;
                const year = lastMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
                const month = lastMonth < 0 ? 11 : lastMonth;
                startDate = new Date(year, month, 1, 0, 0, 0, 0);

                // 上个月最后一天
                endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
            } else {
                // 上个季度第一天
                const currentQuarter = Math.floor(now.getMonth() / 3);
                const lastQuarter = currentQuarter - 1;

                if (lastQuarter < 0) {
                    // 去年第四季度
                    startDate = new Date(now.getFullYear() - 1, 9, 1, 0, 0, 0, 0); // 10月1日
                    endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999); // 12月31日
                } else {
                    // 今年的上个季度
                    const quarterStartMonth = lastQuarter * 3;
                    startDate = new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
                    endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999);
                }
            }

            // 使用原始SQL查询以避免TypeScript类型问题
            const defectData = startDate
                ? await ctx.db.$queryRaw<Array<{ userId: string; defectCount: bigint }>>`
                    SELECT "userId", COUNT(id) as "defectCount"
                    FROM "Defect"
                    WHERE "createdAt" >= ${startDate}
                      AND "createdAt" <= ${endDate}
                      AND severity != 'INVALID'
                    GROUP BY "userId"
                    ORDER BY "defectCount" DESC
                    LIMIT ${limit}
                `
                : await ctx.db.$queryRaw<Array<{ userId: string; defectCount: bigint }>>`
                    SELECT "userId", COUNT(id) as "defectCount"
                    FROM "Defect"
                    WHERE severity != 'INVALID'
                    GROUP BY "userId"
                    ORDER BY "defectCount" DESC
                    LIMIT ${limit}
                `;

            // 获取用户详细信息
            const userIds = defectData.map(d => d.userId);
            const users = await ctx.db.user.findMany({
                where: {
                    id: { in: userIds },
                },
                select: {
                    id: true,
                    name: true,
                    department: true,
                    organization: true,
                },
            });

            // 组装排行榜数据
            const ranking = defectData.map((defect, index) => {
                const user = users.find(u => u.id === defect.userId);
                return {
                    id: defect.userId,
                    rank: index + 1,
                    name: user?.name ?? '未知用户',
                    department: user?.department ?? user?.organization ?? '未知部门',
                    points: Number(defect.defectCount),
                    avatar: '/images/task-hall/avatar-big.png',
                };
            });

            return ranking;
        }),
});
