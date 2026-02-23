import { useSession } from 'next-auth/react';
import { ROLES } from '@/app/const/status';

/**
 * 获取当前用户角色信息的自定义 hook
 */
export function useUserRole() {
    const { data: session, status } = useSession();
    
    // 从 session 中获取用户角色
    const userRole = session?.user?.role as ROLES | undefined;
    
    // 检查是否为部门经理
    const isDeptManager = userRole === ROLES.DEPT_MANAGER;
    
    // 检查是否为总经理
    const isGeneralManager = userRole === ROLES.GENERAL_MANAGER;
    
    // 检查是否为超级管理员（拥有所有权限）
    const isSuperAdmin = userRole === ROLES.SUPER_ADMIN;
    
    // 检查是否具有积分审核权限
    const hasPointsReviewPermission = isDeptManager || isGeneralManager || isSuperAdmin;
    
    return {
        userRole,
        isDeptManager,
        isGeneralManager,
        isSuperAdmin,
        hasPointsReviewPermission,
        isLoading: status === 'loading',
        isAuthenticated: !!session,
    };
}