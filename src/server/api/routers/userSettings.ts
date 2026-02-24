import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const userSettingsRouter = createTRPCRouter({
  // 获取用户设置
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // 获取用户信息
    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      select: {
        phone: true,
        alipayAccount: true,
        organization: true,
        department: true,
        subDepartment: true,
      },
    });

    if (!user) {
      return null;
    }

    const settings = await ctx.db.userSettings.findUnique({
      where: { userId },
    });

    return {
      ...settings,
      phone: user.phone,
      paymentAccount: user.alipayAccount,
      organization: user.organization,
      department: user.department,
      secondDepartment: user.subDepartment,
    };
  }),

  // 保存或更新用户设置
  upsert: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        gender: z.string().optional(),
        ageRange: z.string().optional(),
        phoneModel: z.string().optional(),
        province: z.string().optional(),
        city: z.string().optional(),
        organization: z.string().optional(),
        department: z.string().optional(),
        secondDepartment: z.string().optional(),
        skillTags: z.array(z.string()).optional(),
        blueMessenger: z.boolean().optional(),
        emailNotification: z.boolean().optional(),
        wechatNotification: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const { organization, department, secondDepartment, ...settingsInput } = input;

      // 将机构/部门字段写入 User 表
      await ctx.db.user.update({
        where: { id: userId },
        data: {
          organization,
          department,
          subDepartment: secondDepartment,
        },
      });

      const settings = await ctx.db.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          ...settingsInput,
        },
        update: settingsInput,
      });

      return settings;
    }),
});
