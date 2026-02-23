'use client';

import React, { useState } from 'react';
import {
    Box,
    Flex,
    Text,
    Button,
    Input,
    HStack,
    Container,
} from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { FiAlignJustify } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

const COLORS = {
    primary: '#E31424',
    primaryLight: '#FF9565',
    primaryDark: '#FE5F6B',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    borderColor: '#E5E6EB',
    success: '#fedfe1',
};

// Mock data for payment records
const mockPaymentData = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    transactionTime: '2024-09-19 12:23:00',
    userInfo: '广发众测',
    transactionType: '充值',
    transactionAmount: 120,
    fee: 1000,
    accountBalance: 1000,
    transactionNumber: '123456789',
    transactionSerialNumber: '123456789',
    remark: '',
}));

export default function PaymentManagementPage() {
    const router = useRouter();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Calculate pagination
    const totalRecords = mockPaymentData.length;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentData = mockPaymentData.slice(startIndex, endIndex);

    const handleReset = () => {
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const handleExport = () => {
        console.log('Export payment details');
    };

    const handleRegister = () => {
        console.log('Open payment registration dialog');
    };

    return (
        <Box bg={COLORS.bgSecondary} minH="100vh">
            <Container maxW="1200px" px={0}>
                {/* Breadcrumb */}
                <Flex
                    align="center"
                    gap={2}
                    mb={4}
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
                            router.push('/crowdsource/admin/payment-management')
                        }
                        cursor="pointer"
                    >
                        财务管理
                    </Text>
                    <Text>/</Text>
                    <Text color={COLORS.textPrimary} fontWeight="500">
                        财务打款管理
                    </Text>
                </Flex>

                {/* Filter and Action Bar */}
                <Box bg={COLORS.bgPrimary} p={6} borderRadius="8px" mb={6}>
                    <Flex justify="space-between" align="center" gap={4}>
                        <HStack gap={3} flex={1}>
                            <Input
                                placeholder="开始时间"
                                type="datetime-local"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                fontSize="14px"
                                borderRadius="24px"
                                bg={COLORS.bgSecondary}
                                border="none"
                                maxW="200px"
                                _placeholder={{ color: COLORS.textTertiary }}
                            />

                            <Input
                                placeholder="结束时间"
                                type="datetime-local"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                fontSize="14px"
                                borderRadius="24px"
                                bg={COLORS.bgSecondary}
                                border="none"
                                maxW="200px"
                                _placeholder={{ color: COLORS.textTertiary }}
                            />

                            <Button
                                size="sm"
                                bg={`linear-gradient(to right, ${COLORS.primaryLight}, ${COLORS.primaryDark})`}
                                color="white"
                                borderRadius="999px"
                                fontSize="14px"
                                fontWeight="500"
                                _hover={{ opacity: 0.9 }}
                            >
                                查询
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                color={COLORS.textTertiary}
                                fontSize="14px"
                                fontWeight="500"
                                onClick={handleReset}
                            >
                                重置
                            </Button>
                        </HStack>

                        <HStack gap={3}>
                            <Button
                                size="sm"
                                variant="outline"
                                borderColor={COLORS.primary}
                                color={COLORS.primary}
                                borderRadius="999px"
                                fontSize="14px"
                                fontWeight="500"
                                onClick={handleRegister}
                            >
                                财务打款登记
                            </Button>
                            <Button
                                size="sm"
                                bg={`linear-gradient(to right, ${COLORS.primaryLight}, ${COLORS.primaryDark})`}
                                color="white"
                                borderRadius="999px"
                                fontSize="14px"
                                fontWeight="500"
                                onClick={handleExport}
                                _hover={{ opacity: 0.9 }}
                            >
                                导出财务打款明细
                            </Button>
                        </HStack>
                    </Flex>
                </Box>

                {/* Summary Cards */}
                <Flex gap={6} mb={6}>
                    <Box
                        bg={COLORS.bgPrimary}
                        p={8}
                        borderRadius="8px"
                        flex={1}
                        textAlign="center"
                    >
                        <Text
                            fontSize="24px"
                            fontWeight="700"
                            color={COLORS.textPrimary}
                            mb={1}
                        >
                            288,000.00
                        </Text>
                        <Text fontSize="12px" color={COLORS.textTertiary}>
                            充值金额
                        </Text>
                    </Box>
                    <Box
                        bg={COLORS.bgPrimary}
                        p={8}
                        borderRadius="8px"
                        flex={1}
                        textAlign="center"
                    >
                        <Text
                            fontSize="24px"
                            fontWeight="700"
                            color={COLORS.textPrimary}
                            mb={1}
                        >
                            288,000.00
                        </Text>
                        <Text fontSize="12px" color={COLORS.textTertiary}>
                            提现金额
                        </Text>
                    </Box>
                    <Box
                        bg={COLORS.bgPrimary}
                        p={8}
                        borderRadius="8px"
                        flex={1}
                        textAlign="center"
                    >
                        <Text
                            fontSize="24px"
                            fontWeight="700"
                            color={COLORS.textPrimary}
                            mb={1}
                        >
                            288,000,000.00
                        </Text>
                        <Text fontSize="12px" color={COLORS.textTertiary}>
                            账户余额
                        </Text>
                    </Box>
                </Flex>

                {/* Table */}
                <Box
                    p={6}
                    bg={COLORS.bgPrimary}
                    borderRadius="8px"
                    overflow="hidden"
                >
                    <Box overflowX="auto">
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
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
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: COLORS.textPrimary,
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            minWidth: '50px',
                                        }}
                                    >
                                        序号
                                    </th>
                                    <th
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: COLORS.textPrimary,
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            minWidth: '160px',
                                        }}
                                    >
                                        交易时间
                                    </th>
                                    <th
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: COLORS.textPrimary,
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            minWidth: '80px',
                                        }}
                                    >
                                        用户信息
                                    </th>
                                    <th
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: COLORS.textPrimary,
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            minWidth: '80px',
                                        }}
                                    >
                                        交易类型
                                    </th>
                                    <th
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: COLORS.textPrimary,
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            minWidth: '80px',
                                        }}
                                    >
                                        交易金额
                                    </th>
                                    <th
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: COLORS.textPrimary,
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            minWidth: '70px',
                                        }}
                                    >
                                        手续费
                                    </th>
                                    <th
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: COLORS.textPrimary,
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            minWidth: '80px',
                                        }}
                                    >
                                        账户余额
                                    </th>
                                    <th
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: COLORS.textPrimary,
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            minWidth: '100px',
                                        }}
                                    >
                                        交易单号
                                    </th>
                                    <th
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: COLORS.textPrimary,
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            minWidth: '100px',
                                        }}
                                    >
                                        交易流水号
                                    </th>
                                    <th
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: COLORS.textPrimary,
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            minWidth: '132px',
                                        }}
                                    >
                                        备注
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.map((record) => (
                                    <tr key={record.id}>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.id}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.transactionTime}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.userInfo}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.transactionType}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.transactionAmount}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.fee}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.accountBalance}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.transactionNumber}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.transactionSerialNumber}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.remark || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                </Box>

                {/* Pagination */}
                <Flex
                    p={3}
                    bg="#fff"
                    borderRadius="8px"
                    justify="flex-end"
                    align="center"
                    gap={2}
                    mt={6}
                >
                    <Text fontSize="14px" color={COLORS.textTertiary}>
                        共{totalRecords}条
                    </Text>

                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        <LuChevronLeft />
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                            <Button
                                key={page}
                                size="sm"
                                variant={
                                    currentPage === page ? 'solid' : 'ghost'
                                }
                                bg={
                                    currentPage === page
                                        ? COLORS.success
                                        : 'transparent'
                                }
                                color={
                                    currentPage === page
                                        ? '#FE606B'
                                        : COLORS.textSecondary
                                }
                                onClick={() => setCurrentPage(page)}
                                minW="32px"
                            >
                                {page}
                            </Button>
                        )
                    )}

                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        <LuChevronRight />
                    </Button>

                    <Text fontSize="14px" color={COLORS.textTertiary} ml={4}>
                        {currentPage}/{totalPages}
                    </Text>
                </Flex>
            </Container>
        </Box>
    );
}
