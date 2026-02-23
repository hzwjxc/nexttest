'use client';

import React, { useState } from 'react';
import {
    Box,
    Flex,
    Text,
    Button,
    Input,
    NativeSelectRoot,
    NativeSelectField,
} from '@chakra-ui/react';
import { LuSearch } from 'react-icons/lu';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';

const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    borderColor: '#E5E6EB',
};

// 状态映射
const STATUS_MAP: Record<string, string> = {
    SAVED: '已保存',
    PREPARING: '准备中',
    DEPT_REWARD_REVIEW: '部门经理积分审核中',
    GENERAL_REWARD_REVIEW: '总经理积分审核中',
    PENDING_PUBLISH: '待发布',
    EXECUTING: '执行中',
    EXECUTION_ENDED: '执行结束',
    ACCOUNTING_COMPLETED: '核算完成',
    REWARD_DISTRIBUTION_REVIEW: '积分发放审核中',
    PENDING_REWARD_DISTRIBUTION: '待发放积分',
    COMPLETED: '已完成',
};

export default function TaskManagementPage() {
    const { showSuccessToast, showErrorToast } = useCustomToast();

    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [statusFilter, setStatusFilter] = useState('');
    const [taskName, setTaskName] = useState('');
    const [searchTaskName, setSearchTaskName] = useState('');

    // 查询任务列表
    const { data, isLoading, refetch } = api.taskManagement.list.useQuery(
        {
            page,
            pageSize,
            status: (statusFilter || undefined) as any,
            taskName: searchTaskName || undefined,
        },
        {
            refetchOnMount: 'always',
            refetchOnWindowFocus: true,
        }
    );

    // 搜索
    const handleSearch = () => {
        setSearchTaskName(taskName);
        setPage(1);
    };

    // 重置
    const handleReset = () => {
        setTaskName('');
        setSearchTaskName('');
        setStatusFilter('');
        setPage(1);
    };

    // 格式化日期时间
    const formatDateTime = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const tasks = data?.data || [];
    const pagination = data?.pagination;

    // 生成页码
    const totalPages = pagination?.totalPages || 0;
    const pageNumbers = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }
    } else {
        if (page <= 4) {
            pageNumbers.push(1, 2, 3, 4, 5, -1, totalPages);
        } else if (page >= totalPages - 3) {
            pageNumbers.push(
                1,
                -1,
                totalPages - 4,
                totalPages - 3,
                totalPages - 2,
                totalPages - 1,
                totalPages
            );
        } else {
            pageNumbers.push(1, -1, page - 1, page, page + 1, -1, totalPages);
        }
    }

    return (
        <Box>
            <Box
                bg={COLORS.bgPrimary}
                borderRadius="8px"
                p={6}
                boxShadow="0 1px 2px rgba(0,0,0,0.05)"
            >
                {/* 面包屑 */}
                <Flex align="center" gap={2} mb={4}>
                    <Text fontSize="14px" color={COLORS.textSecondary}>
                        后台管理
                    </Text>
                    <Text fontSize="14px" color={COLORS.textTertiary}>
                        /
                    </Text>
                    <Text
                        fontSize="14px"
                        color={COLORS.textPrimary}
                        fontWeight="500"
                    >
                        任务管理
                    </Text>
                </Flex>

                {/* 标题 */}
                <Text
                    fontSize="20px"
                    fontWeight="600"
                    color={COLORS.textPrimary}
                    mb={6}
                >
                    任务管理
                </Text>

                {/* 筛选区域 */}
                <Flex gap={4} mb={6} wrap="wrap">
                    {/* 类型筛选 */}
                    <Box flex="0 0 200px">
                        <Text
                            fontSize="14px"
                            color={COLORS.textSecondary}
                            mb={2}
                        >
                            类型
                        </Text>
                        <NativeSelectRoot size="md">
                            <NativeSelectField
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                                borderColor={COLORS.borderColor}
                                borderRadius="4px"
                                fontSize="14px"
                                color={COLORS.textPrimary}
                                _focus={{
                                    borderColor: COLORS.primary,
                                    boxShadow: `0 0 0 1px ${COLORS.primary}`,
                                }}
                            >
                                <option value="">全部</option>
                                {Object.entries(STATUS_MAP).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    )
                                )}
                            </NativeSelectField>
                        </NativeSelectRoot>
                    </Box>

                    {/* 状态筛选 (预留，目前使用类型) */}
                    <Box flex="0 0 200px">
                        <Text
                            fontSize="14px"
                            color={COLORS.textSecondary}
                            mb={2}
                        >
                            状态
                        </Text>
                        <NativeSelectRoot size="md">
                            <NativeSelectField
                                borderColor={COLORS.borderColor}
                                borderRadius="4px"
                                fontSize="14px"
                                color={COLORS.textPrimary}
                                _disabled={{
                                    opacity: 0.6,
                                    cursor: 'not-allowed',
                                }}
                                pointerEvents="none"
                            >
                                <option value="">全部</option>
                            </NativeSelectField>
                        </NativeSelectRoot>
                    </Box>

                    {/* 任务名称搜索 */}
                    <Box flex="1" minW="200px">
                        <Text
                            fontSize="14px"
                            color={COLORS.textSecondary}
                            mb={2}
                        >
                            任务名称
                        </Text>
                        <Input
                            value={taskName}
                            onChange={(e) => setTaskName(e.target.value)}
                            placeholder="请输入任务名称"
                            borderColor={COLORS.borderColor}
                            borderRadius="4px"
                            fontSize="14px"
                            _focus={{
                                borderColor: COLORS.primary,
                                boxShadow: `0 0 0 1px ${COLORS.primary}`,
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                        />
                    </Box>

                    {/* 搜索和重置按钮 */}
                    <Flex gap={2} alignItems="flex-end">
                        <Button
                            background="linear-gradient(to right, #FF9566, #FE606B)"
                            color="white"
                            fontSize="14px"
                            px={6}
                            _hover={{ opacity: 0.9 }}
                            onClick={handleSearch}
                        >
                            <Flex align="center" gap={1}>
                                <LuSearch />
                                <Text>查询</Text>
                            </Flex>
                        </Button>
                        <Button
                            variant="outline"
                            fontSize="14px"
                            px={6}
                            borderColor={COLORS.borderColor}
                            color={COLORS.textSecondary}
                            _hover={{ bg: COLORS.bgSecondary }}
                            onClick={handleReset}
                        >
                            重置
                        </Button>
                    </Flex>

                    {/* 导出报表按钮 */}
                    <Box ml="auto" alignSelf="flex-end">
                        <Button
                            background="linear-gradient(to right, #FF9566, #FE606B)"
                            color="white"
                            fontSize="14px"
                            px={6}
                            _hover={{ opacity: 0.9 }}
                        >
                            导出报表
                        </Button>
                    </Box>
                </Flex>

                {/* 表格 */}
                <Box overflowX="auto">
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '14px',
                        }}
                    >
                        <thead>
                            <tr style={{ background: COLORS.bgSecondary }}>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '60px',
                                    }}
                                >
                                    序号
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '200px',
                                    }}
                                >
                                    任务名称
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '160px',
                                    }}
                                >
                                    发布时间
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '160px',
                                    }}
                                >
                                    结束时间
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '100px',
                                    }}
                                >
                                    发布人
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '100px',
                                    }}
                                >
                                    招募人数
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '100px',
                                    }}
                                >
                                    测试人数
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '100px',
                                    }}
                                >
                                    缺陷总数
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '100px',
                                    }}
                                >
                                    奖励积分
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        style={{
                                            padding: '40px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Text color={COLORS.textTertiary}>
                                            加载中...
                                        </Text>
                                    </td>
                                </tr>
                            ) : tasks.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        style={{
                                            padding: '40px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Text color={COLORS.textTertiary}>
                                            暂无数据
                                        </Text>
                                    </td>
                                </tr>
                            ) : (
                                tasks.map((task: any, index: number) => (
                                    <tr
                                        key={task.id}
                                        style={{
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {(page - 1) * pageSize + index + 1}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {task.title}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textSecondary,
                                            }}
                                        >
                                            {formatDateTime(task.publishTime)}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textSecondary,
                                            }}
                                        >
                                            {formatDateTime(task.resultTime)}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {task.creatorName}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {task.maxParticipants}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {task.currentParticipants}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {task.defectTotal}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {task.rewardPoints}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Box>

                {/* 分页 */}
                {pagination && pagination.total > 0 && (
                    <Flex justify="space-between" align="center" mt={6}>
                        <Text fontSize="14px" color={COLORS.textSecondary}>
                            共{pagination.total}条
                        </Text>
                        <Flex gap={2} align="center">
                            {pageNumbers.map((pageNum, idx) =>
                                pageNum === -1 ? (
                                    <Text
                                        key={`ellipsis-${idx}`}
                                        px={2}
                                        color={COLORS.textSecondary}
                                    >
                                        ...
                                    </Text>
                                ) : (
                                    <Box
                                        key={pageNum}
                                        as="button"
                                        minW="32px"
                                        h="32px"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        bg={
                                            page === pageNum
                                                ? '#FFECE8'
                                                : 'transparent'
                                        }
                                        color={
                                            page === pageNum
                                                ? COLORS.primary
                                                : COLORS.textPrimary
                                        }
                                        borderRadius="2px"
                                        fontSize="14px"
                                        cursor="pointer"
                                        transition="all 0.2s"
                                        _hover={{
                                            bg:
                                                page === pageNum
                                                    ? '#FFECE8'
                                                    : COLORS.bgSecondary,
                                        }}
                                        onClick={() => setPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Box>
                                )
                            )}
                            <Flex gap={2} align="center" ml={4}>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                >
                                    {pageSize}条/页
                                </Text>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    fontSize="14px"
                                    borderColor={COLORS.borderColor}
                                    color={COLORS.textSecondary}
                                    borderRadius="2px"
                                    disabled={page === 1}
                                    _disabled={{
                                        opacity: 0.5,
                                        cursor: 'not-allowed',
                                    }}
                                    onClick={() =>
                                        setPage(Math.max(1, page - 1))
                                    }
                                >
                                    上一页
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    fontSize="14px"
                                    borderColor={COLORS.borderColor}
                                    color={COLORS.textSecondary}
                                    borderRadius="2px"
                                    disabled={page === totalPages}
                                    _disabled={{
                                        opacity: 0.5,
                                        cursor: 'not-allowed',
                                    }}
                                    onClick={() =>
                                        setPage(Math.min(totalPages, page + 1))
                                    }
                                >
                                    下一页
                                </Button>
                            </Flex>
                        </Flex>
                    </Flex>
                )}
            </Box>
        </Box>
    );
}
