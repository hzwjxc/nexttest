import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { DefectType, DefectStatus } from '@prisma/client';
import { validateDictionaryValue } from '@/server/api/utils/dictionaryValidator';

export const defectRouter = createTRPCRouter({
    // 创建缺陷/建议（无测试用例任务）
    createWithoutTestCase: protectedProcedure
        .input(
            z.object({
                taskId: z.string(),
                title: z.string().min(1, '标题不能为空'),
                description: z.string().min(1, '描述不能为空'),
                type: z.enum(['BUG', 'SUGGESTION']),
                attachments: z.array(z.string()).optional(),
                isDraft: z.boolean().default(false),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // 检查任务是否存在
            const task = await ctx.db.testTask.findUnique({
                where: { id: input.taskId },
            });

            if (!task) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '任务不存在',
                });
            }

            // 查找或创建任务订单
            let taskOrder = await ctx.db.testTaskOrder.findUnique({
                where: {
                    taskId_userId: {
                        taskId: input.taskId,
                        userId: userId,
                    },
                },
            });

            if (!taskOrder) {
                // 创建新的任务订单
                taskOrder = await ctx.db.testTaskOrder.create({
                    data: {
                        taskId: input.taskId,
                        userId: userId,
                        status: 'IN_PROGRESS',
                    },
                });
            }

            // 创建缺陷/建议（不关联具体测试用例）
            const defect = await ctx.db.defect.create({
                data: {
                    taskId: input.taskId,
                    taskOrderId: taskOrder.id,
                    // testCaseId 不设置，对于无测试用例任务允许为空
                    userId: userId,
                    title: input.title,
                    description: input.description,
                    type: input.type as DefectType,
                    status: input.isDraft
                        ? DefectStatus.SUBMITTED
                        : DefectStatus.SUBMITTED,
                    attachments: input.attachments || [],
                    isDraft: input.isDraft,
                },
            });

            // 如果不是草稿，更新订单的缺陷数量
            if (!input.isDraft) {
                await ctx.db.testTaskOrder.update({
                    where: { id: taskOrder.id },
                    data: {
                        defectCount: {
                            increment: 1,
                        },
                    },
                });
            }

            return {
                success: true,
                message: input.isDraft ? '保存草稿成功' : '提交成功',
                data: defect,
            };
        }),

    // 创建缺陷/建议
    create: protectedProcedure
        .input(
            z.object({
                taskId: z.string(),
                testCaseId: z.string(),
                title: z.string().min(1, '标题不能为空'),
                description: z.string().min(1, '描述不能为空'),
                type: z.enum(['BUG', 'SUGGESTION']),
                relatedStep: z.string().optional(),
                attachments: z.array(z.string()).optional(),
                isDraft: z.boolean().default(false),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // 检查任务是否存在
            const task = await ctx.db.testTask.findUnique({
                where: { id: input.taskId },
            });

            if (!task) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '任务不存在',
                });
            }

            // 检查用例是否存在
            const testCase = await ctx.db.testCase.findUnique({
                where: { id: input.testCaseId },
            });

            if (!testCase) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '用例不存在',
                });
            }

            // 查找或创建任务订单
            let taskOrder = await ctx.db.testTaskOrder.findUnique({
                where: {
                    taskId_userId: {
                        taskId: input.taskId,
                        userId: userId,
                    },
                },
            });

            if (!taskOrder) {
                // 创建新的任务订单
                taskOrder = await ctx.db.testTaskOrder.create({
                    data: {
                        taskId: input.taskId,
                        userId: userId,
                        status: 'IN_PROGRESS',
                    },
                });
            }

            // 创建缺陷/建议
            const defect = await ctx.db.defect.create({
                data: {
                    taskId: input.taskId,
                    taskOrderId: taskOrder.id,
                    testCaseId: input.testCaseId,
                    userId: userId,
                    title: input.title,
                    description: input.description,
                    type: input.type as DefectType,
                    status: input.isDraft
                        ? DefectStatus.SUBMITTED
                        : DefectStatus.SUBMITTED,
                    attachments: input.attachments || [],
                    isDraft: input.isDraft,
                    steps: input.relatedStep,
                },
            });

            // 如果不是草稿，更新订单的缺陷数量
            if (!input.isDraft) {
                await ctx.db.testTaskOrder.update({
                    where: { id: taskOrder.id },
                    data: {
                        defectCount: {
                            increment: 1,
                        },
                    },
                });
            }

            return {
                success: true,
                message: input.isDraft ? '保存草稿成功' : '提交成功',
                data: defect,
            };
        }),

    // 获取用户在某个任务下的缺陷列表
    listByTask: protectedProcedure
        .input(
            z.object({
                taskId: z.string(),
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
            })
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const { taskId, page, pageSize } = input;
            const skip = (page - 1) * pageSize;

            const where = {
                taskId,
                userId,
            };

            const total = await ctx.db.defect.count({ where });

            const data = await ctx.db.defect.findMany({
                where,
                include: {
                    testCase: {
                        select: {
                            title: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
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

    // 根据ID获取缺陷详情
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const defect = await ctx.db.defect.findUnique({
                where: { id: input.id },
                include: {
                    testCase: true,
                    task: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            if (!defect) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '缺陷不存在',
                });
            }

            return defect;
        }),

    // 更新缺陷/建议
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string().min(1, '标题不能为空'),
                description: z.string().min(1, '描述不能为空'),
                type: z.enum(['BUG', 'SUGGESTION']),
                relatedStep: z.string().optional(),
                attachments: z.array(z.string()).optional(),
                isDraft: z.boolean().default(false),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            const userId = ctx.session.user.id;

            // 检查缺陷是否存在且属于当前用户
            const existingDefect = await ctx.db.defect.findUnique({
                where: { id },
            });

            if (!existingDefect) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '缺陷不存在',
                });
            }

            if (existingDefect.userId !== userId) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: '无权限修改此缺陷',
                });
            }

            const defect = await ctx.db.defect.update({
                where: { id },
                data: {
                    title: data.title,
                    description: data.description,
                    type: data.type as DefectType,
                    attachments: data.attachments || [],
                    isDraft: data.isDraft,
                    steps: data.relatedStep,
                },
            });

            return {
                success: true,
                message: '更新成功',
                data: defect,
            };
        }),

    // 删除缺陷/建议
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // 检查缺陷是否存在且属于当前用户
            const defect = await ctx.db.defect.findUnique({
                where: { id: input.id },
            });

            if (!defect) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '缺陷不存在',
                });
            }

            if (defect.userId !== userId) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: '无权限删除此缺陷',
                });
            }

            await ctx.db.defect.delete({
                where: { id: input.id },
            });

            return {
                success: true,
                message: '删除成功',
            };
        }),

    // 获取待判定缺陷列表（用于业务判定页面）
    listForJudgment: publicProcedure
        .input(
            z.object({
                taskId: z.string().optional(),
                status: z.enum(['SUBMITTED', 'REVIEWING']).optional(),
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
            })
        )
        .query(async ({ ctx, input }) => {
            const { taskId, status, page, pageSize } = input;
            const skip = (page - 1) * pageSize;

            const where: any = {
                // 排除已经被添加到重复缺陷组的缺陷
                duplicateGroupId: null,
            };

            // 如果指定了状态，则按状态筛选；否则查询所有待判定的缺陷（SUBMITTED 和 REVIEWING）
            if (status) {
                where.status = status;
            } else {
                where.status = {
                    in: ['SUBMITTED', 'REVIEWING'],
                };
            }

            if (taskId) {
                where.taskId = taskId;
            }

            const total = await ctx.db.defect.count({ where });

            const data = await ctx.db.defect.findMany({
                where,
                include: {
                    testCase: {
                        select: {
                            id: true,
                            title: true,
                            testSteps: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    task: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
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

    // 获取重复缺陷组列表
    listDuplicateGroups: publicProcedure
        .input(
            z.object({
                taskId: z.string().optional(),
                status: z.enum(['SUBMITTED', 'REVIEWING']).optional(),
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(20),
            })
        )
        .query(async ({ ctx, input }) => {
            const { taskId, status, page, pageSize } = input;
            const skip = (page - 1) * pageSize;

            // 构建缺陷过滤条件（用于筛选待判定的缺陷）
            const defectWhere: any = {};
            if (taskId) {
                defectWhere.taskId = taskId;
            }
            if (status) {
                defectWhere.status = status;
            }

            // 获取所有组（不过滤）
            const total = await ctx.db.defectGroup.count();

            const groups = await ctx.db.defectGroup.findMany({
                include: {
                    defects: {
                        where: taskId ? { taskId } : {}, // 只按任务过滤，不按状态过滤
                        select: {
                            id: true,
                            status: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            });

            // 转换为前端需要的格式
            const data = groups.map((group) => ({
                id: group.id,
                title: group.name,
                defectCount: group.defects.length, // 组内所有缺陷数量
                pendingCount: group.defects.filter(
                    (d) => d.status === 'REVIEWING' || d.status === 'SUBMITTED'
                ).length, // 待判定的缺陷数量
            }));

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

    // 获取重复缺陷组详情（包含组内所有缺陷）
    getDuplicateGroupDetail: publicProcedure
        .input(z.object({ groupId: z.string() }))
        .query(async ({ ctx, input }) => {
            const { groupId } = input;

            // 获取缺陷组
            const group = await ctx.db.defectGroup.findUnique({
                where: { id: groupId },
                include: {
                    defects: {
                        include: {
                            testCase: {
                                select: {
                                    id: true,
                                    title: true,
                                    testSteps: true,
                                },
                            },
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });

            if (!group) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '缺陷组不存在',
                });
            }

            return {
                mainDefect: null, // 新结构不需要主缺陷
                duplicateDefects: group.defects,
                totalCount: group.defects.length,
            };
        }),

    // 创建重复缺陷组
    createDuplicateGroup: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1, '请输入组名'),
                defectIds: z.array(z.string()).optional().default([]),
                description: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { name, defectIds, description } = input;
            const userId = ctx.session.user.id;

            // 如果有缺陷ID，验证所有缺陷存在
            if (defectIds.length > 0) {
                const defects = await ctx.db.defect.findMany({
                    where: {
                        id: {
                            in: defectIds,
                        },
                    },
                });

                if (defects.length !== defectIds.length) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: '部分缺陷不存在',
                    });
                }
            }

            // 创建重复缺陷组
            const group = await ctx.db.defectGroup.create({
                data: {
                    name,
                    description,
                    createdBy: userId,
                },
            });

            // 如果有缺陷ID，将缺陷关联到组
            if (defectIds.length > 0) {
                await ctx.db.defect.updateMany({
                    where: {
                        id: {
                            in: defectIds,
                        },
                    },
                    data: {
                        duplicateGroupId: group.id,
                    },
                });
            }

            return {
                success: true,
                message: '创建重复缺陷组成功',
                groupId: group.id,
            };
        }),

    // 添加缺陷到重复缺陷组
    addDefectToGroup: protectedProcedure
        .input(
            z.object({
                groupId: z.string().min(1, '请指定缺陷组'),
                defectId: z.string().min(1, '请指定缺陷'),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { groupId, defectId } = input;

            // 验证缺陷组存在
            const group = await ctx.db.defectGroup.findUnique({
                where: { id: groupId },
            });

            if (!group) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '缺陷组不存在',
                });
            }

            // 验证缺陷存在
            const defect = await ctx.db.defect.findUnique({
                where: { id: defectId },
            });

            if (!defect) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '缺陷不存在',
                });
            }

            // 检查缺陷是否已在其他组中
            if (
                defect.duplicateGroupId &&
                defect.duplicateGroupId !== groupId
            ) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '缺陷已在其他重复缺陷组中，请先移出',
                });
            }

            // 将缺陷添加到组
            await ctx.db.defect.update({
                where: { id: defectId },
                data: {
                    duplicateGroupId: groupId,
                },
            });

            return {
                success: true,
                defectId: defectId,
            };
        }),

    // 从重复缺陷组移出缺陷
    removeDefectFromGroup: protectedProcedure
        .input(
            z.object({
                defectId: z.string().min(1, '请指定缺陷'),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { defectId } = input;

            // 验证缺陷存在
            const defect = await ctx.db.defect.findUnique({
                where: { id: defectId },
            });

            if (!defect) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '缺陷不存在',
                });
            }

            // 检查缺陷是否在组中
            if (!defect.duplicateGroupId) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '缺陷不在任何重复缺陷组中',
                });
            }

            // 从组中移出缺陷
            await ctx.db.defect.update({
                where: { id: defectId },
                data: {
                    duplicateGroupId: null,
                },
            });

            return {
                success: true,
                defectId: defectId,
            };
        }),

    // 删除重复缺陷组
    deleteDuplicateGroup: protectedProcedure
        .input(
            z.object({
                groupId: z.string().min(1, '请指定缺陷组'),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { groupId } = input;

            // 验证缺陷组存在
            const group = await ctx.db.defectGroup.findUnique({
                where: { id: groupId },
                include: {
                    defects: {
                        select: { id: true },
                    },
                },
            });

            if (!group) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '缺陷组不存在',
                });
            }

            // 检查组内是否有缺陷
            if (group.defects.length > 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '组内还有缺陷，请先移出所有缺陷',
                });
            }

            // 删除缺陷组
            await ctx.db.defectGroup.delete({
                where: { id: groupId },
            });

            return {
                success: true,
                message: '缺陷组已删除',
            };
        }),

    // 批量导入缺陷
    batchImport: protectedProcedure
        .input(
            z.object({
                defects: z.array(
                    z.object({
                        defectNo: z.string().optional(),
                        title: z.string().min(1, '标题不能为空'),
                        description: z.string().min(1, '描述不能为空'),
                        points: z.number().optional(),
                        type: z.enum(['BUG', 'SUGGESTION']),
                        caseName: z.string().optional(),
                        relatedSteps: z.string().optional(),
                        attachments: z.string().optional(),
                        reviewComment: z.string().optional(),
                        deviceModel: z.string().optional(),
                        system: z.string().optional(),
                        submitter: z.string().optional(),
                        submitTime: z.string().optional(),
                        taskId: z.string().min(1, '任务ID不能为空'),
                        testCaseId: z.string().min(1, '用例ID不能为空'),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const { defects } = input;

            const results = {
                success: 0,
                failed: 0,
                errors: [] as string[],
            };

            // 逐个处理缺陷导入
            for (let i = 0; i < defects.length; i++) {
                const defectData = defects[i];

                try {
                    // 检查任务是否存在
                    const task = await ctx.db.testTask.findUnique({
                        where: { id: defectData.taskId },
                    });

                    if (!task) {
                        results.failed++;
                        results.errors.push(`第 ${i + 1} 行：任务不存在`);
                        continue;
                    }

                    // 检查用例是否存在
                    const testCase = await ctx.db.testCase.findUnique({
                        where: { id: defectData.testCaseId },
                    });

                    if (!testCase) {
                        results.failed++;
                        results.errors.push(`第 ${i + 1} 行：用例不存在`);
                        continue;
                    }

                    // 查找或创建任务订单
                    let taskOrder = await ctx.db.testTaskOrder.findUnique({
                        where: {
                            taskId_userId: {
                                taskId: defectData.taskId,
                                userId: userId,
                            },
                        },
                    });

                    if (!taskOrder) {
                        taskOrder = await ctx.db.testTaskOrder.create({
                            data: {
                                taskId: defectData.taskId,
                                userId: userId,
                                status: 'IN_PROGRESS',
                            },
                        });
                    }

                    // 解析附件字符串为数组
                    const attachments = defectData.attachments
                        ? defectData.attachments
                              .split(';')
                              .map((url) => url.trim())
                              .filter((url) => url)
                        : [];

                    // 创建缺陷
                    await ctx.db.defect.create({
                        data: {
                            taskId: defectData.taskId,
                            taskOrderId: taskOrder.id,
                            testCaseId: defectData.testCaseId,
                            userId: userId,
                            title: defectData.title,
                            description: defectData.description,
                            type: defectData.type as DefectType,
                            status: DefectStatus.SUBMITTED,
                            attachments: attachments,
                            isDraft: false,
                            steps: defectData.relatedSteps,
                            reviewComment: defectData.reviewComment,
                            earnedPoints: defectData.points || 0,
                        },
                    });

                    // 更新订单的缺陷数量
                    await ctx.db.testTaskOrder.update({
                        where: { id: taskOrder.id },
                        data: {
                            defectCount: {
                                increment: 1,
                            },
                        },
                    });

                    results.success++;
                } catch (error) {
                    results.failed++;
                    results.errors.push(
                        `第 ${i + 1} 行：导入失败 - ${error instanceof Error ? error.message : '未知错误'}`
                    );
                }
            }

            return {
                success: results.failed === 0,
                message: `导入完成：成功 ${results.success} 条，失败 ${results.failed} 条`,
                data: results,
            };
        }),

    // 更新缺陷状态
    updateStatus: protectedProcedure
        .input(
            z.object({
                defectId: z.string(),
                status: z.enum([
                    'SUBMITTED',
                    'REVIEWING',
                    'TO_CONFIRM',
                    'APPROVED',
                    'REJECTED',
                    'DUPLICATE',
                    'CLOSED',
                ]),
                reviewComment: z.string().optional(), // 审核意见（可选）
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { defectId, status, reviewComment } = input;
            const userId = ctx.session.user.id;

            // 检查缺陷是否存在
            const defect = await ctx.db.defect.findUnique({
                where: { id: defectId },
            });

            if (!defect) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '缺陷不存在',
                });
            }

            // 构建更新数据
            const updateData: any = {
                status: status as DefectStatus,
            };

            // 如果有审核意见，保存审核意见和审核者信息
            if (reviewComment) {
                updateData.reviewComment = reviewComment;
                updateData.reviewedBy = userId;
                updateData.reviewedAt = new Date();
            }

            // 如果更新到最终状态（APPROVED、REJECTED、DUPLICATE、CLOSED），计算basePoints
            if (
                ['APPROVED', 'REJECTED', 'DUPLICATE', 'CLOSED'].includes(status)
            ) {
                // 计算缺陷积分
                let basePoints = 0; // 等级积分（基础积分）
                let earnedPoints = 0; // 实际获得积分

                // 获取任务信息和奖励配置
                const [task, rewardConfig] = await Promise.all([
                    ctx.db.testTask.findUnique({
                        where: { id: defect.taskId },
                        select: { ruleFilter: true, executionPoints: true },
                    }),
                    ctx.db.rewardConfig.findUnique({
                        where: { taskId: defect.taskId },
                    }),
                ]);

                // 积分分配规则: 0-重复缺陷无效, 1-重复缺陷均分, 2-重复缺陷均按执行积分发放, 3-无奖励
                const ruleFilter = task?.ruleFilter ?? '1';

                if (rewardConfig?.pointsConfig) {
                    try {
                        const pointsOptions = JSON.parse(
                            rewardConfig.pointsConfig
                        ) as Array<{
                            label: string;
                            value: number;
                            unit: string;
                        }>;

                        // 获取数据字典，将等级代码转换为中文标签
                        const { getDictionaryItems } = await import(
                            '@/server/api/utils/dictionaryValidator'
                        );
                        let levelLabel: string | undefined;

                        if (defect.type === 'BUG' && defect.severity) {
                            const severityItems = await getDictionaryItems(
                                ctx.db,
                                'DEFECT_SEVERITY'
                            );
                            const severityItem = severityItems.find(
                                (item) => item.code === defect.severity
                            );
                            levelLabel = severityItem?.label;
                        } else if (
                            defect.type === 'SUGGESTION' &&
                            defect.suggestionLevel
                        ) {
                            const suggestionItems = await getDictionaryItems(
                                ctx.db,
                                'SUGGESTION_LEVEL'
                            );
                            const suggestionItem = suggestionItems.find(
                                (item) => item.code === defect.suggestionLevel
                            );
                            levelLabel = suggestionItem?.label;
                        }

                        // 根据中文标签查找对应的积分值
                        if (levelLabel) {
                            const pointsOption = pointsOptions.find(
                                (opt) => opt.label === levelLabel
                            );
                            if (pointsOption) {
                                basePoints = pointsOption.value;
                            }
                        }
                    } catch (e) {
                        console.error('计算缺陷等级积分失败:', e);
                    }
                }

                // 仅当状态为APPROVED时才计算earnedPoints（实际发放积分）
                if (status === 'APPROVED') {
                    // 规则3: 无奖励
                    if (ruleFilter === '3') {
                        earnedPoints = 0;
                    } else {
                        // 默认按basePoints发放
                        earnedPoints = basePoints;
                    }
                }

                updateData.basePoints = basePoints;
                updateData.earnedPoints = earnedPoints;
            }

            // 更新缺陷状态
            const updatedDefect = await ctx.db.defect.update({
                where: { id: defectId },
                data: updateData,
            });

            // 创建审核记录
            await ctx.db.defectReview.create({
                data: {
                    defectId: defectId,
                    reviewerId: userId,
                    action: status,
                    comment: reviewComment,
                },
            });

            return {
                success: true,
                message: '缺陷状态已更新',
                data: updatedDefect,
            };
        }),

    // 获取业务判定的可用等级选项
    getJudgmentOptions: publicProcedure.query(async ({ ctx }) => {
        const { getDictionaryMap } = await import(
            '@/server/api/utils/dictionaryValidator'
        );

        try {
            const severityOptions = await getDictionaryMap(
                ctx.db,
                'DEFECT_SEVERITY'
            );
            const suggestionOptions = await getDictionaryMap(
                ctx.db,
                'SUGGESTION_LEVEL'
            );

            return {
                severity: severityOptions,
                suggestionLevel: suggestionOptions,
            };
        } catch (error) {
            // 如果字典不存在，返回空对象
            return {
                severity: {},
                suggestionLevel: {},
            };
        }
    }),

    // 提交业务判定结果
    submitBusinessJudgment: publicProcedure
        .input(
            z.object({
                defectId: z.string(),
                conclusion: z.enum(['BUG', 'SUGGESTION']), // 结论：缺陷或建议
                severity: z.string().optional(), // 缺陷等级（从数据字典获取）
                suggestionLevel: z.string().optional(), // 建议等级（从数据字典获取）
                judgmentReason: z.string().min(1, '请填写原因说明'), // 判定原因
                defectType: z.string().optional(), // 缺陷类型（功能问题、性能问题等）
            })
        )
        .mutation(async ({ ctx, input }) => {
            const {
                defectId,
                conclusion,
                severity,
                suggestionLevel,
                judgmentReason,
                defectType,
            } = input;

            // 检查缺陷是否存在
            const defect = await ctx.db.defect.findUnique({
                where: { id: defectId },
            });

            if (!defect) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '缺陷不存在',
                });
            }

            // 检查缺陷状态是否为判定中
            if (defect.status !== 'REVIEWING') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '只能判定状态为"判定中"的缺陷',
                });
            }

            // 如果是缺陷，验证severity是否在数据字典中
            if (conclusion === 'BUG' && severity) {
                await validateDictionaryValue(
                    ctx.db,
                    'DEFECT_SEVERITY',
                    severity,
                    '缺陷等级'
                );
            }

            // 如果是建议，验证suggestionLevel是否在数据字典中
            if (conclusion === 'SUGGESTION' && suggestionLevel) {
                await validateDictionaryValue(
                    ctx.db,
                    'SUGGESTION_LEVEL',
                    suggestionLevel,
                    '建议等级'
                );
            }

            // 更新缺陷信息
            const updatedDefect = await ctx.db.defect.update({
                where: { id: defectId },
                data: {
                    type: conclusion as any, // 更新类型为缺陷或建议
                    category: defectType, // 保存缺陷分类
                    severity: conclusion === 'BUG' ? (severity as any) : null, // 如果是缺陷，更新等级
                    suggestionLevel:
                        conclusion === 'SUGGESTION'
                            ? (suggestionLevel as any)
                            : null, // 如果是建议，更新等级
                    judgmentReason: judgmentReason, // 保存判定原因
                    status: 'TO_CONFIRM', // 更新状态为待确认（需要众测管理员审核确认）
                    judgedAt: new Date(), // 记录判定时间
                },
            });

            return {
                success: true,
                message: '业务判定提交成功，缺陷已转为待确认状态',
                data: updatedDefect,
            };
        }),

    // 众测管理员确认缺陷状态（将待确认状态改为最终状态）
    confirmDefectStatus: protectedProcedure
        .input(
            z.object({
                defectId: z.string(),
                finalStatus: z.enum([
                    'APPROVED',
                    'REJECTED',
                    'DUPLICATE',
                    'CLOSED',
                ]), // 最终状态
                confirmComment: z.string().optional(), // 确认意见
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { defectId, finalStatus, confirmComment } = input;

            // 检查缺陷是否存在
            const defect = await ctx.db.defect.findUnique({
                where: { id: defectId },
            });

            if (!defect) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '缺陷不存在',
                });
            }

            // 检查缺陷状态是否为待确认
            if (defect.status !== 'TO_CONFIRM') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '只能确认状态为"待确认"的缺陷',
                });
            }

            // 计算缺陷积分
            let basePoints = 0; // 等级积分（基础积分）
            let earnedPoints = 0; // 实际获得积分

            // 不论什么状态，都需要计算basePoints（用于显示等级积分）
            // 获取任务信息和奖励配置
            const [task, rewardConfig] = await Promise.all([
                ctx.db.testTask.findUnique({
                    where: { id: defect.taskId },
                    select: { ruleFilter: true, executionPoints: true },
                }),
                ctx.db.rewardConfig.findUnique({
                    where: { taskId: defect.taskId },
                }),
            ]);

            // 积分分配规则: 0-重复缺陷无效, 1-重复缺陷均分, 2-重复缺陷均按执行积分发放, 3-无奖励
            const ruleFilter = task?.ruleFilter ?? '1';

            if (rewardConfig?.pointsConfig) {
                try {
                    const pointsOptions = JSON.parse(
                        rewardConfig.pointsConfig
                    ) as Array<{
                        label: string;
                        value: number;
                        unit: string;
                    }>;

                    // 获取数据字典，将等级代码转换为中文标签
                    const { getDictionaryItems } = await import(
                        '@/server/api/utils/dictionaryValidator'
                    );
                    let levelLabel: string | undefined;

                    if (defect.type === 'BUG' && defect.severity) {
                        const severityItems = await getDictionaryItems(
                            ctx.db,
                            'DEFECT_SEVERITY'
                        );
                        const severityItem = severityItems.find(
                            (item) => item.code === defect.severity
                        );
                        levelLabel = severityItem?.label;
                    } else if (
                        defect.type === 'SUGGESTION' &&
                        defect.suggestionLevel
                    ) {
                        const suggestionItems = await getDictionaryItems(
                            ctx.db,
                            'SUGGESTION_LEVEL'
                        );
                        const suggestionItem = suggestionItems.find(
                            (item) => item.code === defect.suggestionLevel
                        );
                        levelLabel = suggestionItem?.label;
                    }

                    // 根据中文标签查找对应的积分值
                    if (levelLabel) {
                        const pointsOption = pointsOptions.find(
                            (opt) => opt.label === levelLabel
                        );
                        if (pointsOption) {
                            basePoints = pointsOption.value;
                        }
                    }
                } catch (e) {
                    console.error('计算缺陷等级积分失败:', e);
                }
            }

            // 仅当状态为APPROVED时才计算earnedPoints（实际发放积分）
            if (finalStatus === 'APPROVED') {
                // 规则3: 无奖励
                if (ruleFilter === '3') {
                    earnedPoints = 0;
                } else {
                    // 检查缺陷是否属于重复缺陷组
                    if (defect.duplicateGroupId) {
                        // 获取重复组内所有缺陷，按创建时间排序
                        const duplicateDefects = await ctx.db.defect.findMany({
                            where: {
                                duplicateGroupId: defect.duplicateGroupId,
                            },
                            orderBy: { createdAt: 'asc' },
                            select: { id: true, createdAt: true },
                        });

                        if (duplicateDefects.length > 1) {
                            // 判断当前缺陷是否是第一个提交的（创建时间最早）
                            const isFirstDefect =
                                duplicateDefects[0]?.id === defect.id;

                            switch (ruleFilter) {
                                case '0': // 重复缺陷无效：第一个人获得等级积分，其他人获得0分
                                    earnedPoints = isFirstDefect
                                        ? basePoints
                                        : 0;
                                    break;
                                case '1': // 重复缺陷均分：所有人平均分配
                                    earnedPoints = Math.floor(
                                        basePoints / duplicateDefects.length
                                    );
                                    break;
                                case '2': // 重复缺陷均按执行积分发放：第一个人获得等级积分，其他人获得执行积分
                                    earnedPoints = isFirstDefect
                                        ? basePoints
                                        : (task?.executionPoints ?? 0);
                                    break;
                                default: // 默认均分
                                    earnedPoints = Math.floor(
                                        basePoints / duplicateDefects.length
                                    );
                            }
                        } else {
                            earnedPoints = basePoints;
                        }
                    } else {
                        earnedPoints = basePoints;
                    }
                }
            }

            // 更新缺陷状态为最终状态
            const updatedDefect = await ctx.db.defect.update({
                where: { id: defectId },
                data: {
                    status: finalStatus as DefectStatus,
                    reviewComment: confirmComment || defect.reviewComment, // 保存确认意见
                    reviewedBy: ctx.session.user.id, // 记录审核者
                    reviewedAt: new Date(), // 记录审核时间
                    basePoints, // 保存等级积分（基础积分）
                    earnedPoints, // 保存实际获得积分
                },
            });

            return {
                success: true,
                message: '缺陷状态已确认',
                data: updatedDefect,
            };
        }),

    // 退回业务判定（将待确认状态退回为判定中）
    returnToBusinessJudgment: protectedProcedure
        .input(
            z.object({
                defectId: z.string(),
                comment: z.string().optional(), // 退回意见
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { defectId, comment } = input;

            // 检查缺陷是否存在
            const defect = await ctx.db.defect.findUnique({
                where: { id: defectId },
            });

            if (!defect) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '缺陷不存在',
                });
            }

            // 检查缺陷状态是否为待确认
            if (defect.status !== 'TO_CONFIRM') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '只能退回状态为"待确认"的缺陷',
                });
            }

            // 更新缺陷状态为判定中
            const updatedDefect = await ctx.db.defect.update({
                where: { id: defectId },
                data: {
                    status: 'REVIEWING', // 退回为判定中状态
                    reviewComment: comment || defect.reviewComment, // 保存退回意见
                    reviewedBy: ctx.session.user.id, // 记录审核者
                    reviewedAt: new Date(), // 记录审核时间
                },
            });

            return {
                success: true,
                message: '缺陷已退回业务判定',
                data: updatedDefect,
            };
        }),

    // 批量提交业务判定（用于重复缺陷组）
    submitBatchBusinessJudgment: publicProcedure
        .input(
            z.object({
                defectIds: z.array(z.string()).min(1, '请至少选择一个缺陷'),
                conclusion: z.enum(['BUG', 'SUGGESTION']), // 结论：缺陷或建议
                severity: z.string().optional(), // 缺陷等级（从数据字典获取）
                suggestionLevel: z.string().optional(), // 建议等级（从数据字典获取）
                judgmentReason: z.string().min(1, '请填写原因说明'), // 判定原因
                defectType: z.string().optional(), // 缺陷类型（功能问题、性能问题等）
            })
        )
        .mutation(async ({ ctx, input }) => {
            const {
                defectIds,
                conclusion,
                severity,
                suggestionLevel,
                judgmentReason,
                defectType,
            } = input;

            // 检查所有缺陷是否存在
            const defects = await ctx.db.defect.findMany({
                where: {
                    id: {
                        in: defectIds,
                    },
                },
            });

            if (defects.length !== defectIds.length) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '部分缺陷不存在',
                });
            }

            // 检查所有缺陷状态是否为判定中
            const invalidDefects = defects.filter(
                (d) => d.status !== 'REVIEWING'
            );
            if (invalidDefects.length > 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '只能判定状态为"判定中"的缺陷',
                });
            }

            // 如果是缺陷，验证severity是否在数据字典中
            if (conclusion === 'BUG' && severity) {
                await validateDictionaryValue(
                    ctx.db,
                    'DEFECT_SEVERITY',
                    severity,
                    '缺陷等级'
                );
            }

            // 如果是建议，验证suggestionLevel是否在数据字典中
            if (conclusion === 'SUGGESTION' && suggestionLevel) {
                await validateDictionaryValue(
                    ctx.db,
                    'SUGGESTION_LEVEL',
                    suggestionLevel,
                    '建议等级'
                );
            }

            // 批量更新所有缺陷
            await ctx.db.defect.updateMany({
                where: {
                    id: {
                        in: defectIds,
                    },
                },
                data: {
                    type: conclusion as any, // 更新类型为缺陷或建议
                    category: defectType, // 保存缺陷分类
                    severity: conclusion === 'BUG' ? (severity as any) : null, // 如果是缺陷，更新等级
                    suggestionLevel:
                        conclusion === 'SUGGESTION'
                            ? (suggestionLevel as any)
                            : null, // 如果是建议，更新等级
                    judgmentReason: judgmentReason, // 保存判定原因
                    status: 'TO_CONFIRM', // 更新状态为待确认（需要众测管理员审核确认）
                    judgedAt: new Date(), // 记录判定时间
                },
            });

            return {
                success: true,
                message: `批量业务判定提交成功，${defectIds.length}个缺陷已转为待确认状态`,
                count: defectIds.length,
            };
        }),

    // 批量更新缺陷积分（用于核算导入）
    batchUpdatePoints: protectedProcedure
        .input(
            z.object({
                taskId: z.string(),
                defects: z.array(
                    z.object({
                        defectNo: z.string(), // 缺陷编号（ID）
                        points: z.number().min(0, '积分不能为负数'), // 等级积分（基础积分）
                        status: z.string().optional(), // 可选：更新状态
                        type: z.string().optional(), // 可选：更新类型（缺陷/建议）
                        level: z.string().optional(), // 可选：更新等级（致命/严重/一般/轻微/特别优秀/优秀/有效）
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { taskId, defects } = input;

            // 检查任务是否存在
            const task = await ctx.db.testTask.findUnique({
                where: { id: taskId },
                select: {
                    status: true,
                    ruleFilter: true,
                    executionPoints: true,
                },
            });

            if (!task) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '任务不存在',
                });
            }

            // 验证任务状态是否允许核算
            if (
                task.status !== 'EXECUTION_ENDED' &&
                task.status !== 'ACCOUNTING_COMPLETED'
            ) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '该任务当前状态不允许进行核算',
                });
            }

            // 积分分配规则: 0-重复缺陷无效, 1-重复缺陷均分, 2-重复缺陷均按执行积分发放, 3-无奖励
            const ruleFilter = task?.ruleFilter ?? '1';

            const results = {
                success: 0,
                failed: 0,
                errors: [] as string[],
            };

            // 收集所有需要处理的缺陷和重复组
            const processedDefectIds = new Set<string>();
            const duplicateGroupsToUpdate = new Map<
                string,
                {
                    basePoints: number;
                    level?: string;
                    type?: string;
                    status?: string;
                }
            >();

            // 第一阶段：收集所有缺陷信息和重复组
            for (const item of defects) {
                try {
                    // 查找缺陷
                    const defect = await ctx.db.defect.findFirst({
                        where: {
                            id: item.defectNo,
                            taskId: taskId,
                        },
                    });

                    if (!defect) {
                        results.failed++;
                        results.errors.push(`缺陷 ${item.defectNo} 不存在`);
                        continue;
                    }

                    // 如果缺陷属于重复组，记录该组需要更新
                    if (defect.duplicateGroupId) {
                        const existingData = duplicateGroupsToUpdate.get(
                            defect.duplicateGroupId
                        );
                        // 合并数据：优先使用第一个有值的，保证组内所有缺陷使用相同的等级/类型/状态
                        duplicateGroupsToUpdate.set(defect.duplicateGroupId, {
                            basePoints: item.points, // 总是使用最后导入的积分（允许修改）
                            level:
                                existingData?.level &&
                                existingData.level !== '-'
                                    ? existingData.level
                                    : item.level, // 优先使用第一个有值的等级
                            type:
                                existingData?.type && existingData.type !== ''
                                    ? existingData.type
                                    : item.type, // 优先使用第一个有值的类型
                            status:
                                existingData?.status &&
                                existingData.status !== ''
                                    ? existingData.status
                                    : item.status, // 优先使用第一个有值的状态
                        });
                    }
                } catch (error) {
                    results.failed++;
                    results.errors.push(
                        `处理缺陷 ${item.defectNo} 失败: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }

            // 第二阶段：处理所有重复组的更新
            for (const [groupId, groupData] of duplicateGroupsToUpdate) {
                try {
                    // 获取该组内所有缺陷
                    const groupDefects = await ctx.db.defect.findMany({
                        where: { duplicateGroupId: groupId },
                        orderBy: { createdAt: 'asc' },
                    });

                    if (groupDefects.length === 0) continue;

                    const basePoints = groupData.basePoints;

                    // 根据积分分配规则计算每个缺陷的实际积分
                    for (let i = 0; i < groupDefects.length; i++) {
                        const groupDefect = groupDefects[i];
                        const isFirstDefect = i === 0;
                        let earnedPoints = basePoints;

                        if (ruleFilter === '3') {
                            // 规则3: 无奖励
                            earnedPoints = 0;
                        } else if (groupDefects.length > 1) {
                            switch (ruleFilter) {
                                case '0': // 重复缺陷无效：第一个人获得等级积分，其他人获得0分
                                    earnedPoints = isFirstDefect
                                        ? basePoints
                                        : 0;
                                    break;
                                case '1': // 重复缺陷均分：所有人平均分配
                                    earnedPoints = Math.floor(
                                        basePoints / groupDefects.length
                                    );
                                    break;
                                case '2': // 重复缺陷均按执行积分发放：第一个人获得等级积分，其他人获得执行积分
                                    earnedPoints = isFirstDefect
                                        ? basePoints
                                        : (task?.executionPoints ?? 0);
                                    break;
                                default: // 默认均分
                                    earnedPoints = Math.floor(
                                        basePoints / groupDefects.length
                                    );
                            }
                        }

                        // 构建更新数据
                        const updateData: any = {
                            basePoints,
                            earnedPoints,
                        };

                        // 如果提供了状态，则更新状态
                        if (groupData.status) {
                            const statusMap: Record<string, string> = {
                                已提交: 'SUBMITTED',
                                审核中: 'REVIEWING',
                                待确认: 'TO_CONFIRM',
                                待开发确认: 'TO_CONFIRM_DEV',
                                已通过: 'APPROVED',
                                已驳回: 'REJECTED',
                                重复: 'DUPLICATE',
                                已关闭: 'CLOSED',
                            };
                            updateData.status =
                                statusMap[groupData.status] || groupData.status;
                        }

                        // 如果提供了类型，则更新类型
                        if (groupData.type) {
                            const typeMap: Record<string, string> = {
                                缺陷: 'BUG',
                                建议: 'SUGGESTION',
                            };
                            updateData.type =
                                typeMap[groupData.type] || groupData.type;
                        }

                        // 如果提供了等级，则更新等级
                        if (
                            groupData.level &&
                            groupData.level !== '-' &&
                            groupData.level !== ''
                        ) {
                            let currentType =
                                groupData.type || groupDefect.type;
                            if (currentType === '缺陷') currentType = 'BUG';
                            if (currentType === '建议')
                                currentType = 'SUGGESTION';

                            if (currentType === 'BUG') {
                                const severityMap: Record<string, string> = {
                                    致命: 'CRITICAL',
                                    严重: 'MAJOR',
                                    一般: 'MINOR',
                                    轻微: 'TRIVIAL',
                                    无效: 'INVALID',
                                };
                                if (severityMap[groupData.level]) {
                                    updateData.severity =
                                        severityMap[groupData.level];
                                }
                            } else if (currentType === 'SUGGESTION') {
                                const suggestionLevelMap: Record<
                                    string,
                                    string
                                > = {
                                    特别优秀: 'EXCELLENT_SPECIAL',
                                    优秀: 'EXCELLENT',
                                    有效: 'VALID',
                                    无效: 'INVALID',
                                };
                                if (suggestionLevelMap[groupData.level]) {
                                    updateData.suggestionLevel =
                                        suggestionLevelMap[groupData.level];
                                }
                            }
                        }

                        // 更新缺陷
                        await ctx.db.defect.update({
                            where: { id: groupDefect.id },
                            data: updateData,
                        });

                        processedDefectIds.add(groupDefect.id);
                        results.success++;
                    }
                } catch (error) {
                    results.failed++;
                    results.errors.push(
                        `更新重复组 ${groupId} 失败: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }

            // 第三阶段：处理非重复缺陷的更新
            for (const item of defects) {
                // 跳过已处理的缺陷（属于重复组的）
                if (processedDefectIds.has(item.defectNo)) continue;

                try {
                    // 查找缺陷
                    const defect = await ctx.db.defect.findFirst({
                        where: {
                            id: item.defectNo,
                            taskId: taskId,
                        },
                    });

                    if (!defect) {
                        results.failed++;
                        results.errors.push(`缺陷 ${item.defectNo} 不存在`);
                        continue;
                    }

                    // 非重复缺陷，直接使用导入的积分
                    const basePoints = item.points;
                    let earnedPoints = basePoints;

                    if (ruleFilter === '3') {
                        // 规则3: 无奖励
                        earnedPoints = 0;
                    }

                    // 构建更新数据
                    const updateData: any = {
                        basePoints,
                        earnedPoints,
                    };

                    // 如果提供了状态，则更新状态
                    if (item.status) {
                        const statusMap: Record<string, string> = {
                            已提交: 'SUBMITTED',
                            审核中: 'REVIEWING',
                            待确认: 'TO_CONFIRM',
                            待开发确认: 'TO_CONFIRM_DEV',
                            已通过: 'APPROVED',
                            已驳回: 'REJECTED',
                            重复: 'DUPLICATE',
                            已关闭: 'CLOSED',
                        };
                        updateData.status =
                            statusMap[item.status] || item.status;
                    }

                    // 如果提供了类型，则更新类型
                    if (item.type) {
                        const typeMap: Record<string, string> = {
                            缺陷: 'BUG',
                            建议: 'SUGGESTION',
                        };
                        updateData.type = typeMap[item.type] || item.type;
                    }

                    // 如果提供了等级，则更新等级
                    if (item.level && item.level !== '-' && item.level !== '') {
                        let currentType = item.type || defect.type;
                        if (currentType === '缺陷') currentType = 'BUG';
                        if (currentType === '建议') currentType = 'SUGGESTION';

                        if (currentType === 'BUG') {
                            const severityMap: Record<string, string> = {
                                致命: 'CRITICAL',
                                严重: 'MAJOR',
                                一般: 'MINOR',
                                轻微: 'TRIVIAL',
                                无效: 'INVALID',
                            };
                            if (severityMap[item.level]) {
                                updateData.severity = severityMap[item.level];
                            }
                        } else if (currentType === 'SUGGESTION') {
                            const suggestionLevelMap: Record<string, string> = {
                                特别优秀: 'EXCELLENT_SPECIAL',
                                优秀: 'EXCELLENT',
                                有效: 'VALID',
                                无效: 'INVALID',
                            };
                            if (suggestionLevelMap[item.level]) {
                                updateData.suggestionLevel =
                                    suggestionLevelMap[item.level];
                            }
                        }
                    }

                    // 更新缺陷
                    await ctx.db.defect.update({
                        where: { id: item.defectNo },
                        data: updateData,
                    });

                    results.success++;
                } catch (error) {
                    results.failed++;
                    results.errors.push(
                        `更新缺陷 ${item.defectNo} 失败: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }

            // 构建返回消息
            let message = `核算数据导入完成：成功 ${results.success} 条，失败 ${results.failed} 条`;
            if (results.errors.length > 0) {
                message += `\n失败原因：${results.errors.join('; ')}`;
            }

            return {
                success: results.failed === 0,
                message,
                data: results,
            };
        }),
});
