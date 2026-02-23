import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const feedbackRouter = createTRPCRouter({
  // 上传附件
  uploadAttachment: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
        fileData: z.string(), // base64 字符串
      })
    )
    .mutation(async ({ input }) => {
      try {
        // 打印一些调试信息
        console.log('Uploading file:', input.fileName, 'Type:', input.fileType);
        console.log('Base64 string length:', input.fileData.length);
        console.log('Base64 string prefix:', input.fileData.substring(0, 50));

        let base64Data: string;
        let mimeType: string;

        // 从 base64 中提取实际的数据部分
        // 支持更灵活的 base64 格式匹配
        const matches = input.fileData.match(/^data:([A-Za-z0-9\-+\/;=]+);base64,(.+)$/);

        if (matches && matches.length === 3) {
          // 标准的 data URI 格式
          mimeType = matches[1]!;
          base64Data = matches[2]!;
        } else if (input.fileData.startsWith('data:')) {
          // 尝试其他可能的格式
          console.error('Non-standard base64 format. String starts with:', input.fileData.substring(0, 100));
          throw new Error("Invalid base64 string format");
        } else {
          // 假设是纯 base64 字符串（没有 data URI 前缀）
          console.log('Processing as raw base64 string');
          base64Data = input.fileData;
          mimeType = input.fileType;
        }

        if (!base64Data) {
          throw new Error("No data found in base64 string");
        }

        console.log('Detected MIME type:', mimeType);
        console.log('Base64 data length:', base64Data.length);

        const buffer = Buffer.from(base64Data, "base64");

        // 检查文件大小（限制为 10MB）
        const fileSizeInMB = buffer.length / (1024 * 1024);
        if (fileSizeInMB > 10) {
          throw new Error(`文件太大 (${fileSizeInMB.toFixed(2)}MB)，请上传小于 10MB 的文件`);
        }

        // 生成唯一的文件名
        const fileExt = path.extname(input.fileName);
        const uniqueFileName = `${randomUUID()}${fileExt}`;

        // 确保上传目录存在（使用 output 目录）
        const uploadDir = path.join(process.cwd(), "output", "uploads", "feedback");
        await mkdir(uploadDir, { recursive: true });

        // 保存文件
        const filePath = path.join(uploadDir, uniqueFileName);
        await writeFile(filePath, buffer);

        console.log(`File uploaded successfully: ${filePath} (${fileSizeInMB.toFixed(2)}MB)`);

        // 返回可访问的 URL 路径（通过 /api/uploads 路由访问）
        const fileUrl = `/api/uploads/feedback/${uniqueFileName}`;

        return {
          success: true,
          fileUrl,
          fileName: uniqueFileName,
        };
      } catch (error) {
        console.error("File upload error:", error);
        if (error instanceof Error) {
          throw new Error(error.message);
        }
        throw new Error("文件上传失败");
      }
    }),

  // 提交反馈
  create: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1, "反馈内容不能为空"),
        attachments: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const feedback = await ctx.db.feedback.create({
        data: {
          userId,
          content: input.content,
          attachments: input.attachments,
        },
      });

      return feedback;
    }),

  // 获取用户的历史反馈列表（分页）
  getMyFeedbacks: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const skip = (input.page - 1) * input.pageSize;

      // 获取总数
      const total = await ctx.db.feedback.count({
        where: { userId },
      });

      // 获取反馈列表
      const feedbacks = await ctx.db.feedback.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: input.pageSize,
      });

      return {
        data: feedbacks,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  // 获取单个反馈详情
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const feedback = await ctx.db.feedback.findFirst({
        where: {
          id: input.id,
          userId, // 确保用户只能查看自己的反馈
        },
      });

      if (!feedback) {
        throw new Error("反馈不存在");
      }

      return feedback;
    }),

  // 删除反馈
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // 确保用户只能删除自己的反馈
      const feedback = await ctx.db.feedback.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!feedback) {
        throw new Error("反馈不存在或无权限删除");
      }

      await ctx.db.feedback.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
