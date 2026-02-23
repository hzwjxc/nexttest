import { z } from 'zod';
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
    superAdminProcedure,
} from '@/server/api/trpc';
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { logger, logOperation } from '@/server/api/utils/logger';
import { ROLES } from '@/app/const/status';

export const userRouter = createTRPCRouter({
    register: publicProcedure
        .input(
            z.object({
                phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
                password: z.string().min(6, '密码至少6位'),
                name: z.string().min(3, '用户名至少3位'),
            })
        )
        .mutation(async ({ ctx, input }) => {
            try {
                // 检查手机号是否已被注册（仅检查未删除的用户）
                const existing = await ctx.db.user.findFirst({
                    where: {
                        phone: input.phone,
                        isDeleted: false
                    },
                });
                if (existing) {
                    throw new Error('手机号已被注册');
                }

                const hashed = await hash(input.password, 10);

                // 创建User
                const user = await ctx.db.user.create({
                    data: {
                        name: input.name,
                        password: hashed,
                        phone: input.phone,
                        phoneVerified: new Date(),
                        status: true,
                    }
                });

                // 记录用户注册成功日志
                await logger.userRegister(ctx, user.id, input.phone);

                return { id: user.id, phone: user.phone, name: user.name };
            } catch (error) {
                // 记录注册失败日志
                await logOperation(ctx, {
                    action: 'REGISTER',
                    module: 'USER',
                    description: `用户注册失败: ${input.phone}`,
                    status: 'FAILED',
                    errorMessage:
                        error instanceof Error ? error.message : String(error),
                    requestData: { phone: input.phone, name: input.name },
                });
                throw error;
            }
        }),
    registerFormConfig: publicProcedure.query(() => {
        return [
            {
                name: 'name',
                label: '用户名',
                type: 'text',
                required: true,
                minLength: 3,
            },
            {
                name: 'email',
                label: '邮箱',
                type: 'email',
                required: true,
                pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
            },
            {
                name: 'password',
                label: '密码',
                type: 'password',
                required: true,
                minLength: 6,
            },
        ];
    }),
    recoverPassword: publicProcedure
        .input(z.object({ email: z.string().email() }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findFirst({
                where: {
                    email: input.email,
                },
            });

            // 检查用户是否存在且未被删除
            if (!user || user.isDeleted) {
                throw new Error('该邮箱未注册');
            }

            // 生成 JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.AUTH_SECRET,
                { expiresIn: '30m' }
            );

            // 发送邮件
            const resetUrl = `${process.env.AUTH_URL}/reset-password?token=${token}`;
            const options = {
                host: process.env.SMTP_HOST, // SMTP 服务器地址，如 smtp.qq.com
                port: Number(process.env.SMTP_PORT) || 465, // SMTP 端口，常用465(SSL)或587(TLS)
                secure: true, // true=SSL, false=STARTTLS
                auth: {
                    user: process.env.SMTP_USER, // 发件邮箱账号
                    pass: process.env.SMTP_PASS, // 发件邮箱授权码/密码
                },
            };
            const transporter = nodemailer.createTransport(options);
            await transporter.sendMail({
                from: `"NextMall" <${process.env.SMTP_USER}>`, // 必须和 SMTP_USER 一致
                to: user.email ?? undefined,
                subject: '密码重置',
                html: `<p>点击 <a href="${resetUrl}">这里</a> 重置你的密码。30分钟内有效。</p>`,
            });

            return { message: '已发送密码找回邮件' };
        }),

    // 新增：重置密码接口（通过邮件令牌）
    resetPassword: publicProcedure
        .input(
            z.object({
                token: z.string(),
                newPassword: z.string().min(6, '新密码至少6位'),
            })
        )
        .mutation(async ({ ctx, input }) => {
            let decodedToken: { userId: string; email: string };
            
            try {
                decodedToken = jwt.verify(
                    input.token, 
                    process.env.AUTH_SECRET
                ) as { userId: string; email: string };
            } catch (error) {
                throw new Error('重置令牌无效或已过期');
            }

            // 验证用户是否存在
            const user = await ctx.db.user.findUnique({
                where: { id: decodedToken.userId },
            });

            if (!user) {
                throw new Error('用户不存在');
            }

            // 验证邮箱是否匹配
            if (user.email !== decodedToken.email) {
                throw new Error('邮箱信息不匹配');
            }

            // 加密新密码
            const hashedPassword = await hash(input.newPassword, 10);

            // 更新用户密码
            await ctx.db.user.update({
                where: { id: decodedToken.userId },
                data: { password: hashedPassword },
            });

            // 记录密码重置操作日志
            await logOperation(ctx, {
                action: 'RESET_PASSWORD',
                module: 'USER',
                description: '用户通过邮件链接重置密码',
                targetId: decodedToken.userId,
                targetType: 'User',
            });

            return { message: '密码重置成功' };
        }),

    // 新增：修改密码接口
    /**
     * 为什么 hash(input.oldPassword, 10) 得到的 hash 跟 user.password 不一样？
     *
     * 因为 bcrypt 的 hash 加密在每次调用时都会生成一个随机的 salt，
     * 所以即使明文密码一样，每次 hash 出来的密文也都不一样。
     *
     * 正确的校验方式是用 bcrypt 的 compare(明文, 密文Hash)，
     * 它内部会取 hash 存储的 salt 重新 hash 明文，然后比较是否一致。
     */
    changePassword: protectedProcedure
        .input(
            z.object({
                oldPassword: z.string().min(6, '旧密码至少6位'),
                newPassword: z.string().min(6, '新密码至少6位'),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const user = await ctx.db.user.findUnique({
                where: { id: userId },
                select: { password: true },
            });

            if (!user || !user.password) {
                throw new Error('用户不存在或没有设置密码');
            }

            // bcrypt compare 才是比较密码的正确方式
            const isCorrect = await compare(input.oldPassword, user.password);
            if (!isCorrect) {
                throw new Error('旧密码输入错误');
            }

            const hashedNew = await hash(input.newPassword, 10);

            await ctx.db.user.update({
                where: { id: userId },
                data: { password: hashedNew },
            });

            // 记录操作日志
            await logOperation(ctx, {
                action: 'CHANGE_PASSWORD',
                module: 'USER',
                description: '用户修改密码成功',
                targetId: userId,
                targetType: 'User',
            });

            return { message: '密码修改成功' };
        }),

    // 获取所有供应商接口
    getAllVendors: superAdminProcedure.query(async ({ ctx }) => {
        const users = await ctx.db.user.findMany({
            where: {
                isDeleted: false
            },
            orderBy: { createdAt: 'desc' },
        });
        return users;
    }),

    // 获取所有用户，支持排序和分页 - 用于管理后台
    list: superAdminProcedure
        .input(
            z
                .object({
                    orderBy: z.string().optional(),
                    order: z.enum(['asc', 'desc']).optional(),
                    page: z.number().min(1).optional().default(1),
                    pageSize: z.number().min(1).max(100).optional().default(10),
                    status: z.boolean().optional(),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            const page = input?.page ?? 1;
            const pageSize = input?.pageSize ?? 10;
            const skip = (page - 1) * pageSize;

            const where: any = {
                isDeleted: false, // 只显示未删除的用户
            };
            if (input?.status !== undefined) {
                where.status = input.status;
            }

            // 获取总数
            const total = await ctx.db.user.count({ where });

            // 获取分页数据
            const data = await ctx.db.user.findMany({
                orderBy: input?.orderBy
                    ? { [input.orderBy]: input.order ?? 'asc' }
                    : { createdAt: 'desc' },
                where,
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

    // 创建用户 - 管理后台使用
    create: superAdminProcedure
        .input(
            z.object({
                name: z.string().min(1, '用户名不能为空'),
                email: z.string().email('邮箱格式不正确').optional(),
                phone: z.string(),
                status: z.boolean().optional(),
                password: z.string().min(6, '密码至少6位').optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // 检查邮箱是否已存在
            if (input.email) {
                const existing = await ctx.db.user.findFirst({
                    where: {
                        email: input.email,
                        isDeleted: false,
                    },
                });
                if (existing) {
                    throw new Error('邮箱已被注册');
                }
            }

            // 检查手机号是否已存在（仅检查未删除的用户）
            if (input.phone) {
                const phoneExists = await ctx.db.user.findFirst({
                    where: {
                        phone: input.phone,
                        isDeleted: false
                    },
                });
                if (phoneExists) {
                    throw new Error('手机号已被注册');
                }
            }

            // 如果提供了密码，进行加密
            let hashedPassword: string | undefined;
            if (input.password) {
                hashedPassword = await hash(input.password, 10);
            }

            const user = await ctx.db.user.create({
                data: {
                    name: input.name,
                    email: input.email,
                    password: hashedPassword,
                    phone: input.phone,
                    phoneVerified: new Date(),
                    status: input.status ?? true,
                },
            });

            // 记录操作日志
            await logger.userCreate(ctx, user.id, input.name);

            return {
                message: '创建成功',
            };
        }),

    // 更新用户 - 管理后台使用
    update: superAdminProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1, '用户名不能为空'),
                email: z.string().email('邮箱格式不正确').optional(),
                phone: z.string().optional(),
                status: z.boolean().optional(),
                password: z.string().min(6, '密码至少6位').optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, password, phone, status, ...userData } = input;

            // 检查用户是否存在
            const existingUser = await ctx.db.user.findUnique({
                where: { id },
            });
            if (!existingUser) {
                throw new Error('用户不存在');
            }

            // 检查邮箱是否被其他用户使用
            if (input.email && input.email !== existingUser.email) {
                const emailExists = await ctx.db.user.findFirst({
                    where: {
                        email: input.email,
                        isDeleted: false,
                        id: { not: id }
                    },
                });
                if (emailExists) {
                    throw new Error('邮箱已被其他用户使用');
                }
            }

            // 检查手机号是否被其他用户使用（仅检查未删除的用户）
            if (phone && phone !== existingUser.phone) {
                const phoneExists = await ctx.db.user.findFirst({
                    where: {
                        phone: phone,
                        isDeleted: false,
                        id: { not: id }
                    },
                });
                if (phoneExists) {
                    throw new Error('手机号已被其他用户使用');
                }
            }

            // 准备更新数据
            const updateData: any = { ...userData };
            if (password) {
                updateData.password = await hash(password, 10);
            }
            if (phone !== undefined) {
                updateData.phone = phone;
            }
            if (status !== undefined) {
                updateData.status = status;
            }

            // 更新User表
            await ctx.db.user.update({
                where: { id },
                data: updateData,
            });

            // 记录操作日志
            await logger.userUpdate(ctx, id, input.name);

            return {
                message: '更新成功',
            };
        }),

    // 删除用户 - 管理后台使用
    delete: superAdminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // 检查用户是否存在
            const existingUser = await ctx.db.user.findUnique({
                where: { id: input.id },
            });
            if (!existingUser) {
                throw new Error('用户不存在');
            }

            // 软删除：设置 User 的 isDeleted 为 true
            await ctx.db.user.update({
                where: { id: input.id },
                data: { isDeleted: true },
            });

            // 记录操作日志
            await logger.userDelete(ctx, input.id, existingUser.name || '');

            return {
                message: '删除成功',
            };
        }),

    // 批量删除用户 - 管理后台使用
    deleteMany: superAdminProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            // 软删除：设置 User 的 isDeleted 为 true
            await ctx.db.user.updateMany({
                where: { id: { in: input.ids } },
                data: { isDeleted: true },
            });

            // 记录操作日志
            await logger.userBatchDelete(ctx, input.ids);

            return {
                message: '批量删除成功',
            };
        }),

    // 获取当前用户的积分和等级信息
    getUserPointsInfo: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // 获取用户基本信息
        const user = await ctx.db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                totalPoints: true,
                availablePoints: true,
                experience: true,
                testingLevel: true,
            },
        });

        if (!user) {
            throw new Error('用户不存在');
        }

        // 根据等级枚举映射称号和等级信息
        const getLevelInfo = (level: string, experience: number) => {
            switch (level) {
                case 'LEVEL_1':
                    return {
                        levelNumber: 1,
                        levelName: '注册新人',
                        experienceRequired: 0,
                        nextLevelExperience: 500,
                    };
                case 'LEVEL_2':
                    return {
                        levelNumber: 2,
                        levelName: '资深老手',
                        experienceRequired: 500,
                        nextLevelExperience: 800,
                    };
                case 'LEVEL_3':
                    return {
                        levelNumber: 3,
                        levelName: '资深老手',
                        experienceRequired: 800,
                        nextLevelExperience: null, // 已达到最高等级
                    };
                default:
                    return {
                        levelNumber: 1,
                        levelName: '注册新人',
                        experienceRequired: 0,
                        nextLevelExperience: 500,
                    };
            }
        };

        const levelInfo = getLevelInfo(user.testingLevel, user.experience);

        // 计算待兑换积分（availablePoints）和累计积分（totalPoints）
        return {
            userId: user.id,
            userName: user.name,
            pendingPoints: user.availablePoints, // 待兑换积分（可用积分）
            totalPoints: user.totalPoints, // 累计积分
            experience: user.experience, // 经验值
            level: levelInfo.levelNumber, // 等级序号
            levelName: levelInfo.levelName, // 等级称号
            experienceRequired: levelInfo.experienceRequired, // 当前等级所需经验值
            nextLevelExperience: levelInfo.nextLevelExperience, // 下一等级所需经验值
        };
    }),

    // 获取用户积分详情（含本月统计和积分交易记录）
    getPointsDetails: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).max(100).default(10),
            })
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const { page, pageSize } = input;
            const skip = (page - 1) * pageSize;

            // 获取用户基本信息
            const user = await ctx.db.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    totalPoints: true,
                    availablePoints: true,
                    experience: true,
                    testingLevel: true,
                },
            });

            if (!user) {
                throw new Error('用户不存在');
            }

            // 获取等级信息
            const getLevelInfo = (level: string) => {
                switch (level) {
                    case 'LEVEL_1':
                        return { levelNumber: 1, levelName: '注册新人' };
                    case 'LEVEL_2':
                        return { levelNumber: 2, levelName: '资深老手' };
                    case 'LEVEL_3':
                        return { levelNumber: 3, levelName: '资深老手' };
                    default:
                        return { levelNumber: 1, levelName: '注册新人' };
                }
            };

            const levelInfo = getLevelInfo(user.testingLevel);

            // 计算本月开始和结束时间
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            // 获取本月获取的积分（type='EARN'）
            const monthEarnResult = await ctx.db.pointTransaction.aggregate({
                where: {
                    userId: userId,
                    type: 'EARN',
                    createdAt: {
                        gte: monthStart,
                        lte: monthEnd,
                    },
                },
                _sum: {
                    points: true,
                },
            });

            // 获取本月兑换的积分（type='WITHDRAW'）
            const monthWithdrawResult = await ctx.db.pointTransaction.aggregate({
                where: {
                    userId: userId,
                    type: 'WITHDRAW',
                    createdAt: {
                        gte: monthStart,
                        lte: monthEnd,
                    },
                },
                _sum: {
                    points: true,
                },
            });

            const currentMonthPoints = monthEarnResult._sum.points || 0;
            const exchangedPoints = Math.abs(monthWithdrawResult._sum.points || 0);

            // 获取积分交易记录总数
            const total = await ctx.db.pointTransaction.count({
                where: { userId: userId },
            });

            // 获取积分交易记录列表
            const transactions = await ctx.db.pointTransaction.findMany({
                where: { userId: userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
                select: {
                    id: true,
                    points: true,
                    type: true,
                    description: true,
                    createdAt: true,
                },
            });

            return {
                userInfo: {
                    userId: user.id,
                    userName: user.name,
                    level: levelInfo.levelNumber,
                    levelName: levelInfo.levelName,
                    availablePoints: user.availablePoints, // 可兑换积分
                    totalPoints: user.totalPoints, // 累计积分
                },
                monthlyStats: {
                    currentMonthPoints, // 本月获取
                    exchangedPoints, // 本月已兑换
                },
                transactions: {
                    data: transactions.map((t) => ({
                        id: t.id,
                        name: t.description || (t.type === 'EARN' ? '积分获取' : '积分兑换'),
                        time: t.createdAt,
                        points: t.type === 'EARN' ? t.points : -t.points, // 获取为正，兑换为负
                    })),
                    pagination: {
                        page,
                        pageSize,
                        total,
                        totalPages: Math.ceil(total / pageSize),
                    },
                },
            };
        }),

    // 获取当前用户的菜单权限
    getPermissions: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // 获取用户角色
        const user = await ctx.db.user.findUnique({
            where: { id: userId },
            select: { roles: true },
        });

        if (!user || !user.roles || user.roles.length === 0) {
            return { permissions: [] };
        }

        // 超级管理员自动拥有所有权限
        if (user.roles.includes('SUPER_ADMIN')) {
            const allRoles = await ctx.db.role.findMany({
                where: { status: true },
                select: { permissions: true },
            });
            
            const allPermissions = new Set<string>();
            allRoles.forEach((role) => {
                role.permissions?.forEach((perm) => allPermissions.add(perm));
            });
            
            // 确保包含所有可能的权限
            const defaultPermissions = [
                'workspace',
                'task-hall',
                'task-publish',
                'task-review',
                'points-review',
                'academy',
                'usage-management',
                'defect-management',
                'report',
                'admin',
                'task-management',
                'personnel-management',
                'report-management',
                'announcement-management',
                'data-dictionary',
                'tag-management',
                'finance-management',
                'device-management',
                'invitation-reward',
                'feedback',
                'user-center',
            ];
            defaultPermissions.forEach((perm) => allPermissions.add(perm));
            
            return { permissions: Array.from(allPermissions) };
        }

        // 获取用户所有角色的权限并合并
        const roles = await ctx.db.role.findMany({
            where: {
                code: { in: user.roles },
                status: true,
            },
            select: { permissions: true },
        });

        // 合并所有权限并去重
        const allPermissions = new Set<string>();
        roles.forEach((role) => {
            role.permissions?.forEach((perm) => allPermissions.add(perm));
        });

        return { permissions: Array.from(allPermissions) };
    }),
});






