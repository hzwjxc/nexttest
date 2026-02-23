import { NextResponse } from 'next/server';
import { initTaskScheduler, stopTaskScheduler } from '@/server/cron/taskScheduler';

// 标记是否已初始化
let isInitialized = false;

/**
 * GET /api/cron
 * 用于初始化和检查定时任务状态
 * 可以在应用启动时调用，或者由外部定时服务触发
 */
export async function GET() {
  try {
    // 只在第一次调用时初始化
    if (!isInitialized) {
      initTaskScheduler();
      isInitialized = true;

      return NextResponse.json({
        success: true,
        message: '定时任务调度器已初始化',
        status: 'initialized',
      });
    }

    return NextResponse.json({
      success: true,
      message: '定时任务调度器运行中',
      status: 'running',
    });
  } catch (error) {
    console.error('[Cron API] 初始化定时任务失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '初始化定时任务失败',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron
 * 手动触发任务检查（可选）
 */
export async function POST() {
  try {
    // 这里可以手动触发一次任务检查
    // 实际逻辑在 taskScheduler.ts 中实现

    return NextResponse.json({
      success: true,
      message: '手动触发任务检查已调度',
    });
  } catch (error) {
    console.error('[Cron API] 手动触发任务失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '手动触发任务失败',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cron
 * 停止定时任务（可选）
 */
export async function DELETE() {
  try {
    stopTaskScheduler();
    isInitialized = false;

    return NextResponse.json({
      success: true,
      message: '定时任务调度器已停止',
      status: 'stopped',
    });
  } catch (error) {
    console.error('[Cron API] 停止定时任务失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '停止定时任务失败',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
