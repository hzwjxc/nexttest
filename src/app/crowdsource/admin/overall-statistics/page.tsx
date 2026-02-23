'use client';

import React, { useState } from 'react';
import {
    Box,
    Container,
    Flex,
    Text,
    Button,
    VStack,
    Input,
    HStack,
    Spinner,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FiAlignJustify } from 'react-icons/fi';
import { api } from '@/trpc/react';
import { toaster } from '@/app/_components/ui/toaster';
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

export default function OverallStatisticsPage() {
    const router = useRouter();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // 获取整体统计数据
    const { data: statsData, isLoading, refetch } = api.reports.getOverallStatistics.useQuery({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    });

    // 导出整体统计数据
    const { refetch: exportData } = api.reports.exportOverallStatistics.useQuery(
        {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        },
        {
            enabled: false,
        }
    );

    const handleQuery = () => {
        void refetch();
    };

    const handleReset = () => {
        setStartDate('');
        setEndDate('');
    };

    const handleExport = async () => {
        try {
            const result = await exportData();
            if (result.data) {
                const ws = XLSX.utils.json_to_sheet(result.data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, '整体统计');
                XLSX.writeFile(wb, `整体统计_${new Date().toLocaleDateString()}.xlsx`);

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

    // Calculate max value for chart scaling based on actual data
    const maxCount = statsData?.userGrowth
        ? (() => {
            const maxValue = Math.max(...statsData.userGrowth.map(item => item.count));
            // Round up to nearest nice number for better visualization
            if (maxValue === 0) return 100;
            const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
            const normalized = maxValue / magnitude;
            let roundedNormalized;
            if (normalized <= 1) roundedNormalized = 1;
            else if (normalized <= 2) roundedNormalized = 2;
            else if (normalized <= 5) roundedNormalized = 5;
            else roundedNormalized = 10;
            return roundedNormalized * magnitude;
        })()
        : 100;

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
                                    '/crowdsource/admin/overall-statistics'
                                )
                            }
                            cursor="pointer"
                        >
                            报表管理
                        </Text>
                        <Text>/</Text>
                        <Text color={COLORS.textPrimary} fontWeight="500">
                            总体统计
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
                                总体统计
                            </Text>

                            <HStack gap={8}>
                                <HStack gap={8}>
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

                    {/* Content */}
                    <Box
                        bg={COLORS.bgPrimary}
                        borderRadius="8px"
                        p={6}
                        boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                    >
                        {isLoading ? (
                            <Flex justify="center" align="center" minH="400px">
                                <Spinner size="lg" color={COLORS.primary} />
                            </Flex>
                        ) : !statsData ? (
                            <Flex justify="center" align="center" minH="400px">
                                <Text color={COLORS.textTertiary}>暂无数据</Text>
                            </Flex>
                        ) : (
                            <VStack gap={12} align="stretch">
                                {/* Statistics Cards */}
                                <Flex gap={5} justify="flex-start">
                                    {/* Card 1: Participation Rate */}
                                    <Box
                                        border={`1px solid ${COLORS.borderColor}`}
                                        borderRadius="8px"
                                        p={4}
                                        w="290px"
                                        bg={COLORS.bgPrimary}
                                    >
                                        <Flex gap={4} align="center">
                                            <Box
                                                bg={COLORS.bgSecondary}
                                                borderRadius="6px"
                                                p={2}
                                                w="48px"
                                                h="48px"
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                flexShrink={0}
                                            >
                                                <Text fontSize="24px">📊</Text>
                                            </Box>
                                            <VStack gap={3} align="flex-start">
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textSecondary}
                                                >
                                                    用户参测率
                                                </Text>
                                                <Text
                                                    fontSize="28px"
                                                    fontWeight="bold"
                                                    color={COLORS.textPrimary}
                                                >
                                                    {statsData.participationRate}%
                                                </Text>
                                            </VStack>
                                        </Flex>
                                    </Box>

                                    {/* Card 2: Valid Feedback Rate */}
                                    <Box
                                        border={`1px solid ${COLORS.borderColor}`}
                                        borderRadius="8px"
                                        p={4}
                                        w="290px"
                                        bg={COLORS.bgPrimary}
                                    >
                                        <Flex gap={4} align="center">
                                            <Box
                                                bg={COLORS.bgSecondary}
                                                borderRadius="6px"
                                                p={2}
                                                w="48px"
                                                h="48px"
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                flexShrink={0}
                                            >
                                                <Text fontSize="24px">📊</Text>
                                            </Box>
                                            <VStack gap={3} align="flex-start">
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textSecondary}
                                                >
                                                    有效反馈率
                                                </Text>
                                                <Text
                                                    fontSize="28px"
                                                    fontWeight="bold"
                                                    color={COLORS.textPrimary}
                                                >
                                                    {statsData.validFeedbackRate}%
                                                </Text>
                                            </VStack>
                                        </Flex>
                                    </Box>

                                    {/* Card 3: Retention Users */}
                                    <Box
                                        border={`1px solid ${COLORS.borderColor}`}
                                        borderRadius="8px"
                                        p={4}
                                        w="290px"
                                        bg={COLORS.bgPrimary}
                                    >
                                        <Flex gap={4} align="center">
                                            <Box
                                                bg={COLORS.bgSecondary}
                                                borderRadius="6px"
                                                p={2}
                                                w="48px"
                                                h="48px"
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                flexShrink={0}
                                            >
                                                <Text fontSize="24px">👥</Text>
                                            </Box>
                                            <VStack gap={3} align="flex-start">
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textSecondary}
                                                >
                                                    留存用户人数
                                                </Text>
                                                <Text
                                                    fontSize="28px"
                                                    fontWeight="bold"
                                                    color={COLORS.textPrimary}
                                                >
                                                    {statsData.retentionUsers}
                                                </Text>
                                            </VStack>
                                        </Flex>
                                    </Box>
                                </Flex>

                                {/* Chart */}
                                <Box overflow="visible">
                                    <Text
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textPrimary}
                                        mb={6}
                                    >
                                        用户成长情况
                                    </Text>

                                    <Box
                                        display="flex"
                                        alignItems="flex-end"
                                        gap={8}
                                        h="300px"
                                        position="relative"
                                        mb={8}
                                    >
                                        {/* Y-axis labels */}
                                        <VStack
                                            gap={0}
                                            h="full"
                                            justify="space-between"
                                            pr={4}
                                            w="50px"
                                        >
                                            <Text
                                                fontSize="12px"
                                                color={COLORS.textTertiary}
                                            >
                                                {maxCount}
                                            </Text>
                                            <Text
                                                fontSize="12px"
                                                color={COLORS.textTertiary}
                                            >
                                                {Math.round(maxCount * 0.75)}
                                            </Text>
                                            <Text
                                                fontSize="12px"
                                                color={COLORS.textTertiary}
                                            >
                                                {Math.round(maxCount * 0.5)}
                                            </Text>
                                            <Text
                                                fontSize="12px"
                                                color={COLORS.textTertiary}
                                            >
                                                {Math.round(maxCount * 0.25)}
                                            </Text>
                                            <Text
                                                fontSize="12px"
                                                color={COLORS.textTertiary}
                                            >
                                                0
                                            </Text>
                                        </VStack>

                                        {/* Grid lines and bars container */}
                                        <Box position="relative" flex={1} h="full">
                                            {/* Horizontal grid lines */}
                                            <VStack
                                                gap={0}
                                                h="full"
                                                justify="space-between"
                                                position="absolute"
                                                w="full"
                                                top={0}
                                                left={0}
                                            >
                                                {[0, 1, 2, 3, 4].map((index) => (
                                                    <Box
                                                        key={index}
                                                        w="full"
                                                        borderTop="1px dashed #E5E6EB"
                                                    />
                                                ))}
                                            </VStack>

                                            {/* Bars */}
                                            <Flex
                                                gap={40}
                                                align="flex-end"
                                                h="full"
                                                justify="flex-start"
                                                position="relative"
                                                zIndex={1}
                                            >
                                                {statsData.userGrowth.map((item) => {
                                                    const heightPercent =
                                                        (item.count / maxCount) *
                                                        100;
                                                    return (
                                                        <VStack
                                                            key={item.level}
                                                            gap={0}
                                                            align="center"
                                                            h="full"
                                                            justify="flex-end"
                                                            flexShrink={0}
                                                        >
                                                            <Box
                                                                bg="#165DFF"
                                                                w="32px"
                                                                h={`${heightPercent}%`}
                                                                borderRadius="4px 4px 0 0"
                                                                position="relative"
                                                                minH={0}
                                                            >
                                                                <Text
                                                                    fontSize="12px"
                                                                    color={
                                                                        COLORS.textPrimary
                                                                    }
                                                                    fontWeight="500"
                                                                    position="absolute"
                                                                    top="-20px"
                                                                    left="50%"
                                                                    transform="translateX(-50%)"
                                                                    whiteSpace="nowrap"
                                                                >
                                                                    {item.count}
                                                                </Text>
                                                            </Box>
                                                        </VStack>
                                                    );
                                                })}
                                            </Flex>
                                        </Box>
                                    </Box>

                                    {/* Labels below chart */}
                                    <Flex
                                        gap={40}
                                        justify="flex-start"
                                        pl="82px"
                                        mt={-4}
                                    >
                                        {statsData.userGrowth.map((item) => (
                                            <Box
                                                key={item.level}
                                                w="32px"
                                                textAlign="center"
                                                flexShrink={0}
                                            >
                                                <Text
                                                    fontSize="12px"
                                                    color={COLORS.textTertiary}
                                                >
                                                    {item.level}
                                                </Text>
                                            </Box>
                                        ))}
                                    </Flex>
                                </Box>
                            </VStack>
                        )}
                    </Box>
                </VStack>
            </Container>
        </Box>
    );
}
