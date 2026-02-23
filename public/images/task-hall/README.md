# 任务大厅图片资源

## 目录结构

```
public/images/task-hall/
├── banner.jpg              # Banner轮播图 (870x300px)
├── task-1.jpg              # 任务1缩略图 (72x72px)
├── task-2.jpg              # 任务2缩略图 (72x72px)
├── task-3.jpg              # 任务3缩略图 (72x72px)
├── task-4.jpg              # 任务4缩略图 (72x72px)
├── task-5.jpg              # 任务5缩略图 (72x72px)
├── task-6.jpg              # 任务6缩略图 (72x72px)
├── task-7.jpg              # 任务7缩略图 (72x72px)
├── task-8.jpg              # 任务8缩略图 (72x72px)
├── task-9.jpg              # 任务9缩略图 (72x72px)
├── task-10.jpg             # 任务10缩略图 (72x72px)
└── user-avatar.jpg         # 用户头像 (72x72px)
```

## 图片规格

### Banner图片
- **文件名**: banner.jpg
- **尺寸**: 870x300px
- **用途**: 任务大厅顶部轮播图
- **格式**: JPG (推荐压缩质量80%)

### 任务缩略图
- **文件名**: task-1.jpg ~ task-10.jpg
- **尺寸**: 72x72px
- **用途**: 任务卡片左侧缩略图
- **格式**: JPG (推荐压缩质量85%)

### 用户头像
- **文件名**: user-avatar.jpg
- **尺寸**: 72x72px
- **用途**: 用户信息卡片头像
- **格式**: JPG (推荐压缩质量85%)

## 使用方法

### 在代码中引用
```tsx
// Banner
<img src="/images/task-hall/banner.jpg" alt="Banner" />

// 任务缩略图
<img src="/images/task-hall/task-1.jpg" alt="Task" />

// 用户头像
<img src="/images/task-hall/user-avatar.jpg" alt="User Avatar" />
```

## 上传步骤

1. 准备好对应尺寸的图片文件
2. 将图片放入 `public/images/task-hall/` 目录
3. 确保文件名与上面列出的名称一致
4. 重启开发服务器

## 图片优化建议

- 使用 JPG 格式以获得最佳压缩率
- 对于 Banner 图片，建议使用 WebP 格式以进一步减小文件大小
- 使用在线工具（如 TinyPNG）压缩图片
- 确保图片质量在 80-85% 之间

## 替换图片

如需替换图片，只需：
1. 删除旧图片
2. 上传新图片（保持相同的文件名）
3. 清除浏览器缓存或硬刷新（Ctrl+Shift+R）

## 常见问题

**Q: 图片不显示？**
A: 检查文件名是否正确，确保文件在 `public/images/task-hall/` 目录中

**Q: 图片加载很慢？**
A: 尝试压缩图片或使用 WebP 格式

**Q: 如何使用 Next.js Image 组件优化？**
A: 可以使用 `next/image` 组件替代 `<img>` 标签以获得自动优化
