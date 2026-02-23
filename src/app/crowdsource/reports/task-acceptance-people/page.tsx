'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Breadcrumb,
    Box,
    Container,
    Flex,
    Text,
    Button,
    HStack,
    VStack,
} from '@chakra-ui/react';
import { ChevronLeft } from 'lucide-react';
import { FiAlignJustify } from 'react-icons/fi';
import { LiaSlashSolid } from 'react-icons/lia';
import { api } from '@/trpc/react';
import { showSuccessToast, showErrorToast } from '@/app/utils';

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

export default function TaskAcceptancePeoplePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // 从 URL 获取日期范围
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // 获取任务领取人数数据
    const { data, isLoading } = api.reports.getTaskAcceptancePeople.useQuery({
        page: currentPage,
        pageSize: itemsPerPage,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    });

    // 导出数据查询
    const { refetch: fetchExportData } = api.reports.exportTaskAcceptancePeople.useQuery(
        {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        },
        {
            enabled: false, // 默认不执行
        }
    );

    const paginatedData = data?.data || [];
    const total = data?.total || 0;
    const totalPages = data?.totalPages || 1;

    // 导出报表功能
    const handleExport = async () => {
        try {
            const result = await fetchExportData();
            const exportData = result.data || [];

            if (exportData.length === 0) {
                showErrorToast('没有数据可导出');
                return;
            }

            // 准备导出数据
            const headers = ['序号', '用户名', '所属机构', '手机号', '最后领取时间', '最后任务编号', '最后任务名称'];
            const csvRows = [
                headers.join(','),
                ...exportData.map((item: any) => [
                    item.id,
                    `"${item.username}"`,
                    `"${item.organization}"`,
                    item.phone,
                    `"${item.lastAcceptanceTime}"`,
                    item.lastTaskNumber,
                    `"${item.lastTaskName}"`
                ].join(','))
            ];

            // 创建CSV内容
            const csvContent = csvRows.join('\n');
            
            // 添加BOM以支持中文
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], {
                type: 'text/csv;charset=utf-8;',
            });

            // 创建下载链接
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute(
                'download',
                `任务领取人数_${startDate || '全部'}_${endDate || '全部'}.csv`
            );
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showSuccessToast('导出成功');
        } catch (error) {
            console.error('导出失败:', error);
            showErrorToast('导出失败，请稍后重试');
        }
    };

    return (
        <Box bg={COLORS.bgTertiary} minH="100vh">
            {/* Main Content */}
            <Container maxW="1400px" px={6} py={6}>
                {/* 面包屑导航 */}
                <Breadcrumb.Root>
                    <Breadcrumb.List>
                        <Breadcrumb.Item>
                            <Breadcrumb.Link href="/crowdsource/reports">
                                <FiAlignJustify />
                                统计报表
                            </Breadcrumb.Link>
                        </Breadcrumb.Item>
                        <Breadcrumb.Separator>
                            <LiaSlashSolid />
                        </Breadcrumb.Separator>

                        <Breadcrumb.Item>
                            <Breadcrumb.CurrentLink>
                                任务领取人数
                            </Breadcrumb.CurrentLink>
                        </Breadcrumb.Item>
                    </Breadcrumb.List>
                </Breadcrumb.Root>
                <Box h={4} />
                {/* Header */}
                <Box
                    bg={COLORS.bgPrimary}
                    borderBottom={`1px solid ${COLORS.borderColor}`}
                    py={3}
                    borderRadius="8px"
                >
                    <Container maxW="1400px" px={6}>
                        <Flex justify="space-between" align="center">
                            <HStack gap={4}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.back()}
                                    _hover={{ bg: 'transparent' }}
                                >
                                    <ChevronLeft
                                        size={20}
                                        color={COLORS.textPrimary}
                                    />
                                </Button>
                                <Text
                                    fontSize="16px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                >
                                    任务领取人数
                                </Text>
                            </HStack>
                            <HStack gap={6}>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                >
                                    时间段：{startDate || '全部'}~{endDate || '全部'}
                                </Text>
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
                                    loading={isLoading}
                                    disabled={isLoading}
                                >
                                    导出报表
                                </Button>
                            </HStack>
                        </Flex>
                    </Container>
                </Box>
                <Box h={4} />

                <VStack gap={6} align="stretch">
                    {/* Table */}
                    <Box
                        bg={COLORS.bgPrimary}
                        borderRadius="8px"
                        overflow="hidden"
                        boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                    >
                        <Box overflowX="auto">
                            {/* Table Header */}
                            <Flex
                                bg={COLORS.bgSecondary}
                                borderBottom={`1px solid ${COLORS.borderColor}`}
                            >
                                <Box
                                    w="60px"
                                    px={4}
                                    py={3}
                                    fontWeight="500"
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                >
                                    序号
                                </Box>
                                <Box
                                    w="120px"
                                    px={4}
                                    py={3}
                                    fontWeight="500"
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                >
                                    用户名
                                </Box>
                                <Box
                                    w="200px"
                                    px={4}
                                    py={3}
                                    fontWeight="500"
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                >
                                    所属机构
                                </Box>
                                <Box
                                    w="160px"
                                    px={4}
                                    py={3}
                                    fontWeight="500"
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                >
                                    手机号
                                </Box>
                                <Box
                                    w="180px"
                                    px={4}
                                    py={3}
                                    fontWeight="500"
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                >
                                    最后领取时间
                                </Box>
                                <Box
                                    w="172px"
                                    px={4}
                                    py={3}
                                    fontWeight="500"
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                >
                                    最后任务编号
                                </Box>
                                <Box
                                    flex={1}
                                    px={4}
                                    py={3}
                                    fontWeight="500"
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                >
                                    最后任务名称
                                </Box>
                            </Flex>

                            {/* Table Body */}
                            {isLoading ? (
                                <Flex justify="center" align="center" py={8}>
                                    <Text fontSize="14px" color={COLORS.textSecondary}>
                                        加载中...
                                    </Text>
                                </Flex>
                            ) : paginatedData.length === 0 ? (
                                <Flex justify="center" align="center" py={8}>
                                    <Text fontSize="14px" color={COLORS.textSecondary}>
                                        暂无数据
                                    </Text>
                                </Flex>
                            ) : (
                                paginatedData.map((item) => (
                                    <Flex
                                        key={item.id}
                                        borderBottom={`1px solid ${COLORS.borderColor}`}
                                        _hover={{ bg: '#FAFBFC' }}
                                    >
                                        <Box
                                            w="60px"
                                            px={4}
                                            py={3}
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                        >
                                            {item.id}
                                        </Box>
                                        <Box
                                            w="120px"
                                            px={4}
                                            py={3}
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                        >
                                            {item.username}
                                        </Box>
                                        <Box
                                            w="200px"
                                            px={4}
                                            py={3}
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                        >
                                            {item.organization}
                                        </Box>
                                        <Box
                                            w="160px"
                                            px={4}
                                            py={3}
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                        >
                                            {item.phone}
                                        </Box>
                                        <Box
                                            w="180px"
                                            px={4}
                                            py={3}
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                        >
                                            {item.lastAcceptanceTime}
                                        </Box>
                                        <Box
                                            w="172px"
                                            px={4}
                                            py={3}
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                        >
                                            {item.lastTaskNumber}
                                        </Box>
                                        <Box
                                            flex={1}
                                            px={4}
                                            py={3}
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                        >
                                            {item.lastTaskName}
                                        </Box>
                                    </Flex>
                                ))
                            )}
                        </Box>

                        {/* Pagination */}
                        <Flex
                            justify="flex-end"
                            align="center"
                            gap={4}
                            p={4}
                            borderTop={`1px solid ${COLORS.borderColor}`}
                        >
                            <Text fontSize="14px" color={COLORS.textSecondary}>
                                共{total}条
                            </Text>
                            <HStack gap={2}>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={currentPage === 1}
                                    onClick={() =>
                                        setCurrentPage(currentPage - 1)
                                    }
                                    _hover={{ bg: COLORS.bgSecondary }}
                                >
                                    上一页
                                </Button>
                                {Array.from(
                                    { length: Math.min(5, totalPages) },
                                    (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <Button
                                                key={pageNum}
                                                size="sm"
                                                bg={
                                                    currentPage === pageNum
                                                        ? '#fedfe1'
                                                        : 'transparent'
                                                }
                                                color={
                                                    currentPage === pageNum
                                                        ? '#fe6771'
                                                        : COLORS.textSecondary
                                                }
                                                fontWeight={
                                                    currentPage === pageNum
                                                        ? '600'
                                                        : '400'
                                                }
                                                onClick={() =>
                                                    setCurrentPage(pageNum)
                                                }
                                                _hover={{
                                                    bg: COLORS.bgSecondary,
                                                }}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    }
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={currentPage === totalPages}
                                    onClick={() =>
                                        setCurrentPage(currentPage + 1)
                                    }
                                    _hover={{ bg: COLORS.bgSecondary }}
                                >
                                    下一页
                                </Button>
                            </HStack>
                            <Text fontSize="14px" color={COLORS.textTertiary}>
                                10条/页
                            </Text>
                        </Flex>
                    </Box>
                </VStack>
            </Container>
        </Box>
    );
}
