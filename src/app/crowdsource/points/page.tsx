'use client';

import React, { useState } from 'react';
import {
    Box,
    Container,
    Flex,
    Input,
    Text,
    Button,
    NativeSelectRoot,
    NativeSelectField,
} from '@chakra-ui/react';
import { Search, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Pagination from '../task-hall/components/Pagination';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';
import { useUserRole } from '@/app/hooks/useUserRole';

// 设计系统颜色
const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    bgTertiary: '#F3F7FB',
    borderColor: '#E5E6EB',
};

interface PointsCard {
    id: string;
    title: string;
    thumbnailImage?: string | null;
    status: string;
    testCaseCount: number;
    recruitmentQuota: number;
    appliedPoints: number;
    appliedTime: string;
    reason: string;
    rewardRule: string;
    estimatedPoints: {
        executionScore: number;
        participantCount: number;
        participationRate: number;
        appliedPoints: number;
    };
}

export default function PointsReviewPage() {
    const router = useRouter();
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const { isDeptManager, isGeneralManager, isSuperAdmin } = useUserRole();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [taskType, setTaskType] = useState<string>('ALL');
    const [taskStatus, setTaskStatus] = useState<string>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>(
        'pending'
    );
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

    const activeStatus = taskStatus === 'ALL' ? undefined : (taskStatus as any);

    // 获取数据字典
    const { data: defectSeverityDict } =
        api.dataDictionary.getByCode.useQuery('DEFECT_SEVERITY');
    const { data: suggestionLevelDict } =
        api.dataDictionary.getByCode.useQuery('SUGGESTION_LEVEL');

    // 获取审核统计
    const { data: statsData } = api.pointsApplication.getStats.useQuery();

    // 根据当前 tab 确定要查询的状态
    const getStatusForTab = (tab: string) => {
        switch (tab) {
            case 'pending':
                // 待处理：显示所有审核中的状态
                return undefined; // 不过滤状态，由前端根据任务状态过滤
            case 'completed':
                // 已处理：显示已审核完成的状态
                return undefined; // 不过滤状态，由前端根据任务状态过滤
            case 'all':
                // 全部：显示所有状态
                return undefined;
            default:
                return undefined;
        }
    };

    // 获取审核列表
    const {
        data: taskData,
        isLoading,
        refetch,
    } = api.pointsApplication.list.useQuery({
        page: currentPage,
        pageSize: 10,
        keyword: searchQuery || undefined,
        status: getStatusForTab(activeTab),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    });

    // 监听页面可见性变化，当页面重新可见时刷新数据
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void refetch();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange
            );
        };
    }, [refetch]);

    const allTasks = taskData?.data ?? [];
    const totalPages = taskData?.pagination?.totalPages ?? 1;
    const totalItems = taskData?.pagination?.total ?? 0;

    // 根据当前 tab 过滤任务
    const filterTasksByTab = (tasks: any[], tab: string) => {
        switch (tab) {
            case 'pending':
                // 待处理：显示审核中的状态
                return tasks.filter((item) =>
                    ['DEPT_REWARD_REVIEW', 'GENERAL_REWARD_REVIEW', 'REWARD_DISTRIBUTION_REVIEW'].includes(item.task.status)
                );
            case 'completed':
                // 已处理：显示已审核完成的状态
                return tasks.filter((item) =>
                    ['PENDING_PUBLISH', 'EXECUTING', 'EXECUTION_ENDED', 'ACCOUNTING_COMPLETED', 'PENDING_REWARD_DISTRIBUTION', 'COMPLETED'].includes(item.task.status)
                );
            case 'all':
            default:
                // 全部：显示所有任务
                return tasks;
        }
    };

    const tasks = filterTasksByTab(allTasks, activeTab);

    // Mutations
    const approveDeptMutation = api.pointsApplication.approveDept.useMutation({
        onSuccess: () => {
            showSuccessToast('审核通过');
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    const approveGeneralMutation =
        api.pointsApplication.approveGeneral.useMutation({
            onSuccess: () => {
                showSuccessToast('审核通过');
                void refetch();
            },
            onError: (error) => {
                showErrorToast(error.message);
            },
        });

    const rejectDeptMutation = api.pointsApplication.rejectDept.useMutation({
        onSuccess: () => {
            showSuccessToast('已拒绝');
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    const rejectGeneralMutation =
        api.pointsApplication.rejectGeneral.useMutation({
            onSuccess: () => {
                showSuccessToast('已拒绝');
                void refetch();
            },
            onError: (error) => {
                showErrorToast(error.message);
            },
        });

    const approveRewardDistributionMutation =
        api.pointsApplication.approveRewardDistribution.useMutation({
            onSuccess: () => {
                showSuccessToast('审核通过');
                void refetch();
            },
            onError: (error) => {
                showErrorToast(error.message);
            },
        });

    const rejectRewardDistributionMutation =
        api.pointsApplication.rejectRewardDistribution.useMutation({
            onSuccess: () => {
                showSuccessToast('审核不通过');
                void refetch();
            },
            onError: (error) => {
                showErrorToast(error.message);
            },
        });

    const handleApprove = (id: string, taskId: string, taskStatus: string) => {
        if (taskStatus === 'DEPT_REWARD_REVIEW') {
            approveDeptMutation.mutate({ id });
        } else if (taskStatus === 'GENERAL_REWARD_REVIEW') {
            approveGeneralMutation.mutate({ id });
        } else if (taskStatus === 'REWARD_DISTRIBUTION_REVIEW') {
            approveRewardDistributionMutation.mutate({ taskId });
        }
    };

    const handleReject = (id: string, taskId: string, taskStatus: string) => {
        if (confirm('确定要拒绝这个申请吗？')) {
            if (taskStatus === 'DEPT_REWARD_REVIEW') {
                rejectDeptMutation.mutate({ id });
            } else if (taskStatus === 'GENERAL_REWARD_REVIEW') {
                rejectGeneralMutation.mutate({ id });
            } else if (taskStatus === 'REWARD_DISTRIBUTION_REVIEW') {
                rejectRewardDistributionMutation.mutate({ taskId });
            }
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } catch {
            return dateString;
        }
    };

    return (
        <Box bg={COLORS.bgTertiary} minH="100vh">
            {/* 顶部导航栏 - 标签页和搜索框在同一行 */}
            <Box
                bg={COLORS.bgPrimary}
                borderBottom={`1px solid ${COLORS.borderColor}`}
            >
                <Container maxW="1400px" px={6}>
                    <Flex justify="space-between" align="center" h="60px">
                        {/* 左侧标签页 */}
                        <Flex gap={8} align="center">
                            <Box
                                pb={3}
                                borderBottom={
                                    activeTab === 'pending'
                                        ? `3px solid ${COLORS.primary}`
                                        : 'none'
                                }
                                cursor="pointer"
                                onClick={() => {
                                    setActiveTab('pending');
                                    setCurrentPage(1);
                                }}
                            >
                                <Text
                                    fontSize="14px"
                                    fontWeight={
                                        activeTab === 'pending' ? '600' : '500'
                                    }
                                    color={
                                        activeTab === 'pending'
                                            ? COLORS.primary
                                            : COLORS.textPrimary
                                    }
                                >
                                    待处理 ({filterTasksByTab(allTasks, 'pending').length})
                                </Text>
                            </Box>
                            <Box
                                pb={3}
                                borderBottom={
                                    activeTab === 'completed'
                                        ? `3px solid ${COLORS.primary}`
                                        : 'none'
                                }
                                cursor="pointer"
                                onClick={() => {
                                    setActiveTab('completed');
                                    setCurrentPage(1);
                                }}
                            >
                                <Text
                                    fontSize="14px"
                                    fontWeight={
                                        activeTab === 'completed'
                                            ? '600'
                                            : '500'
                                    }
                                    color={
                                        activeTab === 'completed'
                                            ? COLORS.primary
                                            : COLORS.textSecondary
                                    }
                                >
                                    已处理 ({filterTasksByTab(allTasks, 'completed').length})
                                </Text>
                            </Box>
                            <Box
                                pb={3}
                                borderBottom={
                                    activeTab === 'all'
                                        ? `3px solid ${COLORS.primary}`
                                        : 'none'
                                }
                                cursor="pointer"
                                onClick={() => {
                                    setActiveTab('all');
                                    setCurrentPage(1);
                                }}
                            >
                                <Text
                                    fontSize="14px"
                                    fontWeight={
                                        activeTab === 'all' ? '600' : '500'
                                    }
                                    color={
                                        activeTab === 'all'
                                            ? COLORS.primary
                                            : COLORS.textSecondary
                                    }
                                >
                                    全部 ({allTasks.length})
                                </Text>
                            </Box>
                        </Flex>

                        {/* 右侧搜索框 */}
                        <Box position="relative" w="220px">
                            <Input
                                type="text"
                                placeholder="请输入任务关键词"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                bg={COLORS.bgSecondary}
                                border="none"
                                borderRadius="2px"
                                fontSize="14px"
                                color={COLORS.textPrimary}
                                _placeholder={{ color: COLORS.textTertiary }}
                                _focus={{ boxShadow: 'none' }}
                                pl={4}
                                pr={10}
                                py={2}
                                h="32px"
                            />
                            <Box
                                position="absolute"
                                right={3}
                                top="50%"
                                transform="translateY(-50%)"
                                pointerEvents="none"
                            >
                                <Search
                                    color={COLORS.textSecondary}
                                    size={16}
                                />
                            </Box>
                        </Box>
                    </Flex>
                </Container>
            </Box>

            <Container maxW="1400px" px={6} pt="20px" pb={4}>
                {/* 顶部标签页 - 已移到上方导航栏 */}

                {/* 任务列表 */}
                <Flex direction="column" gap={4} mb={4}>
                    {isLoading ? (
                        <Box
                            textAlign="center"
                            py={8}
                            bg={COLORS.bgPrimary}
                            borderRadius="8px"
                            boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                        >
                            <Text color={COLORS.textTertiary}>加载中...</Text>
                        </Box>
                    ) : tasks.length > 0 ? (
                        tasks.map((application) => (
                            <PointsCard
                                key={application.id}
                                application={application}
                                onApprove={() =>
                                    handleApprove(
                                        application.id,
                                        application.task.id,
                                        application.task.status
                                    )
                                }
                                onReject={() =>
                                    handleReject(
                                        application.id,
                                        application.task.id,
                                        application.task.status
                                    )
                                }
                                defectSeverityDict={defectSeverityDict}
                                suggestionLevelDict={suggestionLevelDict}
                                isDeptManager={isDeptManager}
                                isGeneralManager={isGeneralManager}
                                isSuperAdmin={isSuperAdmin}
                            />
                        ))
                    ) : (
                        <Box
                            textAlign="center"
                            py={8}
                            bg={COLORS.bgPrimary}
                            borderRadius="8px"
                            boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                        >
                            <Text color={COLORS.textTertiary}>
                                暂无任务记录
                            </Text>
                        </Box>
                    )}
                </Flex>

                {/* 分页 */}
                {totalItems > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        onPageChange={setCurrentPage}
                    />
                )}
            </Container>
        </Box>
    );
}

interface PointsCardProps {
    application: any;
    onApprove: () => void;
    onReject: () => void;
    defectSeverityDict?: any;
    suggestionLevelDict?: any;
    isDeptManager: boolean;
    isGeneralManager: boolean;
    isSuperAdmin: boolean;
}

function PointsCard({
    application,
    onApprove,
    onReject,
    defectSeverityDict,
    suggestionLevelDict,
    isDeptManager,
    isGeneralManager,
    isSuperAdmin,
}: PointsCardProps) {
    const task = application.task;
    // 任务状态映射（使用 task.status）
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'SAVED':
                return {
                    text: '已保存',
                    color: '#86909C',
                    bg: 'rgba(134, 144, 156, 0.1)',
                };
            case 'PREPARING':
                return {
                    text: '准备中',
                    color: '#4E5969',
                    bg: 'rgba(78, 89, 105, 0.1)',
                };
            case 'DEPT_REWARD_REVIEW':
                return {
                    text: '部门经理积分审核中',
                    color: '#F34724',
                    bg: 'rgba(243, 71, 36, 0.1)',
                };
            case 'GENERAL_REWARD_REVIEW':
                return {
                    text: '总经理积分审核中',
                    color: '#FF7D00',
                    bg: 'rgba(255, 125, 0, 0.1)',
                };
            case 'PENDING_PUBLISH':
                return {
                    text: '待发布',
                    color: '#F34724',
                    bg: 'rgba(243, 71, 36, 0.1)',
                };
            case 'EXECUTING':
                return {
                    text: '执行中',
                    color: '#165DFF',
                    bg: 'rgba(22, 93, 255, 0.1)',
                };
            case 'EXECUTION_ENDED':
                return {
                    text: '执行结束',
                    color: '#4E5969',
                    bg: 'rgba(78, 89, 105, 0.1)',
                };
            case 'ACCOUNTING_COMPLETED':
                return {
                    text: '核算完成',
                    color: '#165DFF',
                    bg: 'rgba(22, 93, 255, 0.1)',
                };
            case 'REWARD_DISTRIBUTION_REVIEW':
                return {
                    text: '积分发放审核中',
                    color: '#FF7D00',
                    bg: 'rgba(255, 125, 0, 0.1)',
                };
            case 'PENDING_REWARD_DISTRIBUTION':
                return {
                    text: '待发放积分',
                    color: '#F34724',
                    bg: 'rgba(243, 71, 36, 0.1)',
                };
            case 'COMPLETED':
                return {
                    text: '已完成',
                    color: '#00B42A',
                    bg: 'rgba(0, 180, 42, 0.1)',
                };
            default:
                return {
                    text: status,
                    color: '#86909C',
                    bg: 'rgba(134, 144, 156, 0.1)',
                };
        }
    };

    const statusConfig = getStatusConfig(task.status);

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } catch {
            return dateString;
        }
    };

    return (
        <Box
            bg={COLORS.bgPrimary}
            borderRadius="8px"
            boxShadow="0 1px 2px rgba(0,0,0,0.05)"
            overflow="hidden"
        >
            {/* Main Card Content */}
            <Box p={6}>
                <Flex gap={6} align="flex-start" justify="space-between">
                    <Flex gap={6} flex={1}>
                        {/* 任务图片 */}
                        <Box flexShrink={0}>
                            <Box
                                w="72px"
                                h="72px"
                                borderRadius="8px"
                                bg={COLORS.bgSecondary}
                                backgroundImage={
                                    task.thumbnailImage
                                        ? `url(${task.thumbnailImage})`
                                        : undefined
                                }
                                backgroundSize="cover"
                                backgroundPosition="center"
                            />
                        </Box>

                        {/* 任务信息 */}
                        <Flex direction="column" gap={3} flex={1}>
                            {/* 标题和状态 */}
                            <Flex align="center" gap={2}>
                                <Text
                                    fontSize="16px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                    lineHeight="1.4"
                                >
                                    {task.title ?? '未命名任务'}
                                </Text>
                                <Box
                                    px={3}
                                    py={1}
                                    borderRadius="4px"
                                    bg={statusConfig.bg}
                                >
                                    <Text
                                        fontSize="12px"
                                        fontWeight="500"
                                        color={statusConfig.color}
                                    >
                                        {statusConfig.text}
                                    </Text>
                                </Box>
                            </Flex>

                            {/* 详细信息 */}
                            <Flex direction="column" gap={2} fontSize="14px">
                                {/* 第一行 - 基础信息 */}
                                <Flex gap={6}>
                                    {![
                                        'REWARD_DISTRIBUTION_REVIEW',
                                        'PENDING_REWARD_DISTRIBUTION',
                                        'COMPLETED',
                                    ].includes(task.status) && (
                                            <>
                                                <Flex gap={1} align="center">
                                                    <Text
                                                        color={COLORS.textSecondary}
                                                        whiteSpace="nowrap"
                                                    >
                                                        用例数量：
                                                    </Text>
                                                    <Text
                                                        fontWeight="500"
                                                        color={COLORS.textPrimary}
                                                    >
                                                        {task.testCases?.length ??
                                                            0}
                                                    </Text>
                                                </Flex>

                                                <Flex gap={1} align="center">
                                                    <Text
                                                        color={COLORS.textSecondary}
                                                        whiteSpace="nowrap"
                                                    >
                                                        招募名额：
                                                    </Text>
                                                    <Text
                                                        fontWeight="500"
                                                        color={COLORS.textPrimary}
                                                    >
                                                        {task.maxParticipants ?? 0}
                                                    </Text>
                                                </Flex>
                                            </>
                                        )}

                                    {[
                                        'REWARD_DISTRIBUTION_REVIEW',
                                        'PENDING_REWARD_DISTRIBUTION',
                                        'COMPLETED',
                                    ].includes(task.status) ? (
                                        <>
                                            <Flex gap={1} align="center">
                                                <Text
                                                    color={COLORS.textSecondary}
                                                    whiteSpace="nowrap"
                                                >
                                                    积分发放总额：
                                                </Text>
                                                <Text
                                                    fontWeight="500"
                                                    color={COLORS.textPrimary}
                                                >
                                                    {(() => {
                                                        const stats =
                                                            task.defectStats;
                                                        if (!stats) return 0;
                                                        // 从calculation字段中提取总积分
                                                        const match =
                                                            stats.calculation?.match(
                                                                /=(\d+)$/
                                                            );
                                                        return match
                                                            ? match[1]
                                                            : 0;
                                                    })()}
                                                </Text>
                                            </Flex>

                                            <Flex gap={1} align="center">
                                                <Text
                                                    color={COLORS.textSecondary}
                                                    whiteSpace="nowrap"
                                                >
                                                    申请时间：
                                                </Text>
                                                <Text
                                                    fontWeight="500"
                                                    color={COLORS.textPrimary}
                                                    whiteSpace="nowrap"
                                                >
                                                    {formatDate(
                                                        task.rewardDistributionAppliedAt ??
                                                        task.createdAt
                                                    )}
                                                </Text>
                                            </Flex>
                                        </>
                                    ) : (
                                        <>
                                            <Flex gap={1} align="center">
                                                <Text
                                                    color={COLORS.textSecondary}
                                                    whiteSpace="nowrap"
                                                >
                                                    申请积分：
                                                </Text>
                                                <Text
                                                    fontWeight="500"
                                                    color={COLORS.textPrimary}
                                                >
                                                    {application.appliedPoints ??
                                                        0}
                                                </Text>
                                            </Flex>

                                            <Flex gap={1} align="center">
                                                <Text
                                                    color={COLORS.textSecondary}
                                                    whiteSpace="nowrap"
                                                >
                                                    申请时间：
                                                </Text>
                                                <Text
                                                    fontWeight="500"
                                                    color={COLORS.textPrimary}
                                                    whiteSpace="nowrap"
                                                >
                                                    {formatDate(
                                                        application.createdAt
                                                    )}
                                                </Text>
                                            </Flex>
                                        </>
                                    )}
                                </Flex>
                            </Flex>
                        </Flex>
                    </Flex>

                    {/* 操作按钮 - 根据任务状态和用户角色显示 */}
                    {((task.status === 'DEPT_REWARD_REVIEW' && (isDeptManager || isSuperAdmin)) ||
                        (task.status === 'GENERAL_REWARD_REVIEW' && (isGeneralManager || isSuperAdmin)) ||
                        (task.status === 'REWARD_DISTRIBUTION_REVIEW' && (isDeptManager || isSuperAdmin))) && (
                            <Flex gap={2} flexShrink={0}>
                                <Button
                                    variant="outline"
                                    borderColor={COLORS.borderColor}
                                    color={COLORS.textSecondary}
                                    w="88px"
                                    h="36px"
                                    fontSize="14px"
                                    fontWeight="500"
                                    borderRadius="999px"
                                    _hover={{
                                        borderColor: COLORS.primary,
                                        color: COLORS.primary,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onReject();
                                    }}
                                >
                                    不通过
                                </Button>
                                <Button
                                    bg="linear-gradient(to right, #ff9565, #fe5f6b)"
                                    color="white"
                                    w="88px"
                                    h="36px"
                                    fontSize="14px"
                                    fontWeight="500"
                                    borderRadius="999px"
                                    _hover={{ opacity: 0.9 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onApprove();
                                    }}
                                >
                                    通过
                                </Button>
                            </Flex>
                        )}

                    {/* 已处理状态指示 - 显示通过/不通过 */}
                    {[
                        'PENDING_PUBLISH',
                        'EXECUTING',
                        'EXECUTION_ENDED',
                        'ACCOUNTING_COMPLETED',
                        'PENDING_REWARD_DISTRIBUTION',
                        'COMPLETED',
                    ].includes(task.status) && (
                            <Box flexShrink={0}>
                                {['DEPT_APPROVED', 'GENERAL_APPROVED'].includes(
                                    application.status
                                ) ? (
                                    <Box
                                        px={4}
                                        py={2}
                                        borderRadius="4px"
                                        bg="rgba(0, 180, 42, 0.1)"
                                    >
                                        <Text
                                            fontSize="14px"
                                            fontWeight="600"
                                            color="#00B42A"
                                        >
                                            通过
                                        </Text>
                                    </Box>
                                ) : ['DEPT_REJECTED', 'GENERAL_REJECTED'].includes(
                                    application.status
                                ) ? (
                                    <Box
                                        px={4}
                                        py={2}
                                        borderRadius="4px"
                                        bg="rgba(243, 71, 36, 0.1)"
                                    >
                                        <Text
                                            fontSize="14px"
                                            fontWeight="600"
                                            color="#F34724"
                                        >
                                            不通过
                                        </Text>
                                    </Box>
                                ) : null}
                            </Box>
                        )}
                </Flex>
            </Box>

            {/* Divider */}
            <Box h="1px" bg={COLORS.borderColor} />

            {/* Expandable Content - 默认显示 */}
            <Box p={6} bg={COLORS.bgPrimary}>
                {/* 事由 Section */}
                <Box mb={6}>
                    <Text
                        fontSize="14px"
                        color={COLORS.textSecondary}
                        mb={2}
                        fontWeight="500"
                    >
                        事由：
                    </Text>
                    <Text
                        fontSize="14px"
                        color={COLORS.textPrimary}
                        lineHeight="1.6"
                    >
                        {[
                            'REWARD_DISTRIBUTION_REVIEW',
                            'PENDING_REWARD_DISTRIBUTION',
                            'COMPLETED',
                        ].includes(task.status)
                            ? task.rewardDistributionReason ||
                            '应公司金融部申请，拟面全行范围内开展"对公E掌柜"APP众测活动。活动计划明天开展。以下是活动方案，需您审批。'
                            : application.reason ||
                            '应公司金融部申请，拟面全行范围内开展"对公E掌柜"APP众测活动。活动计划明天开展。以下是活动方案，需您审批。'}
                    </Text>
                </Box>

                {/* 奖励规则和预估积分 - 合并表格 */}
                {!application.isManualInput && (
                    <Box
                        borderRadius="4px"
                        border={`1px solid ${COLORS.borderColor}`}
                        overflow="hidden"
                    >
                        {/* 表格头部 */}
                        <Flex borderBottom={`1px solid ${COLORS.borderColor}`}>
                            <Box
                                flex={1}
                                bg={COLORS.bgSecondary}
                                p={3}
                                borderRight={`1px solid ${COLORS.borderColor}`}
                            >
                                <Text
                                    fontSize="14px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                >
                                    奖励规则
                                </Text>
                            </Box>
                            <Box flex={1} bg={COLORS.bgSecondary} p={3}>
                                <Text
                                    fontSize="14px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                >
                                    预估积分（点）
                                </Text>
                            </Box>
                        </Flex>

                        {/* 表格内容 */}
                        <Flex>
                            {/* 左侧 - 奖励规则 */}
                            <Box
                                flex={1}
                                p={3}
                                borderRight={`1px solid ${COLORS.borderColor}`}
                            >
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                    lineHeight="1.6"
                                >
                                    {application.rewardRule ||
                                        '满足《众测细则》活动积分中模式一的适用条件，拟采用"按缺陷/建议单个价值"的积分方案。'}
                                </Text>
                            </Box>

                            {/* 右侧 - 预估积分计算公式 */}
                            <Box flex={1} p={3}>
                                <Flex
                                    gap={2}
                                    align="center"
                                    justify="center"
                                    wrap="wrap"
                                >
                                    <Box textAlign="center">
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textTertiary}
                                            mb={1}
                                        >
                                            执行积分
                                        </Text>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="500"
                                            color={COLORS.textPrimary}
                                        >
                                            {application.executionScore ?? 20}
                                        </Text>
                                    </Box>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textSecondary}
                                        fontWeight="500"
                                    >
                                        ×
                                    </Text>
                                    <Box textAlign="center">
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textTertiary}
                                            mb={1}
                                        >
                                            参测人数
                                        </Text>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="500"
                                            color={COLORS.textPrimary}
                                        >
                                            {application.participantCount ?? 0}
                                        </Text>
                                    </Box>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textSecondary}
                                        fontWeight="500"
                                    >
                                        +
                                    </Text>
                                    <Box textAlign="center">
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textTertiary}
                                            mb={1}
                                        >
                                            参测人数
                                        </Text>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="500"
                                            color={COLORS.textPrimary}
                                        >
                                            {application.participantCount ?? 0}
                                        </Text>
                                    </Box>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textSecondary}
                                        fontWeight="500"
                                    >
                                        ×
                                    </Text>
                                    <Box textAlign="center">
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textTertiary}
                                            mb={1}
                                        >
                                            参测率
                                        </Text>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="500"
                                            color={COLORS.textPrimary}
                                        >
                                            {application.participationRate ??
                                                '0'}
                                            %
                                        </Text>
                                    </Box>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textSecondary}
                                        fontWeight="500"
                                    >
                                        ×
                                    </Text>
                                    <Box textAlign="center">
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textTertiary}
                                            mb={1}
                                        >
                                            有效反馈率
                                        </Text>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="500"
                                            color={COLORS.textPrimary}
                                        >
                                            {application.validFeedbackRate ??
                                                '0'}
                                            %
                                        </Text>
                                    </Box>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textSecondary}
                                        fontWeight="500"
                                    >
                                        ×
                                    </Text>
                                    <Box textAlign="center">
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textTertiary}
                                            mb={1}
                                        >
                                            每反馈积分
                                        </Text>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="500"
                                            color={COLORS.textPrimary}
                                        >
                                            {application.pointsPerFeedback ?? 0}
                                        </Text>
                                    </Box>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textSecondary}
                                        fontWeight="500"
                                    >
                                        =
                                    </Text>
                                    <Box textAlign="center">
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textTertiary}
                                            mb={1}
                                        >
                                            申请积分
                                        </Text>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="500"
                                            color={COLORS.textPrimary}
                                        >
                                            {(() => {
                                                const executionScore =
                                                    application.executionScore ??
                                                    20;
                                                const participantCount =
                                                    application.participantCount ??
                                                    0;
                                                const participationRate =
                                                    (application.participationRate ??
                                                        0) / 100;
                                                const validFeedbackRate =
                                                    (application.validFeedbackRate ??
                                                        0) / 100;
                                                const pointsPerFeedback =
                                                    application.pointsPerFeedback ??
                                                    0;

                                                const calculatedPoints =
                                                    executionScore *
                                                    participantCount +
                                                    participantCount *
                                                    participationRate *
                                                    validFeedbackRate *
                                                    pointsPerFeedback;

                                                return Math.round(
                                                    calculatedPoints
                                                );
                                            })()}
                                        </Text>
                                    </Box>
                                </Flex>
                            </Box>
                        </Flex>
                    </Box>
                )}

                {/* 缺陷分类统计表格 - 在积分发放审核中、待发放积分、已完成状态显示 */}
                {[
                    'REWARD_DISTRIBUTION_REVIEW',
                    'PENDING_REWARD_DISTRIBUTION',
                    'COMPLETED',
                ].includes(task.status) && (
                        <Box mt={6} overflowX="auto">
                            <Box
                                as="table"
                                borderRadius="4px"
                                border={`1px solid ${COLORS.borderColor}`}
                                w="100%"
                                css={{
                                    borderCollapse: 'collapse',
                                    '& td, & th': {
                                        border: `1px solid ${COLORS.borderColor}`,
                                        textAlign: 'center',
                                        verticalAlign: 'middle',
                                        padding: '8px',
                                    },
                                }}
                            >
                                <thead
                                    style={{ backgroundColor: COLORS.bgSecondary }}
                                >
                                    <tr>
                                        <th rowSpan={2} style={{ width: '120px' }}>
                                            <Text
                                                fontSize="13px"
                                                fontWeight="600"
                                                color={COLORS.textPrimary}
                                            >
                                                执行分获得人数
                                            </Text>
                                        </th>
                                        <th rowSpan={2} style={{ width: '100px' }}>
                                            <Text
                                                fontSize="13px"
                                                fontWeight="600"
                                                color={COLORS.textPrimary}
                                            >
                                                执行分
                                            </Text>
                                        </th>
                                        <th
                                            colSpan={
                                                defectSeverityDict?.items?.length ??
                                                4
                                            }
                                        >
                                            <Text
                                                fontSize="13px"
                                                fontWeight="600"
                                                color={COLORS.textPrimary}
                                            >
                                                缺陷
                                            </Text>
                                        </th>
                                        <th
                                            colSpan={
                                                suggestionLevelDict?.items?.filter(
                                                    (item: any) =>
                                                        item.code !== 'INVALID'
                                                ).length ?? 3
                                            }
                                        >
                                            <Text
                                                fontSize="13px"
                                                fontWeight="600"
                                                color={COLORS.textPrimary}
                                            >
                                                建议
                                            </Text>
                                        </th>
                                        <th rowSpan={2}>
                                            <Text
                                                fontSize="13px"
                                                fontWeight="600"
                                                color={COLORS.textPrimary}
                                            >
                                                积分发放计算
                                            </Text>
                                        </th>
                                    </tr>
                                    <tr>
                                        {/* 缺陷等级 */}
                                        {defectSeverityDict?.items?.map(
                                            (item: any) => (
                                                <th
                                                    key={item.code}
                                                    style={{ width: '60px' }}
                                                >
                                                    <Text
                                                        fontSize="12px"
                                                        fontWeight="500"
                                                        color={COLORS.textSecondary}
                                                    >
                                                        {item.label}
                                                    </Text>
                                                </th>
                                            )
                                        )}
                                        {/* 建议等级（排除无效） */}
                                        {suggestionLevelDict?.items
                                            ?.filter(
                                                (item: any) =>
                                                    item.code !== 'INVALID'
                                            )
                                            .map((item: any) => (
                                                <th
                                                    key={item.code}
                                                    style={{ width: '60px' }}
                                                >
                                                    <Text
                                                        fontSize="12px"
                                                        fontWeight="500"
                                                        color={COLORS.textSecondary}
                                                    >
                                                        {item.label}
                                                    </Text>
                                                </th>
                                            ))}
                                    </tr>
                                </thead>
                                <tbody
                                    style={{ backgroundColor: COLORS.bgPrimary }}
                                >
                                    <tr>
                                        <td>
                                            <Text
                                                fontSize="14px"
                                                fontWeight="500"
                                                color={COLORS.textPrimary}
                                            >
                                                {task.defectStats?.executionCount ??
                                                    0}
                                            </Text>
                                        </td>
                                        <td>
                                            <Text
                                                fontSize="14px"
                                                fontWeight="500"
                                                color={COLORS.textPrimary}
                                            >
                                                {task.defectStats?.executionScore ??
                                                    0}
                                            </Text>
                                        </td>
                                        {/* 缺陷等级数据 */}
                                        {defectSeverityDict?.items?.map(
                                            (item: any) => {
                                                const statKey =
                                                    item.code === 'CRITICAL'
                                                        ? 'critical'
                                                        : item.code === 'MAJOR'
                                                            ? 'major'
                                                            : item.code === 'MINOR'
                                                                ? 'normal'
                                                                : item.code ===
                                                                    'TRIVIAL'
                                                                    ? 'minor'
                                                                    : null;
                                                return (
                                                    <td key={item.code}>
                                                        <Text
                                                            fontSize="14px"
                                                            fontWeight="500"
                                                            color={
                                                                COLORS.textPrimary
                                                            }
                                                        >
                                                            {statKey
                                                                ? (task
                                                                    .defectStats?.[
                                                                    statKey
                                                                ] ?? 0)
                                                                : 0}
                                                        </Text>
                                                    </td>
                                                );
                                            }
                                        )}
                                        {/* 建议等级数据（排除无效） */}
                                        {suggestionLevelDict?.items
                                            ?.filter(
                                                (item: any) =>
                                                    item.code !== 'INVALID'
                                            )
                                            .map((item: any) => {
                                                const statKey =
                                                    item.code ===
                                                        'EXCELLENT_SPECIAL'
                                                        ? 'excellent'
                                                        : item.code === 'EXCELLENT'
                                                            ? 'good'
                                                            : item.code === 'VALID'
                                                                ? 'valid'
                                                                : null;
                                                return (
                                                    <td key={item.code}>
                                                        <Text
                                                            fontSize="14px"
                                                            fontWeight="500"
                                                            color={
                                                                COLORS.textPrimary
                                                            }
                                                        >
                                                            {statKey
                                                                ? (task
                                                                    .defectStats?.[
                                                                    statKey
                                                                ] ?? 0)
                                                                : 0}
                                                        </Text>
                                                    </td>
                                                );
                                            })}
                                        <td>
                                            <Text
                                                fontSize="14px"
                                                fontWeight="500"
                                                color={COLORS.textPrimary}
                                            >
                                                {task.defectStats?.calculation ??
                                                    '0*0=0'}
                                            </Text>
                                        </td>
                                    </tr>
                                </tbody>
                            </Box>
                        </Box>
                    )}
            </Box>
        </Box>
    );
}
