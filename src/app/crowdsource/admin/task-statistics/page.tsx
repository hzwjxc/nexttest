'use client';

import React, { useState } from 'react';
import {
    Box,
    Container,
    Flex,
    Text,
    Button,
    HStack,
    VStack,
    Input,
    Spinner,
} from '@chakra-ui/react';
import { toaster } from '@/app/_components/ui/toaster';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FiAlignJustify } from 'react-icons/fi';
import { api } from '@/trpc/react';
import * as XLSX from 'xlsx';

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

export default function TaskStatisticsPage() {
    const router = useRouter();
    const [taskName, setTaskName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // 获取任务统计数据
    const { data: taskStatsData, isLoading, refetch } = api.reports.getTaskStatistics.useQuery({
        page: currentPage,
        pageSize,
        taskName: taskName || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    });

    // 获取任务名称列表（用于下拉框）
    const { data: taskNamesData } = api.reports.getAllTaskNames.useQuery();

    // 导出任务统计数据
    const { refetch: exportData } = api.reports.exportTaskStatistics.useQuery(
        {
            taskName: taskName || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        },
        {
            enabled: false,
        }
    );

    const handleQuery = () => {
        setCurrentPage(1);
        void refetch();
    };

    const handleReset = () => {
        setTaskName('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const handleExport = async () => {
        try {
            const result = await exportData();
            if (result.data) {
                const ws = XLSX.utils.json_to_sheet(result.data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, '任务统计');
                XLSX.writeFile(wb, `任务统计_${new Date().toLocaleDateString()}.xlsx`);

                toaster.create({
                    title: '导出成功',
                    type: 'success',
                    duration: 3000,
                });
            }
        } catch (error) {
            toaster.create({
                title: '导出失败',
                description: error instanceof Error ? error.message : '未知错误',
                type: 'error',
                duration: 3000,
            });
        }
    };

    const paginatedData = taskStatsData?.data || [];
    const total = taskStatsData?.total || 0;
    const totalPages = taskStatsData?.totalPages || 1;

    return (
        <Box minH="100vh">
            <Container maxW="1400px" px={0} py={0}>
                <VStack gap={4} align="stretch">
                    {/* Breadcrumb */}
                    <Flex
                        align="center"
                        gap={2}
                        fontSize="14px"
                        color={COLORS.textSecondary}
                    >
                        <FiAlignJustify />
                        <Text>/</Text>
                        <Text
                            onClick={() => router.push('/crowdsource/admin')}
                            cursor="pointer"
                        >
                            后台管理
                        </Text>
                        <Text>/</Text>
                        <Text
                            onClick={() =>
                                router.push(
                                    '/crowdsource/admin/task-statistics'
                                )
                            }
                            cursor="pointer"
                        >
                            报表管理
                        </Text>
                        <Text>/</Text>
                        <Text color={COLORS.textPrimary} fontWeight="500">
                            任务统计
                        </Text>
                    </Flex>
                    {/* Header */}
                    <Box
                        bg={COLORS.bgPrimary}
                        borderRadius="8px"
                        p={6}
                        boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                    >
                        <Flex justify="space-between" align="center">
                            <Text
                                fontSize="14px"
                                fontWeight="500"
                                color={COLORS.textPrimary}
                            >
                                任务统计
                            </Text>

                            <HStack gap={8}>
                                <HStack gap={8}>
                                    {/* Task Name Filter */}
                                    <Box position="relative" w="140px">
                                        <select
                                            value={taskName}
                                            onChange={(e) =>
                                                setTaskName(e.target.value)
                                            }
                                            style={{
                                                background: COLORS.bgSecondary,
                                                border: 'none',
                                                borderRadius: '24px',
                                                fontSize: '14px',
                                                color: taskName ? COLORS.textPrimary : COLORS.textTertiary,
                                                padding: '7px 12px',
                                                paddingRight: '32px',
                                                width: '100%',
                                                appearance: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <option value="">任务名称</option>
                                            {taskNamesData?.map((task) => (
                                                <option key={task.id} value={task.name}>
                                                    {task.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown
                                            size={16}
                                            color={COLORS.textTertiary}
                                            style={{
                                                position: 'absolute',
                                                right: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    </Box>

                                    {/* Start Date */}
                                    <Box position="relative" w="140px">
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) =>
                                                setStartDate(e.target.value)
                                            }
                                            bg={COLORS.bgSecondary}
                                            border="none"
                                            borderRadius="24px"
                                            fontSize="14px"
                                            color={COLORS.textTertiary}
                                            _focus={{ boxShadow: 'none' }}
                                            placeholder="开始时间"
                                            pl={3}
                                            pr={8}
                                            py={1}
                                        />
                                    </Box>

                                    {/* End Date */}
                                    <Box position="relative" w="140px">
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) =>
                                                setEndDate(e.target.value)
                                            }
                                            bg={COLORS.bgSecondary}
                                            border="none"
                                            borderRadius="24px"
                                            fontSize="14px"
                                            color={COLORS.textTertiary}
                                            _focus={{ boxShadow: 'none' }}
                                            placeholder="结束时间"
                                            pl={3}
                                            pr={8}
                                            py={1}
                                        />
                                    </Box>
                                </HStack>

                                <HStack gap={4}>
                                    <Button
                                        bg="linear-gradient(to right, #FF9565, #FE5F6B)"
                                        color="white"
                                        fontSize="14px"
                                        fontWeight="500"
                                        borderRadius="999px"
                                        px={6}
                                        py={2}
                                        h="36px"
                                        _hover={{ opacity: 0.9 }}
                                        onClick={handleQuery}
                                    >
                                        查询
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                        _hover={{ bg: 'transparent' }}
                                        onClick={handleReset}
                                    >
                                        重置
                                    </Button>
                                </HStack>

                                <Button
                                    bg="linear-gradient(to right, #FF9565, #FE5F6B)"
                                    color="white"
                                    fontSize="14px"
                                    fontWeight="500"
                                    borderRadius="999px"
                                    px={6}
                                    py={2}
                                    h="36px"
                                    _hover={{ opacity: 0.9 }}
                                    onClick={handleExport}
                                >
                                    导出报表
                                </Button>
                            </HStack>
                        </Flex>
                    </Box>

                    {/* Table */}
                    <Box
                        bg={COLORS.bgPrimary}
                        borderRadius="8px"
                        p={6}
                        boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                        overflowX="auto"
                    >
                        {isLoading ? (
                            <Flex justify="center" align="center" minH="200px">
                                <Spinner size="lg" color={COLORS.primary} />
                            </Flex>
                        ) : paginatedData.length === 0 ? (
                            <Flex justify="center" align="center" minH="200px">
                                <Text color={COLORS.textTertiary}>暂无数据</Text>
                            </Flex>
                        ) : (
                            <table
                                style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '14px',
                                }}
                            >
                            <thead>
                                <tr
                                    style={{
                                        backgroundColor: COLORS.bgSecondary,
                                    }}
                                >
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '50px',
                                        }}
                                    >
                                        序号
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '150px',
                                        }}
                                    >
                                        任务名称
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '120px',
                                        }}
                                    >
                                        任务领取人次
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '120px',
                                        }}
                                    >
                                        任务领取人数
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '120px',
                                        }}
                                    >
                                        缺陷提报人次
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '120px',
                                        }}
                                    >
                                        缺陷提报人数
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '140px',
                                        }}
                                    >
                                        提报有效缺陷数
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '100px',
                                        }}
                                    >
                                        奖励积分数
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '100px',
                                        }}
                                    >
                                        每缺陷奖励积分
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '100px',
                                        }}
                                    >
                                        用户参测率
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '100px',
                                        }}
                                    >
                                        有效反馈率
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((row, index) => (
                                    <tr key={row.id}>
                                        <td
                                            style={{
                                                padding: '8px 16px',
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {(currentPage - 1) * pageSize +
                                                index +
                                                1}
                                        </td>
                                        <td
                                            style={{
                                                padding: '8px 16px',
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {row.taskName}
                                        </td>
                                        <td
                                            style={{
                                                padding: '8px 16px',
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {row.taskAcceptanceCount}
                                        </td>
                                        <td
                                            style={{
                                                padding: '8px 16px',
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {row.taskAcceptancePeople}
                                        </td>
                                        <td
                                            style={{
                                                padding: '8px 16px',
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {row.defectReportCount}
                                        </td>
                                        <td
                                            style={{
                                                padding: '8px 16px',
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {row.defectReportPeople}
                                        </td>
                                        <td
                                            style={{
                                                padding: '8px 16px',
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {row.validDefectCount}
                                        </td>
                                        <td
                                            style={{
                                                padding: '8px 16px',
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {row.rewardPoints}
                                        </td>
                                        <td
                                            style={{
                                                padding: '8px 16px',
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {row.pointsPerDefect}
                                        </td>
                                        <td
                                            style={{
                                                padding: '8px 16px',
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {row.participationRate}%
                                        </td>
                                        <td
                                            style={{
                                                padding: '8px 16px',
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {row.validFeedbackRate}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        )}
                    </Box>

                    {/* Pagination */}
                    <Box
                        bg={COLORS.bgPrimary}
                        borderRadius="8px"
                        p={4}
                        boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                    >
                        <Flex justify="flex-end" align="center" gap={4}>
                            <Text
                                fontSize="14px"
                                color={COLORS.textSecondary}
                            >
                                共{total}条
                            </Text>

                            <HStack gap={2}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() =>
                                        setCurrentPage(currentPage - 1)
                                    }
                                    p={2}
                                >
                                    <ChevronLeft size={16} />
                                </Button>

                                {Array.from({ length: totalPages }, (_, i) => (
                                    <Button
                                        key={i + 1}
                                        size="sm"
                                        variant={
                                            currentPage === i + 1
                                                ? 'solid'
                                                : 'ghost'
                                        }
                                        bg={
                                            currentPage === i + 1
                                                ? '#FEDFE1'
                                                : 'transparent'
                                        }
                                        color={
                                            currentPage === i + 1
                                                ? '#FE606B'
                                                : COLORS.textSecondary
                                        }
                                        onClick={() => setCurrentPage(i + 1)}
                                        minW="24px"
                                        h="24px"
                                        fontSize="14px"
                                    >
                                        {i + 1}
                                    </Button>
                                ))}

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() =>
                                        setCurrentPage(currentPage + 1)
                                    }
                                    p={2}
                                >
                                    <ChevronRight size={16} />
                                </Button>
                            </HStack>

                            <Box position="relative" w="100px">
                                <select
                                    value={pageSize}
                                    onChange={(e) =>
                                        setPageSize(Number(e.target.value))
                                    }
                                    style={{
                                        background: COLORS.bgSecondary,
                                        border: 'none',
                                        borderRadius: '2px',
                                        fontSize: '14px',
                                        color: COLORS.textPrimary,
                                        padding: '4px 12px',
                                        paddingRight: '24px',
                                        width: '100%',
                                        appearance: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <option value={10}>10条/页</option>
                                    <option value={20}>20条/页</option>
                                    <option value={50}>50条/页</option>
                                </select>
                                <ChevronDown
                                    size={14}
                                    color={COLORS.textTertiary}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        pointerEvents: 'none',
                                    }}
                                />
                            </Box>
                        </Flex>
                    </Box>
                </VStack>
            </Container>
        </Box>
    );
}
