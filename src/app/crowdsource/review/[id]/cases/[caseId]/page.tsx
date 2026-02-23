'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
    Box,
    Container,
    Flex,
    Text,
    VStack,
    HStack,
    Image,
} from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import { LuMenu, LuChevronRight } from 'react-icons/lu';
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
    lightBg: '#EAEDF2',
};

// Test Step type
interface TestStep {
    title: string;
    description: string;
    expectedResult: string;
}

export default function TestCaseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const caseId = params.caseId as string;
    const reviewId = params.id as string;

    // 获取用例详情
    const { data: testCaseData, isLoading } = api.testCase.getById.useQuery({
        id: caseId,
    });

    const testCase = testCaseData;

    // 解析测试步骤 JSON
    const parseTestSteps = (testStepsJson: string): TestStep[] => {
        try {
            const parsed = JSON.parse(testStepsJson);
            if (Array.isArray(parsed)) {
                return parsed;
            }
            return [];
        } catch (e) {
            return [];
        }
    };

    // 解析测试准备（前置条件）
    const parsePrecondition = (precondition?: string | null): string[] => {
        if (!precondition) return [];
        // 如果是 JSON 数组格式
        try {
            const parsed = JSON.parse(precondition);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch (e) {
            // 如果不是 JSON，按换行符分割
            return precondition.split('\n').filter(line => line.trim());
        }
        return [precondition];
    };

    const handleBack = () => {
        router.push(`/crowdsource/review/${reviewId}`);
    };

    if (isLoading) {
        return (
            <Box bg={COLORS.bgTertiary} minH="100vh" display="flex" alignItems="center" justifyContent="center">
                <Text fontSize="16px" color={COLORS.textSecondary}>加载中...</Text>
            </Box>
        );
    }

    if (!testCase) {
        return (
            <Box bg={COLORS.bgTertiary} minH="100vh" display="flex" alignItems="center" justifyContent="center">
                <Text fontSize="16px" color={COLORS.textSecondary}>用例不存在</Text>
            </Box>
        );
    }

    const testSteps = parseTestSteps(testCase.testSteps);
    const preparations = parsePrecondition(testCase.precondition);

    return (
        <Box bg={COLORS.bgTertiary} minH="100vh" display="flex" flexDirection="column">
            {/* Main Content */}
            <Box flex="1">
                <Container maxW="1200px" px={6} py={4}>
                    {/* Breadcrumb */}
                    <Flex align="center" gap={2} mb={4} fontSize="14px" color={COLORS.textSecondary}>
                        <Box cursor="pointer" _hover={{ color: COLORS.textPrimary }} onClick={handleBack}>
                            <LuMenu size={16} />
                        </Box>
                        <Text>/</Text>
                        <Text cursor="pointer" _hover={{ color: COLORS.primary }} onClick={handleBack}>
                            众测审核
                        </Text>
                        <Text>/</Text>
                        <Text cursor="pointer" _hover={{ color: COLORS.primary }} onClick={handleBack}>
                            任务详情
                        </Text>
                        <Text>/</Text>
                        <Text color={COLORS.textPrimary}>用例详情</Text>
                    </Flex>

                    {/* Case Title Card */}
                    <Box
                        bg={COLORS.lightBg}
                        borderRadius="8px"
                        p={6}
                        mb={4}
                        border="1px solid"
                        borderColor={COLORS.borderColor}
                        display="flex"
                        alignItems="center"
                        gap={3}
                    >
                        <Image src="/images/review/caseDetail-icon.png" alt="" width="14px" height="14px" />
                        <Text fontSize="18px" fontWeight="600" color={COLORS.textPrimary} flex="1">
                            {testCase.title}
                        </Text>
                    </Box>

                    {/* Content Sections */}
                    <VStack gap={4} align="stretch">
                        {/* Test Preparation */}
                        {preparations.length > 0 && (
                            <Box
                                bg={COLORS.bgPrimary}
                                borderRadius="8px"
                                p={6}
                                border="1px solid"
                                borderColor={COLORS.borderColor}
                            >
                                <Text fontSize="18px" fontWeight="600" color={COLORS.textPrimary} mb={4}>
                                    测试准备
                                </Text>
                                <VStack align="stretch" gap={2}>
                                    {preparations.map((item, index) => (
                                        <Text
                                            key={index}
                                            fontSize="14px"
                                            color={COLORS.textSecondary}
                                            lineHeight="1.7"
                                            textAlign="justify"
                                        >
                                            {item}
                                        </Text>
                                    ))}
                                </VStack>
                            </Box>
                        )}

                        {/* Focus Points */}
                        {testCase.explanation && (
                            <Box
                                bg={COLORS.bgPrimary}
                                borderRadius="8px"
                                p={6}
                                border="1px solid"
                                borderColor={COLORS.borderColor}
                            >
                                <Text fontSize="18px" fontWeight="600" color={COLORS.textPrimary} mb={4}>
                                    重点关注
                                </Text>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    lineHeight="1.7"
                                    textAlign="justify"
                                >
                                    {testCase.explanation}
                                </Text>
                            </Box>
                        )}

                        {/* Test Data */}
                        {testCase.testData && testCase.testData.length > 0 && (
                            <Box
                                bg={COLORS.bgPrimary}
                                borderRadius="8px"
                                p={6}
                                border="1px solid"
                                borderColor={COLORS.borderColor}
                            >
                                <Text fontSize="18px" fontWeight="600" color={COLORS.textPrimary} mb={4}>
                                    测试数据
                                </Text>
                                <VStack align="stretch" gap={2}>
                                    {testCase.testData.map((data, index) => (
                                        <HStack key={index} gap={2}>
                                            <Text fontSize="14px" color={COLORS.textSecondary} fontWeight="500">
                                                {data.label}:
                                            </Text>
                                            <Text fontSize="14px" color={COLORS.textSecondary}>
                                                {data.dataValue}
                                            </Text>
                                        </HStack>
                                    ))}
                                </VStack>
                            </Box>
                        )}

                        {/* Test Steps */}
                        {testSteps.length > 0 && (
                            <Box
                                bg={COLORS.bgPrimary}
                                borderRadius="8px"
                                p={6}
                                border="1px solid"
                                borderColor={COLORS.borderColor}
                            >
                                <VStack align="stretch" gap={6}>
                                    {testSteps.map((step, index) => (
                                        <VStack key={index} align="stretch" gap={3}>
                                            <Text fontSize="18px" fontWeight="600" color={COLORS.textPrimary}>
                                                {step.title || `步骤${index + 1}`}
                                            </Text>
                                            <VStack align="stretch" gap={2}>
                                                <HStack align="flex-start" gap={2}>
                                                    <Text
                                                        fontSize="14px"
                                                        color={COLORS.textSecondary}
                                                        flexShrink={0}
                                                        fontWeight="500"
                                                    >
                                                        操作步骤：
                                                    </Text>
                                                    <Text
                                                        fontSize="14px"
                                                        color={COLORS.textSecondary}
                                                        lineHeight="1.7"
                                                        textAlign="justify"
                                                    >
                                                        {step.description}
                                                    </Text>
                                                </HStack>
                                                <HStack align="flex-start" gap={2}>
                                                    <Text
                                                        fontSize="14px"
                                                        color={COLORS.textSecondary}
                                                        flexShrink={0}
                                                        fontWeight="500"
                                                    >
                                                        预期结果：
                                                    </Text>
                                                    <Text
                                                        fontSize="14px"
                                                        color={COLORS.textSecondary}
                                                        lineHeight="1.7"
                                                        textAlign="justify"
                                                    >
                                                        {step.expectedResult}
                                                    </Text>
                                                </HStack>
                                            </VStack>
                                            {index < testSteps.length - 1 && (
                                                <Box borderBottom="1px solid" borderColor={COLORS.borderColor} />
                                            )}
                                        </VStack>
                                    ))}
                                </VStack>
                            </Box>
                        )}
                    </VStack>
                </Container>
            </Box>

            {/* Footer */}
            <Box bg="#1D2129" py={4}>
                <Text textAlign="center" fontSize="14px" color={COLORS.textTertiary}>
                    备案信息
                </Text>
            </Box>
        </Box>
    );
}
