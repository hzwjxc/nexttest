import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

// 文件信息schema
const FileItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  size: z.number(),
  status: z.enum(['uploading', 'success', 'error']),
});

// 基本信息schema
const BasicInfoSchema = z.object({
  taskSystem: z.string().min(1, '请选择系统'),
  taskName: z.string().min(1, '请输入任务名称'),
  taskDescription: z.string().min(1, '请输入任务描述'),
  testType: z.string().default('手机客户端'),
  testRules: z.string().optional(),
  testData: z.string().optional(),
  files: z.array(FileItemSchema).optional(),
});

// 测试用例schema
const TestCaseSchema = z.object({
  id: z.number(),
  sequence: z.number(),
  system: z.string(),
  name: z.string(),
  focus: z.string(),
  originalId: z.string().optional(),
});

// 测试设计schema
const TestDesignSchema = z.object({
  testCases: z.array(TestCaseSchema),
  testPoints: z.string().optional(),
});

// 积分奖励配置schema
const PointsOptionSchema = z.object({
  label: z.string(),
  value: z.number(),
  unit: z.string(),
});

// 任务发布schema
const TaskPublishSchema = z.object({
  personTags: z.array(z.string()),
  selectedTagIds: z.array(z.string()),
  taskDate: z.string(),
  participants: z.string(),
  executePoints: z.string(),
  ruleFilter: z.string(),
  pointsOptions: z.array(PointsOptionSchema),
  emailNotify: z.boolean(),
  emailContent: z.string().optional(),
  selectedEmailTemplate: z.string().optional(),
  smsNotify: z.boolean(),
  smsContent: z.string().optional(),
  selectedSmsTemplate: z.string().optional(),
  groupInvite: z.boolean(),
  thumbnailImage: z.string().nullable().optional(),
  wechatContent: z.string().optional(),
  selectedWechatTemplate: z.string().optional(),
  isPaused: z.boolean().optional().default(false),
});

// 完整的任务保存schema
const SaveTaskSchema = z.object({
  basicInfo: BasicInfoSchema,
  testDesign: TestDesignSchema,
  taskPublish: TaskPublishSchema,
  isDraft: z.boolean().optional().default(false),
});

export const taskPublishRouter = createTRPCRouter({
  // 保存任务(草稿或发布)
  save: protectedProcedure
    .input(SaveTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { basicInfo, testDesign, taskPublish, isDraft } = input;

      // 将personTags转换为测试类型数组
      const testTypes: string[] = [];
      if (basicInfo.testType === '手机客户端') {
        testTypes.push('ANDROID', 'IOS');
      } else if (basicInfo.testType === 'PC客户端') {
        testTypes.push('WEB');
      } else if (basicInfo.testType === '语音对话') {
        testTypes.push('VOICE');
      }

      // 创建任务
      const task = await ctx.db.testTask.create({
        data: {
          title: basicInfo.taskName,
          description: basicInfo.taskDescription,
          type: 'FUNCTIONAL', // 默认功能测试类,可以根据需求调整
          system: basicInfo.taskSystem,
          testTypes,
          environment: basicInfo.testData || undefined,
          testPoints: testDesign.testPoints || undefined,
          testRules: basicInfo.testRules || undefined,
          personTags: taskPublish.personTags,
          ruleFilter: taskPublish.ruleFilter || undefined,
          thumbnailImage: taskPublish.thumbnailImage || undefined,
          attachments: basicInfo.files && basicInfo.files.length > 0
            ? JSON.stringify(basicInfo.files)
            : undefined,
          status: isDraft ? 'SAVED' : 'PREPARING',
          startTime: new Date(),
          endTime: new Date(taskPublish.taskDate + 'T23:59:59+08:00'),
          maxParticipants: parseInt(taskPublish.participants),
          createdBy: ctx.session.user.id,
          executionPoints: parseInt(taskPublish.executePoints),
          estimatedParticipants: parseInt(taskPublish.participants),
          isPaused: taskPublish.isPaused || false,
          // 关联测试用例(只关联有originalId的用例)
          testCases: {
            connect: testDesign.testCases
              .filter((tc) => tc.originalId && !tc.originalId.startsWith('imported-'))
              .map((tc) => ({ id: tc.originalId as string })),
          },
        } as any,
      });

      // 创建奖励配置
      await ctx.db.rewardConfig.create({
        data: {
          taskId: task.id,
          executionPoints: parseInt(taskPublish.executePoints),
          totalBudget: 0, // 可以根据实际需求计算
          pointsConfig: JSON.stringify(taskPublish.pointsOptions), // 保存动态配置
        },
      });

      // 创建通知配置
      await ctx.db.notificationConfig.create({
        data: {
          taskId: task.id,
          wechatEnabled: taskPublish.groupInvite,
          wechatTemplate: taskPublish.wechatContent || undefined,
          wechatTemplateId: taskPublish.selectedWechatTemplate || undefined,
          lanxinEnabled: taskPublish.smsNotify,
          lanxinTemplate: taskPublish.smsContent || undefined,
          lanxinTemplateId: taskPublish.selectedSmsTemplate || undefined,
          emailEnabled: taskPublish.emailNotify,
          emailTemplate: taskPublish.emailContent || undefined,
          emailTemplateId: taskPublish.selectedEmailTemplate || undefined,
        } as any,
      });

      return {
        success: true,
        taskId: task.id,
        message: isDraft ? '任务已保存为草稿' : '任务已提交审批',
      };
    }),

  // 获取任务详情
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const task = await ctx.db.testTask.findUnique({
        where: { id: input.id },
        include: {
          testCases: {
            select: {
              id: true,
              title: true,
              system: true,
              explanation: true,
            },
          },
          rewardConfig: true,
          notificationConfig: true,
          orders: {
            where: { userId },
            select: {
              id: true,
              status: true,
              earnedPoints: true,
              defectCount: true,
              validDefectCount: true,
              startedAt: true,
              submittedAt: true,
              completedAt: true,
            },
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
      });

      if (!task) {
        throw new Error('任务不存在');
      }

      const now = new Date();

      // 计算剩余名额
      const spotsRemaining = task.maxParticipants - task.currentParticipants;

      // 计算剩余时间 - 基于用户期望的本地时间概念
      const taskEndTimeUserLocal = new Date(task.endTime.toLocaleDateString() + ' 23:59:59');
      const nowUserLocal = new Date(now.toLocaleDateString() + ' ' + now.toLocaleTimeString());
      const timeDiff = taskEndTimeUserLocal.getTime() - nowUserLocal.getTime();
      const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hoursRemaining = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      // 判断任务状态
      const isEnded = task.endTime < now;
      const isFull = spotsRemaining <= 0;
      const userOrder = task.orders[0];

      // 确定任务状态
      // 根据设计图：
      // status1: 待领取 - 用户未领取
      // status2: 待完成 - 用户已领取，等待审核判定
      // status3: 已完成 - 审核判定完成（任务状态为 ACCOUNTING_COMPLETED 或更后）
      // status4: 已满员 - 名额已满
      // status5: 已结束 - 积分发放完成或任务到结束时间
      let taskStatus: 'status1' | 'status2' | 'status3' | 'status4' | 'status5';
      
      if (isEnded) {
        taskStatus = 'status5'; // 已结束
      } else if (isFull) {
        taskStatus = 'status4'; // 已满员
      } else if (userOrder) {
        // 用户已领取，判断任务是否完成审核判定
        // 当任务状态为 ACCOUNTING_COMPLETED 或之后时，表示已完成审核判定
        if (task.status === 'ACCOUNTING_COMPLETED' || 
            task.status === 'REWARD_DISTRIBUTION_REVIEW' || 
            task.status === 'PENDING_REWARD_DISTRIBUTION' || 
            task.status === 'COMPLETED') {
          taskStatus = 'status3'; // 已完成（审核判定完成）
        } else {
          taskStatus = 'status2'; // 待完成（等待审核判定）
        }
      } else {
        taskStatus = 'status1'; // 待领取
      }

      // 解析附件
      let attachments = [];
      if (task.attachments) {
        try {
          attachments = JSON.parse(task.attachments);
        } catch (e) {
          console.error('Failed to parse attachments:', e);
        }
      }

      // 解析奖励规则（从 pointsConfig 获取）
      let rewardRules = [];
      if (task.rewardConfig?.pointsConfig) {
        try {
          rewardRules = JSON.parse(task.rewardConfig.pointsConfig);
        } catch (e) {
          console.error('Failed to parse reward rules:', e);
        }
      }

      // 构建任务跟踪数据
      const taskTrackingSteps = [];
      
      // 步骤1：任务领取
      if (userOrder?.startedAt) {
        taskTrackingSteps.push({
          id: 1,
          title: '任务领取',
          timestamp: userOrder.startedAt.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          status: 'completed',
        });
      }

      // 步骤2：缺陷提交
      if (userOrder?.submittedAt) {
        taskTrackingSteps.push({
          id: 2,
          title: '缺陷提交',
          timestamp: userOrder.submittedAt.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          status: 'completed',
        });
      }

      // 步骤3：已判定
      if (userOrder?.completedAt) {
        taskTrackingSteps.push({
          id: 3,
          title: '已判定',
          timestamp: userOrder.completedAt.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          status: 'completed',
        });
      }

      // 步骤4：积分发放（仅在任务已结束时显示）
      if (isEnded && userOrder?.completedAt) {
        taskTrackingSteps.push({
          id: 4,
          title: '积分发放',
          timestamp: task.accountingCompletedAt?.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }) || userOrder.completedAt.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          status: 'completed',
        });
      }

      return {
        ...task,
        taskStatus,
        spotsRemaining: Math.max(0, spotsRemaining),
        timeRemaining: isEnded ? '0天0小时' : `${daysRemaining}天${hoursRemaining}小时`,
        userOrder,
        attachments,
        rewardRules, // 奖励积分配置
        testRules: task.testRules, // 测试规则文本
        taskTrackingSteps, // 任务跟踪步骤
        testCases: task.testCases.map((tc) => ({
          id: tc.id,
          system: tc.system,
          name: tc.title,
          testFocus: tc.explanation || '',
        })),
      };
    }),

  // 更新任务
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: SaveTaskSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { basicInfo, testDesign, taskPublish, isDraft } = input.data;

      // 获取当前任务状态
      const currentTask = await ctx.db.testTask.findUnique({
        where: { id: input.id },
        select: { status: true },
      });

      // 将personTags转换为测试类型数组
      const testTypes: string[] = [];
      if (basicInfo.testType === '手机客户端') {
        testTypes.push('ANDROID', 'IOS');
      } else if (basicInfo.testType === 'PC客户端') {
        testTypes.push('WEB');
      } else if (basicInfo.testType === '语音对话') {
        testTypes.push('VOICE');
      }

      // 确定新状态：如果任务已在执行中或之后的状态，保持原状态；否则根据isDraft设置
      let newStatus = currentTask?.status;
      if (!newStatus || ['SAVED', 'PREPARING', 'DEPT_REWARD_REVIEW', 'GENERAL_REWARD_REVIEW', 'PENDING_PUBLISH'].includes(newStatus)) {
        newStatus = isDraft ? 'SAVED' : 'PREPARING';
      }

      // 更新任务
      const task = await ctx.db.testTask.update({
        where: { id: input.id },
        data: {
          title: basicInfo.taskName,
          description: basicInfo.taskDescription,
          system: basicInfo.taskSystem,
          testTypes,
          environment: basicInfo.testData || undefined,
          testPoints: testDesign.testPoints || undefined,
          testRules: basicInfo.testRules || undefined,
          personTags: taskPublish.personTags,
          ruleFilter: taskPublish.ruleFilter || undefined,
          thumbnailImage: taskPublish.thumbnailImage || undefined,
          attachments: basicInfo.files && basicInfo.files.length > 0
            ? JSON.stringify(basicInfo.files)
            : undefined,
          status: newStatus,
          endTime: new Date(taskPublish.taskDate + 'T23:59:59+08:00'),
          maxParticipants: parseInt(taskPublish.participants),
          executionPoints: parseInt(taskPublish.executePoints),
          estimatedParticipants: parseInt(taskPublish.participants),
          isPaused: taskPublish.isPaused || false,
          // 更新测试用例关联
          testCases: {
            set: testDesign.testCases
              .filter((tc) => tc.originalId && !tc.originalId.startsWith('imported-'))
              .map((tc) => ({ id: tc.originalId as string })),
          },
        } as any,
      });

      // 更新奖励配置
      await ctx.db.rewardConfig.upsert({
        where: { taskId: task.id },
        update: {
          executionPoints: parseInt(taskPublish.executePoints),
          pointsConfig: JSON.stringify(taskPublish.pointsOptions), // 保存动态配置
        },
        create: {
          taskId: task.id,
          executionPoints: parseInt(taskPublish.executePoints),
          totalBudget: 0,
          pointsConfig: JSON.stringify(taskPublish.pointsOptions), // 保存动态配置
        },
      });

      // 更新通知配置
      await ctx.db.notificationConfig.upsert({
        where: { taskId: task.id },
        update: {
          wechatEnabled: taskPublish.groupInvite,
          wechatTemplate: taskPublish.wechatContent || undefined,
          wechatTemplateId: taskPublish.selectedWechatTemplate || undefined,
          lanxinEnabled: taskPublish.smsNotify,
          lanxinTemplate: taskPublish.smsContent || undefined,
          lanxinTemplateId: taskPublish.selectedSmsTemplate || undefined,
          emailEnabled: taskPublish.emailNotify,
          emailTemplate: taskPublish.emailContent || undefined,
          emailTemplateId: taskPublish.selectedEmailTemplate || undefined,
        } as any,
        create: {
          taskId: task.id,
          wechatEnabled: taskPublish.groupInvite,
          wechatTemplate: taskPublish.wechatContent || undefined,
          wechatTemplateId: taskPublish.selectedWechatTemplate || undefined,
          lanxinEnabled: taskPublish.smsNotify,
          lanxinTemplate: taskPublish.smsContent || undefined,
          lanxinTemplateId: taskPublish.selectedSmsTemplate || undefined,
          emailEnabled: taskPublish.emailNotify,
          emailTemplate: taskPublish.emailContent || undefined,
          emailTemplateId: taskPublish.selectedEmailTemplate || undefined,
        } as any,
      });

      return {
        success: true,
        taskId: task.id,
        message: isDraft ? '任务已保存为草稿' : '任务已提交审批',
      };
    }),

  // 删除任务
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.testTask.update({
        where: { id: input.id },
        data: { isDeleted: true },
      });

      return {
        success: true,
        message: '任务已删除',
      };
    }),

  // 获取任务列表
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(10),
        status: z.enum([
          'SAVED',
          'PREPARING',
          'DEPT_REWARD_REVIEW',
          'GENERAL_REWARD_REVIEW',
          'PENDING_PUBLISH',
          'EXECUTING',
          'EXECUTION_ENDED',
          'ACCOUNTING_COMPLETED',
          'REWARD_DISTRIBUTION_REVIEW',
          'PENDING_REWARD_DISTRIBUTION',
          'COMPLETED',
        ]).optional(),
        system: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, system } = input;

      const where = {
        isDeleted: false,
        ...(status && { status: status as any }),
        ...(system && { system }),
      };

      const [tasks, total] = await Promise.all([
        ctx.db.testTask.findMany({
          where,
          include: {
            testCases: true,
            rewardConfig: true,
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.testTask.count({ where }),
      ]);

      return {
        data: tasks,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  // 获取任务大厅列表（包含用户参与状态）
  getTaskHallList: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(10),
        type: z.enum(['pending', 'in-progress', 'completed']).default('pending'),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, type, search } = input;
      const userId = ctx.session.user.id;

      // 根据type确定查询条件
      let where: any = {
        isDeleted: false,
        isPaused: false,
      };

      if (type === 'pending') {
        // 待领取：状态为EXECUTING且用户未参与的任务
        where.status = 'EXECUTING';
        where.NOT = {
          orders: {
            some: {
              userId,
            },
          },
        };
      } else if (type === 'in-progress') {
        // 进行中：用户已领取但未完成的任务
        where.orders = {
          some: {
            userId,
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
          },
        };
      } else if (type === 'completed') {
        // 已完成：用户已完成的任务
        where.orders = {
          some: {
            userId,
            status: {
              in: ['SUBMITTED', 'COMPLETED'],
            },
          },
        };
      }

      // 搜索条件
      if (search) {
        where.title = {
          contains: search,
          mode: 'insensitive',
        };
      }

      // 标签权限控制：只有设置了对应人员标签的人员才能看到该任务
      // 先获取当前用户的所有标签
      const userTags = await ctx.db.testingUserTag.findMany({
        where: { userId },
        include: {
          tag: true,
        },
      });

      // 提取用户标签的名称和值，用于权限匹配
      const userTagLabels = userTags.map(ut => ut.tag.name);
      const userTagValues = userTags.map(ut => ut.value).filter(v => v !== null) as string[];
      const userTagSet = new Set([...userTagLabels, ...userTagValues]);

      // 添加标签过滤条件到现有where条件中
      const tagFilter = {
        OR: [
          // 任务没有设置人员标签（所有人都可见）
          {
            personTags: {
              equals: [],
            },
          },
          // 任务设置了人员标签，且用户拥有其中任意一个标签
          {
            personTags: {
              hasSome: Array.from(userTagSet),
            },
          },
        ],
      };

      // 将标签过滤条件合并到where中
      where = {
        ...where,
        ...tagFilter,
      };

      const [tasks, total] = await Promise.all([
        ctx.db.testTask.findMany({
          where,
          include: {
            rewardConfig: true,
            orders: {
              where: { userId },
              select: {
                id: true,
                status: true,
                earnedPoints: true,
                defectCount: true,
                validDefectCount: true,
              },
            },
            _count: {
              select: {
                orders: true,
              },
            },
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.testTask.count({ where }),
      ]);

      // 转换数据格式
      const formattedTasks = tasks.map((task) => {
        const userOrder = task.orders[0];
        const spotsRemaining = task.maxParticipants - task.currentParticipants;
        const now = new Date();
        const isEnded = task.endTime < now;

        // 计算剩余时间 - 基于用户期望的本地时间概念
        const taskEndTimeUserLocal = new Date(task.endTime.toLocaleDateString() + ' 23:59:59');
        const nowUserLocal = new Date(now.toLocaleDateString() + ' ' + now.toLocaleTimeString());
        const timeDiff = taskEndTimeUserLocal.getTime() - nowUserLocal.getTime();
        const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        let timeRemaining: string;
        if (type === 'completed') {
          // 已完成任务显示完成时间
          timeRemaining = userOrder?.earnedPoints
            ? task.endTime.toISOString()
            : task.endTime.toISOString();
        } else {
          timeRemaining = isEnded ? '0天0小时' : `${daysRemaining}天${hoursRemaining}小时`;
        }

        // 确定任务状态
        let taskStatus: 'available' | 'full' | 'ended';
        if (isEnded) {
          taskStatus = 'ended';
        } else if (spotsRemaining <= 0) {
          taskStatus = 'full';
        } else {
          taskStatus = 'available';
        }

        return {
          id: task.id,
          title: task.title,
          image: task.thumbnailImage || '/images/task-hall/task-icon.png',
          timeRemaining,
          spotsRemaining: Math.max(0, spotsRemaining),
          status: taskStatus,
          type,
          pendingPoints: userOrder?.earnedPoints || undefined,
          reviewStatus: userOrder?.status === 'SUBMITTED' ? 'reviewing' as const : undefined,
        };
      });

      return {
        data: formattedTasks,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  // 领取任务
  claimTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { taskId } = input;
      const userId = ctx.session.user.id;

      // 检查任务是否存在
      const task = await ctx.db.testTask.findUnique({
        where: { id: taskId },
        include: {
          _count: {
            select: {
              orders: true,
            },
          },
        },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '任务不存在',
        });
      }

      // 检查任务状态
      if (task.status !== 'EXECUTING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '任务当前不可领取',
        });
      }

      // 检查任务是否已结束
      const now = new Date();
      if (task.endTime < now) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '任务已结束',
        });
      }

      // 检查是否已满员
      if (task.currentParticipants >= task.maxParticipants) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '任务已满员',
        });
      }

      // 检查用户是否已领取过该任务
      const existingOrder = await ctx.db.testTaskOrder.findUnique({
        where: {
          taskId_userId: {
            taskId,
            userId,
          },
        },
      });

      if (existingOrder) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '您已领取过该任务',
        });
      }

      // 创建任务订单
      const order = await ctx.db.testTaskOrder.create({
        data: {
          taskId,
          userId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      // 更新任务当前参与人数
      await ctx.db.testTask.update({
        where: { id: taskId },
        data: {
          currentParticipants: {
            increment: 1,
          },
        },
      });

      return {
        success: true,
        message: '任务领取成功',
        data: order,
      };
    }),
});
