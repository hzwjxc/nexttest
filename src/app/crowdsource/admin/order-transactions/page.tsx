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

// Mock data for order transactions
const mockOrderData = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    orderTime: '2024-09-19 12:23:00',
    orderNumber: `ORD${String(i + 1).padStart(6, '0')}`,
    systemName: '系统' + ((i % 3) + 1),
    name: '用户' + (i + 1),
    executionFee: 100 + i * 10,
    defectFee: 50 + i * 5,
    suggestionFee: 30 + i * 3,
    supplementFee: 20 + i * 2,
    defectSupplementFee: 10 + i,
    orderStatus: ['已完成', '进行中', '待处理'][i % 3],
    remark: '',
}));

export default function OrderTransactionsPage() {
    const router = useRouter();
    const [taskFilter, setTaskFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Calculate pagination
    const totalRecords = mockOrderData.length;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentData = mockOrderData.slice(startIndex, endIndex);

    const handleReset = () => {
        setTaskFilter('');
        setStartDate('');
        setEndDate('');
        setNameInput('');
        setCurrentPage(1);
    };

    const handleExport = () => {
        console.log('Export order transactions');
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
                        订单交易明细
                    </Text>
                </Flex>

                {/* Filter and Action Bar */}
                <Flex
                    justifyContent="space-between"
                    alignItems="center"
                    bg={COLORS.bgPrimary}
                    p={4}
                    borderRadius="8px"
                    mb={6}
                >
                    <Text
                        fontSize="14px"
                        color={COLORS.textSecondary}
                        fontWeight="500"
                    >
                        8个任务，共计500个订单
                    </Text>
                    <Flex justify="space-between" align="center" gap={4}>
                        <HStack gap={3} flex={1}>
                            <select
                                value={taskFilter}
                                onChange={(e) => setTaskFilter(e.target.value)}
                                style={{
                                    fontSize: '14px',
                                    borderRadius: '24px',
                                    backgroundColor: COLORS.bgSecondary,
                                    border: 'none',
                                    maxWidth: '150px',
                                    padding: '8px 12px',
                                }}
                            >
                                <option value="">选择任务</option>
                                <option value="task1">任务1</option>
                                <option value="task2">任务2</option>
                                <option value="task3">任务3</option>
                            </select>

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

                            <Input
                                placeholder="发布者/测试者姓名"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                fontSize="14px"
                                borderRadius="24px"
                                bg={COLORS.bgSecondary}
                                border="none"
                                maxW="180px"
                                _placeholder={{ color: COLORS.textTertiary }}
                            />
                        </HStack>
                    </Flex>

                    <Flex justify="space-between" align="center" gap={4}>
                        <HStack gap={3}>
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

                {/* Summary Cards */}
                <Flex gap={4} mb={6} flexWrap="wrap">
                    <Box
                        bg={COLORS.bgPrimary}
                        p={6}
                        borderRadius="8px"
                        flex={1}
                        minW="150px"
                        textAlign="center"
                    >
                        <Text
                            fontSize="20px"
                            fontWeight="700"
                            color={COLORS.textPrimary}
                            mb={1}
                        >
                            5,000.00
                        </Text>
                        <Text fontSize="12px" color={COLORS.textTertiary}>
                            支付费用
                        </Text>
                    </Box>
                    <Box
                        bg={COLORS.bgPrimary}
                        p={6}
                        borderRadius="8px"
                        flex={1}
                        minW="150px"
                        textAlign="center"
                    >
                        <Text
                            fontSize="20px"
                            fontWeight="700"
                            color={COLORS.textPrimary}
                            mb={1}
                        >
                            3,000.00
                        </Text>
                        <Text fontSize="12px" color={COLORS.textTertiary}>
                            建议费用
                        </Text>
                    </Box>
                    <Box
                        bg={COLORS.bgPrimary}
                        p={6}
                        borderRadius="8px"
                        flex={1}
                        minW="150px"
                        textAlign="center"
                    >
                        <Text
                            fontSize="20px"
                            fontWeight="700"
                            color={COLORS.textPrimary}
                            mb={1}
                        >
                            2,500.00
                        </Text>
                        <Text fontSize="12px" color={COLORS.textTertiary}>
                            执行费用
                        </Text>
                    </Box>
                    <Box
                        bg={COLORS.bgPrimary}
                        p={6}
                        borderRadius="8px"
                        flex={1}
                        minW="150px"
                        textAlign="center"
                    >
                        <Text
                            fontSize="20px"
                            fontWeight="700"
                            color={COLORS.textPrimary}
                            mb={1}
                        >
                            1,500.00
                        </Text>
                        <Text fontSize="12px" color={COLORS.textTertiary}>
                            补充费用
                        </Text>
                    </Box>
                    <Box
                        bg={COLORS.bgPrimary}
                        p={6}
                        borderRadius="8px"
                        flex={1}
                        minW="150px"
                        textAlign="center"
                    >
                        <Text
                            fontSize="20px"
                            fontWeight="700"
                            color={COLORS.textPrimary}
                            mb={1}
                        >
                            1,200.00
                        </Text>
                        <Text fontSize="12px" color={COLORS.textTertiary}>
                            缺陷费用
                        </Text>
                    </Box>
                    <Box
                        bg={COLORS.bgPrimary}
                        p={6}
                        borderRadius="8px"
                        flex={1}
                        minW="150px"
                        textAlign="center"
                    >
                        <Text
                            fontSize="20px"
                            fontWeight="700"
                            color={COLORS.textPrimary}
                            mb={1}
                        >
                            800.00
                        </Text>
                        <Text fontSize="12px" color={COLORS.textTertiary}>
                            缺陷补登费用
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
                                        订单时间
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
                                        订单编号
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
                                        系统名称
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
                                        姓名
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
                                        执行费用
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
                                        缺陷费用
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
                                        建议费用
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
                                        补充费用
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
                                        缺陷补登费用
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
                                        订单状态
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
                                            {record.orderTime}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.orderNumber}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.systemName}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.name}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.executionFee}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.defectFee}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.suggestionFee}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.supplementFee}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.defectSupplementFee}
                                        </td>
                                        <td
                                            style={{
                                                fontSize: '14px',
                                                color: COLORS.textPrimary,
                                                borderBottom: `1px solid ${COLORS.borderColor}`,
                                                padding: '12px 16px',
                                            }}
                                        >
                                            {record.orderStatus}
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
