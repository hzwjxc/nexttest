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

// Mock data for user redemption
const mockUserRedemptionData = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    account: '15203262314',
    user: '张三',
    cardNumber: '1236213245687456',
    redeemPoints: 5,
    fee: 0,
    redemptionStatus: '成功',
    transactionSerialNumber: '1541856464153641615',
    redemptionTime: '2024-09-19 12:23:00',
    description: '测试',
}));

export default function UserRedemptionPage() {
    const router = useRouter();
    const [redemptionStatus, setRedemptionStatus] = useState('');
    const [account, setAccount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Calculate pagination
    const totalRecords = mockUserRedemptionData.length;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentData = mockUserRedemptionData.slice(startIndex, endIndex);

    const handleReset = () => {
        setRedemptionStatus('');
        setAccount('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const handleExport = () => {
        console.log('Export user redemption data');
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
                        用户提现明细
                    </Text>
                </Flex>

                {/* Filter and Action Bar */}
                <Flex
                    justify="space-between"
                    bg={COLORS.bgPrimary}
                    p={6}
                    borderRadius="8px"
                    mb={6}
                >
                    <Flex justify="space-between" align="center" gap={4}>
                        <HStack gap={3} flex={1}>
                            <select
                                value={redemptionStatus}
                                onChange={(e) =>
                                    setRedemptionStatus(e.target.value)
                                }
                                style={{
                                    fontSize: '14px',
                                    borderRadius: '24px',
                                    backgroundColor: COLORS.bgSecondary,
                                    border: 'none',
                                    maxWidth: '120px',
                                    padding: '8px 12px',
                                }}
                            >
                                <option value="">提现状态</option>
                                <option value="success">成功</option>
                                <option value="pending">待处理</option>
                                <option value="failed">失败</option>
                            </select>

                            <Input
                                placeholder="账号"
                                value={account}
                                onChange={(e) => setAccount(e.target.value)}
                                fontSize="14px"
                                borderRadius="24px"
                                bg={COLORS.bgSecondary}
                                border="none"
                                maxW="150px"
                                _placeholder={{ color: COLORS.textTertiary }}
                            />

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
                                px={6}
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
                    </Flex>

                    <Flex justify="space-between" align="center" gap={4}>
                        <Button
                            px={6}
                            size="sm"
                            bg={`linear-gradient(to right, ${COLORS.primaryLight}, ${COLORS.primaryDark})`}
                            color="white"
                            borderRadius="999px"
                            fontSize="14px"
                            fontWeight="500"
                            onClick={handleExport}
                            _hover={{ opacity: 0.9 }}
                        >
                            导出数据
                        </Button>
                    </Flex>
                </Flex>

                {/* Summary Section */}
                <Box bg={COLORS.bgPrimary} p={6} borderRadius="8px" mb={6}>
                    <Text
                        fontSize="14px"
                        color={COLORS.textSecondary}
                        fontWeight="500"
                    >
                        提现合计金额：￥300,000.00元
                    </Text>
                </Box>

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
                                            minWidth: '120px',
                                        }}
                                    >
                                        账号
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
                                        用户
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
                                        卡号
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
                                        兑换积分
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
                                        提现状态
                                    </th>
                                    <th
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: COLORS.textPrimary,
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            minWidth: '180px',
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
                                            minWidth: '160px',
                                        }}
                                    >
                                        兑换时间
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
                                        处理描述
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
                                            {record.account}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.user}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.cardNumber}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.redeemPoints}
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
                                            {record.redemptionStatus}
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
                                            {record.redemptionTime}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.description}
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
