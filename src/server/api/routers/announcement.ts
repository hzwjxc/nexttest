import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

export const announcementRouter = createTRPCRouter({
    // 分页查询系统公告列表
    list: publicProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
                title: z.string().optional(), // 可选的标题搜索
            })
        )
        .query(async ({ ctx, input }) => {
            const { page, pageSize, title } = input;
            const skip = (page - 1) * pageSize;

            // 构建查询条件
            const where = {
                ...(title && {
                    title: {
                        contains: title,
                    },
                }),
            };

            // 获取总数
            const total = await ctx.db.announcement.count({ where });

            // 获取分页数据，按sort升序，相同sort按createdAt降序
            const data = await ctx.db.announcement.findMany({
                where,
                orderBy: [
                    { sort: 'asc' },
                    { createdAt: 'desc' },
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

    // 获取所有公告（不分页，用于前台展示）
    getAll: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.announcement.findMany({
            where: { isActive: true },
            orderBy: [
                { sort: 'asc' },
                { createdAt: 'desc' },
            ],
        });
    }),

    // 获取未读公告（任务大厅使用）
    getUnread: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        const now = new Date();

        // 获取所有启用的公告
        const announcements = await ctx.db.announcement.findMany({
            where: {
                isActive: true,
            },
            orderBy: [
                { sort: 'asc' },
                { createdAt: 'desc' },
            ],
        });

        // 过滤有效期内的公告
        const validAnnouncements = announcements.filter((announcement) => {
            if (!announcement.startTime && !announcement.endTime) {
                return true;
            }
            const isAfterStart = !announcement.startTime || new Date(announcement.startTime) <= now;
            const isBeforeEnd = !announcement.endTime || new Date(announcement.endTime) >= now;
            return isAfterStart && isBeforeEnd;
        });

        // 获取用户已读的公告ID列表
        const readRecords = await ctx.db.announcementReadRecord.findMany({
            where: {
                userId,
                announcementId: {
                    in: validAnnouncements.map(a => a.id),
                },
            },
            select: {
                announcementId: true,
            },
        });

        const readAnnouncementIds = new Set(readRecords.map(r => r.announcementId));

        // 返回未读的公告
        return validAnnouncements.filter(a => !readAnnouncementIds.has(a.id));
    }),

    // 获取消息中心列表（分页，包含已读/未读状态）
    getMessageList: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
                showUnreadOnly: z.boolean().default(false), // 是否只显示未读
            })
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const { page, pageSize, showUnreadOnly } = input;
            const skip = (page - 1) * pageSize;

            // 获取所有启用的公告
            const announcements = await ctx.db.announcement.findMany({
                where: { isActive: true },
                orderBy: [
                    { sort: 'asc' },
                    { createdAt: 'desc' },
                ],
            });

            // 获取用户已读的公告ID列表
            const readRecords = await ctx.db.announcementReadRecord.findMany({
                where: {
                    userId,
                    announcementId: {
                        in: announcements.map(a => a.id),
                    },
                },
                select: {
                    announcementId: true,
                },
            });

            const readAnnouncementIds = new Set(readRecords.map(r => r.announcementId));

            // 为每条公告添加已读状态和类型
            let messagesWithReadStatus = announcements.map(announcement => ({
                id: announcement.id,
                title: announcement.title,
                content: announcement.content,
                createdAt: announcement.createdAt,
                isRead: readAnnouncementIds.has(announcement.id),
                type: '系统公告',
                messageType: 'ANNOUNCEMENT',
            }));

            // 获取所有启用的首页弹窗
            const popups = await ctx.db.homepagePopup.findMany({
                where: { isActive: true },
                orderBy: [
                    { sequence: 'asc' },
                    { createdAt: 'desc' },
                ],
            });

            // 获取用户已读的首页弹窗ID列表
            const popupReadRecords = await ctx.db.homepagePopupReadRecord.findMany({
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

            const readPopupIds = new Set(popupReadRecords.map(r => r.popupId));

            // 为每个弹窗添加已读状态和类型
            const popupMessages = popups.map(popup => ({
                id: popup.id,
                title: popup.title,
                content: popup.content || popup.image || '',
                createdAt: popup.createdAt,
                isRead: readPopupIds.has(popup.id),
                type: popup.type === 'IMAGE' ? '图片弹窗' : '文字弹窗',
                messageType: 'POPUP',
                popupType: popup.type,
            }));

            // 合并公告和弹窗消息
            let allMessages = [...messagesWithReadStatus, ...popupMessages];

            // 按创建时间排序（最新的在前）
            allMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // 如果只显示未读，过滤掉已读的
            if (showUnreadOnly) {
                allMessages = allMessages.filter(m => !m.isRead);
            }

            // 计算总数
            const total = allMessages.length;

            // 分页
            const data = allMessages.slice(skip, skip + pageSize);

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

    // 标记公告为已读
    markAsRead: protectedProcedure
        .input(
            z.object({
                announcementId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const { announcementId } = input;

            // 检查公告是否存在
            const announcement = await ctx.db.announcement.findUnique({
                where: { id: announcementId },
            });

            if (!announcement) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '公告不存在',
                });
            }

            // 使用 upsert 来创建或更新已读记录
            await ctx.db.announcementReadRecord.upsert({
                where: {
                    announcementId_userId: {
                        announcementId,
                        userId,
                    },
                },
                update: {
                    readAt: new Date(),
                },
                create: {
                    announcementId,
                    userId,
                },
            });

            return {
                success: true,
                message: '已标记为已读',
            };
        }),

    // 标记首页弹窗为已读
    markPopupAsRead: protectedProcedure
        .input(
            z.object({
                popupId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const { popupId } = input;

            // 检查弹窗是否存在
            const popup = await ctx.db.homepagePopup.findUnique({
                where: { id: popupId },
            });

            if (!popup) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '首页弹窗不存在',
                });
            }

            // 使用 upsert 来创建或更新已读记录
            await ctx.db.homepagePopupReadRecord.upsert({
                where: {
                    popupId_userId: {
                        popupId,
                        userId,
                    },
                },
                update: {
                    readAt: new Date(),
                },
                create: {
                    popupId,
                    userId,
                },
            });

            return {
                success: true,
                message: '已标记为已读',
            };
        }),

    // 根据ID获取单个公告
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const announcement = await ctx.db.announcement.findUnique({
                where: { id: input.id },
            });

            if (!announcement) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '公告不存在',
                });
            }

            return announcement;
        }),

    // 新增公告
    create: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1, '公告标题不能为空').max(200, '公告标题不能超过200个字符'),
                content: z.string().min(1, '公告内容不能为空'),
                sort: z.number().optional(),
                startTime: z.string().optional(), // ISO 8601 日期时间字符串
                endTime: z.string().optional(), // ISO 8601 日期时间字符串
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 如果没有指定序号，自动计算下一个序号
            let sort = input.sort;
            if (sort === undefined) {
                // 查找当前最大的序号
                const maxSortAnnouncement = await ctx.db.announcement.findFirst({
                    orderBy: { sort: 'desc' },
                    select: { sort: true },
                });
                // 如果没有公告，从1开始；否则最大序号+1
                sort = (maxSortAnnouncement?.sort ?? 0) + 1;
            }

            const announcement = await ctx.db.announcement.create({
                data: {
                    title: input.title,
                    content: input.content,
                    sort: sort,
                    startTime: input.startTime ? new Date(input.startTime) : null,
                    endTime: input.endTime ? new Date(input.endTime) : null,
                },
            });

            return {
                success: true,
                message: '新增公告成功',
                data: announcement,
            };
        }),

    // 更新公告
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string().min(1, '公告标题不能为空').max(200, '公告标题不能超过200个字符'),
                content: z.string().min(1, '公告内容不能为空'),
                sort: z.number().optional(),
                startTime: z.string().optional(), // ISO 8601 日期时间字符串
                endTime: z.string().optional(), // ISO 8601 日期时间字符串
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, title, content, sort, startTime, endTime } = input;

            // 检查公告是否存在
            const existingAnnouncement = await ctx.db.announcement.findUnique({
                where: { id },
            });

            if (!existingAnnouncement) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '公告不存在',
                });
            }

            const announcement = await ctx.db.announcement.update({
                where: { id },
                data: {
                    title,
                    content,
                    ...(sort !== undefined && { sort }),
                    ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
                    ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
                },
            });

            return {
                success: true,
                message: '更新公告成功',
                data: announcement,
            };
        }),

    // 删除单个公告
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 检查公告是否存在
            const announcement = await ctx.db.announcement.findUnique({
                where: { id: input.id },
            });

            if (!announcement) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '公告不存在',
                });
            }

            await ctx.db.announcement.delete({
                where: { id: input.id },
            });

            return {
                success: true,
                message: '删除公告成功',
            };
        }),

    // 调整公告序号 (上移)
    moveUp: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const announcement = await ctx.db.announcement.findUnique({
                where: { id: input.id },
            });

            if (!announcement) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '公告不存在',
                });
            }

            // 找到上一个公告（sort比当前小的最大值）
            const previousAnnouncement = await ctx.db.announcement.findFirst({
                where: {
                    sort: {
                        lt: announcement.sort,
                    },
                },
                orderBy: {
                    sort: 'desc',
                },
            });

            if (!previousAnnouncement) {
                return {
                    success: false,
                    message: '已经是第一条了',
                };
            }

            // 交换序号
            await ctx.db.$transaction([
                ctx.db.announcement.update({
                    where: { id: announcement.id },
                    data: { sort: previousAnnouncement.sort },
                }),
                ctx.db.announcement.update({
                    where: { id: previousAnnouncement.id },
                    data: { sort: announcement.sort },
                }),
            ]);

            return {
                success: true,
                message: '上移成功',
            };
        }),

    // 调整公告序号 (下移)
    moveDown: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const announcement = await ctx.db.announcement.findUnique({
                where: { id: input.id },
            });

            if (!announcement) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '公告不存在',
                });
            }

            // 找到下一个公告（sort比当前大的最小值）
            const nextAnnouncement = await ctx.db.announcement.findFirst({
                where: {
                    sort: {
                        gt: announcement.sort,
                    },
                },
                orderBy: {
                    sort: 'asc',
                },
            });

            if (!nextAnnouncement) {
                return {
                    success: false,
                    message: '已经是最后一条了',
                };
            }

            // 交换序号
            await ctx.db.$transaction([
                ctx.db.announcement.update({
                    where: { id: announcement.id },
                    data: { sort: nextAnnouncement.sort },
                }),
                ctx.db.announcement.update({
                    where: { id: nextAnnouncement.id },
                    data: { sort: announcement.sort },
                }),
            ]);

            return {
                success: true,
                message: '下移成功',
            };
        }),
});
