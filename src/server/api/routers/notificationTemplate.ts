import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc';
import { NotificationTemplateType } from '@prisma/client';

export const notificationTemplateRouter = createTRPCRouter({
    // 获取所有模版
    getAll: publicProcedure
        .input(
            z.object({
                type: z.nativeEnum(NotificationTemplateType).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const templates = await ctx.db.notificationTemplate.findMany({
                where: {
                    ...(input.type && { type: input.type }),
                    isActive: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            return templates;
        }),

    // 根据ID获取模版
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const template = await ctx.db.notificationTemplate.findUnique({
                where: { id: input.id },
            });
            return template;
        }),

    // 创建模版
    create: publicProcedure
        .input(
            z.object({
                name: z.string().min(1, '模版名称不能为空'),
                type: z.nativeEnum(NotificationTemplateType),
                content: z.string().min(1, '模版内容不能为空'),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const template = await ctx.db.notificationTemplate.create({
                data: {
                    name: input.name,
                    type: input.type,
                    content: input.content,
                    createdBy: ctx.session?.user?.id,
                },
            });
            return template;
        }),

    // 更新模版
    update: publicProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1, '模版名称不能为空').optional(),
                content: z.string().min(1, '模版内容不能为空').optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            const template = await ctx.db.notificationTemplate.update({
                where: { id },
                data,
            });
            return template;
        }),

    // 删除模版（软删除）
    delete: publicProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const template = await ctx.db.notificationTemplate.update({
                where: { id: input.id },
                data: { isActive: false },
            });
            return template;
        }),

    // 批量删除模版
    deleteMany: publicProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.notificationTemplate.updateMany({
                where: {
                    id: { in: input.ids },
                },
                data: { isActive: false },
            });
            return { success: true };
        }),
});
