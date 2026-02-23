import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const deviceRouter = createTRPCRouter({
  // 获取设备列表
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        brand: z.string().optional(),
        brandZh: z.string().optional(),
        systemVersion: z.string().optional(),
        model: z.string().optional(),
        modelAlias: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, brand, brandZh, systemVersion, model, modelAlias } = input;
      
      const whereConditions: any = {
        isActive: true,
      };

      if (brand) {
        whereConditions.brand = {
          contains: brand,
          mode: "insensitive",
        };
      }

      if (brandZh) {
        whereConditions.brandZh = {
          contains: brandZh,
          mode: "insensitive",
        };
      }

      if (systemVersion) {
        whereConditions.systemVersion = {
          contains: systemVersion,
          mode: "insensitive",
        };
      }

      if (model) {
        whereConditions.model = {
          contains: model,
          mode: "insensitive",
        };
      }

      if (modelAlias) {
        whereConditions.modelAlias = {
          contains: modelAlias,
          mode: "insensitive",
        };
      }

      const [devices, totalCount] = await Promise.all([
        ctx.db.device.findMany({
          where: whereConditions,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: {
            createdAt: "desc",
          },
        }),
        ctx.db.device.count({
          where: whereConditions,
        }),
      ]);

      return {
        data: devices,
        pagination: {
          page,
          pageSize,
          total: totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      };
    }),

  // 获取单个设备详情
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const device = await ctx.db.device.findUnique({
        where: { id: input.id },
      });

      if (!device) {
        throw new Error("设备不存在");
      }

      return device;
    }),

  // 创建设备
  create: protectedProcedure
    .input(
      z.object({
        brand: z.string().min(1, "品牌不能为空"),
        brandZh: z.string().min(1, "品牌中文不能为空"),
        model: z.string().min(1, "型号不能为空"),
        modelAlias: z.string().optional(),
        systemVersion: z.string().min(1, "系统版本不能为空"),
        resolution: z.string().optional(),
        cpuModel: z.string().optional(),
        cpuCores: z.number().optional(),
        memory: z.string().optional(),
        sdkVersion: z.string().optional(),
        cpuFrequency: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查是否已存在相同的品牌和型号组合
      const existingDevice = await ctx.db.device.findFirst({
        where: {
          brand: input.brand,
          model: input.model,
          isActive: true,
        },
      });

      if (existingDevice) {
        throw new Error("该品牌和型号的设备已存在");
      }

      const device = await ctx.db.device.create({
        data: {
          brand: input.brand,
          brandZh: input.brandZh,
          model: input.model,
          modelAlias: input.modelAlias,
          systemVersion: input.systemVersion,
          resolution: input.resolution,
          cpuModel: input.cpuModel,
          cpuCores: input.cpuCores,
          memory: input.memory,
          sdkVersion: input.sdkVersion,
          cpuFrequency: input.cpuFrequency,
        },
      });

      return device;
    }),

  // 更新设备
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        brand: z.string().min(1, "品牌不能为空"),
        brandZh: z.string().min(1, "品牌中文不能为空"),
        model: z.string().min(1, "型号不能为空"),
        modelAlias: z.string().optional(),
        systemVersion: z.string().min(1, "系统版本不能为空"),
        resolution: z.string().optional(),
        cpuModel: z.string().optional(),
        cpuCores: z.number().optional(),
        memory: z.string().optional(),
        sdkVersion: z.string().optional(),
        cpuFrequency: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 检查设备是否存在
      const existingDevice = await ctx.db.device.findUnique({
        where: { id },
      });

      if (!existingDevice) {
        throw new Error("设备不存在");
      }

      // 检查是否与其他设备冲突（除了自己）
      const duplicateDevice = await ctx.db.device.findFirst({
        where: {
          brand: input.brand,
          model: input.model,
          id: { not: id },
          isActive: true,
        },
      });

      if (duplicateDevice) {
        throw new Error("该品牌和型号的设备已存在");
      }

      const device = await ctx.db.device.update({
        where: { id },
        data: updateData,
      });

      return device;
    }),

  // 删除设备（软删除）
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const device = await ctx.db.device.findUnique({
        where: { id: input.id },
      });

      if (!device) {
        throw new Error("设备不存在");
      }

      await ctx.db.device.update({
        where: { id: input.id },
        data: { isActive: false },
      });

      return { success: true };
    }),

  // 批量导出设备数据
  exportDevices: protectedProcedure
    .input(
      z.object({
        brand: z.string().optional(),
        brandZh: z.string().optional(),
        systemVersion: z.string().optional(),
        model: z.string().optional(),
        modelAlias: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const whereConditions: any = {
        isActive: true,
      };

      if (input.brand) {
        whereConditions.brand = {
          contains: input.brand,
          mode: "insensitive",
        };
      }

      if (input.brandZh) {
        whereConditions.brandZh = {
          contains: input.brandZh,
          mode: "insensitive",
        };
      }

      if (input.systemVersion) {
        whereConditions.systemVersion = {
          contains: input.systemVersion,
          mode: "insensitive",
        };
      }

      if (input.model) {
        whereConditions.model = {
          contains: input.model,
          mode: "insensitive",
        };
      }

      if (input.modelAlias) {
        whereConditions.modelAlias = {
          contains: input.modelAlias,
          mode: "insensitive",
        };
      }

      const devices = await ctx.db.device.findMany({
        where: whereConditions,
        orderBy: {
          createdAt: "desc",
        },
      });

      return devices;
    }),
});