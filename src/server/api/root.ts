import { createCallerFactory, createTRPCRouter } from '@/server/api/trpc';
import { userRouter } from '@/server/api/routers/user';
import { utilRouter } from '@/server/api/util';
import { testSystemRouter } from '@/server/api/routers/testSystem';
import { testCaseRouter } from '@/server/api/routers/testCase';
import { userSettingsRouter } from '@/server/api/routers/userSettings';
import { feedbackRouter } from '@/server/api/routers/feedback';
import { academyRouter } from '@/server/api/routers/academy';
import { announcementRouter } from '@/server/api/routers/announcement';
import { notificationRouter } from '@/server/api/routers/notification';
import { notificationTemplateRouter } from '@/server/api/routers/notificationTemplate';
import { taskPublishRouter } from '@/server/api/routers/taskPublish';
import { tagManagementRouter } from '@/server/api/routers/tagManagement';
import { dataDictionaryRouter } from '@/server/api/routers/dataDictionary';
import { testerRouter } from '@/server/api/routers/tester';
import { roleRouter } from '@/server/api/routers/role';
import { reviewRouter } from '@/server/api/routers/review';
import { pointsApplicationRouter } from '@/server/api/routers/pointsApplication';
import { defectRouter } from '@/server/api/routers/defect';
import { workbenchRouter } from '@/server/api/routers/workbench';
import { taskManagementRouter } from '@/server/api/routers/taskManagement';
import { carouselRouter } from '@/server/api/routers/carousel';
import { slidingTabRouter } from '@/server/api/routers/slidingTab';
import { homepagePopupRouter } from '@/server/api/routers/homepagePopup';
import { invitationRewardRouter } from '@/server/api/routers/invitationReward';
import { adminRouter } from '@/server/api/routers/admin';
import { deviceRouter } from '@/server/api/routers/device';
import { reportsRouter } from '@/server/api/routers/reports';
import { initTaskScheduler } from '@/server/cron/taskScheduler';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    user: userRouter,
    util: utilRouter,
    testSystem: testSystemRouter,
    testCase: testCaseRouter,
    userSettings: userSettingsRouter,
    feedback: feedbackRouter,
    academy: academyRouter,
    announcement: announcementRouter,
    notification: notificationRouter,
    notificationTemplate: notificationTemplateRouter,
    taskPublish: taskPublishRouter,
    tagManagement: tagManagementRouter,
    dataDictionary: dataDictionaryRouter,
    tester: testerRouter,
    role: roleRouter,
    review: reviewRouter,
    pointsApplication: pointsApplicationRouter,
    defect: defectRouter,
    workbench: workbenchRouter,
    taskManagement: taskManagementRouter,
    carousel: carouselRouter,
    slidingTab: slidingTabRouter,
    homepagePopup: homepagePopupRouter,
    invitationReward: invitationRewardRouter,
    admin: adminRouter,
    device: deviceRouter,
    reports: reportsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

// 初始化定时任务（只在服务器端执行）
// 使用条件导入确保只在服务器端运行
if (typeof window === 'undefined') {
    // 使用 setTimeout 确保在应用完全启动后再初始化定时任务
    setTimeout(() => {
        initTaskScheduler();
    }, 5000);
}
