'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box,
    Flex,
    Text,
    Button,
    Input,
} from '@chakra-ui/react';
import { LuChevronRight } from 'react-icons/lu';
import RichTextEditor from '@/app/_components/ui/rich-text-editor';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';

const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    borderColor: '#E5E6EB',
};

export default function AnnouncementReleasePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');
    const { showSuccessToast, showErrorToast } = useCustomToast();

    // 获取 tRPC utils 用于刷新缓存
    const utils = api.useUtils();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // 获取公告详情（编辑模式）
    const { data: announcementData } = api.announcement.getById.useQuery(
        { id: editId || '' },
        { enabled: !!editId }
    );

    // 加载公告数据到表单
    useEffect(() => {
        if (announcementData) {
            setTitle(announcementData.title);
            setContent(announcementData.content || '');

            // 将Date转换为datetime-local格式 (YYYY-MM-DDThh:mm)
            const formatDateForInput = (date: string | Date | null | undefined) => {
                if (!date) return '';
                const d = new Date(date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                return `${year}-${month}-${day}T${hours}:${minutes}`;
            };

            setStartDate(formatDateForInput(announcementData.startTime));
            setEndDate(formatDateForInput(announcementData.endTime));
        }
    }, [announcementData]);

    // 创建公告
    const createMutation = api.announcement.create.useMutation({
        onSuccess: async () => {
            showSuccessToast('新增公告成功');
            await utils.announcement.list.invalidate();
            router.push('/crowdsource/admin/system-announcement');
        },
        onError: (error) => {
            showErrorToast(`新增公告失败: ${error.message}`);
        },
    });

    // 更新公告
    const updateMutation = api.announcement.update.useMutation({
        onSuccess: async () => {
            showSuccessToast('更新公告成功');
            await utils.announcement.list.invalidate();
            await utils.announcement.getById.invalidate({ id: editId || '' });
            router.push('/crowdsource/admin/system-announcement');
        },
        onError: (error) => {
            showErrorToast(`更新公告失败: ${error.message}`);
        },
    });

    // 文件上传处理函数（用于富文本编辑器）
    const handleFileUpload = async (file: File): Promise<string> => {
        try {
            // 将文件转为 Base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // 使用 tRPC 上传文件到服务器
            const result = await utils.client.util.uploadRichTextFile.mutate({
                file: base64,
                filename: file.name,
                folder: 'announcement',
            });

            if (result.success) {
                return result.url;
            } else {
                throw new Error('上传失败');
            }
        } catch (error) {
            console.error('文件上传失败:', error);
            throw error;
        }
    };

    const handleSubmit = () => {
        // 验证必填字段
        if (!title.trim()) {
            showErrorToast('请输入公告标题');
            return;
        }

        if (!content.trim()) {
            showErrorToast('请输入公告内容');
            return;
        }

        if (!startDate) {
            showErrorToast('请选择起始时间');
            return;
        }

        if (!endDate) {
            showErrorToast('请选择关闭时间');
            return;
        }

        // 验证结束时间必须大于开始时间
        if (new Date(endDate) <= new Date(startDate)) {
            showErrorToast('关闭时间必须晚于起始时间');
            return;
        }

        if (editId) {
            // 编辑模式
            updateMutation.mutate({
                id: editId,
                title,
                content,
                startTime: startDate,
                endTime: endDate,
            });
        } else {
            // 新增模式
            createMutation.mutate({
                title,
                content,
                startTime: startDate,
                endTime: endDate,
            });
        }
    };

    const handleCancel = () => {
        router.push('/crowdsource/admin/system-announcement');
    };

    return (
        <Box p={6}>
            {/* 面包屑导航 */}
            <Flex align="center" gap={2} mb={4}>
                <Text fontSize="14px" color={COLORS.textTertiary}>
                    后台管理
                </Text>
                <LuChevronRight size={14} color={COLORS.textTertiary} />
                <Text fontSize="14px" color={COLORS.textTertiary}>
                    公告与消息管理
                </Text>
                <LuChevronRight size={14} color={COLORS.textTertiary} />
                <Text
                    fontSize="14px"
                    color={COLORS.textTertiary}
                    cursor="pointer"
                    onClick={() => router.push('/crowdsource/admin/system-announcement')}
                    _hover={{ color: COLORS.primary }}
                >
                    系统公告
                </Text>
                <LuChevronRight size={14} color={COLORS.textTertiary} />
                <Text fontSize="14px" color={COLORS.textPrimary} fontWeight="500">
                    公告发布
                </Text>
            </Flex>

            {/* 主内容卡片 */}
            <Box bg={COLORS.bgPrimary} borderRadius="8px" p={6}>
                <Flex direction="column" gap={6} maxW="1000px">
                    {/* 公告标题 */}
                    <Box>
                        <Flex mb={2}>
                            <Text color={COLORS.primary} mr={1}>
                                *
                            </Text>
                            <Text fontSize="14px" color={COLORS.textSecondary}>
                                公告标题
                            </Text>
                        </Flex>
                        <Input
                            placeholder="请输入公告标题"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            fontSize="14px"
                            h="40px"
                            borderColor={COLORS.borderColor}
                            _focus={{ borderColor: COLORS.primary }}
                        />
                    </Box>

                    {/* 公告内容 */}
                    <Box>
                        <Text fontSize="14px" color={COLORS.textSecondary} mb={2}>
                            公告内容
                        </Text>
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            placeholder="富文本"
                            minHeight="300px"
                            onUploadFile={handleFileUpload}
                        />
                    </Box>

                    {/* 起始时间 */}
                    <Box>
                        <Flex mb={2}>
                            <Text color={COLORS.primary} mr={1}>
                                *
                            </Text>
                            <Text fontSize="14px" color={COLORS.textSecondary}>
                                起始时间
                            </Text>
                        </Flex>
                        <Input
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            placeholder="请选择日期"
                            fontSize="14px"
                            h="40px"
                            borderColor={COLORS.borderColor}
                            _focus={{ borderColor: COLORS.primary }}
                            maxW="400px"
                        />
                    </Box>

                    {/* 关闭时间 */}
                    <Box>
                        <Flex mb={2}>
                            <Text color={COLORS.primary} mr={1}>
                                *
                            </Text>
                            <Text fontSize="14px" color={COLORS.textSecondary}>
                                关闭时间
                            </Text>
                        </Flex>
                        <Input
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            placeholder="请选择日期"
                            fontSize="14px"
                            h="40px"
                            borderColor={COLORS.borderColor}
                            _focus={{ borderColor: COLORS.primary }}
                            maxW="400px"
                        />
                    </Box>

                    {/* 操作按钮 */}
                    <Flex gap={4} pt={4}>
                        <Button
                            variant="outline"
                            fontSize="14px"
                            h="40px"
                            px={8}
                            borderColor={COLORS.borderColor}
                            color={COLORS.textSecondary}
                            onClick={handleCancel}
                            _hover={{ bg: COLORS.bgSecondary }}
                        >
                            关闭
                        </Button>
                        <Button
                            bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                            color="white"
                            fontSize="14px"
                            h="40px"
                            px={8}
                            onClick={handleSubmit}
                            _hover={{ opacity: 0.9 }}
                            loading={createMutation.isPending || updateMutation.isPending}
                        >
                            确认
                        </Button>
                    </Flex>
                </Flex>
            </Box>
        </Box>
    );
}
