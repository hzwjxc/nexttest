"use client"

import {
    Box,
    Flex,
    Text,
    Checkbox,
    Button,
    Image,
    Grid,
    GridItem,
    Icon,
    Link,
    HStack,
    VStack,
    useDisclosure,
    Center,
    DialogRoot,
    DialogBackdrop,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogCloseTrigger,
} from "@chakra-ui/react"
import { Download, Edit, Trash2, Bug, Play } from "lucide-react"
import { LuX } from 'react-icons/lu'
import { useState } from "react";

interface Attachment {
    id: string
    url: string
    isVideo?: boolean
}

interface DefectCardProps {
    index: number
    defectId: string
    score: number
    relatedCount: number
    title: string
    description: string
    attachments: Attachment[]
    relatedSteps: string[]
    reviewComment?: string
    additionalNote?: string
    submittedAt: string
    isSaved?: boolean
    // 新增属性
    status?: string
    type?: 'BUG' | 'SUGGESTION'
    severity?: string | null
    suggestionLevel?: string | null
    earnedPoints?: number
    onEdit?: () => void
    onDelete?: () => void
    onDownloadAll?: () => void
    onAssociateDuplicate?: () => void
    // 用例步骤信息
    testCaseSteps?: Array<{
        title: string;
        description: string;
        expectedResult: string;
    }>;
}

// 缺陷状态映射
const severityMap: Record<string, string> = {
    'CRITICAL': '致命',
    'MAJOR': '严重',
    'MINOR': '一般',
    'TRIVIAL': '轻微',
    'INVALID': '无效',
};

// 建议等级映射
const suggestionLevelMap: Record<string, string> = {
    'EXCELLENT_SPECIAL': '特别优秀',
    'EXCELLENT': '优秀',
    'VALID': '有效',
    'INVALID': '无效',
};

export function DefectCard({
    index,
    defectId,
    score,
    relatedCount,
    title,
    description,
    attachments,
    relatedSteps,
    reviewComment = "",
    additionalNote = "",
    submittedAt,
    isSaved = true,
    // 新增属性
    status,
    type = 'BUG',
    severity,
    suggestionLevel,
    earnedPoints,
    onEdit,
    onDelete,
    onDownloadAll,
    onAssociateDuplicate,
    testCaseSteps = [],
}: DefectCardProps) {
    const [previewUrl, setPreviewUrl] = useState("");
    const [previewType, setPreviewType] = useState<"image" | "video" | null>(null);
    const { open: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();

    const { open: isStepsOpen, onOpen: onStepsOpen, onClose: onStepsClose } = useDisclosure();



    // 获取显示等级
    const getDisplayLevel = () => {
        // 如果状态是已驳回(REJECTED)，显示"无效"
        if (status === 'REJECTED') {
            return '无效';
        }
        // 如果状态是重复(DUPLICATE)，显示"重复"
        if (status === 'DUPLICATE') {
            return '重复';
        }
        // 如果状态是已关闭(CLOSED)，显示"已关闭"
        if (status === 'CLOSED') {
            return '已关闭';
        }
        if (type === 'BUG' && severity) {
            return severityMap[severity] || severity;
        } else if (type === 'SUGGESTION' && suggestionLevel) {
            return suggestionLevelMap[suggestionLevel] || suggestionLevel;
        }
        return null;
    };

    // 判断是否已判定（有等级、状态为已驳回/无效/重复/关闭）
    const isJudged = () => {
        // 如果状态是已驳回(REJECTED)、重复(DUPLICATE)或已关闭(CLOSED)，认为已判定
        if (status === 'REJECTED' || status === 'DUPLICATE' || status === 'CLOSED') {
            return true;
        }
        // 如果有等级，认为已判定
        if (type === 'BUG') {
            return !!severity;
        } else if (type === 'SUGGESTION') {
            return !!suggestionLevel;
        }
        return false;
    };

    // 判断是否可以编辑/删除
    const canEdit = () => {
        // 已判定状态不能编辑（优先判断）
        if (isJudged()) return false;
        // 草稿状态可以编辑
        if (!isSaved) return true;
        return false;
    };

    const displayLevel = getDisplayLevel();

    const handlePreview = (attachment: Attachment) => {
        setPreviewUrl(attachment.url);
        setPreviewType(attachment.isVideo ? "video" : "image");
        onPreviewOpen();
    };

    return (
        <Box bg="white" borderRadius="lg" boxShadow="sm" p={6}>
            {/* Header */}
            <Flex
                align="center"
                justify="space-between"
                px={4}
                py={3}
                borderBottom="1px solid"
                borderColor="gray.100"
            >
                <HStack gap={12}>
                    <Checkbox.Root>
                        <Checkbox.HiddenInput />
                        <Checkbox.Control
                            borderColor="gray.300"
                            borderRadius="sm"
                            width="18px"
                            height="18px"
                        />
                    </Checkbox.Root>

                    <Text fontSize="sm" color="gray.700" fontWeight="medium">
                        {index}
                    </Text>

                    <Text fontSize="sm" color="gray.700">
                        {defectId}
                    </Text>

                    <HStack gap={1}>
                        <Text fontSize="sm" color="gray.600">
                            缺陷/建议积分：
                        </Text>
                        <Text fontSize="sm" color="gray.800" fontWeight="medium">
                            {earnedPoints ?? score}
                        </Text>
                        <Image src="/images/task-hall/jinbi.png"></Image>
                    </HStack>

                    <HStack gap={1}>
                        <Link
                            fontSize="sm"
                            color="#E31424"
                            textDecoration="none"
                            _hover={{ textDecoration: "underline" }}
                            cursor="pointer"
                            onClick={onAssociateDuplicate}
                        >
                            关联重复：{relatedCount}
                        </Link>
                    </HStack>

                    <HStack gap={1}>
                        <Icon color={type === 'BUG' ? '#165DFF' : '#00B42A'}>
                            <Bug size={16} />
                        </Icon>
                        <Text fontSize="sm" color="gray.700">
                            {type === 'BUG' ? '缺陷' : '建议'}
                        </Text>
                    </HStack>
                </HStack>

                <HStack gap={2}>
                    {/* 显示等级按钮（已判定状态下） */}
                    {displayLevel ? (
                        <Button
                            size="sm"
                            bg={type === 'SUGGESTION' ? '#DEF3ED' : '#ecf2ff'}
                            color={type === 'SUGGESTION' ? '#3AB385' : '#2067f6'}
                            fontWeight="medium"
                            borderRadius="md"
                            px={4}
                            border={type === 'SUGGESTION' ? 'none' : '1px solid'}
                            borderColor={type === 'SUGGESTION' ? 'transparent' : '#2067f6'}
                            _hover={{ bg: type === 'SUGGESTION' ? '#c8e9de' : '#dce7ff' }}
                        >
                            {displayLevel}
                        </Button>
                    ) : (
                        /* 已提交但没有等级时显示已保存按钮（仅未判定状态下） */
                        isSaved && !isJudged() && (
                            <Button
                                size="sm"
                                bg="#ecf2ff"
                                color="#2067f6"
                                fontWeight="medium"
                                borderRadius="md"
                                px={4}
                                _hover={{ bg: "#dce7ff" }}
                            >
                                已保存
                            </Button>
                        )
                    )}

                    {/* 草稿状态显示编辑和删除按钮，已判定状态不显示 */}
                    {canEdit() && (
                        <>
                            <Button
                                size="sm"
                                variant="ghost"
                                color="#2067f6"
                                fontWeight="normal"
                                _hover={{ bg: "gray.100" }}
                                onClick={onEdit}
                            >
                                <Icon mr={1}>
                                    <Edit size={14} />
                                </Icon>
                                编辑
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                color="gray.600"
                                fontWeight="normal"
                                _hover={{ bg: "gray.100" }}
                                onClick={onDelete}
                            >
                                <Icon mr={1} color="#F53F3F">
                                    <Trash2 size={14} />
                                </Icon>
                                删除
                            </Button>
                        </>
                    )}
                </HStack>
            </Flex>

            {/* Content */}
            <Grid templateColumns="10fr 0.1fr 10fr" gap={2} p={6}>
                {/* Left Column */}
                <GridItem>
                    <VStack align="stretch" gap={4}>
                        {/* Title */}
                        <HStack align="start">
                            <Text fontSize="sm" color="gray.600" flexShrink={0}>
                                标题：
                            </Text>
                            <Text fontSize="sm" color="gray.800">
                                {title}
                            </Text>
                        </HStack>

                        {/* Description */}
                        <HStack align="start">
                            <Text fontSize="sm" color="gray.600" flexShrink={0}>
                                描述：
                            </Text>
                            <Text fontSize="sm" color="gray.800" lineHeight="1.8">
                                {description}
                            </Text>
                        </HStack>

                        {/* Attachments */}
                        <Box>
                            <Flex justify="space-between" align="center" mb={3}>
                                <Text fontSize="sm" color="gray.600">
                                    附件：
                                </Text>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    color="gray.600"
                                    fontWeight="normal"
                                    _hover={{ bg: "gray.100" }}
                                    onClick={onDownloadAll}
                                >
                                    <Icon mr={1}>
                                        <Download size={14} />
                                    </Icon>
                                    全部下载
                                </Button>
                            </Flex>

                            <Flex gap={3} flexWrap="wrap">
                                {attachments.map((attachment) => (
                                    <Box
                                        key={attachment.id}
                                        position="relative"
                                        width="100px"
                                        height="100px"
                                        borderRadius="md"
                                        overflow="hidden"
                                        cursor="pointer"
                                        _hover={{ opacity: 0.9 }}
                                        onClick={() => handlePreview(attachment)}
                                    >
                                        {attachment.isVideo ? (
                                            <video
                                                src={attachment.url || "/placeholder.svg"}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <Image
                                                src={attachment.url || "/placeholder.svg"}
                                                alt="attachment"
                                                width="100%"
                                                height="100%"
                                                objectFit="cover"
                                            />
                                        )}

                                        {attachment.isVideo && (
                                            <Flex
                                                position="absolute"
                                                top="0"
                                                left="0"
                                                right="0"
                                                bottom="0"
                                                align="center"
                                                justify="center"
                                                bg="blackAlpha.400"
                                            >
                                                <Flex
                                                    align="center"
                                                    justify="center"
                                                    bg="white"
                                                    borderRadius="full"
                                                    width="32px"
                                                    height="32px"
                                                >
                                                    <Icon color="gray.700">
                                                        <Play size={16} fill="currentColor" />
                                                    </Icon>
                                                </Flex>
                                            </Flex>
                                        )}
                                    </Box>
                                ))}
                            </Flex>
                        </Box>
                    </VStack>
                </GridItem>
                <div style={{ margin: "16px 0", borderLeft: "1px dashed #e5e6eb" }}></div>
                {/* Right Column */}
                <GridItem>
                    <VStack align="stretch" gap={4}>
                        {/* Related Steps */}
                        <HStack align="start">
                            <Text fontSize="sm" color="gray.600" flexShrink={0}>
                                关联步骤：
                            </Text>
                            <HStack gap={2} flexWrap="wrap">
                                {relatedSteps.slice(0, 3).map((step, idx) => (
                                    <Text key={idx} fontSize="sm" color="gray.800">
                                        {step}
                                        {idx < relatedSteps.length - 1 && "、"}
                                    </Text>
                                ))}

                                {relatedSteps.length > 3 && (
                                    <>
                                        <Text fontSize="sm" color="gray.800">
                                            等{relatedSteps.length}个步骤
                                        </Text>
                                        <Link
                                            fontSize="sm"
                                            color="#2067f6"
                                            textDecoration="none"
                                            _hover={{ textDecoration: "underline" }}
                                            onClick={onStepsOpen}
                                            cursor="pointer"
                                        >
                                            查看详细
                                        </Link>
                                    </>
                                )}

                                {relatedSteps.length <= 3 && relatedSteps.length > 0 && (
                                    <Link
                                        fontSize="sm"
                                        color="#2067f6"
                                        textDecoration="none"
                                        _hover={{ textDecoration: "underline" }}
                                        onClick={onStepsOpen}
                                        cursor="pointer"
                                    >
                                        查看详细
                                    </Link>
                                )}

                                {relatedSteps.length === 0 && (
                                    <Text fontSize="sm" color="gray.500">
                                        无步骤
                                    </Text>
                                )}
                            </HStack>
                        </HStack>

                        {/* Review Comment */}
                        <HStack align="start">
                            <Text fontSize="sm" color="gray.600" flexShrink={0}>
                                审核意见：
                            </Text>
                            <Text fontSize="sm" color="gray.800">
                                {reviewComment}
                            </Text>
                        </HStack>

                        {/* Additional Note */}
                        {/* Additional Note */}
                        <HStack align="start">
                            <Text fontSize="sm" color="gray.600" flexShrink={0}>
                                补充说明：
                            </Text>
                            <Text fontSize="sm" color="gray.800">
                                {additionalNote}
                            </Text>
                        </HStack>
                    </VStack>
                </GridItem>
            </Grid>

            <div style={{ margin: "16px 0", border: "1px dashed #e5e6eb" }}></div>

            {/* Footer */}
            <Box px={6}>
                <HStack>
                    <Text fontSize="sm" color="#86909C">
                        提交时间：
                    </Text>
                    <Text fontSize="sm" color="gray.800" fontWeight="medium">
                        {submittedAt}
                    </Text>
                </HStack>
            </Box>

            {/* Preview Modal */}
            <DialogRoot open={isPreviewOpen} onOpenChange={(details) => !details.open && onPreviewClose()} closeOnInteractOutside={true}>
                <DialogBackdrop />
                <DialogContent
                    maxW={{ base: "90%", md: "80%", lg: "60%" }}
                    borderRadius="8px"
                    bg="white"
                    boxShadow="0px 0px 18px rgba(0, 65, 215, 0.06)"
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    maxH="85vh"
                    m={4}
                >
                    {/* Header */}
                    <DialogHeader
                        borderBottom="1px solid"
                        borderColor="#e5e6eb"
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        px={4}
                        py={3}
                    >
                        <Text fontSize="16px" fontWeight="500" color="#1d2129">
                            {previewType === "image" ? "图片预览" : "视频预览"}
                        </Text>
                        <DialogCloseTrigger
                            position="static"
                            onClick={onPreviewClose}
                            _hover={{ bg: 'transparent' }}
                            asChild
                        >
                            <button>
                                <LuX size={16} color="#4e5969" />
                            </button>
                        </DialogCloseTrigger>
                    </DialogHeader>

                    {/* Body */}
                    <DialogBody py={6} px={4}>
                        <Center>
                            {previewType === "image" ? (
                                <Image
                                    src={previewUrl}
                                    alt="Attachment preview"
                                    maxH="70vh"
                                    objectFit="contain"
                                    borderRadius="md"
                                />
                            ) : previewType === "video" ? (
                                <video
                                    src={previewUrl}
                                    controls
                                    style={{
                                        width: '100%',
                                        maxHeight: '70vh',
                                        objectFit: 'contain'
                                    }}
                                >
                                    您的浏览器不支持视频播放
                                </video>
                            ) : null}
                        </Center>
                    </DialogBody>
                </DialogContent>
            </DialogRoot>

            {/* Steps Detail Modal */}
            <DialogRoot open={isStepsOpen} onOpenChange={(details) => !details.open && onStepsClose()} closeOnInteractOutside={false}>
                <DialogBackdrop />
                <DialogContent
                    maxW="500px"
                    borderRadius="8px"
                    bg="white"
                    boxShadow="0px 0px 18px rgba(0, 65, 215, 0.06)"
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    maxH="80vh"
                >
                    {/* Header */}
                    <DialogHeader
                        borderBottom="1px solid"
                        borderColor="#e5e6eb"
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        px={4}
                        py={3}
                    >
                        <Text fontSize="16px" fontWeight="500" color="#1d2129">
                            关联步骤详情
                        </Text>
                        <DialogCloseTrigger
                            position="static"
                            onClick={onStepsClose}
                            _hover={{ bg: 'transparent' }}
                            asChild
                        >
                            <button>
                                <LuX size={16} color="#4e5969" />
                            </button>
                        </DialogCloseTrigger>
                    </DialogHeader>

                    {/* Body */}
                    <DialogBody
                        px={4}
                        py={6}
                        maxH="60vh"
                        overflowY="auto"
                    >
                        <VStack gap={4} alignItems="stretch">
                            {relatedSteps.map((stepName, index) => {
                                // 查找对应的步骤详情
                                // 多种匹配策略：
                                // 1. 精确匹配标题
                                // 2. 匹配步骤序号（步骤1, 步骤2等）
                                // 3. 模糊匹配包含关系
                                // 4. 匹配索引位置
                                const stepDetail = testCaseSteps?.find((step, stepIndex) => {
                                    const stepTitle = step.title || `步骤${stepIndex + 1}`;

                                    // 策略1: 精确匹配标题
                                    if (stepTitle === stepName) {
                                        return true;
                                    }

                                    // 策略2: 匹配步骤序号（如"步骤1"）
                                    if (stepName === `步骤${stepIndex + 1}`) {
                                        return true;
                                    }

                                    // 策略3: 模糊匹配包含关系
                                    if (stepName.includes(stepTitle) || stepTitle.includes(stepName)) {
                                        return true;
                                    }

                                    // 策略4: 如果relatedSteps数组长度与testCaseSteps相同，按索引匹配
                                    if (relatedSteps.length === testCaseSteps.length && index === stepIndex) {
                                        return true;
                                    }

                                    return false;
                                });

                                return (
                                    <Box key={index} p={4} bg="#f8f9fa" borderRadius="8px" border="1px solid #e9ecef">
                                        <Text fontSize="sm" fontWeight="600" color="#1d2129" mb={2}>
                                            {stepName}
                                        </Text>

                                        {stepDetail ? (
                                            <VStack align="stretch" gap={2}>
                                                <Box>
                                                    <Text fontSize="sm" color="#4e5969" fontWeight="500" mb={1}>
                                                        操作步骤：
                                                    </Text>
                                                    <Text fontSize="sm" color="#1d2129" lineHeight="1.6">
                                                        {stepDetail.description}
                                                    </Text>
                                                </Box>

                                                <Box>
                                                    <Text fontSize="sm" color="#4e5969" fontWeight="500" mb={1}>
                                                        预期结果：
                                                    </Text>
                                                    <Text fontSize="sm" color="#1d2129" lineHeight="1.6">
                                                        {stepDetail.expectedResult}
                                                    </Text>
                                                </Box>
                                            </VStack>
                                        ) : (
                                            <VStack align="stretch" gap={2}>
                                                <Text fontSize="sm" color="#86909c" fontStyle="italic">
                                                    未找到该步骤的详细信息
                                                </Text>
                                                <Text fontSize="xs" color="#86909c">
                                                    用例共有 {testCaseSteps?.length || 0} 个步骤
                                                </Text>
                                                {testCaseSteps && testCaseSteps.length > 0 && (
                                                    <Box>
                                                        <Text fontSize="xs" color="#86909c" mb={1}>
                                                            可用步骤列表：
                                                        </Text>
                                                        <VStack align="stretch" gap={1}>
                                                            {testCaseSteps.map((step, stepIndex) => (
                                                                <Text key={stepIndex} fontSize="xs" color="#86909c">
                                                                    {step.title || `步骤${stepIndex + 1}`}: {step.description?.substring(0, 30)}...
                                                                </Text>
                                                            ))}
                                                        </VStack>
                                                    </Box>
                                                )}
                                            </VStack>
                                        )}
                                    </Box>
                                );
                            })}
                        </VStack>
                    </DialogBody>
                </DialogContent>
            </DialogRoot>
        </Box>
    )
}