'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, Flex, Text, Button, Spinner } from '@chakra-ui/react';
import { FiShield } from 'react-icons/fi';
import { usePermissions, PERMISSION_ROUTE_MAP } from '@/app/hooks/usePermissions';

interface PermissionGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

// 根据当前路径获取所需的权限ID
function getRequiredPermission(pathname: string): string | null {
    // 精确匹配
    for (const [permissionId, routes] of Object.entries(PERMISSION_ROUTE_MAP)) {
        if (routes.includes(pathname)) {
            return permissionId;
        }
    }
    
    // 前缀匹配（用于子路由）
    for (const [permissionId, routes] of Object.entries(PERMISSION_ROUTE_MAP)) {
        for (const route of routes) {
            if (pathname.startsWith(route) && route !== '/crowdsource/admin') {
                return permissionId;
            }
        }
    }
    
    // 后台管理页面特殊处理
    if (pathname.startsWith('/crowdsource/admin')) {
        return 'admin';
    }
    
    return null;
}

export default function PermissionGuard({ children, fallback }: PermissionGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { permissions, isLoading, isAuthenticated } = usePermissions();

    const requiredPermission = getRequiredPermission(pathname);

    useEffect(() => {
        // 如果未登录且不在登录页面，重定向到登录页
        if (!isLoading && !isAuthenticated && pathname !== '/login') {
            router.replace('/login');
        }
    }, [isLoading, isAuthenticated, pathname, router]);

    // 加载中显示加载状态
    if (isLoading) {
        return (
            <Flex justify="center" align="center" minH="100vh">
                <Spinner size="xl" color="#E31424" />
            </Flex>
        );
    }

    // 未登录不渲染内容
    if (!isAuthenticated) {
        return null;
    }

    // 如果没有需要检查的权限，直接渲染内容
    if (!requiredPermission) {
        return <>{children}</>;
    }

    // 检查是否有权限
    const hasPermission = permissions.includes(requiredPermission);

    // 无权限显示提示页面
    if (!hasPermission) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <Flex justify="center" align="center" minH="calc(100vh - 72px)">
                <Box textAlign="center" p={8}>
                    <Flex direction="column" align="center" gap={4}>
                        <FiShield size={48} color="#E31424" />
                        <Text
                            fontSize="xl"
                            fontWeight="bold"
                            color="#1D2129"
                        >
                            权限不足
                        </Text>
                        <Text
                            color="#4E5969"
                            textAlign="center"
                            maxW="400px"
                        >
                            您的账户没有访问此页面的权限
                            <br />
                            如需访问，请联系管理员分配相应权限
                        </Text>
                        <Button
                            bg="#E31424"
                            color="white"
                            _hover={{ bg: '#c70f20' }}
                            onClick={() => router.push('/crowdsource/task-hall')}
                            mt={4}
                        >
                            返回任务大厅
                        </Button>
                    </Flex>
                </Box>
            </Flex>
        );
    }

    // 有权限，渲染子组件
    return <>{children}</>;
}

// 高阶组件版本，用于包裹页面组件
export function withPermissionGuard<P extends object>(
    Component: React.ComponentType<P>
): React.FC<P> {
    return function WrappedComponent(props: P) {
        return (
            <PermissionGuard>
                <Component {...props} />
            </PermissionGuard>
        );
    };
}
