import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";

export const dataDictionaryRouter = createTRPCRouter({
  // 获取所有数据字典列表
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        category: z.string().optional(),
        keyword: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, category, keyword } = input;
      const skip = (page - 1) * pageSize;

      const where: any = { isActive: true };
      if (category) where.category = category;
      if (keyword) {
        where.OR = [
          { name: { contains: keyword } },
          { code: { contains: keyword } },
        ];
      }

      const [data, total] = await Promise.all([
        ctx.db.dataDictionary.findMany({
          where,
          include: { items: { where: { isActive: true }, orderBy: { sort: "asc" } } },
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.dataDictionary.count({ where }),
      ]);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  // 获取所有字典（不分页）
  getAll: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = { isActive: true };
      if (input?.category) where.category = input.category;

      return ctx.db.dataDictionary.findMany({
        where,
        include: { items: { where: { isActive: true }, orderBy: { sort: "asc" } } },
        orderBy: { createdAt: "desc" },
      });
    }),

  // 按分类获取字典
  getByCategory: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input: category }) => {
      return ctx.db.dataDictionary.findMany({
        where: { category, isActive: true },
        include: { items: { where: { isActive: true }, orderBy: { sort: "asc" } } },
        orderBy: { createdAt: "desc" },
      });
    }),

  // 按ID获取字典
  getById: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      return ctx.db.dataDictionary.findUnique({
        where: { id },
        include: { items: { orderBy: { sort: "asc" } } },
      });
    }),

  // 按code获取字典
  getByCode: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input: code }) => {
      return ctx.db.dataDictionary.findUnique({
        where: { code },
        include: { items: { where: { isActive: true }, orderBy: { sort: "asc" } } },
      });
    }),

  // 创建字典
  create: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        category: z.string().min(1),
        description: z.string().optional(),
        valueType: z.enum(["LIST", "NUMBER"]).default("LIST"),
        items: z
          .array(
            z.object({
              code: z.string().optional(),
              label: z.string(),
              value: z.string().optional(),
              description: z.string().optional(),
              sort: z.number().default(0),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { code, name, category, description, valueType, items } = input;

      // 检查code是否已存在
      const existing = await ctx.db.dataDictionary.findUnique({
        where: { code },
      });
      if (existing) {
        throw new Error(`字典编码 ${code} 已存在`);
      }

      return ctx.db.dataDictionary.create({
        data: {
          code,
          name,
          category,
          description,
          valueType,
          items: items
            ? {
                create: items.map((item, index) => ({
                  code: item.code,
                  label: item.label,
                  value: item.value,
                  description: item.description,
                  sort: item.sort ?? index,
                })),
              }
            : undefined,
        },
        include: { items: true },
      });
    }),

  // 更新字典
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, description, isActive } = input;

      return ctx.db.dataDictionary.update({
        where: { id },
        data: { name, description, isActive },
        include: { items: true },
      });
    }),

  // 删除字典
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      return ctx.db.dataDictionary.delete({
        where: { id },
      });
    }),

  // 创建字典项
  createItem: protectedProcedure
    .input(
      z.object({
        dictionaryId: z.string(),
        code: z.string().optional(),
        label: z.string(),
        value: z.string().optional(),
        description: z.string().optional(),
        sort: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { dictionaryId, code, label, value, description, sort } = input;

      // 检查code是否已存在（如果提供了code）
      if (code) {
        const existing = await ctx.db.dataDictionaryItem.findFirst({
          where: { dictionaryId, code },
        });
        if (existing) {
          throw new Error(`码值 ${code} 在此字典中已存在`);
        }
      }

      return ctx.db.dataDictionaryItem.create({
        data: {
          dictionaryId,
          code,
          label,
          value,
          description,
          sort,
        },
      });
    }),

  // 更新字典项
  updateItem: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().optional(),
        value: z.string().optional(),
        description: z.string().optional(),
        sort: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, label, value, description, sort, isActive } = input;

      return ctx.db.dataDictionaryItem.update({
        where: { id },
        data: { label, value, description, sort, isActive },
      });
    }),

  // 删除字典项
  deleteItem: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      return ctx.db.dataDictionaryItem.delete({
        where: { id },
      });
    }),

  // 重新排序字典项
  reorderItems: protectedProcedure
    .input(
      z.object({
        dictionaryId: z.string(),
        items: z.array(
          z.object({
            id: z.string(),
            sort: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { dictionaryId, items } = input;

      // 批量更新排序
      await Promise.all(
        items.map((item) =>
          ctx.db.dataDictionaryItem.update({
            where: { id: item.id },
            data: { sort: item.sort },
          })
        )
      );

      return ctx.db.dataDictionary.findUnique({
        where: { id: dictionaryId },
        include: { items: { orderBy: { sort: "asc" } } },
      });
    }),
});
