import cron from 'node-cron';
import { db } from '@/server/db';

/**
 * 定时任务调度器
 * 用于自动处理任务状态变更
 */

// 是否已初始化
let isInitialized = false;

// 标记是否在服务器环境
const isServer = typeof window === 'undefined';

/**
 * 自动结束已过期的执行中任务
 * 将 EXECUTING 状态且 endTime < now 的任务更新为 EXECUTION_ENDED
 */
async function autoEndExpiredTasks() {
  try {
    const now = new Date();

    // 查找所有已过期但状态仍为 EXECUTING 的任务
    const expiredTasks = await db.testTask.findMany({
      where: {
        status: 'EXECUTING',
        endTime: {
          lt: now,
        },
        isDeleted: false,
      },
      select: {
        id: true,
        title: true,
        endTime: true,
      },
    });

    if (expiredTasks.length === 0) {
      console.log('[Cron] 没有需要自动结束的任务');
      return;
    }

    console.log(`[Cron] 发现 ${expiredTasks.length} 个已过期任务，正在自动结束...`);

    // 批量更新任务状态
    const result = await db.testTask.updateMany({
      where: {
        status: 'EXECUTING',
        endTime: {
          lt: now,
        },
        isDeleted: false,
      },
      data: {
        status: 'EXECUTION_ENDED',
      },
    });

    console.log(`[Cron] 成功自动结束 ${result.count} 个任务`);

    // 记录具体结束的任务
    expiredTasks.forEach((task) => {
      console.log(`[Cron] 任务已自动结束: ${task.title} (ID: ${task.id})`);
    });
  } catch (error) {
    console.error('[Cron] 自动结束任务时出错:', error);
  }
}

/**
 * 初始化定时任务
 * 在应用启动时调用
 */
export function initTaskScheduler() {
  // 确保只在服务器端运行
  if (!isServer) {
    console.log('[Cron] 非服务器环境，跳过定时任务初始化');
    return;
  }

  if (isInitialized) {
    console.log('[Cron] 定时任务已初始化，跳过');
    return;
  }

  console.log('[Cron] 正在初始化定时任务调度器...');

  // 每5分钟检查一次过期任务
  // 可以根据实际需求调整频率
  cron.schedule('*/5 * * * *', () => {
    console.log('[Cron] 执行定时任务: 检查并自动结束过期任务');
    void autoEndExpiredTasks();
  });

  // 立即执行一次（应用启动时）
  void autoEndExpiredTasks();

  isInitialized = true;
  console.log('[Cron] 定时任务调度器初始化完成');
}

/**
 * 停止定时任务
 * 在应用关闭时调用（可选）
 */
export function stopTaskScheduler() {
  if (!isInitialized) {
    return;
  }

  cron.getTasks().forEach((task) => {
    task.stop();
  });

  isInitialized = false;
  console.log('[Cron] 定时任务调度器已停止');
}

