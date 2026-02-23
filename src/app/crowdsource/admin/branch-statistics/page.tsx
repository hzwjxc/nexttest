'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Flex,
    Text,
    Button,
    HStack,
    VStack,
    Input,
} from '@chakra-ui/react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FiAlignJustify } from 'react-icons/fi';
import { api } from '@/trpc/react';

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

interface BranchStatistics {
    id: number;
    branchName: string;
    cumulativeUsers: number;
    newUsers: number;
    activeUsersTotal: number;
    activeUsersMiniProgram: number;
    activeUsersPC: number;
    taskAcceptanceCount: number;
    taskAcceptancePeople: number;
    defectReportCount: number;
    defectReportPeople: number;
    validDefectCount: number;
    participationRate: number;
    validFeedbackRate: number;
}

export default function BranchStatisticsPage() {
    const router = useRouter();
    const [branchName, setBranchName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // 获取所有分行名称
    const { data: allBranches = [] } = api.reports.getAllBranches.useQuery();

    // 获取分行统计数据
    const { data: branchStats, isLoading, refetch } = api.reports.getBranchStatistics.useQuery({
        page: currentPage,
        pageSize: pageSize,
        branchName: branchName || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    });

    // 导出数据状态
    const [exportData, setExportData] = useState<any[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    
    // 获取导出数据
    const { data: exportResult, refetch: refetchExport } = api.reports.exportBranchStatistics.useQuery({
        branchName: branchName || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    }, {
        enabled: false, // 默认不自动执行
    });

    // 监听导出数据变化
    useEffect(() => {
        if (exportResult && isExporting) {
            // 创建CSV内容
            const headers = [
                '序号', '分行名称', '累计注册用户数', '新增注册用户数', '用户登录活跃数总数', 
                '用户登录活跃数小程序', '用户登录活跃数PC端', '任务领取人次', '任务领取人数', 
                '提报缺陷人次', '提报缺陷人数', '提报有效缺陷数', '用户参测率(%)', '有效反馈率(%)'
            ];
            
            const csvContent = [
                headers.join(','),
                ...exportResult.map((row: any) => [
                    row.id,
                    `"${row.branchName}"`, // 添加引号防止分行名称中的逗号问题
                    row.cumulativeUsers,
                    row.newUsers,
                    row.activeUsersTotal,
                    row.activeUsersMiniProgram,
                    row.activeUsersPC,
                    row.taskAcceptanceCount,
                    row.taskAcceptancePeople,
                    row.defectReportCount,
                    row.defectReportPeople,
                    row.validDefectCount,
                    row.participationRate,
                    row.validFeedbackRate
                ].join(','))
            ].join('\n');

            // 创建并下载文件
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `分行统计_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setIsExporting(false);
        }
    }, [exportResult, isExporting]);

    const handleQuery = () => {
        setCurrentPage(1);
        refetch();
    };

    const handleReset = () => {
        setBranchName('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
        refetch();
    };

    const handleExport = () => {
        setIsExporting(true);
        refetchExport();
    };

    const totalPages = branchStats?.totalPages || 1;
    const paginatedData = branchStats?.data || [];

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
                                    '/crowdsource/admin/branch-statistics'
                                )
                            }
                            cursor="pointer"
                        >
                            报表管理
                        </Text>
                        <Text>/</Text>
                        <Text color={COLORS.textPrimary} fontWeight="500">
                            分行统计
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
                                分行统计
                            </Text>

                            <HStack gap={8}>
                                <HStack gap={8}>
                                    {/* Branch Name Filter */}
                                    <Box position="relative" w="140px">
                                        <select
                                            value={branchName}
                                            onChange={(e) =>
                                                setBranchName(e.target.value)
                                            }
                                            style={{
                                                background: COLORS.bgSecondary,
                                                border: 'none',
                                                borderRadius: '24px',
                                                fontSize: '14px',
                                                color: COLORS.textTertiary,
                                                padding: '7px 12px',
                                                paddingRight: '32px',
                                                width: '100%',
                                                appearance: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <option value="">全部分行</option>
                                            {allBranches.map((branch: string) => (
                                                <option key={branch} value={branch}>
                                                    {branch}
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
                                        loading={isLoading}
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
                                    loading={isExporting}
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
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '14px',
                            }}
                        >
                            <thead
                                style={{ backgroundColor: COLORS.bgSecondary }}
                            >
                                <tr>
                                    <th
                                        rowSpan={2}
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
                                        rowSpan={2}
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '150px',
                                        }}
                                    >
                                        分行名称
                                    </th>
                                    <th
                                        rowSpan={2}
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '120px',
                                        }}
                                    >
                                        累计注册用户数
                                    </th>
                                    <th
                                        rowSpan={2}
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '130px',
                                        }}
                                    >
                                        新增注册用户数
                                    </th>
                                    <th
                                        colSpan={3}
                                        style={{
                                            textAlign: 'center',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                        }}
                                    >
                                        用户登录活跃数
                                    </th>
                                    <th
                                        rowSpan={2}
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
                                        rowSpan={2}
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
                                        rowSpan={2}
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '112px',
                                        }}
                                    >
                                        提报缺陷人次
                                    </th>
                                    <th
                                        rowSpan={2}
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '112px',
                                        }}
                                    >
                                        提报缺陷人数
                                    </th>
                                    <th
                                        rowSpan={2}
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
                                        rowSpan={2}
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
                                        rowSpan={2}
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
                                <tr>
                                    <th
                                        style={{
                                            textAlign: 'center',
                                            padding: '8px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '80px',
                                        }}
                                    >
                                        总数
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'center',
                                            padding: '8px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '80px',
                                        }}
                                    >
                                        小程序
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'center',
                                            padding: '8px 16px',
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            fontWeight: 500,
                                            color: COLORS.textPrimary,
                                            width: '80px',
                                        }}
                                    >
                                        PC端
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={14}
                                            style={{
                                                padding: '20px',
                                                textAlign: 'center',
                                                color: COLORS.textSecondary,
                                            }}
                                        >
                                            加载中...
                                        </td>
                                    </tr>
                                ) : paginatedData.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={14}
                                            style={{
                                                padding: '20px',
                                                textAlign: 'center',
                                                color: COLORS.textSecondary,
                                            }}
                                        >
                                            暂无数据
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((row: any, index: number) => (
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
                                                {row.branchName}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '8px 16px',
                                                    borderBottom: `1px solid ${COLORS.borderColor}`,
                                                    color: COLORS.textPrimary,
                                                }}
                                            >
                                                {row.cumulativeUsers}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '8px 16px',
                                                    borderBottom: `1px solid ${COLORS.borderColor}`,
                                                    color: COLORS.textPrimary,
                                                }}
                                            >
                                                {row.newUsers}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '8px 16px',
                                                    borderBottom: `1px solid ${COLORS.borderColor}`,
                                                    color: COLORS.textPrimary,
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {row.activeUsersTotal}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '8px 16px',
                                                    borderBottom: `1px solid ${COLORS.borderColor}`,
                                                    color: COLORS.textPrimary,
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {row.activeUsersMiniProgram}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '8px 16px',
                                                    borderBottom: `1px solid ${COLORS.borderColor}`,
                                                    color: COLORS.textPrimary,
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {row.activeUsersPC}
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </Box>

                    {/* Pagination */}
                    <Box
                        bg={COLORS.bgPrimary}
                        borderRadius="8px"
                        p={4}
                        boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                    >
                        <Flex justify="flex-end" align="center" gap={4}>
                            <Text fontSize="14px" color={COLORS.textSecondary}>
                                共{branchStats?.total || 0}条
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
