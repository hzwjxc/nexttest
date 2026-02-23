import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const adminRouter = createTRPCRouter({
  // 获取反馈列表（管理员权限）
  getFeedbackList: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        searchTerm: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // 检查管理员权限
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user || !user.roles.includes('SUPER_ADMIN') && !user.roles.includes('TEST_ADMIN')) {
        throw new Error("无权限访问");
      }

      const skip = (input.page - 1) * input.pageSize;
      
      // 构建查询条件
      const where: any = {};
      
      // 日期范围筛选
      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) {
          where.createdAt.gte = new Date(input.startDate);
        }
        if (input.endDate) {
          where.createdAt.lte = new Date(input.endDate + 'T23:59:59');
        }
      }
      
      // 搜索条件
      if (input.searchTerm) {
        where.OR = [
          { id: { contains: input.searchTerm } },
          { user: { name: { contains: input.searchTerm } } },
          { user: { phone: { contains: input.searchTerm } } },
        ];
      }

      // 获取总数
      const total = await ctx.db.feedback.count({ where });

      // 获取反馈列表
      const feedbacks = await ctx.db.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: input.pageSize,
        include: {
          user: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      });

      return {
        data: feedbacks,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  // 导出反馈数据
  exportFeedback: protectedProcedure
    .input(
      z.object({
        searchTerm: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查管理员权限
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user || !user.roles.includes('SUPER_ADMIN') && !user.roles.includes('TEST_ADMIN')) {
        throw new Error("无权限访问");
      }

      // 构建查询条件
      const where: any = {};
      
      // 日期范围筛选
      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) {
          where.createdAt.gte = new Date(input.startDate);
        }
        if (input.endDate) {
          where.createdAt.lte = new Date(input.endDate + 'T23:59:59');
        }
      }
      
      // 搜索条件
      if (input.searchTerm) {
        where.OR = [
          { id: { contains: input.searchTerm } },
          { user: { name: { contains: input.searchTerm } } },
          { user: { phone: { contains: input.searchTerm } } },
        ];
      }

      // 获取所有反馈数据
      const feedbacks = await ctx.db.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      });

      // 生成CSV内容
      const headers = ['ID', '提交人', '手机号', '反馈内容', '附件链接', '提交时间'];
      const csvRows = [
        headers.join(','),
        ...feedbacks.map(feedback => [
          feedback.id,
          feedback.user?.name || '匿名用户',
          feedback.user?.phone || '-',
          `"${feedback.content.replace(/"/g, '"')}"`,
          `"${(feedback.attachments || []).join(',')}"`,
          new Date(feedback.createdAt).toISOString().slice(0, 19).replace('T', ' ')
        ].join(','))
      ];

      const csv = csvRows.join('\n');

      return { csv };
    }),
});