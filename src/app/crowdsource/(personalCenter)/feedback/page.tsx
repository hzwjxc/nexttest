'use client'

import {
    Box,
    Container,
    Flex,
    Text,
    Button,
    Textarea,
    Image,
    HStack,
} from "@chakra-ui/react"
import { NativeSelectRoot, NativeSelectField } from "@chakra-ui/react"
import { useState, useRef } from "react"
import { LuChevronLeft, LuChevronRight, LuX, LuUpload, LuDownload } from "react-icons/lu"
import CrowdsourceNav from "../../_components/CrowdsourceNav"
import { useRouter } from 'next/navigation'
import { api } from "@/trpc/react"
import { toaster } from "@/app/_components/ui/toaster"

export default function Feedback() {
    const [activeTab, setActiveTab] = useState("意见反馈")
    const [feedbackTab, setFeedbackTab] = useState("意见反馈")
    const [feedbackContent, setFeedbackContent] = useState("")
    const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; type: string }>>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [previewMedia, setPreviewMedia] = useState<{ url: string; type: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const router = useRouter()

    // API 调用
    const { data: feedbackData, isLoading } = api.feedback.getMyFeedbacks.useQuery(
        { page: currentPage, pageSize },
        { enabled: feedbackTab === "我的历史反馈" }
    )

    const utils = api.useUtils()

    const createFeedback = api.feedback.create.useMutation({
        onSuccess: () => {
            toaster.create({
                title: "提交成功",
                description: "您的反馈已成功提交",
                type: "success",
            })
            setFeedbackContent("")
            setUploadedImages([])
            // 使历史反馈查询缓存失效，以便重新获取最新数据
            void utils.feedback.getMyFeedbacks.invalidate()
        },
        onError: (error) => {
            toaster.create({
                title: "提交失败",
                description: error.message,
                type: "error",
            })
        },
    })

    const uploadAttachment = api.feedback.uploadAttachment.useMutation({
        onError: (error) => {
            toaster.create({
                title: "上传失败",
                description: error.message,
                type: "error",
            })
        },
    })

    const totalItems = feedbackData?.total ?? 0
    const totalPages = feedbackData?.totalPages ?? 0
    const currentData = feedbackData?.data ?? []

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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            const fileArray = Array.from(files)

            fileArray.forEach((file) => {
                // 检查文件大小（10MB 限制）
                const fileSizeInMB = file.size / (1024 * 1024)
                if (fileSizeInMB > 10) {
                    toaster.create({
                        title: "文件太大",
                        description: `${file.name} (${fileSizeInMB.toFixed(2)}MB) 超过 10MB 限制`,
                        type: "error",
                    })
                    return
                }

                const reader = new FileReader()
                reader.onloadend = async () => {
                    const base64String = reader.result as string

                    // 调用上传 API
                    try {
                        const result = await uploadAttachment.mutateAsync({
                            fileName: file.name,
                            fileType: file.type,
                            fileData: base64String,
                        })

                        // 上传成功后，添加到列表中
                        if (result.success) {
                            setUploadedImages(prev => [...prev, {
                                url: result.fileUrl,
                                type: file.type
                            }])
                        }
                    } catch (error) {
                        console.error('Upload failed:', error)
                    }
                }
                reader.readAsDataURL(file)
            })
        }
        // Reset the input value to allow uploading the same file again
        e.target.value = ''
    }

    const handleRemoveImage = (index: number) => {
        setUploadedImages(uploadedImages.filter((_, i) => i !== index))
    }

    const handleSubmit = () => {
        if (!feedbackContent.trim()) {
            toaster.create({
                title: "提示",
                description: "请输入反馈内容",
                type: "warning",
            })
            return
        }

        createFeedback.mutate({
            content: feedbackContent,
            attachments: uploadedImages.map(img => img.url),
        })
    }

    const handleDownloadAll = (attachments: Array<{ url: string; type: string }>) => {
        console.log('Downloading all attachments:', attachments)
        // Add download logic here
        attachments.forEach((attachment, index) => {
            const link = document.createElement('a')
            link.href = attachment.url
            link.download = `attachment-${index + 1}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        })
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

                        {/* Feedback Content */}
                        <Box bg="white" borderRadius="8px" p={6}>
                            {/* Tab Headers */}
                            <Flex gap={8} mb={6} borderBottom="2px solid #F2F3F5">
                                <Box
                                    pb={3}
                                    borderBottom={feedbackTab === "意见反馈" ? "2px solid #FE606B" : "2px solid transparent"}
                                    cursor="pointer"
                                    onClick={() => setFeedbackTab("意见反馈")}
                                >
                                    <Text
                                        fontSize="16px"
                                        fontWeight="500"
                                        color={feedbackTab === "意见反馈" ? "#FE606B" : "#4E5969"}
                                    >
                                        意见反馈
                                    </Text>
                                </Box>
                                <Box
                                    pb={3}
                                    borderBottom={feedbackTab === "我的历史反馈" ? "2px solid #FE606B" : "2px solid transparent"}
                                    cursor="pointer"
                                    onClick={() => setFeedbackTab("我的历史反馈")}
                                >
                                    <Text
                                        fontSize="16px"
                                        fontWeight="500"
                                        color={feedbackTab === "我的历史反馈" ? "#FE606B" : "#4E5969"}
                                    >
                                        我的历史反馈
                                    </Text>
                                </Box>
                            </Flex>

                            {/* Tab Content */}
                            {feedbackTab === "意见反馈" ? (
                                <Box>
                                    {/* Feedback Form */}
                                    <Box mb={6}>
                                        <Flex align="center" mb={2}>
                                            <Text fontSize="14px" color="#F53F3F" mr={1}>*</Text>
                                            <Text fontSize="14px" color="#1D2129">反馈内容</Text>
                                        </Flex>
                                        <Textarea
                                            value={feedbackContent}
                                            onChange={(e) => setFeedbackContent(e.target.value)}
                                            placeholder="请输入反馈内容"
                                            bg="#F7F8FA"
                                            border="none"
                                            borderRadius="4px"
                                            fontSize="14px"
                                            color="#1D2129"
                                            minH="200px"
                                            resize="vertical"
                                            _placeholder={{ color: "#C9CDD4" }}
                                            _focus={{ bg: "#F7F8FA", outline: "none" }}
                                        />
                                    </Box>

                                    {/* Image Upload Section */}
                                    <Box mb={6}>
                                        <Flex align="center" gap={3} mb={3} flexWrap="wrap">
                                            <Box
                                                w="120px"
                                                h="120px"
                                                border="2px dashed #E5E6EB"
                                                borderRadius="4px"
                                                display="flex"
                                                flexDirection="column"
                                                alignItems="center"
                                                justifyContent="center"
                                                cursor={uploadAttachment.isPending ? "not-allowed" : "pointer"}
                                                bg="#FAFBFC"
                                                _hover={{ borderColor: "#FE606B", bg: "#FFF5F6" }}
                                                onClick={() => !uploadAttachment.isPending && fileInputRef.current?.click()}
                                                opacity={uploadAttachment.isPending ? 0.6 : 1}
                                            >
                                                <LuUpload size={24} color="#86909C" />
                                                <Text fontSize="12px" color="#86909C" mt={2}>
                                                    {uploadAttachment.isPending ? "上传中..." : "上传图片或视频"}
                                                </Text>
                                            </Box>

                                            {uploadedImages.map((media, index) => (
                                                <Box
                                                    key={index}
                                                    position="relative"
                                                    w="120px"
                                                    h="120px"
                                                    borderRadius="4px"
                                                    overflow="hidden"
                                                >
                                                    {media.type.startsWith('video/') ? (
                                                        <video
                                                            src={media.url}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover'
                                                            }}
                                                            controls
                                                        />
                                                    ) : (
                                                        <Image
                                                            src={media.url}
                                                            alt={`Uploaded ${index + 1}`}
                                                            w="100%"
                                                            h="100%"
                                                            objectFit="cover"
                                                        />
                                                    )}
                                                    <Box
                                                        position="absolute"
                                                        top={1}
                                                        right={1}
                                                        w="20px"
                                                        h="20px"
                                                        bg="rgba(0, 0, 0, 0.6)"
                                                        borderRadius="50%"
                                                        display="flex"
                                                        alignItems="center"
                                                        justifyContent="center"
                                                        cursor="pointer"
                                                        _hover={{ bg: "rgba(0, 0, 0, 0.8)" }}
                                                        onClick={() => handleRemoveImage(index)}
                                                    >
                                                        <LuX size={14} color="white" />
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Flex>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*,video/*"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={handleImageUpload}
                                        />
                                    </Box>

                                    {/* Submit Button */}
                                    <Flex justify="flex-start">
                                        <Button
                                            bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                                            color="white"
                                            borderRadius="999px"
                                            px={8}
                                            h="40px"
                                            fontSize="14px"
                                            fontWeight="400"
                                            _hover={{ opacity: 0.9 }}
                                            onClick={handleSubmit}
                                        >
                                            提交
                                        </Button>
                                    </Flex>
                                </Box>
                            ) : (
                                <Box>
                                    {/* Feedback History */}
                                    {isLoading ? (
                                        <Flex justify="center" align="center" minH="200px">
                                            <Text color="#86909C">加载中...</Text>
                                        </Flex>
                                    ) : currentData.length === 0 ? (
                                        <Flex justify="center" align="center" minH="200px">
                                            <Text color="#86909C">暂无反馈记录</Text>
                                        </Flex>
                                    ) : (
                                        <>
                                            {currentData.map((feedback) => (
                                                <Box
                                                    key={feedback.id}
                                                    bg="#F7F8FA"
                                                    borderRadius="4px"
                                                    p={4}
                                                    mb={4}
                                                >
                                                    <Text fontSize="14px" color="#4E5969" mb={3}>
                                                        反馈日期: {new Date(feedback.createdAt).toLocaleDateString('zh-CN', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </Text>
                                                    <Text fontSize="14px" color="#1D2129" mb={3}>
                                                        反馈内容: {feedback.content}
                                                    </Text>
                                                    {feedback.attachments && feedback.attachments.length > 0 && (
                                                        <Box>
                                                            <Flex w={515} align="center" justify="space-between" mb={2}>
                                                                <Text fontSize="14px" color="#4E5969">附件:</Text>
                                                                <Flex
                                                                    align="center"
                                                                    gap={1}
                                                                    cursor="pointer"
                                                                    _hover={{ color: "#FE606B" }}
                                                                    onClick={() => handleDownloadAll(feedback.attachments.map((url) => ({
                                                                        url,
                                                                        type: url.includes('.mp4') ? 'video/mp4' : 'image/jpeg'
                                                                    })))}
                                                                >
                                                                    <LuDownload size={14} color="#86909C" />
                                                                    <Text fontSize="12px" color="#86909C">
                                                                        全部下载
                                                                    </Text>
                                                                </Flex>
                                                            </Flex>
                                                            <Flex gap={3} flexWrap="wrap">
                                                                {feedback.attachments.map((url, index) => {
                                                                    const isVideo = url.includes('.mp4') || url.includes('video')
                                                                    const attachment = { url, type: isVideo ? 'video/mp4' : 'image/jpeg' }
                                                                    return (
                                                                        <Box
                                                                            key={index}
                                                                            w="120px"
                                                                            h="120px"
                                                                            borderRadius="4px"
                                                                            overflow="hidden"
                                                                            position="relative"
                                                                            cursor="pointer"
                                                                            onClick={() => setPreviewMedia(attachment)}
                                                                        >
                                                                            {isVideo ? (
                                                                                <Box position="relative" w="100%" h="100%">
                                                                                    <video
                                                                                        src={url}
                                                                                        style={{
                                                                                            width: '100%',
                                                                                            height: '100%',
                                                                                            objectFit: 'cover'
                                                                                        }}
                                                                                    />
                                                                                    <Box
                                                                                        position="absolute"
                                                                                        top={0}
                                                                                        left={0}
                                                                                        w="100%"
                                                                                        h="100%"
                                                                                        bg="rgba(0, 0, 0, 0.3)"
                                                                                        display="flex"
                                                                                        alignItems="center"
                                                                                        justifyContent="center"
                                                                                    >
                                                                                        <Box
                                                                                            w="40px"
                                                                                            h="40px"
                                                                                            borderRadius="50%"
                                                                                            bg="rgba(255, 255, 255, 0.9)"
                                                                                            display="flex"
                                                                                            alignItems="center"
                                                                                            justifyContent="center"
                                                                                        >
                                                                                            <Box
                                                                                                w="0"
                                                                                                h="0"
                                                                                                borderLeft="12px solid #1D2129"
                                                                                                borderTop="8px solid transparent"
                                                                                                borderBottom="8px solid transparent"
                                                                                                ml="4px"
                                                                                            />
                                                                                        </Box>
                                                                                    </Box>
                                                                                </Box>
                                                                            ) : (
                                                                                <Image
                                                                                    src={url}
                                                                                    alt={`Feedback attachment ${index + 1}`}
                                                                                    w="100%"
                                                                                    h="100%"
                                                                                    objectFit="cover"
                                                                                />
                                                                            )}
                                                                        </Box>
                                                                    )
                                                                })}
                                                            </Flex>
                                                        </Box>
                                                    )}
                                                </Box>
                                            ))}

                                        </>
                                    )}

                                    {/* Pagination - 只在有数据时显示 */}
                                    {!isLoading && currentData.length > 0 && (
                                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={4} mt={6}>
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

                                            <Text fontSize="14px" color="#86909C" mx={2}>
                                                ...
                                            </Text>

                                            <Button
                                                size="sm"
                                                minW="48px"
                                                h="32px"
                                                p={0}
                                                bg="transparent"
                                                color="#1D2129"
                                                border="1px solid #E5E6EB"
                                                borderRadius="4px"
                                                fontSize="14px"
                                                fontWeight="400"
                                                onClick={() => {
                                                    if (totalPages > 0) {
                                                        setCurrentPage(totalPages)
                                                    }
                                                }}
                                            >
                                                20
                                            </Button>

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

                                            <Text fontSize="14px" color="#86909C">
                                                前往
                                            </Text>
                                        </HStack>
                                    </Flex>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Flex>
            </Container>

            {/* Preview Modal */}
            {previewMedia && (
                <Box
                    position="fixed"
                    top={0}
                    left={0}
                    w="100vw"
                    h="100vh"
                    bg="rgba(0, 0, 0, 0.9)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    zIndex={9999}
                    onClick={() => setPreviewMedia(null)}
                >
                    <Box
                        position="absolute"
                        top={4}
                        right={4}
                        cursor="pointer"
                        color="white"
                        fontSize="32px"
                        _hover={{ color: "#FE606B" }}
                        onClick={() => setPreviewMedia(null)}
                    >
                        <LuX size={32} />
                    </Box>
                    <Box
                        maxW="90vw"
                        maxH="90vh"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {previewMedia.type.startsWith('video/') ? (
                            <video
                                src={previewMedia.url}
                                controls
                                autoPlay
                                style={{
                                    maxWidth: '90vw',
                                    maxHeight: '90vh',
                                    width: 'auto',
                                    height: 'auto'
                                }}
                            />
                        ) : (
                            <Image
                                src={previewMedia.url}
                                alt="Preview"
                                maxW="90vw"
                                maxH="90vh"
                                objectFit="contain"
                            />
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    )
}
