import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";

export const roleRouter = createTRPCRouter({
  // 获取角色列表
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        keyword: z.string().optional(), // 搜索关键词（角色编码、角色名称）
        status: z.string().optional(), // 状态筛选
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, keyword, status } = input;
      const skip = (page - 1) * pageSize;

      // 构建查询条件
      const where: any = {};

      // 关键词搜索
      if (keyword) {
        where.OR = [
          { code: { contains: keyword } },
          { name: { contains: keyword } },
        ];
      }

      // 状态筛选
      if (status) {
        where.status = status === 'ACTIVE';
      }

      // 查询总数
      const total = await ctx.db.role.count({ where });

      // 查询列表
      const list = await ctx.db.role.findMany({
        where,
        skip,
        take: pageSize,
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

  // 获取角色详情
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const role = await ctx.db.role.findUnique({
        where: { id: input.id },
      });

      if (!role) {
        throw new Error('角色不存在');
      }

      return role;
    }),

  // 创建角色
  create: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        name: z.string(),
        description: z.string().optional(),
        status: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查角色编码是否已存在
      const existingRole = await ctx.db.role.findUnique({
        where: { code: input.code },
      });

      if (existingRole) {
        throw new Error('角色编码已存在');
      }

      const role = await ctx.db.role.create({
        data: {
          code: input.code,
          name: input.name,
          description: input.description,
          status: input.status,
        },
      });

      return role;
    }),

  // 更新角色
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        description: z.string().optional(),
        status: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // 检查角色是否存在
      const existingRole = await ctx.db.role.findUnique({
        where: { id },
      });

      if (!existingRole) {
        throw new Error('角色不存在');
      }

      const role = await ctx.db.role.update({
        where: { id },
        data,
      });

      return role;
    }),

  // 删除角色
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // 检查是否有用户使用该角色
      const role = await ctx.db.role.findUnique({ where: { id: input }, select: { code: true } });
      if (role) {
        const usersWithRole = await ctx.db.user.count({
          where: { roles: { has: role.code } },
        });
        if (usersWithRole > 0) {
          throw new Error('该角色下还有用户，无法删除');
        }
      }

      await ctx.db.role.delete({
        where: { id: input },
      });

      return { success: true };
    }),

  // 获取所有角色（用于下拉选择）
  getAll: publicProcedure.query(async ({ ctx }) => {
    const roles = await ctx.db.role.findMany({
      where: { status: true },
      orderBy: { createdAt: 'desc' },
    });

    return roles;
  }),

  // 更新角色权限
  updatePermissions: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        permissions: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, permissions } = input;

      // 检查角色是否存在
      const existingRole = await ctx.db.role.findUnique({
        where: { id },
      });

      if (!existingRole) {
        throw new Error('角色不存在');
      }

      const role = await ctx.db.role.update({
        where: { id },
        data: { permissions },
      });

      return role;
    }),
});
