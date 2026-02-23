'use client';

import { useSession } from 'next-auth/react';
import { api } from '@/trpc/react';
import { useMemo } from 'react';

// 菜单权限ID到路由的映射
export const PERMISSION_ROUTE_MAP: Record<string, string[]> = {
    // 顶部导航菜单
    workspace: ['/crowdsource/workbench'],
    'task-hall': ['/crowdsource/task-hall'],
    'task-publish': ['/crowdsource/publish'],
    'task-review': ['/crowdsource/review'],
    'points-review': ['/crowdsource/points'],
    academy: ['/crowdsource/academy'],
    'usage-management': ['/crowdsource/cases'],
    'defect-management': ['/crowdsource/defectManagement'],
    report: ['/crowdsource/reports'],
    admin: ['/crowdsource/admin'],

    // 后台管理子菜单
    'task-management': ['/crowdsource/admin/task-management'],
    'personnel-management': [
        '/crowdsource/admin/testers',
        '/crowdsource/admin/roles',
    ],
    'report-management': [
        '/crowdsource/admin/branch-statistics',
        '/crowdsource/admin/task-statistics',
        '/crowdsource/admin/overall-statistics',
        '/crowdsource/admin/detail-reports',
    ],
    'announcement-management': [
        '/crowdsource/admin/system-announcement',
        '/crowdsource/admin/message-notification',
        '/crowdsource/admin/homepage-management',
        '/crowdsource/admin/academy',
    ],
    'data-dictionary': ['/crowdsource/admin/data-dictionary'],
    'tag-management': ['/crowdsource/admin/tag-management'],
    'finance-management': [
        '/crowdsource/admin/payment-management',
        '/crowdsource/admin/order-transactions',
        '/crowdsource/admin/admin-transactions',
        '/crowdsource/admin/user-redemption',
        '/crowdsource/admin/legacy-points-query',
    ],
    'device-management': ['/crowdsource/admin/device-management'],
    'invitation-reward': ['/crowdsource/admin/invitation-rewards'],
    feedback: ['/crowdsource/admin/feedback'],

    // 用户中心
    'user-center': [
        '/crowdsource/pointsDetails',
        '/crowdsource/settings',
        '/crowdsource/messageCenter',
        '/crowdsource/feedback',
        '/crowdsource/aboutUs',
    ],
};

// 顶部导航菜单项配置
export const TOP_NAV_ITEMS = [
    { id: 'task-hall', label: '任务大厅', href: '/crowdsource/task-hall' },
    { id: 'task-publish', label: '众测发布', href: '/crowdsource/publish' },
    { id: 'task-review', label: '众测审核', href: '/crowdsource/review' },
    { id: 'points-review', label: '积分审核', href: '/crowdsource/points' },
    { id: 'academy', label: '众测学堂', href: '/crowdsource/academy' },
    { id: 'usage-management', label: '用例管理', href: '/crowdsource/cases' },
    {
        id: 'defect-management',
        label: '缺陷管理',
        href: '/crowdsource/defectManagement',
    },
    { id: 'report', label: '统计报表', href: '/crowdsource/reports' },
    { id: 'admin', label: '后台管理', href: '/crowdsource/admin' },
];

// 后台管理侧边栏菜单配置
export const ADMIN_MENU_ITEMS = [
    {
        id: 'task-management',
        label: '任务管理',
        href: '/crowdsource/admin/task-management',
    },
    {
        id: 'personnel-management',
        label: '人员管理',
        children: [
            {
                id: 'testers',
                label: '众测人员',
                href: '/crowdsource/admin/testers',
            },
            { id: 'roles', label: '角色', href: '/crowdsource/admin/roles' },
        ],
    },
    {
        id: 'report-management',
        label: '报表管理',
        children: [
            {
                id: 'branch-statistics',
                label: '分行统计',
                href: '/crowdsource/admin/branch-statistics',
            },
            {
                id: 'task-statistics',
                label: '任务统计',
                href: '/crowdsource/admin/task-statistics',
            },
            {
                id: 'overall-statistics',
                label: '总体统计',
                href: '/crowdsource/admin/overall-statistics',
            },
            {
                id: 'detail-reports',
                label: '明细报表',
                href: '/crowdsource/admin/detail-reports',
            },
        ],
    },
    {
        id: 'announcement-management',
        label: '公告与消息管理',
        children: [
            {
                id: 'system-announcement',
                label: '系统公告',
                href: '/crowdsource/admin/system-announcement',
            },
            {
                id: 'message-notification',
                label: '消息通知',
                href: '/crowdsource/admin/message-notification',
            },
            {
                id: 'homepage-management',
                label: '首页管理',
                href: '/crowdsource/admin/homepage-management',
            },
            {
                id: 'academy-management',
                label: '众测学堂',
                href: '/crowdsource/admin/academy',
            },
        ],
    },
    {
        id: 'data-dictionary',
        label: '数据字典管理',
        href: '/crowdsource/admin/data-dictionary',
    },
    {
        id: 'tag-management',
        label: '标签管理',
        href: '/crowdsource/admin/tag-management',
    },
    {
        id: 'finance-management',
        label: '财务管理',
        children: [
            {
                id: 'payment-management',
                label: '财务打款管理',
                href: '/crowdsource/admin/payment-management',
            },
            {
                id: 'order-transactions',
                label: '订单交易明细',
                href: '/crowdsource/admin/order-transactions',
            },
            {
                id: 'admin-transactions',
                label: '管理员交易明细',
                href: '/crowdsource/admin/admin-transactions',
            },
            {
                id: 'user-redemption',
                label: '用户兑换明细',
                href: '/crowdsource/admin/user-redemption',
            },
            {
                id: 'legacy-points-query',
                label: '旧系统积分查询',
                href: '/crowdsource/admin/legacy-points-query',
            },
        ],
    },
    {
        id: 'device-management',
        label: '设备管理',
        href: '/crowdsource/admin/device-management',
    },
    {
        id: 'invitation-reward',
        label: '邀请有奖',
        href: '/crowdsource/admin/invitation-rewards',
    },
    { id: 'feedback', label: '意见反馈', href: '/crowdsource/admin/feedback' },
];

export function usePermissions() {
    const { data: session, status } = useSession();
    const { data: permissionsData, isLoading } =
        api.user.getPermissions.useQuery(undefined, {
            enabled: status === 'authenticated',
            staleTime: 5 * 60 * 1000, // 5分钟内不重新获取
        });

    const permissions = useMemo(() => {
        return permissionsData?.permissions || [];
    }, [permissionsData]);

    // 检查是否有某个权限
    const hasPermission = (permissionId: string): boolean => {
        return permissions.includes(permissionId);
    };

    // 检查是否有任意一个权限
    const hasAnyPermission = (permissionIds: string[]): boolean => {
        return permissionIds.some((id) => permissions.includes(id));
    };

    // 检查是否有所有权限
    const hasAllPermissions = (permissionIds: string[]): boolean => {
        return permissionIds.every((id) => permissions.includes(id));
    };

    // 根据权限过滤顶部导航菜单
    const filteredTopNavItems = useMemo(() => {
        return TOP_NAV_ITEMS.filter((item) => hasPermission(item.id));
    }, [permissions]);

    // 根据权限过滤后台管理菜单
    const filteredAdminMenuItems = useMemo(() => {
        return ADMIN_MENU_ITEMS.filter((item) => {
            // 检查父菜单权限
            if (!hasPermission(item.id)) {
                return false;
            }

            // 如果有子菜单，过滤子菜单
            if (item.children) {
                const filteredChildren = item.children.filter((child) => {
                    // 子菜单不需要单独检查权限，只要父菜单有权限就显示
                    return true;
                });
                return filteredChildren.length > 0;
            }

            return true;
        }).map((item) => {
            if (item.children) {
                return {
                    ...item,
                    children: item.children,
                };
            }
            return item;
        });
    }, [permissions]);

    // 检查是否有后台管理权限
    const hasAdminPermission = useMemo(() => {
        return hasPermission('admin');
    }, [permissions]);

    return {
        permissions,
        isLoading: isLoading || status === 'loading',
        isAuthenticated: status === 'authenticated',
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        filteredTopNavItems,
        filteredAdminMenuItems,
        hasAdminPermission,
    };
}

export default usePermissions;
