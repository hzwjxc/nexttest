# 使用官方 Node.js 镜像
FROM node:18-alpine AS base

# 安装依赖阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 预安装 pnpm 之前先配置 npm 源
RUN npm config set registry https://mirrors.cloud.tencent.com/npm/

# 全局安装 pnpm
RUN npm install -g pnpm

# 复制包管理文件和 Prisma schema
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma

# 设置镜像源并安装依赖
RUN pnpm config set registry https://mirrors.cloud.tencent.com/npm/ && pnpm i --frozen-lockfile

# 构建阶段
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 全局安装 pnpm 在 builder 阶段
RUN npm config set registry https://mirrors.cloud.tencent.com/npm/ && npm install -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma 客户端
RUN pnpm prisma generate

# 构建应用
ENV NEXT_TELEMETRY_DISABLED 1
ENV SKIP_ENV_VALIDATION 1
RUN pnpm build

# 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# 复制整个 node_modules（包含 Prisma 客户端）
COPY --from=builder /app/node_modules ./node_modules

# 创建上传目录
RUN mkdir -p /app/output && chown -R nextjs:nodejs /app/output

USER root
# 复制 docker-entrypoint.sh 脚本并设置执行权限
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]