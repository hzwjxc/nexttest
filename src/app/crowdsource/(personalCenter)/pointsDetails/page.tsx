'use client'

import {
    Box,
    Container,
    Flex,
    Text,
    Button,
    Table,
    HStack,
    Image,
} from "@chakra-ui/react"
import { NativeSelectRoot, NativeSelectField } from "@chakra-ui/react"
import { useState } from "react"
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"
import CrowdsourceNav from "../../_components/CrowdsourceNav"
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';

export default function PointsDetails() {
    const [activeTab, setActiveTab] = useState("积分明细")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const router = useRouter();

    // 获取积分详情数据
    const { data: pointsData, isLoading } = api.user.getPointsDetails.useQuery({
        page: currentPage,
        pageSize: pageSize,
    });

    const userInfo = pointsData?.userInfo;
    const monthlyStats = pointsData?.monthlyStats;
    const transactions = pointsData?.transactions?.data || [];
    const pagination = pointsData?.transactions?.pagination;

    const totalItems = pagination?.total || 0;
    const totalPages = pagination?.totalPages || 1;

    // 格式化日期时间
    const formatDateTime = (date: Date | string) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hour = String(d.getHours()).padStart(2, '0');
        const minute = String(d.getMinutes()).padStart(2, '0');
        const second = String(d.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    };

    // Generate page numbers
    const getPageNumbers = () => {
        const pages: (number | string)[] = []
        const maxVisible = 5

        if (totalPages <= maxVisible + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            pages.push(1)

            if (currentPage > 3) {
                pages.push('...')
            }

            const start = Math.max(2, currentPage - 1)
            const end = Math.min(totalPages - 1, currentPage + 1)

            for (let i = start; i <= end; i++) {
                pages.push(i)
            }

            if (currentPage < totalPages - 2) {
                pages.push('...')
            }

            pages.push(totalPages)
        }

        return pages
    }

    const sidebarItems = [
        { label: "积分明细", icon: "📊" },
        { label: "设置", icon: "⚙️" },
        { label: "消息中心", icon: "💬" },
        { label: "意见反馈", icon: "📝" },
        { label: "关于我们", icon: "ℹ️" },
    ]

    return (
        <Box minH="100vh" bg="#F3F7FB">
            <CrowdsourceNav />

            <Container maxW="1400px" pt="80px" pb={6}>
                <Flex gap={6} align="flex-start">
                    {/* Left Sidebar */}
                    <Box
                        w="260px"
                        bg="white"
                        borderRadius="8px"
                        p={4}
                        flexShrink={0}
                    >
                        <Flex align="center" mb={4} pb={4} borderBottom="1px solid #F2F3F5">
                            <Box>
                                <Image
                                    src="/images/task-hall/avatar-big.png"
                                    alt="用户头像"
                                    w="48px"
                                    h="48px"
                                    borderRadius="50%"
                                    objectFit="cover"
                                />
                            </Box>
                            <Box ml={3}>
                                <Text fontSize="16px" fontWeight="500" color="#1D2129">
                                    个人中心
                                </Text>
                            </Box>
                        </Flex>

                        <Box>
                            {sidebarItems.map((item) => (
                                <Box
                                    key={item.label}
                                    px={3}
                                    py={2}
                                    mb={1}
                                    borderRadius="4px"
                                    bg={activeTab === item.label ? "#FEDFE1" : "transparent"}
                                    color={activeTab === item.label ? "#FE606B" : "#4E5969"}
                                    cursor="pointer"
                                    _hover={{ bg: activeTab === item.label ? "#FEDFE1" : "#F7F8FA" }}
                                    onClick={() => {
                                        setActiveTab(item.label)
                                        if (item.label === "积分明细") {
                                            router.push('/crowdsource/pointsDetails');
                                        } else if (item.label === "设置") {
                                            router.push('/crowdsource/settings');
                                        } else if (item.label === "消息中心") {
                                            router.push('/crowdsource/messageCenter');
                                        } else if (item.label === "意见反馈") {
                                            router.push('/crowdsource/feedback');
                                        } else if (item.label === "关于我们") {
                                            router.push('/crowdsource/aboutUs');
                                        }
                                    }}
                                >
                                    <Flex align="center">
                                        <Text fontSize="16px" mr={2}>{item.icon}</Text>
                                        <Text fontSize="14px" fontWeight={activeTab === item.label ? "500" : "400"}>
                                            {item.label}
                                        </Text>
                                    </Flex>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Right Content Area */}
                    <Box flex={1}>
                        {/* Breadcrumb */}
                        <Flex align="center" mb={4} fontSize="14px" color="#86909C">
                            <Text cursor="pointer" _hover={{ color: "#1D2129" }}>个人中心</Text>
                            <Text mx={2}>/</Text>
                            <Text color="#1D2129">{activeTab}</Text>
                        </Flex>

                        {isLoading ? (
                            <Box textAlign="center" py={8}>
                                <Text color="#86909C">加载中...</Text>
                            </Box>
                        ) : (
                            <>
                                {/* User Info Card */}
                                <Box
                                    bg="linear-gradient(135deg, #E8E3FF 0%, #F0EAFF 100%)"
                                    borderRadius="8px"
                                    p={6}
                                    mb={4}
                                    position="relative"
                                    overflow="hidden"
                                >
                                    <Flex justify="space-between" align="center">
                                        <Flex align="center" gap={4}>
                                            <Box>
                                                <Image
                                                    src="/images/task-hall/avatar-big.png"
                                                    alt="用户头像"
                                                    w="72px"
                                                    h="72px"
                                                    borderRadius="50%"
                                                    objectFit="cover"
                                                />
                                            </Box>
                                            <Box>
                                                <Flex align="center" gap={2} mb={1}>
                                                    <Text fontSize="20px" fontWeight="500" color="#1D2129">
                                                        {userInfo?.userName || '用户昵称'}
                                                    </Text>
                                                    <Flex
                                                        align="center"
                                                        bg="linear-gradient(90deg, #FFD700 0%, #FFA500 100%)"
                                                        px={2}
                                                        py={0.5}
                                                        borderRadius="12px"
                                                        fontSize="12px"
                                                        fontWeight="500"
                                                        color="#fff"
                                                    >
                                                        <Text>✓</Text>
                                                        <Text ml={1}>LV.{userInfo?.level || 1}</Text>
                                                    </Flex>
                                                </Flex>
                                                <Text fontSize="14px" color="#4E5969">
                                                    {userInfo?.levelName || '注册新人'}
                                                </Text>
                                            </Box>
                                        </Flex>

                                        <Flex gap={12}>
                                            <Box textAlign="center">
                                                <Flex align="center" justify="center" mb={1}>
                                                    <Text fontSize="28px" fontWeight="600" color="#1D2129">
                                                        {userInfo?.availablePoints || 0}
                                                    </Text>
                                                    <Image ml={1} src="/images/task-hall/jinbi.png" alt="金币" />
                                                </Flex>
                                                <Text fontSize="14px" color="#86909C">
                                                    可兑换积分
                                                </Text>
                                            </Box>
                                            <Box textAlign="center">
                                                <Flex align="center" justify="center" mb={1}>
                                                    <Text fontSize="28px" fontWeight="600" color="#1D2129">
                                                        {userInfo?.totalPoints || 0}
                                                    </Text>
                                                    <Image ml={1} src="/images/task-hall/jinbi.png" alt="金币" />
                                                </Flex>
                                                <Text fontSize="14px" color="#86909C">
                                                    累计积分
                                                </Text>
                                            </Box>
                                        </Flex>

                                        {/* Decorative coin image */}
                                        <Box>
                                            <Image
                                                src="/images/personalCenter/point-icon.png"
                                                alt="金币"
                                                w="120px"
                                                h="120px"
                                                objectFit="contain"
                                            />
                                        </Box>
                                    </Flex>
                                </Box>

                                {/* Points Summary */}
                                <Box bg="white" borderRadius="8px" p={4} mb={4}>
                                    <Flex align="center" gap={2} mb={3}>
                                        <Text fontSize="16px" fontWeight="500" color="#1D2129">
                                            本月获取
                                        </Text>
                                        <Text fontSize="20px" fontWeight="600" color="#FE606B">
                                            {monthlyStats?.currentMonthPoints || 0}
                                        </Text>
                                        <Image ml={1} src="/images/task-hall/jinbi.png" alt="金币" />
                                        <Text fontSize="14px" color="#86909C" ml={2}>
                                            已兑换
                                        </Text>
                                        <Text fontSize="16px" fontWeight="500" color="#1D2129">
                                            {monthlyStats?.exchangedPoints || 0}
                                        </Text>
                                        <Image ml={1} src="/images/task-hall/jinbi.png" alt="金币" />
                                    </Flex>
                                    <Text fontSize="12px" color="#86909C">
                                        每月1、15日平台会自动申请积分
                                        <Text
                                            as="span"
                                            color="#FE606B"
                                            cursor="pointer"
                                            ml={1}
                                            _hover={{ textDecoration: "underline" }}
                                        >
                                            积分规则 →
                                        </Text>
                                    </Text>
                                </Box>

                                {/* Points History Table */}
                                <Box bg="white" borderRadius="8px" overflow="hidden">
                                    <Table.Root size="sm" variant="outline">
                                        <Table.Header>
                                            <Table.Row bg="#F7F8FA">
                                                <Table.ColumnHeader w="120px" px={4} py={3}>
                                                    <Text fontSize="14px" color="#86909C" fontWeight="400">序号</Text>
                                                </Table.ColumnHeader>
                                                <Table.ColumnHeader px={4} py={3}>
                                                    <Text fontSize="14px" color="#86909C" fontWeight="400">名称</Text>
                                                </Table.ColumnHeader>
                                                <Table.ColumnHeader px={4} py={3}>
                                                    <Text fontSize="14px" color="#86909C" fontWeight="400">时间</Text>
                                                </Table.ColumnHeader>
                                                <Table.ColumnHeader w="140px" px={4} py={3} textAlign="right">
                                                    <Text fontSize="14px" color="#86909C" fontWeight="400">积分</Text>
                                                </Table.ColumnHeader>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            {transactions.length > 0 ? (
                                                transactions.map((item: any, index: number) => (
                                                    <Table.Row
                                                        key={item.id}
                                                        borderBottom="1px solid"
                                                        borderColor="#F2F3F5"
                                                        _hover={{ bg: "#FAFBFC" }}
                                                    >
                                                        <Table.Cell px={4} py={3}>
                                                            <Text fontSize="14px" color="#1D2129">
                                                                {(currentPage - 1) * pageSize + index + 1}
                                                            </Text>
                                                        </Table.Cell>
                                                        <Table.Cell px={4} py={3}>
                                                            <Text fontSize="14px" color="#1D2129">{item.name}</Text>
                                                        </Table.Cell>
                                                        <Table.Cell px={4} py={3}>
                                                            <Text fontSize="14px" color="#1D2129">
                                                                {formatDateTime(item.time)}
                                                            </Text>
                                                        </Table.Cell>
                                                        <Table.Cell px={4} py={3} textAlign="right">
                                                            <Text
                                                                fontSize="14px"
                                                                fontWeight="500"
                                                                color={item.points > 0 ? "#00B42A" : "#F53F3F"}
                                                            >
                                                                {item.points > 0 ? '+' : ''}{item.points}
                                                            </Text>
                                                        </Table.Cell>
                                                    </Table.Row>
                                                ))
                                            ) : (
                                                <Table.Row>
                                                    <Table.Cell colSpan={4} textAlign="center" py={8}>
                                                        <Text color="#86909C">暂无积分记录</Text>
                                                    </Table.Cell>
                                                </Table.Row>
                                            )}
                                        </Table.Body>
                                    </Table.Root>
                                </Box>

                                {/* Pagination */}
                                {totalItems > 0 && (
                                    <Box bg="white" borderRadius="8px" p={4} mt={4}>
                                        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                                            <Text fontSize="14px" color="#86909C">
                                                共{totalItems}条
                                            </Text>

                                            <HStack gap={1}>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    p={0}
                                                    minW="32px"
                                                    h="32px"
                                                    color="#C9CDD4"
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage(currentPage - 1)}
                                                    _hover={{ bg: "transparent" }}
                                                >
                                                    <LuChevronLeft size={16} />
                                                </Button>

                                                {getPageNumbers().map((page, index) => {
                                                    if (page === '...') {
                                                        return (
                                                            <Text key={`ellipsis-${index}`} px={2} color="#86909C" fontSize="14px">
                                                                ...
                                                            </Text>
                                                        )
                                                    }

                                                    return (
                                                        <Button
                                                            key={page}
                                                            size="sm"
                                                            minW="32px"
                                                            h="32px"
                                                            p={0}
                                                            bg={currentPage === page ? "#FEDFE1" : "transparent"}
                                                            color={currentPage === page ? "#FE606B" : "#1D2129"}
                                                            border={currentPage === page ? "1px solid #FE606B" : "1px solid #E5E6EB"}
                                                            borderRadius="4px"
                                                            fontSize="14px"
                                                            fontWeight="400"
                                                            _hover={{
                                                                bg: currentPage === page ? "#FEDFE1" : "#F2F3F5",
                                                            }}
                                                            onClick={() => setCurrentPage(page as number)}
                                                        >
                                                            {page}
                                                        </Button>
                                                    )
                                                })}

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    p={0}
                                                    minW="32px"
                                                    h="32px"
                                                    color="#C9CDD4"
                                                    disabled={currentPage === totalPages}
                                                    onClick={() => setCurrentPage(currentPage + 1)}
                                                    _hover={{ bg: "transparent" }}
                                                >
                                                    <LuChevronRight size={16} />
                                                </Button>
                                            </HStack>

                                            <HStack gap={2}>
                                                <NativeSelectRoot size="sm" w="100px">
                                                    <NativeSelectField
                                                        value={pageSize}
                                                        onChange={(e) => {
                                                            setPageSize(parseInt(e.target.value))
                                                            setCurrentPage(1)
                                                        }}
                                                        borderColor="#E5E6EB"
                                                        borderRadius="4px"
                                                        fontSize="14px"
                                                        color="#1D2129"
                                                    >
                                                        <option value={10}>10条/页</option>
                                                        <option value={20}>20条/页</option>
                                                        <option value={50}>50条/页</option>
                                                    </NativeSelectField>
                                                </NativeSelectRoot>
                                            </HStack>
                                        </Flex>
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                </Flex>
            </Container>
        </Box>
    )
}
