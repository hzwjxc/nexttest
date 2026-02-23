'use client'

import React, { useRef, useState } from 'react'
import {
    Box,
    Button,
    Text,
    Flex,
    Icon,
    VStack,
    HStack,
} from '@chakra-ui/react'
import { Eye, Download, X, FileText } from 'lucide-react'
import { api } from '@/trpc/react'

interface FileItem {
    id: string
    name: string
    url: string
    size: number
    status: 'uploading' | 'success' | 'error'
}

interface FileUploadProps {
    value?: FileItem[]
    onChange: (files: FileItem[]) => void
    maxFiles?: number
    maxSize?: number // 单位：MB
    accept?: string
    disabled?: boolean
}

export default function FileUpload({
    value = [],
    onChange,
    maxFiles = 10,
    maxSize = 50,
    accept,
    disabled = false,
}: FileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)

    // 使用通用文件上传 API
    const uploadFileMutation = api.util.uploadFile.useMutation()

    // 格式化文件大小
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    // 将文件转换为 base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = (error) => reject(error)
        })
    }

    // 处理文件选择
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files || files.length === 0) return

        const fileArray = Array.from(files)

        // 检查文件数量限制
        if (value.length + fileArray.length > maxFiles) {
            alert(`最多只能上传 ${maxFiles} 个文件`)
            return
        }

        // 验证文件大小
        for (const file of fileArray) {
            if (file.size > maxSize * 1024 * 1024) {
                alert(`文件 ${file.name} 大小不能超过 ${maxSize}MB`)
                return
            }
        }

        setUploading(true)

        // 先添加上传中状态的文件
        const uploadingFiles: FileItem[] = fileArray.map(file => ({
            id: Date.now().toString() + Math.random(),
            name: file.name,
            url: '',
            size: file.size,
            status: 'uploading' as const,
        }))

        onChange([...value, ...uploadingFiles])

        // 逐个上传文件
        const uploadedFiles: FileItem[] = []
        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i]
            const uploadingFile = uploadingFiles[i]

            try {
                // 转换为 base64
                const base64 = await fileToBase64(file)

                // 调用上传 API
                const result = await uploadFileMutation.mutateAsync({
                    file: base64,
                    filename: file.name,
                    folder: 'task-attachments', // 任务附件文件夹
                })

                if (result.success) {
                    uploadedFiles.push({
                        ...uploadingFile!,
                        url: result.url,
                        status: 'success',
                    })
                } else {
                    uploadedFiles.push({
                        ...uploadingFile!,
                        status: 'error',
                    })
                }
            } catch (error) {
                console.error('Upload error:', error)
                uploadedFiles.push({
                    ...uploadingFile!,
                    status: 'error',
                })
            }
        }

        // 更新文件列表，替换上传中的文件为最终状态
        const otherFiles = value.filter(
            f => !uploadingFiles.some(uf => uf.id === f.id)
        )
        onChange([...otherFiles, ...uploadedFiles])
        setUploading(false)

        // 清空文件输入
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // 触发文件选择
    const triggerFileSelect = () => {
        fileInputRef.current?.click()
    }

    // 删除文件
    const removeFile = (id: string) => {
        onChange(value.filter((file) => file.id !== id))
    }

    // 预览文件
    const previewFile = (file: FileItem) => {
        if (file.url) {
            window.open(file.url, '_blank')
        }
    }

    // 下载文件
    const downloadFile = (file: FileItem) => {
        if (file.url) {
            const link = document.createElement('a')
            link.href = file.url
            link.download = file.name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    return (
        <VStack align="stretch" gap={3}>
            {/* 上传按钮 */}
            {!disabled && value.length < maxFiles && (
                <Box
                    border="1px dashed"
                    borderColor="#E5E6EB"
                    bg="#F7F8FA"
                    borderRadius="4px"
                    p={6}
                    textAlign="center"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ bg: '#F2F3F5', borderColor: '#C9CDD4' }}
                    onClick={triggerFileSelect}
                >
                    <VStack gap={2}>
                        <Text fontSize="32px" color="#C9CDD4" lineHeight="1">
                            +
                        </Text>
                        <Text fontSize="14px" color="#4E5969">
                            上传附件
                        </Text>
                    </VStack>
                </Box>
            )}

            {/* 文件列表 */}
            {value.length > 0 && (
                <VStack align="stretch" gap={2}>
                    {value.map((file) => (
                        <Flex
                            key={file.id}
                            align="center"
                            justify="space-between"
                            p={3}
                            bg="#F7F8FA"
                            borderRadius="4px"
                            border="1px solid"
                            borderColor="#E5E6EB"
                        >
                            {/* 左侧：图标和文件信息 */}
                            <Flex gap={3} align="center" flex={1} minW={0}>
                                {/* 文件图标 */}
                                <Flex
                                    w="40px"
                                    h="40px"
                                    bg="#E5E6EB"
                                    borderRadius="4px"
                                    align="center"
                                    justify="center"
                                    flexShrink={0}
                                >
                                    <Icon as={FileText} boxSize={5} color="#4E5969" />
                                </Flex>

                                {/* 文件名和大小 */}
                                <VStack align="start" gap={0} flex={1} minW={0}>
                                    <Text
                                        fontSize="14px"
                                        color="#1D2129"
                                        fontWeight="medium"
                                        lineClamp={1}
                                        wordBreak="break-all"
                                    >
                                        {file.name}
                                    </Text>
                                    <Text fontSize="12px" color="#86909C">
                                        {formatFileSize(file.size)}
                                    </Text>
                                </VStack>
                            </Flex>

                            {/* 右侧：状态和操作 */}
                            <HStack gap={2} flexShrink={0}>
                                {file.status === 'uploading' && (
                                    <Flex
                                        w="20px"
                                        h="20px"
                                        border="2px solid"
                                        borderColor="#165DFF"
                                        borderTopColor="transparent"
                                        borderRadius="50%"
                                        animation="spin 0.8s linear infinite"
                                    />
                                )}

                                {file.status === 'success' && (
                                    <>
                                        {/* 查看按钮 */}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            h="24px"
                                            minW="auto"
                                            px={2}
                                            onClick={() => previewFile(file)}
                                            _hover={{ bg: 'transparent' }}
                                        >
                                            <Icon as={Eye} boxSize={4} color="#86909C" />
                                        </Button>

                                        {/* 下载按钮 */}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            h="24px"
                                            minW="auto"
                                            px={2}
                                            onClick={() => downloadFile(file)}
                                            _hover={{ bg: 'transparent' }}
                                        >
                                            <Icon as={Download} boxSize={4} color="#86909C" />
                                        </Button>

                                        {/* 删除按钮 */}
                                        {!disabled && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                h="24px"
                                                minW="auto"
                                                px={2}
                                                onClick={() => removeFile(file.id)}
                                                _hover={{ bg: 'transparent' }}
                                            >
                                                <Icon as={X} boxSize={4} color="#F53F3F" />
                                            </Button>
                                        )}
                                    </>
                                )}

                                {file.status === 'error' && (
                                    <>
                                        <Text fontSize="12px" color="#F53F3F">
                                            上传失败
                                        </Text>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            h="24px"
                                            minW="auto"
                                            px={2}
                                            onClick={() => removeFile(file.id)}
                                            _hover={{ bg: 'transparent' }}
                                        >
                                            <Icon as={X} boxSize={4} color="#F53F3F" />
                                        </Button>
                                    </>
                                )}
                            </HStack>
                        </Flex>
                    ))}
                </VStack>
            )}

            {/* 隐藏的文件输入 */}
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={disabled || uploading}
            />

            {/* 添加旋转动画的样式 */}
            <style jsx global>{`
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </VStack>
    )
}
