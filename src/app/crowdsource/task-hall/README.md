# 任务大厅页面 (Task Hall Page)

## 概述

这是广发众测平台的任务大厅页面，用户可以在这里浏览、搜索和领取众测任务。

## 页面结构

### 主要组件

1. **TaskCard** - 任务卡片组件
   - 显示单个任务的信息
   - 支持三种状态：可领取、已满员、已结束
   - 显示剩余时间和剩余名额

2. **UserCard** - 用户信息卡片
   - 显示用户头像、昵称、等级
   - 显示待兑换积分和累计积分
   - 提供个人中心、设置、积分明细、退出登录等菜单

3. **TabBar** - 标签页组件
   - 三个标签：待领取、待完成、已完成
   - 支持标签切换和计数显示

4. **Pagination** - 分页组件
   - 支持上一页、下一页、页码跳转
   - 支持每页显示条数选择
   - 支持直接跳转到指定页码

5. **ShortcutsCard** - 快捷入口卡片
   - 显示6个快捷入口
   - 包括：操作指南、积分规则、蓝信客服、排行榜等

6. **MessageCard** - 消息中心卡片
   - 显示系统消息和众测公告
   - 支持消息已读/未读状态

## 文件结构

```
task-hall/
├── page.tsx                 # 主页面组件
├── page.module.css          # 主页面样式
├── README.md               # 本文件
└── components/
    ├── index.ts            # 组件导出
    ├── TaskCard.tsx        # 任务卡片
    ├── TaskCard.module.css
    ├── UserCard.tsx        # 用户卡片
    ├── UserCard.module.css
    ├── TabBar.tsx          # 标签页
    ├── TabBar.module.css
    ├── Pagination.tsx      # 分页
    ├── Pagination.module.css
    ├── ShortcutsCard.tsx   # 快捷入口
    ├── ShortcutsCard.module.css
    ├── MessageCard.tsx     # 消息中心
    └── MessageCard.module.css
```

## 使用方法

### 基本使用

```tsx
import TaskHallPage from '@/app/crowdsource/task-hall/page';

export default function App() {
  return <TaskHallPage />;
}
```

### 路由配置

在 `next.config.js` 中配置路由：

```
/crowdsource/task-hall -> 任务大厅页面
```

## 功能特性

### 1. 任务搜索
- 支持按关键词搜索任务
- 实时过滤任务列表

### 2. 标签页切换
- 待领取：显示可以领取的任务
- 待完成：显示已领取但未完成的任务
- 已完成：显示已完成的任务

### 3. 任务状态
- **可领取**：显示绿色"领取"按钮
- **已满员**：显示灰色"已满员"按钮，不可点击
- **已结束**：显示灰色"已结束"按钮，不可点击

### 4. 分页功能
- 支持上一页/下一页导航
- 支持直接点击页码跳转
- 支持每页显示条数选择（10/20/50条）
- 支持输入页码直接跳转

### 5. 用户信息
- 显示用户等级和积分
- 快速访问个人中心
- 查看积分明细
- 退出登录

## 样式系统

### 颜色方案

- **主色**：#e31424（红色）
- **文字色**：#1d2129（深灰）
- **辅助文字**：#4e5969（中灰）
- **浅文字**：#86909c（浅灰）
- **背景色**：#f3f7fb（浅蓝）
- **卡片背景**：#ffffff（白色）

### 字体

- **标题**：PingFang SC, 16px, 500
- **正文**：PingFang SC, 14px, 400
- **小文本**：PingFang SC, 12px, 400

## 响应式设计

页面支持以下断点：

- **桌面**：1440px+
- **平板**：768px - 1440px
- **手机**：< 768px

在移动设备上：
- 侧边栏移到下方
- 搜索框全宽显示
- 任务卡片堆叠显示

## 数据结构

### Task 接口

```typescript
interface Task {
  id: string;
  title: string;
  image: string;
  timeRemaining: string;
  spotsRemaining: number;
  status: 'available' | 'full' | 'ended';
  type: 'pending' | 'in-progress' | 'completed';
}
```

### Message 接口

```typescript
interface Message {
  id: number;
  type: 'system' | 'announcement';
  title: string;
  content: string;
  isRead: boolean;
}
```

## 集成指南

### 1. 连接真实数据

替换 `mockTasks` 和 `mockMessages` 为真实数据源：

```tsx
// 使用 API 获取任务列表
const { data: tasks } = useTasks();

// 使用 API 获取消息列表
const { data: messages } = useMessages();
```

### 2. 实现任务领取功能

```tsx
const handleClaimTask = async (taskId: string) => {
  try {
    await claimTask(taskId);
    // 刷新任务列表
    refetchTasks();
  } catch (error) {
    console.error('Failed to claim task:', error);
  }
};
```

### 3. 实现搜索功能

```tsx
const handleSearch = (query: string) => {
  setSearchQuery(query);
  // 可选：调用 API 进行服务端搜索
  searchTasks(query);
};
```

## 性能优化

1. **虚拟滚动**：对于大量任务列表，考虑使用虚拟滚动
2. **图片优化**：使用 Next.js Image 组件优化图片加载
3. **缓存**：使用 React Query 或 SWR 缓存任务数据
4. **代码分割**：组件已按需加载

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 常见问题

### Q: 如何修改任务卡片的样式？
A: 编辑 `TaskCard.module.css` 文件中的相应样式类。

### Q: 如何添加新的快捷入口？
A: 在 `ShortcutsCard.tsx` 中的 `shortcuts` 数组中添加新项。

### Q: 如何修改分页的每页条数？
A: 在 `page.tsx` 中修改 `itemsPerPage` 常量。

## 后续改进

- [ ] 添加任务详情页面
- [ ] 实现任务筛选功能
- [ ] 添加任务收藏功能
- [ ] 实现实时通知
- [ ] 添加任务推荐算法
- [ ] 支持多语言

## 许可证

MIT

## 联系方式

如有问题或建议，请联系开发团队。
