"use client"

import { useState } from "react"
import { DefectCard } from "./defect-card"
import {
    Box,
    Heading,
    DialogRoot,
    DialogBackdrop,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogCloseTrigger,
    Input,
    Textarea,
    NativeSelect,
    VStack,
    HStack,
    Text,
    Button,
    IconButton,
    Image,
} from "@chakra-ui/react"
import { useParams } from "next/navigation"
import { api } from "@/trpc/react"
import { LuX, LuUpload } from "react-icons/lu"
import useCustomToast from "@/app/hooks/useCustomToast"

const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    borderColor: '#E5E6EB',
}

export default function MyFeedBack() {
    const params = useParams()
    const taskId = params.id as string
    const { showErrorToast, showSuccessToast } = useCustomToast()
    const utils = api.useUtils()

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingDefectId, setEditingDefectId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        defectType: '',
        relatedStep: [] as string[],
        description: '',
    })
    const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; isVideo: boolean }>>([])
    const [isUploading, setIsUploading] = useState(false)

    // Fetch user's defects for this task
    const { data: defectsData, refetch: refetchDefects } = api.defect.listByTask.useQuery(
        { taskId: taskId, page: 1, pageSize: 100 },
        { enabled: !!taskId }
    )

    const defects = defectsData?.data || []

    // Update defect mutation
    const updateDefect = api.defect.update.useMutation({
        onSuccess: (data) => {
            setIsDialogOpen(false)
            setEditingDefectId(null)
            setFormData({ title: '', defectType: '', relatedStep: [], description: '' })
            setUploadedFiles([])
            showSuccessToast(data.message)
            refetchDefects()
        },
        onError: (error) => {
            showErrorToast('更新失败: ' + error.message)
        },
    })

    // Delete defect mutation
    const deleteDefect = api.defect.delete.useMutation({
        onSuccess: (data) => {
            showSuccessToast(data.message)
            refetchDefects()
        },
        onError: (error) => {
            showErrorToast('删除失败: ' + error.message)
        },
    })

    // Handle edit click
    const handleEdit = (defectId: string) => {
        const defect = defects.find(d => d.id === defectId)
        if (!defect) return

        setEditingDefectId(defectId)
        setFormData({
            title: defect.title,
            defectType: defect.type === 'BUG' ? '缺陷' : '建议',
            relatedStep: defect.steps ? defect.steps.split('、') : [],
            description: defect.description,
        })

        // Parse attachments
        const attachments = (defect.attachments as string[])?.map((url) => ({
            url: url,
            isVideo: url.includes('.mp4') || url.includes('.mov'),
        })) || []
        setUploadedFiles(attachments)

        setIsDialogOpen(true)
    }

    // Handle delete click
    const handleDelete = (defectId: string) => {
        if (confirm('确定要删除这条反馈吗？')) {
            deleteDefect.mutate({ id: defectId })
        }
    }

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const isVideo = file.type.startsWith('video/')
                const isImage = file.type.startsWith('image/')

                if (!isVideo && !isImage) {
                    showErrorToast(`文件 ${file.name} 格式不支持，仅支持图片和视频`)
                    return null
                }

                const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024
                if (file.size > maxSize) {
                    showErrorToast(`文件 ${file.name} 过大，${isVideo ? '视频' : '图片'}最大支持 ${isVideo ? '50MB' : '5MB'}`)
                    return null
                }

                return new Promise<{ url: string; isVideo: boolean } | null>((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = async () => {
                        try {
                            const base64 = reader.result as string

                            const result = await utils.client.util.uploadRichTextFile.mutate({
                                file: base64,
                                filename: file.name,
                                folder: 'defects',
                            })

                            if (result.success) {
                                resolve({ url: result.url, isVideo })
                            } else {
                                showErrorToast(`文件 ${file.name} 上传失败`)
                                resolve(null)
                            }
                        } catch (error) {
                            console.error('Upload error:', error)
                            showErrorToast(`文件 ${file.name} 上传失败`)
                            resolve(null)
                        }
                    }
                    reader.readAsDataURL(file)
                })
            })

            const results = await Promise.all(uploadPromises)
            const successfulUploads = results.filter((r): r is { url: string; isVideo: boolean } => r !== null)

            if (successfulUploads.length > 0) {
                setUploadedFiles([...uploadedFiles, ...successfulUploads])
                showSuccessToast(`成功上传 ${successfulUploads.length} 个文件`)
            }
        } catch (error) {
            console.error('Upload error:', error)
            showErrorToast('文件上传失败')
        } finally {
            setIsUploading(false)
            e.target.value = ''
        }
    }

    // Handle remove file
    const handleRemoveFile = (index: number) => {
        setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
    }

    // Handle form submit
    const handleSubmit = (isDraft: boolean) => {
        if (!editingDefectId) return

        if (!formData.title.trim()) {
            showErrorToast('请输入标题')
            return
        }
        if (!formData.defectType) {
            showErrorToast('请选择缺陷类型')
            return
        }
        if (!formData.relatedStep || formData.relatedStep.length === 0) {
            showErrorToast('请选择关联步骤')
            return
        }
        if (!formData.description.trim()) {
            showErrorToast('请输入描述')
            return
        }

        // 按步骤顺序排序
        const sortedSteps = formData.relatedStep.sort((a, b) => {
            // 提取步骤号
            const aNum = parseInt(a.match(/\d+/)?.[0] || '0')
            const bNum = parseInt(b.match(/\d+/)?.[0] || '0')
            return aNum - bNum
        })

        updateDefect.mutate({
            id: editingDefectId,
            title: formData.title,
            description: formData.description,
            type: formData.defectType === '缺陷' ? 'BUG' : 'SUGGESTION',
            relatedStep: sortedSteps.join('、'),
            attachments: uploadedFiles.map(f => f.url),
            isDraft: isDraft,
        })
    }

    // Handle download all
    const handleDownloadAll = (defectId: string) => {
        const defect = defects.find(d => d.id === defectId)
        if (!defect) return

        const attachments = defect.attachments as string[]
        if (!attachments || attachments.length === 0) {
            showErrorToast('没有可下载的附件')
            return
        }

        attachments.forEach((url, index) => {
            setTimeout(() => {
                const link = document.createElement('a')
                link.href = url
                link.download = `attachment-${index + 1}`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            }, index * 100)
        })
    }

    return <>
        <Box mt={2} p={2}>
            <Heading as="h2" size="sm" color="gray.900" mb={3} pl={4}>
                我的反馈
            </Heading>
        </Box>

        {defects.length === 0 ? (
            <Box bg="white" borderRadius="lg" boxShadow="sm" p={8} textAlign="center">
                <Text fontSize="sm" color={COLORS.textTertiary}>
                    暂无反馈记录
                </Text>
            </Box>
        ) : (
            defects.map((defect, index) => (
                <Box mb={4} key={defect.id}>
                    <DefectCard
                        index={index + 1}
                        defectId={defect.id}
                        score={0}
                        relatedCount={0}
                        title={defect.title}
                        description={defect.description}
                        attachments={(defect.attachments as string[])?.map((url, idx) => ({
                            id: `${idx}`,
                            url: url,
                            isVideo: url.includes('.mp4') || url.includes('.mov'),
                        })) || []}
                        relatedSteps={defect.steps ? defect.steps.split('、') : []}
                        reviewComment={defect.reviewComment || ''}
                        additionalNote={defect.judgmentReason || ''}
                        submittedAt={new Date(defect.createdAt).toLocaleString('zh-CN')}
                        isSaved={!defect.isDraft}
                        // 新增属性
                        status={defect.status}
                        type={defect.type}
                        severity={defect.severity}
                        suggestionLevel={defect.suggestionLevel}
                        earnedPoints={defect.earnedPoints}
                        onEdit={() => handleEdit(defect.id)}
                        onDelete={() => handleDelete(defect.id)}
                        onDownloadAll={() => handleDownloadAll(defect.id)}
                        testCaseSteps={[]}
                    />
                </Box>
            ))
        )}

        {/* Edit Defect/Suggestion Dialog */}
        <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)} size="xl">
            <DialogBackdrop />
            <DialogContent maxW="600px" borderRadius="8px"
                position="fixed"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)">
                <DialogHeader
                    fontSize="18px"
                    fontWeight="600"
                    color={COLORS.textPrimary}
                    borderBottom="1px solid"
                    borderColor={COLORS.borderColor}
                    pb={4}
                >
                    编辑缺陷/建议
                </DialogHeader>
                <DialogCloseTrigger />
                <DialogBody py={6}>
                    <VStack gap={4} align="stretch">
                        {/* Title */}
                        <Box>
                            <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} mb={2}>
                                标题 <Text as="span" color={COLORS.primary}>*</Text>
                            </Text>
                            <Input
                                placeholder="请输入标题"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                fontSize="14px"
                                borderColor={COLORS.borderColor}
                                _focus={{ borderColor: COLORS.primary }}
                            />
                        </Box>

                        {/* Defect Type and Related Step */}
                        <HStack gap={4}>
                            <Box flex="1">
                                <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} mb={2}>
                                    缺陷类型 <Text as="span" color={COLORS.primary}>*</Text>
                                </Text>
                                <NativeSelect.Root>
                                    <NativeSelect.Field
                                        value={formData.defectType}
                                        onChange={(e) => setFormData({ ...formData, defectType: e.target.value })}
                                        fontSize="14px"
                                        borderColor={COLORS.borderColor}
                                        _focus={{ borderColor: COLORS.primary }}
                                    >
                                        <option value="">请选择缺陷类型</option>
                                        <option value="缺陷">缺陷</option>
                                        <option value="建议">建议</option>
                                    </NativeSelect.Field>
                                </NativeSelect.Root>
                            </Box>

                            <Box flex="1">
                                <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} mb={2}>
                                    关联步骤 <Text as="span" color={COLORS.primary}>*</Text>
                                </Text>
                                <Box>
                                    <Input
                                        placeholder="输入步骤名称后按回车添加"
                                        fontSize="14px"
                                        borderColor={COLORS.borderColor}
                                        _focus={{ borderColor: COLORS.primary }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                const value = e.currentTarget.value.trim()
                                                if (value && !formData.relatedStep.includes(value)) {
                                                    setFormData({
                                                        ...formData,
                                                        relatedStep: [...formData.relatedStep, value]
                                                    })
                                                    e.currentTarget.value = ''
                                                }
                                            }
                                        }}
                                    />
                                    {formData.relatedStep.length > 0 && (
                                        <HStack gap={2} mt={2} flexWrap="wrap">
                                            {formData.relatedStep.map((step, index) => (
                                                <Box
                                                    key={index}
                                                    display="flex"
                                                    alignItems="center"
                                                    gap={1}
                                                    bg="#f2f3f5"
                                                    px={2}
                                                    py={1}
                                                    borderRadius="md"
                                                    fontSize="14px"
                                                >
                                                    <Text color={COLORS.textSecondary}>{step}</Text>
                                                    <Box
                                                        as="button"
                                                        onClick={() => {
                                                            setFormData({
                                                                ...formData,
                                                                relatedStep: formData.relatedStep.filter((_, i) => i !== index)
                                                            })
                                                        }}
                                                        cursor="pointer"
                                                        color={COLORS.textTertiary}
                                                        _hover={{ color: COLORS.primary }}
                                                    >
                                                        <LuX size={14} />
                                                    </Box>
                                                </Box>
                                            ))}
                                        </HStack>
                                    )}
                                </Box>
                            </Box>
                        </HStack>

                        {/* Description */}
                        <Box>
                            <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} mb={2}>
                                描述 <Text as="span" color={COLORS.primary}>*</Text>
                            </Text>
                            <Textarea
                                placeholder="请输入详细描述"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                fontSize="14px"
                                borderColor={COLORS.borderColor}
                                _focus={{ borderColor: COLORS.primary }}
                                minH="120px"
                                resize="vertical"
                            />
                        </Box>

                        {/* File Upload */}
                        <Box>
                            <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} mb={2}>
                                上传图片/视频
                            </Text>
                            <Box
                                border="1px dashed"
                                borderColor={COLORS.borderColor}
                                borderRadius="8px"
                                p={4}
                                textAlign="center"
                                cursor={isUploading ? "not-allowed" : "pointer"}
                                _hover={{ borderColor: isUploading ? COLORS.borderColor : COLORS.primary }}
                                position="relative"
                                opacity={isUploading ? 0.6 : 1}
                            >
                                <Input
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={handleFileUpload}
                                    position="absolute"
                                    top="0"
                                    left="0"
                                    width="100%"
                                    height="100%"
                                    opacity="0"
                                    cursor={isUploading ? "not-allowed" : "pointer"}
                                    disabled={isUploading}
                                />
                                <VStack gap={2}>
                                    <LuUpload size={24} color={COLORS.textTertiary} />
                                    <Text fontSize="14px" color={COLORS.textSecondary}>
                                        {isUploading ? '上传中...' : '点击或拖拽图片/视频到此处上传'}
                                    </Text>
                                    <Text fontSize="12px" color={COLORS.textTertiary}>
                                        支持 JPG、PNG、MP4、MOV 等格式
                                    </Text>
                                    <Text fontSize="12px" color={COLORS.textTertiary}>
                                        图片不超过 5MB，视频不超过 50MB
                                    </Text>
                                </VStack>
                            </Box>

                            {/* File Preview */}
                            {uploadedFiles.length > 0 && (
                                <HStack gap={3} mt={3} flexWrap="wrap">
                                    {uploadedFiles.map((file, index) => (
                                        <Box
                                            key={index}
                                            position="relative"
                                            width="80px"
                                            height="80px"
                                            borderRadius="8px"
                                            overflow="hidden"
                                            border="1px solid"
                                            borderColor={COLORS.borderColor}
                                        >
                                            {file.isVideo ? (
                                                <Box
                                                    width="100%"
                                                    height="100%"
                                                    position="relative"
                                                >
                                                    <video
                                                        src={file.url}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                        }}
                                                    />
                                                    <Text
                                                        position="absolute"
                                                        bottom="2px"
                                                        right="2px"
                                                        fontSize="10px"
                                                        bg="rgba(0,0,0,0.7)"
                                                        color="white"
                                                        px={1}
                                                        borderRadius="2px"
                                                    >
                                                        视频
                                                    </Text>
                                                </Box>
                                            ) : (
                                                <Image
                                                    src={file.url}
                                                    alt={`preview-${index}`}
                                                    width="100%"
                                                    height="100%"
                                                    objectFit="cover"
                                                />
                                            )}
                                            <IconButton
                                                position="absolute"
                                                top="2px"
                                                right="2px"
                                                size="xs"
                                                bg="rgba(0,0,0,0.6)"
                                                color="white"
                                                _hover={{ bg: "rgba(0,0,0,0.8)" }}
                                                onClick={() => handleRemoveFile(index)}
                                                aria-label="Remove file"
                                            >
                                                <LuX size={14} />
                                            </IconButton>
                                        </Box>
                                    ))}
                                </HStack>
                            )}
                        </Box>

                        {/* Action Buttons */}
                        <HStack gap={3} justify="flex-end" mt={4}>
                            <Button
                                variant="outline"
                                fontSize="14px"
                                px={6}
                                borderColor={COLORS.borderColor}
                                color={COLORS.textSecondary}
                                _hover={{ borderColor: COLORS.primary, color: COLORS.primary }}
                                onClick={() => handleSubmit(true)}
                                disabled={updateDefect.isPending}
                            >
                                保存草稿
                            </Button>
                            <Button
                                bg={COLORS.primary}
                                color="white"
                                fontSize="14px"
                                px={6}
                                _hover={{ bg: '#C41020' }}
                                onClick={() => handleSubmit(false)}
                                disabled={updateDefect.isPending}
                                loading={updateDefect.isPending}
                            >
                                提交
                            </Button>
                        </HStack>
                    </VStack>
                </DialogBody>
            </DialogContent>
        </DialogRoot>
    </>
}