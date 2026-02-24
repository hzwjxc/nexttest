<div align="center">
  <p>基于 Next.js 构建的全栈解决方案，集成了现代 Web 技术栈</p>
  <p>快速开发 代码易懂 方便二开 源码全开源</p>

  <!-- 重要依赖包徽章 -->
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License" />
  </a>
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5.8-blue" alt="TypeScript" />
  </a>
  <a href="https://prisma.io/">
    <img src="https://img.shields.io/badge/Prisma-6.5-green" alt="Prisma" />
  </a>
  <a href="https://react.dev/">
    <img src="https://img.shields.io/badge/React-19-61dafb" alt="React" />
  </a>
  <a href="https://chakra-ui.com/">
    <img src="https://img.shields.io/badge/Chakra--UI-3.22-319795" alt="Chakra UI" />
  </a>
  <a href="https://trpc.io/">
    <img src="https://img.shields.io/badge/tRPC-11.0-2596be" alt="tRPC" />
  </a>
  <a href="https://zod.dev/">
    <img src="https://img.shields.io/badge/Zod-3.24-8e44ad" alt="Zod" />
  </a>
  <a href="https://next-auth.js.org/">
    <img src="https://img.shields.io/badge/NextAuth.js-5.0.0--beta.25-0070f3" alt="NextAuth.js" />
  </a>
  <a href="https://prettier.io/">
    <img src="https://img.shields.io/badge/Prettier-3.5.3-f7b93e" alt="Prettier" />
  </a>
</div>

</div>

## 🚀 项目简介

项目采用 Next.js 15 + TRpc + TypeScript + Prisma + React + Chakra 的全栈技术架构

## 🌟 优势

1. 极致开发体验 next.js/trpc/prisma/chakra，方便二次开发
2. 高性能
3. node+postgre就可快速本地部署或者docker一键部署
4. 现代化的界面设计
5. 开源学习：提供完整的代码

## ⚡ 高性能

1. 服务器占用小 100M多一点
   ![内存占用](./docs/docker.png)
2. 客户端加载小 几百kb的静态资源
   <img src="./docs/client.png" alt="订单详情" width="200" />

## 🚀 快速开始

### 📋 环境要求

- Node.js 18+ & PostgreSQL 17+
- 或 Docker & Docker Compose (推荐)

### 🐳 Docker 一键部署

```bash
# 克隆项目
git clone https://github.com/your-username/nexttest.git
cd nexttest

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置数据库密码等配置

# 启动服务
docker compose up -d
```

访问 http://localhost:3000 即可使用

### 💻 本地开发

1. **安装依赖**

```bash
pnpm install
```

2. **配置数据库**

```bash
# 将 .env.example 重命名为 .env 并配置数据库连接
cp .env.example .env

# 推送数据库结构
pnpm db:push

# 创建管理员账号
npx prisma db seed
```

3. **启动开发服务器**

```bash
pnpm dev
```

4. **构建生产版本**

```bash
pnpm build
pnpm start
```

### 🔧 其他可用命令

```bash
# 数据库操作
pnpm db:studio      # 打开 Prisma Studio
pnpm db:generate    # 生成 Prisma 客户端
pnpm db:migrate     # 运行数据库迁移

# 代码质量
pnpm lint           # 运行 ESLint
pnpm typecheck      # TypeScript 类型检查
pnpm format:write   # 格式化代码
```

## 🏗️ 技术架构

### 前端技术栈

- **[Next.js 15](https://nextjs.org/)** - React 全栈框架
- **[TypeScript](https://www.typescriptlang.org/)** - 类型安全的 JavaScript
- **[Chakra UI](https://chakra-ui.com/)** - 现代化 React 组件库
- **[React Query](https://tanstack.com/query)** - 数据获取和状态管理
- **[React Hook Form](https://react-hook-form.com/)** - 高性能表单处理
- **[Next Themes](https://github.com/pacocoursey/next-themes)** - 主题切换支持

### 后端技术栈

- **[tRPC](https://trpc.io/)** - 端到端类型安全 API
- **[Prisma](https://prisma.io/)** - 现代化数据库 ORM
- **[NextAuth.js](https://next-auth.js.org/)** - 认证授权解决方案
- **[PostgreSQL](https://www.postgresql.org/)** - 关系型数据库
- **[Zod](https://zod.dev/)** - TypeScript 优先的模式验证

### 开发工具

- **[ESLint](https://eslint.org/)** - 代码质量检测
- **[Prettier](https://prettier.io/)** - 代码格式化
- **[Docker](https://www.docker.com/)** - 容器化部署
- **[pnpm](https://pnpm.io/)** - 高效的包管理器

## 🤝 贡献指南

我们欢迎任何形式的贡献！无论是报告 bug、提出新功能建议，还是提交代码改进。

### 如何贡献

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

### 开发规范

- 遵循现有的代码风格
- 为新功能添加适当的测试
- 更新相关文档
- 确保所有测试通过

## 📄 许可证

本项目基于 Apache License 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 声明

本项目仅做技术交流和学习，不建议用于商业目的！

---

对于生产环境或包含重要数据的远程数据库，正确的做法是使用 Prisma Migrate：

npx prisma migrate dev （开发环境）
npx prisma migrate deploy （生产环境）
迁移（Migration）与 db push 的关键区别：

Migrations 会生成 SQL 文件，记录数据库结构变化的历史
Migrations 会尽量保留现有数据，并提供数据迁移的机会
db push 直接应用 schema 变更，不考虑数据保留
建议： 在对包含数据的远程数据库进行任何操作之前：

先备份数据库
使用 npx prisma migrate 而不是 db push
仔细检查 schema 变更对现有数据的影响
根据您的项目信息，如果需要部署到生产环境，应该使用 prisma migrate deploy 而不是 db push。

npx prisma migrate dev
这个命令主要用于开发环境，具有以下特点：

会根据 schema.prisma 文件和现有的迁移历史文件（在 prisma/migrations 目录中）来决定如何更新数据库
会读取 .env 文件中的 DATABASE_URL 来连接数据库
如果检测到 schema 变更，它会尝试智能地更新数据库表结构而不丢失数据（但有时仍可能需要重置）
如果发现迁移冲突，它可能会重置数据库（会丢失数据）
npx prisma migrate deploy
这个命令主要用于生产环境，具有以下特点：

也是根据 schema.prisma 和迁移历史文件来更新数据库
会读取 .env 文件中的 DATABASE_URL 来连接数据库
它只是应用尚未执行的迁移文件，不会生成新的迁移文件
设计为在生产环境中安全使用，不会尝试重置数据库或丢失数据
主要用于部署新版本的应用程序时更新数据库结构

---

标准工作流程
修改 schema.prisma 文件
运行 npx prisma migrate dev (或 npx prisma db push 在开发早期)
运行 npx prisma generate 更新客户端代码
按键 ctrl+shift+p, 输入"TypeScript: Restart TS Server"
在代码中使用新生成的 API

生产环境运行
npx prisma migrate deploy

初始化种子数据
npx tsx .\scripts\init-dictionaries.ts

## 本地构建

pnpm build
pnpm start
docker compose up -d

---

## 生产构建

docker-compose -f docker-compose.production.yml --env-file .env.production up -d

## 生产构建报错

Get "https://registry-1.docker.io/v2/": net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)
方案一：配置国内镜像源（推荐）
在服务器上编辑 /etc/docker/daemon.json
添加以下内容：
{
"builder": {
"gc": {
"defaultKeepStorage": "20GB",
"enabled": true
}
},
"experimental": false,
"registry-mirrors": [
"https://docker.1panel.live",
"https://docker.1ms.run",
"https://dytt.online",
"https://docker-0.unsee.tech",
"https://lispy.org",
"https://docker.xiaogenban1993.com",
"https://666860.xyz",
"https://hub.rat.dev",
"https://docker.m.daocloud.io",
"https://demo.52013120.xyz",
"https://proxy.vvvv.ee",
"https://registry.cyou",
"https://mirror.ccs.tencentyun.com",
"https://<your_code>.mirror.aliyuncs.com"
]
}
然后重启 Docker：

sudo systemctl daemon-reload
sudo systemctl restart docker
再重新运行 docker-compose 命令。

---

# 迁移数据库

1. 推送数据库结构
   pnpm db:push

2. 导出数据库表的sql数据文件

方案：按表依赖顺序导入
既然无法禁用外键检查，就必须按正确顺序导入。根据你的 schema，正确的导入顺序是：

第一批（无外键依赖的基础表）：
User
VerificationToken
TestSystem
TestingTag
TestCase
Announcement
HomepagePopup
InvitationReward
DataDictionary
NotificationTemplate
Notification
DefectGroup
Carousel
SlidingTab
Device
Role
Academy

第二批（依赖第一批）：
Account → 依赖 User
Session → 依赖 User
TestingUserTag → 依赖 User, TestingTag
TestData → 依赖 TestCase
TestTask → 依赖 TestCase（多对多）
UserSettings → 依赖 User
Feedback → 依赖 User
AcademyFavorite → 依赖 User, Academy
AnnouncementReadRecord → 依赖 User, Announcement
HomepagePopupReadRecord → 依赖 User, HomepagePopup
DataDictionaryItem → 依赖 DataDictionary
NotificationRecipientTag → 依赖 Notification

第三批（依赖第二批）：
TestTaskOrder → 依赖 User, TestTask
RewardConfig → 依赖 TestTask
NotificationConfig → 依赖 TestTask
Withdrawal → 依赖 User
PointTransaction → 依赖 User
BusinessJudgmentToken → 依赖 TestTask
PointsApplication → 依赖 TestTask
InvitationRecord → 依赖 User, InvitationReward

第四批（依赖第三批）：
Defect → 依赖 TestTask, TestTaskOrder, User, TestCase, DefectGroup

第五批（依赖第四批）：
DefectReview → 依赖 Defect
Reward → 依赖 User, TestTask, Defect
