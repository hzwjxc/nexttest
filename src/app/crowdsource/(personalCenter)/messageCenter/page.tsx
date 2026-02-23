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
import { Tooltip } from "@chakra-ui/react"
import { NativeSelectRoot, NativeSelectField } from "@chakra-ui/react"
import { useState } from "react"
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"
import CrowdsourceNav from "../../_components/CrowdsourceNav"
import { useRouter } from 'next/navigation'
import { Switch } from "@/app/_components/ui/switch"
import { api } from "@/trpc/react"
import { format } from "date-fns"

export default function MessageCenter() {
    const [activeTab, setActiveTab] = useState("消息中心")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [showUnreadOnly, setShowUnreadOnly] = useState(false)

    const router = useRouter()

    // 获取消息中心数据
    const { data: messageData, isLoading } = api.announcement.getMessageList.useQuery({
        page: currentPage,
        pageSize,
        showUnreadOnly,
    })

    const messages = messageData?.data ?? []
    const totalItems = messageData?.pagination.total ?? 0
    const totalPages = messageData?.pagination.totalPages ?? 1

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

    const handleSidebarClick = (label: string) => {
        setActiveTab(label)
        if (label === "积分明细") {
            router.push('/crowdsource/pointsDetails')
        } else if (label === "设置") {
            router.push('/crowdsource/settings')
        } else if (label === "消息中心") {
            router.push('/crowdsource/messageCenter')
        } else if (label === "意见反馈") {
            router.push('/crowdsource/feedback')
        } else if (label === "关于我们") {
            router.push('/crowdsource/aboutUs')
        }
    }

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
                                    onClick={() => handleSidebarClick(item.label)}
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

                        {/* Message Center Content */}
                        <Box bg="white" borderRadius="8px" p={6}>
                            {/* Header with toggle */}
                            <Flex gap={10} align="center" mb={4}>
                                <Text fontSize="20px" fontWeight="500" color="#1D2129">
                                    消息中心
                                </Text>
                                <Flex align="center" gap={2}>
                                    <Switch
                                        checked={showUnreadOnly}
                                        onCheckedChange={(e) => {
                                            setShowUnreadOnly(e.checked)
                                            setCurrentPage(1) // Reset to first page when filter changes
                                        }}
                                        colorPalette="red"
                                    />
                                    <Text fontSize="14px" color="#4E5969">
                                        只显示未读
                                    </Text>
                                </Flex>
                            </Flex>

                            {/* Loading state */}
                            {isLoading && (
                                <Box py={8} textAlign="center">
                                    <Text color="#86909C">加载中...</Text>
                                </Box>
                            )}

                            {/* Messages Table */}
                            {!isLoading && (
                                <>
                                    <Box borderRadius="8px" overflow="hidden" mb={4}>
                                        <Table.Root size="sm" variant="outline">
                                            <Table.Header>
                                                <Table.Row bg="#F7F8FA">
                                                    <Table.ColumnHeader w="120px" px={4} py={3}>
                                                        <Text fontSize="14px" color="#86909C" fontWeight="400">序号</Text>
                                                    </Table.ColumnHeader>
                                                    <Table.ColumnHeader px={4} py={3}>
                                                        <Text fontSize="14px" color="#86909C" fontWeight="400">通知内容</Text>
                                                    </Table.ColumnHeader>
                                                    <Table.ColumnHeader px={4} py={3}>
                                                        <Text fontSize="14px" color="#86909C" fontWeight="400">时间</Text>
                                                    </Table.ColumnHeader>
                                                    <Table.ColumnHeader w="140px" px={4} py={3}>
                                                        <Text fontSize="14px" color="#86909C" fontWeight="400">类型</Text>
                                                    </Table.ColumnHeader>
                                                </Table.Row>
                                            </Table.Header>
                                            <Table.Body>
                                                {messages.map((item, index) => (
                                                    <Table.Row
                                                        key={item.id}
                                                        borderBottom="1px solid"
                                                        borderColor="#F2F3F5"
                                                        bg={!item.isRead ? "#FAFBFC" : "white"}
                                                        _hover={{ bg: "#F7F8FA" }}
                                                        cursor="pointer"
                                                    >
                                                        <Table.Cell px={4} py={3}>
                                                            <Text
                                                                fontSize="14px"
                                                                color={!item.isRead ? "#1D2129" : "#86909C"}
                                                            >
                                                                {(currentPage - 1) * pageSize + index + 1}
                                                            </Text>
                                                        </Table.Cell>
                                                        <Table.Cell px={4} py={3}>
                                                            <Tooltip.Root openDelay={300}>
                                                                <Tooltip.Trigger asChild>
                                                                    <Box>
                                                                        <Text
                                                                            fontSize="14px"
                                                                            color="#1D2129"
                                                                            fontWeight={!item.isRead ? "500" : "400"}
                                                                            dangerouslySetInnerHTML={{ __html: item.title }}
                                                                            cursor="pointer"
                                                                        />
                                                                    </Box>
                                                                </Tooltip.Trigger>
                                                                <Tooltip.Positioner>
                                                                    <Tooltip.Content
                                                                        maxW="500px"
                                                                        bg="white"
                                                                        color="#1D2129"
                                                                        borderRadius="8px"
                                                                        boxShadow="0 4px 12px rgba(0,0,0,0.15)"
                                                                        p={4}
                                                                        border="1px solid #E5E6EB"
                                                                    >
                                                                        <Box>
                                                                            <Text
                                                                                fontSize="14px"
                                                                                fontWeight="500"
                                                                                mb={2}
                                                                                dangerouslySetInnerHTML={{ __html: item.title }}
                                                                            />
                                                                            <Text
                                                                                fontSize="13px"
                                                                                color="#4E5969"
                                                                                lineHeight="1.6"
                                                                                dangerouslySetInnerHTML={{ __html: item.content }}
                                                                            />
                                                                        </Box>
                                                                    </Tooltip.Content>
                                                                </Tooltip.Positioner>
                                                            </Tooltip.Root>
                                                        </Table.Cell>
                                                        <Table.Cell px={4} py={3}>
                                                            <Text
                                                                fontSize="14px"
                                                                color={!item.isRead ? "#1D2129" : "#86909C"}
                                                            >
                                                                {format(new Date(item.createdAt), "yyyy-MM-dd HH:mm:ss")}
                                                            </Text>
                                                        </Table.Cell>
                                                        <Table.Cell px={4} py={3}>
                                                            <Text
                                                                fontSize="14px"
                                                                color={!item.isRead ? "#1D2129" : "#86909C"}
                                                            >
                                                                {item.type}
                                                            </Text>
                                                        </Table.Cell>
                                                    </Table.Row>
                                                ))}
                                                {messages.length === 0 && (
                                                    <Table.Row>
                                                        <Table.Cell colSpan={4} py={8} textAlign="center">
                                                            <Text color="#86909C">暂无消息</Text>
                                                        </Table.Cell>
                                                    </Table.Row>
                                                )}
                                            </Table.Body>
                                        </Table.Root>
                                    </Box>

                                    {/* Pagination */}
                                    {totalPages > 0 && (
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
                                    )}
                                </>
                            )}
                        </Box>
                    </Box>
                </Flex>
            </Container>
        </Box>
    )
}
