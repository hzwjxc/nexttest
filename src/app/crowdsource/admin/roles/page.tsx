'use client';

import React, { useState } from 'react';
import {
    Box,
    Flex,
    Text,
    Button,
    Input,
    Badge,
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogTitle,
    DialogCloseTrigger,
    DialogActionTrigger,
    NativeSelectRoot,
    NativeSelectField,
    Textarea,
    DialogBackdrop,
} from '@chakra-ui/react';
import { LuPlus, LuPencil, LuTrash2 } from 'react-icons/lu';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';
import { Checkbox } from '@/app/_components/ui/checkbox';

const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    borderColor: '#E5E6EB',
};

// 角色映射
const ROLE_MAP: Record<string, string> = {
    SUPER_ADMIN: '超级管理员',
    TEST_ADMIN: '众测管理员',
    LIAISON: '分行众测联络员',
    TESTER: '众测测试人员',
    DEPT_MANAGER: '部门经理',
    GENERAL_MANAGER: '总经理',
};

// 角色颜色
const ROLE_COLOR_MAP: Record<string, string> = {
    SUPER_ADMIN: 'red',
    TEST_ADMIN: 'purple',
    LIAISON: 'orange',
    TESTER: 'blue',
    DEPT_MANAGER: 'green',
    GENERAL_MANAGER: 'pink',
};

// 角色描述
const ROLE_DESCRIPTIONS: Record<string, string> = {
    SUPER_ADMIN: '拥有系统所有权限，可管理所有模块和用户',
    TEST_ADMIN: '管理众测任务、审核测试报告、分配任务',
    LIAISON: '协调分行众测工作，管理本分行测试人员',
    TESTER: '执行测试任务，提交测试报告和缺陷',
    DEPT_MANAGER: '审核积分预算初审、奖励金发放审核',
    GENERAL_MANAGER: '审核积分预算终审',
};

// 菜单权限树
const MENU_PERMISSIONS = [
    {
        id: 'workspace',
        name: '工作台',
        children: [],
    },
    {
        id: 'task-hall',
        name: '任务大厅',
        children: [],
    },
    {
        id: 'task-publish',
        name: '众测发布',
        children: [],
    },
    {
        id: 'task-review',
        name: '众测审核',
        children: [],
    },
    {
        id: 'points-review',
        name: '积分审核',
        children: [],
    },
    {
        id: 'academy',
        name: '众测学堂',
        children: [],
    },
    {
        id: 'usage-management',
        name: '用例管理',
        children: [],
    },
    {
        id: 'defect-management',
        name: '缺陷管理',
        children: [],
    },
    {
        id: 'report',
        name: '统计报表',
        children: [],
    },
    {
        id: 'admin',
        name: '后台管理',
        children: [
            { id: 'task-management', name: '任务管理' },
            { id: 'personnel-management', name: '人员管理' },
            { id: 'report-management', name: '报表管理' },
            { id: 'announcement-management', name: '公告与消息管理' },
            { id: 'data-dictionary', name: '数据字典管理' },
            { id: 'tag-management', name: '标签管理' },
            { id: 'finance-management', name: '财务管理' },
            { id: 'device-management', name: '设备管理' },
            { id: 'invitation-reward', name: '邀请有奖' },
            { id: 'feedback', name: '意见反馈' },
        ],
    },
    {
        id: 'mini-program',
        name: '小程序',
        children: [
            { id: 'mini-task', name: '任务' },
            { id: 'mini-academy', name: '学堂' },
            { id: 'mini-my', name: '我的' },
        ],
    },
];

interface RoleFormData {
    id?: string;
    code: string;
    name: string;
    description: string;
    status: boolean;
}

export default function RolesPage() {
    const { showSuccessToast, showErrorToast } = useCustomToast();

    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [currentRole, setCurrentRole] = useState<RoleFormData | null>(null);
    const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        []
    );

    // 查询角色列表
    const {
        data: rolesData,
        isLoading,
        refetch,
    } = api.role.list.useQuery(
        {
            page: 1,
            pageSize: 100,
        },
        {
            refetchOnMount: 'always',
            refetchOnWindowFocus: true,
        }
    );

    // 查询选中角色的人员列表
    const selectedRole = rolesData?.list.find((r) => r.id === selectedRoleId);
    const { data: roleUsersData } = api.tester.list.useQuery(
        {
            page: 1,
            pageSize: 100,
            role: selectedRole?.code || undefined,
        },
        {
            enabled: !!selectedRoleId && !!selectedRole,
        }
    );

    // 创建角色
    const createMutation = api.role.create.useMutation({
        onSuccess: () => {
            showSuccessToast('角色创建成功');
            setIsDialogOpen(false);
            setCurrentRole(null);
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message || '角色创建失败');
        },
    });

    // 更新角色
    const updateMutation = api.role.update.useMutation({
        onSuccess: () => {
            showSuccessToast('角色更新成功');
            setIsDialogOpen(false);
            setCurrentRole(null);
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message || '角色更新失败');
        },
    });

    // 删除角色
    const deleteMutation = api.role.delete.useMutation({
        onSuccess: () => {
            showSuccessToast('角色删除成功');
            setIsDeleteDialogOpen(false);
            setDeleteRoleId(null);
            if (selectedRoleId === deleteRoleId) {
                setSelectedRoleId(null);
            }
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message || '角色删除失败');
        },
    });

    // 更新角色权限
    const updatePermissionsMutation = api.role.updatePermissions.useMutation({
        onSuccess: () => {
            showSuccessToast('权限保存成功');
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message || '权限保存失败');
        },
    });

    // 打开新增对话框
    const handleAdd = () => {
        setCurrentRole({
            code: '',
            name: '',
            description: '',
            status: true,
        });
        setIsDialogOpen(true);
    };

    // 打开编辑对话框
    const handleEdit = (role: any) => {
        setCurrentRole({
            id: role.id,
            code: role.code,
            name: role.name,
            description: role.description || '',
            status: role.status,
        });
        setIsDialogOpen(true);
    };

    // 打开删除对话框
    const handleDeleteClick = (roleId: string) => {
        setDeleteRoleId(roleId);
        setIsDeleteDialogOpen(true);
    };

    // 提交表单
    const handleSubmit = () => {
        if (!currentRole) return;

        if (!currentRole.code || !currentRole.name) {
            showErrorToast('请填写完整信息');
            return;
        }

        if (currentRole.id) {
            updateMutation.mutate({
                id: currentRole.id,
                code: currentRole.code,
                name: currentRole.name,
                description: currentRole.description,
                status: currentRole.status,
            });
        } else {
            createMutation.mutate({
                code: currentRole.code,
                name: currentRole.name,
                description: currentRole.description,
                status: currentRole.status,
            });
        }
    };

    // 确认删除
    const handleConfirmDelete = () => {
        if (deleteRoleId) {
            deleteMutation.mutate(deleteRoleId);
        }
    };

    // 切换权限选择
    const handleTogglePermission = (permissionId: string) => {
        setSelectedPermissions((prev) => {
            // 查找是否是父菜单
            const parentMenu = MENU_PERMISSIONS.find(
                (menu) => menu.id === permissionId
            );

            if (parentMenu && parentMenu.children.length > 0) {
                // 如果是父菜单且有子菜单
                const childIds = parentMenu.children.map((child) => child.id);

                if (prev.includes(permissionId)) {
                    // 取消选中：移除父菜单和所有子菜单
                    return prev.filter(
                        (id) => id !== permissionId && !childIds.includes(id)
                    );
                } else {
                    // 选中：添加父菜单和所有子菜单
                    return [...prev, permissionId, ...childIds];
                }
            } else {
                // 如果是子菜单或没有子菜单的父菜单
                let newPermissions: string[];

                if (prev.includes(permissionId)) {
                    // 取消选中子菜单
                    newPermissions = prev.filter((id) => id !== permissionId);

                    // 检查是否需要取消父菜单
                    const parent = MENU_PERMISSIONS.find((menu) =>
                        menu.children.some((child) => child.id === permissionId)
                    );

                    if (parent) {
                        const childIds = parent.children.map(
                            (child) => child.id
                        );
                        const hasAnyChildSelected = childIds.some((childId) =>
                            newPermissions.includes(childId)
                        );

                        // 如果所有子菜单都未选中，则取消父菜单
                        if (
                            !hasAnyChildSelected &&
                            newPermissions.includes(parent.id)
                        ) {
                            newPermissions = newPermissions.filter(
                                (id) => id !== parent.id
                            );
                        }
                    }

                    return newPermissions;
                } else {
                    // 选中子菜单
                    newPermissions = [...prev, permissionId];

                    // 检查是否需要自动选中父菜单
                    const parent = MENU_PERMISSIONS.find((menu) =>
                        menu.children.some((child) => child.id === permissionId)
                    );

                    if (parent) {
                        const childIds = parent.children.map(
                            (child) => child.id
                        );
                        const allChildrenSelected = childIds.every((childId) =>
                            newPermissions.includes(childId)
                        );

                        // 如果所有子菜单都已选中，则自动选中父菜单
                        if (
                            allChildrenSelected &&
                            !newPermissions.includes(parent.id)
                        ) {
                            newPermissions = [...newPermissions, parent.id];
                        }
                    }

                    return newPermissions;
                }
            }
        });
    };

    // 选中角色
    const handleSelectRole = (roleId: string) => {
        setSelectedRoleId(roleId);
        // 加载该角色的权限
        const role = rolesData?.list.find((r) => r.id === roleId);
        setSelectedPermissions(role?.permissions || []);
    };

    // 保存权限
    const handleSavePermissions = () => {
        if (!selectedRoleId) {
            showErrorToast('请先选择角色');
            return;
        }

        updatePermissionsMutation.mutate({
            id: selectedRoleId,
            permissions: selectedPermissions,
        });
    };

    return (
        <Box bg={COLORS.bgSecondary} minH="calc(100vh - 72px)" p={6}>
            {/* 面包屑导航 */}
            <Flex align="center" gap={2} mb={4}>
                <Text fontSize="14px" color={COLORS.textSecondary}>
                    后台管理
                </Text>
                <Text fontSize="14px" color={COLORS.textSecondary}>
                    /
                </Text>
                <Text fontSize="14px" color={COLORS.textSecondary}>
                    人员管理
                </Text>
                <Text fontSize="14px" color={COLORS.textSecondary}>
                    /
                </Text>
                <Text fontSize="14px" color={COLORS.textPrimary}>
                    角色
                </Text>
            </Flex>

            {/* 三栏布局 */}
            <Flex gap={4} align="stretch">
                {/* 左侧：角色列表 */}
                <Box
                    bg={COLORS.bgPrimary}
                    borderRadius="8px"
                    boxShadow="0 1px 4px rgba(0, 0, 0, 0.08)"
                    width="280px"
                    flexShrink={0}
                >
                    {/* 标题和新增按钮 */}
                    <Flex
                        justify="space-between"
                        align="center"
                        p={4}
                        borderBottom="1px solid"
                        borderColor={COLORS.borderColor}
                    >
                        <Text
                            fontSize="16px"
                            fontWeight="600"
                            color={COLORS.textPrimary}
                        >
                            角色名称
                        </Text>
                        <Button
                            size="xs"
                            bg={COLORS.primary}
                            color="white"
                            fontSize="12px"
                            _hover={{ bg: '#c70f20' }}
                            onClick={handleAdd}
                        >
                            <LuPlus style={{ marginRight: '4px' }} />
                            新增
                        </Button>
                    </Flex>

                    {/* 角色列表 */}
                    <Box maxH="calc(100vh - 250px)" overflowY="auto">
                        {isLoading ? (
                            <Flex justify="center" align="center" py={8}>
                                <Text
                                    color={COLORS.textSecondary}
                                    fontSize="14px"
                                >
                                    加载中...
                                </Text>
                            </Flex>
                        ) : !rolesData || rolesData.list.length === 0 ? (
                            <Flex justify="center" align="center" py={8}>
                                <Text
                                    color={COLORS.textSecondary}
                                    fontSize="14px"
                                >
                                    暂无角色
                                </Text>
                            </Flex>
                        ) : (
                            rolesData.list.map((role) => (
                                <Flex
                                    key={role.id}
                                    align="center"
                                    justify="space-between"
                                    p={3}
                                    borderBottom="1px solid"
                                    borderColor={COLORS.borderColor}
                                    cursor="pointer"
                                    bg={
                                        selectedRoleId === role.id
                                            ? '#FFF1F0'
                                            : 'transparent'
                                    }
                                    _hover={{ bg: '#FFF1F0' }}
                                    onClick={() => handleSelectRole(role.id)}
                                >
                                    <Flex align="center" gap={2} flex={1}>
                                        <Text
                                            fontSize="14px"
                                            fontWeight={
                                                selectedRoleId === role.id
                                                    ? '600'
                                                    : '400'
                                            }
                                            color={
                                                selectedRoleId === role.id
                                                    ? COLORS.primary
                                                    : COLORS.textPrimary
                                            }
                                        >
                                            {role.name}
                                        </Text>
                                    </Flex>
                                    <Flex gap={1}>
                                        <Button
                                            size="xs"
                                            variant="ghost"
                                            colorScheme="blue"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(role);
                                            }}
                                        >
                                            <LuPencil size={14} />
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="ghost"
                                            colorScheme="red"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(role.id);
                                            }}
                                        >
                                            <LuTrash2 size={14} />
                                        </Button>
                                    </Flex>
                                </Flex>
                            ))
                        )}
                    </Box>
                </Box>

                {/* 中间：菜单权限 */}
                <Box
                    bg={COLORS.bgPrimary}
                    borderRadius="8px"
                    boxShadow="0 1px 4px rgba(0, 0, 0, 0.08)"
                    flex={1}
                >
                    <Flex
                        justify="space-between"
                        align="center"
                        p={4}
                        borderBottom="1px solid"
                        borderColor={COLORS.borderColor}
                    >
                        <Text
                            fontSize="16px"
                            fontWeight="600"
                            color={COLORS.textPrimary}
                        >
                            菜单
                        </Text>
                        {selectedRoleId && (
                            <Button
                                size="sm"
                                bg={COLORS.primary}
                                color="white"
                                fontSize="14px"
                                _hover={{ bg: '#c70f20' }}
                                onClick={handleSavePermissions}
                                loading={updatePermissionsMutation.isPending}
                            >
                                保存权限
                            </Button>
                        )}
                    </Flex>

                    <Box p={4} maxH="calc(100vh - 250px)" overflowY="auto">
                        {!selectedRoleId ? (
                            <Flex justify="center" align="center" py={8}>
                                <Text
                                    color={COLORS.textSecondary}
                                    fontSize="14px"
                                >
                                    请选择角色
                                </Text>
                            </Flex>
                        ) : (
                            <Flex direction="column" gap={3}>
                                {MENU_PERMISSIONS.map((menu) => (
                                    <Box key={menu.id}>
                                        <Flex align="center" gap={2} mb={2}>
                                            <Checkbox
                                                checked={selectedPermissions.includes(
                                                    menu.id
                                                )}
                                                onCheckedChange={() =>
                                                    handleTogglePermission(
                                                        menu.id
                                                    )
                                                }
                                            >
                                                <Text
                                                    fontSize="14px"
                                                    fontWeight="500"
                                                    color={COLORS.textPrimary}
                                                >
                                                    {menu.name}
                                                </Text>
                                            </Checkbox>
                                        </Flex>
                                        {menu.children.length > 0 && (
                                            <Flex
                                                direction="column"
                                                gap={2}
                                                ml={6}
                                            >
                                                {menu.children.map((child) => (
                                                    <Checkbox
                                                        key={child.id}
                                                        checked={selectedPermissions.includes(
                                                            child.id
                                                        )}
                                                        onCheckedChange={() =>
                                                            handleTogglePermission(
                                                                child.id
                                                            )
                                                        }
                                                    >
                                                        <Text
                                                            fontSize="14px"
                                                            color={
                                                                COLORS.textSecondary
                                                            }
                                                        >
                                                            {child.name}
                                                        </Text>
                                                    </Checkbox>
                                                ))}
                                            </Flex>
                                        )}
                                    </Box>
                                ))}
                            </Flex>
                        )}
                    </Box>
                </Box>

                {/* 右侧：角色人员列表 */}
                <Box
                    bg={COLORS.bgPrimary}
                    borderRadius="8px"
                    boxShadow="0 1px 4px rgba(0, 0, 0, 0.08)"
                    width="320px"
                    flexShrink={0}
                >
                    <Flex
                        justify="space-between"
                        align="center"
                        p={4}
                        borderBottom="1px solid"
                        borderColor={COLORS.borderColor}
                    >
                        <Text
                            fontSize="16px"
                            fontWeight="600"
                            color={COLORS.textPrimary}
                        >
                            角色人员列表
                        </Text>
                    </Flex>

                    <Box maxH="calc(100vh - 250px)" overflowY="auto">
                        {!selectedRoleId ? (
                            <Flex justify="center" align="center" py={8}>
                                <Text
                                    color={COLORS.textSecondary}
                                    fontSize="14px"
                                >
                                    请选择角色
                                </Text>
                            </Flex>
                        ) : !roleUsersData ||
                          roleUsersData.list.length === 0 ? (
                            <Flex justify="center" align="center" py={8}>
                                <Text
                                    color={COLORS.textSecondary}
                                    fontSize="14px"
                                >
                                    暂无人员
                                </Text>
                            </Flex>
                        ) : (
                            roleUsersData.list.map((user) => (
                                <Flex
                                    key={user.id}
                                    align="center"
                                    justify="space-between"
                                    p={3}
                                    borderBottom="1px solid"
                                    borderColor={COLORS.borderColor}
                                >
                                    <Flex direction="column" gap={1}>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="500"
                                            color={COLORS.textPrimary}
                                        >
                                            {user.name || '未命名'}
                                        </Text>
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textSecondary}
                                        >
                                            {user.phone || user.oaId || '-'}
                                        </Text>
                                    </Flex>
                                </Flex>
                            ))
                        )}
                    </Box>
                </Box>
            </Flex>

            {/* 新增/编辑对话框 */}
            <DialogRoot
                open={isDialogOpen}
                onOpenChange={(e) => setIsDialogOpen(e.open)}
            >
                <DialogBackdrop />
                <DialogContent
                    maxW="600px"
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                >
                    <DialogHeader>
                        <DialogTitle>
                            {currentRole?.id ? '编辑角色' : '新增角色'}
                        </DialogTitle>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody>
                        <Flex direction="column" gap={4}>
                            <Box>
                                <Text fontSize="14px" mb={2} fontWeight="500">
                                    角色编码{' '}
                                    <Text as="span" color="red">
                                        *
                                    </Text>
                                </Text>
                                {currentRole?.id ? (
                                    <NativeSelectRoot disabled>
                                        <NativeSelectField
                                            value={currentRole.code}
                                            onChange={(e) =>
                                                setCurrentRole({
                                                    ...currentRole,
                                                    code: e.target.value,
                                                })
                                            }
                                            fontSize="14px"
                                        >
                                            {Object.entries(ROLE_MAP).map(
                                                ([key, value]) => (
                                                    <option
                                                        key={key}
                                                        value={key}
                                                    >
                                                        {key} - {value}
                                                    </option>
                                                )
                                            )}
                                        </NativeSelectField>
                                    </NativeSelectRoot>
                                ) : (
                                    <NativeSelectRoot>
                                        <NativeSelectField
                                            placeholder="请选择角色编码"
                                            value={currentRole?.code || ''}
                                            onChange={(e) => {
                                                const code = e.target.value;
                                                setCurrentRole({
                                                    ...currentRole!,
                                                    code,
                                                    name: ROLE_MAP[code] || '',
                                                    description:
                                                        ROLE_DESCRIPTIONS[
                                                            code
                                                        ] || '',
                                                });
                                            }}
                                            fontSize="14px"
                                        >
                                            {Object.entries(ROLE_MAP).map(
                                                ([key, value]) => (
                                                    <option
                                                        key={key}
                                                        value={key}
                                                    >
                                                        {key} - {value}
                                                    </option>
                                                )
                                            )}
                                        </NativeSelectField>
                                    </NativeSelectRoot>
                                )}
                            </Box>
                            <Box>
                                <Text fontSize="14px" mb={2} fontWeight="500">
                                    角色名称{' '}
                                    <Text as="span" color="red">
                                        *
                                    </Text>
                                </Text>
                                <Input
                                    placeholder="请输入角色名称"
                                    value={currentRole?.name || ''}
                                    onChange={(e) =>
                                        setCurrentRole({
                                            ...currentRole!,
                                            name: e.target.value,
                                        })
                                    }
                                    fontSize="14px"
                                />
                            </Box>
                            <Box>
                                <Text fontSize="14px" mb={2} fontWeight="500">
                                    角色描述
                                </Text>
                                <Textarea
                                    placeholder="请输入角色描述"
                                    value={currentRole?.description || ''}
                                    onChange={(e) =>
                                        setCurrentRole({
                                            ...currentRole!,
                                            description: e.target.value,
                                        })
                                    }
                                    fontSize="14px"
                                    rows={4}
                                />
                            </Box>
                            <Box>
                                <Text fontSize="14px" mb={2} fontWeight="500">
                                    状态
                                </Text>
                                <NativeSelectRoot>
                                    <NativeSelectField
                                        value={
                                            currentRole?.status
                                                ? 'true'
                                                : 'false'
                                        }
                                        onChange={(e) =>
                                            setCurrentRole({
                                                ...currentRole!,
                                                status:
                                                    e.target.value === 'true',
                                            })
                                        }
                                        fontSize="14px"
                                    >
                                        <option value="true">启用</option>
                                        <option value="false">禁用</option>
                                    </NativeSelectField>
                                </NativeSelectRoot>
                            </Box>
                        </Flex>
                    </DialogBody>
                    <DialogFooter>
                        <DialogActionTrigger asChild>
                            <Button variant="outline" fontSize="14px">
                                取消
                            </Button>
                        </DialogActionTrigger>
                        <Button
                            bg={COLORS.primary}
                            color="white"
                            fontSize="14px"
                            _hover={{ bg: '#c70f20' }}
                            onClick={handleSubmit}
                            loading={
                                createMutation.isPending ||
                                updateMutation.isPending
                            }
                        >
                            确定
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>

            {/* 删除确认对话框 */}
            <DialogRoot
                open={isDeleteDialogOpen}
                onOpenChange={(e) => setIsDeleteDialogOpen(e.open)}
            >
                <DialogBackdrop />
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody>
                        <Text fontSize="14px">
                            确定要删除该角色吗？此操作不可恢复。
                        </Text>
                    </DialogBody>
                    <DialogFooter>
                        <DialogActionTrigger asChild>
                            <Button variant="outline" fontSize="14px">
                                取消
                            </Button>
                        </DialogActionTrigger>
                        <Button
                            colorScheme="red"
                            fontSize="14px"
                            onClick={handleConfirmDelete}
                            loading={deleteMutation.isPending}
                        >
                            确定删除
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>
        </Box>
    );
}
