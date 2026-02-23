import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc';
import { NotificationTemplateType } from '@prisma/client';

export const notificationRouter = createTRPCRouter({
    // 获取所有消息通知
    getAll: publicProcedure
        .input(
            z.object({
                type: z.nativeEnum(NotificationTemplateType).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const notifications = await ctx.db.notification.findMany({
                where: {
                    ...(input.type && { type: input.type }),
                    isActive: true,
                },
                include: {
                    recipientTags: true
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            
            // 转换标签格式
            return notifications.map(notification => ({
                ...notification,
                tags: notification.recipientTags.map(rt => ({
                    tagId: rt.tagId,
                    value: rt.tagValue
                }))
            }));
        }),

    // 根据ID获取消息通知
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const notification = await ctx.db.notification.findUnique({
                where: { id: input.id },
                include: {
                    recipientTags: true
                }
            });
            
            if (notification) {
                return {
                    ...notification,
                    tags: notification.recipientTags.map(rt => ({
                        tagId: rt.tagId,
                        value: rt.tagValue
                    }))
                };
            }
            return notification;
        }),

    // 创建消息通知
    create: publicProcedure
        .input(
            z.object({
                type: z.nativeEnum(NotificationTemplateType),
                content: z.string().min(1, '通知内容不能为空'),
                tags: z.array(z.object({
                    tagId: z.string(),
                    value: z.string()
                })).optional(),
                publishNow: z.boolean().optional() // 是否立即发布
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { tags, publishNow, ...notificationData } = input;
            
            const notification = await ctx.db.notification.create({
                data: {
                    type: notificationData.type,
                    content: notificationData.content,
                    createdBy: ctx.session?.user?.id,
                    publishedAt: publishNow ? new Date() : null,
                    ...(tags && tags.length > 0 ? {
                        recipientTags: {
                            create: tags.map(tag => ({
                                tagId: tag.tagId,
                                tagValue: tag.value
                            }))
                        }
                    } : {})
                },
                include: {
                    recipientTags: true
                }
            });
            
            return {
                ...notification,
                tags: notification.recipientTags.map(rt => ({
                    tagId: rt.tagId,
                    value: rt.tagValue
                }))
            };
        }),

    // 更新消息通知
    update: publicProcedure
        .input(
            z.object({
                id: z.string(),
                content: z.string().min(1, '通知内容不能为空').optional(),
                tags: z.array(z.object({
                    tagId: z.string(),
                    value: z.string()
                })).optional()
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, tags, ...data } = input;
            
            // 先更新通知基本信息
            const notification = await ctx.db.notification.update({
                where: { id },
                data,
            });
            
            // 如果提供了标签，则更新标签关联
            if (tags !== undefined) {
                // 删除现有的标签关联
                await ctx.db.notificationRecipientTag.deleteMany({
                    where: { notificationId: id }
                });
                
                // 创建新的标签关联
                if (tags.length > 0) {
                    await ctx.db.notificationRecipientTag.createMany({
                        data: tags.map(tag => ({
                            notificationId: id,
                            tagId: tag.tagId,
                            tagValue: tag.value
                        }))
                    });
                }
            }
            
            // 获取更新后的完整数据
            const updatedNotification = await ctx.db.notification.findUnique({
                where: { id },
                include: {
                    recipientTags: true
                }
            });
            
            return {
                ...updatedNotification,
                tags: updatedNotification?.recipientTags.map(rt => ({
                    tagId: rt.tagId,
                    value: rt.tagValue
                })) || []
            };
        }),

    // 删除消息通知（软删除）
    delete: publicProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const notification = await ctx.db.notification.update({
                where: { id: input.id },
                data: { isActive: false },
            });
            return notification;
        }),

    // 发布消息通知
    publish: publicProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const notification = await ctx.db.notification.update({
                where: { id: input.id },
                data: { publishedAt: new Date() },
            });
            return notification;
        }),
});
