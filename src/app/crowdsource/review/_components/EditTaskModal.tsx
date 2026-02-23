'use client';

import React, { useState, useEffect } from 'react';
import {
    DialogRoot,
    DialogBackdrop,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogCloseTrigger,
    Box,
    Flex,
    Text,
    Input,
    Button,
    VStack,
    HStack,
    IconButton,
    Field,
} from '@chakra-ui/react';
import { X } from 'lucide-react';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';

const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    bgTertiary: '#F3F7FB',
    borderColor: '#E5E6EB',
};

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskId: string;
    taskData?: {
        title?: string;
        personTags?: string[];
        selectedTagIds?: string[];
        isPaused?: boolean;
        endDate?: string | Date;
        participantCount?: number;
        [key: string]: any;
    };
    onSuccess?: () => void;
}

export function EditTaskModal({
    isOpen,
    onClose,
    taskId,
    taskData,
    onSuccess,
}: EditTaskModalProps) {
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
    const [tempSelectedTags, setTempSelectedTags] = useState<Set<string>>(
        new Set()
    );
    const [personTags, setPersonTags] = useState<string[]>(
        taskData?.personTags || []
    );
    const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
        new Set(taskData?.selectedTagIds || [])
    );
    const [isPaused, setIsPaused] = useState(taskData?.isPaused || false);
    const [endDate, setEndDate] = useState<string>(() => {
        if (taskData?.endDate) {
            if (taskData.endDate instanceof Date) {
                const year = taskData.endDate.getFullYear();
                const month = String(taskData.endDate.getMonth() + 1).padStart(2, '0');
                const day = String(taskData.endDate.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
            return taskData.endDate as string;
        }
        return '';
    });
    const [participantCount, setParticipantCount] = useState<number>(
        taskData?.participantCount || 0
    );

    // API Queries - 获取标签数据
    const { data: tagCategoriesData } =
        api.tagManagement.getAllWithUserCount.useQuery();

    // 初始化标签数据 - 从taskData中恢复已选择的标签
    useEffect(() => {
        if (
            tagCategoriesData &&
            taskData?.personTags &&
            taskData.personTags.length > 0 &&
            selectedTagIds.size === 0
        ) {
            const tagIds = new Set<string>();
            Object.values(tagCategoriesData).forEach((tags) => {
                tags.forEach((tag) => {
                    if (taskData.personTags?.includes(tag.name)) {
                        tagIds.add(tag.id);
                    }
                });
            });
            if (tagIds.size > 0) {
                setSelectedTagIds(tagIds);
            }
        }
    }, [tagCategoriesData, taskData?.personTags, selectedTagIds.size]);

    // 打开标签配置对话框
    const handleOpenTagDialog = () => {
        setTempSelectedTags(new Set(selectedTagIds));
        setIsTagDialogOpen(true);
    };

    // 关闭对话框
    const handleCloseTagDialog = () => {
        setIsTagDialogOpen(false);
    };

    // 切换标签选择
    const handleToggleTag = (tagId: string) => {
        const newSelected = new Set(tempSelectedTags);
        if (newSelected.has(tagId)) {
            newSelected.delete(tagId);
        } else {
            newSelected.add(tagId);
        }
        setTempSelectedTags(newSelected);
    };

    // 确认选择标签
    const handleConfirmTags = () => {
        setSelectedTagIds(tempSelectedTags);

        // 根据选中的ID获取标签文本
        const selectedTagLabels: string[] = [];
        if (tagCategoriesData) {
            Object.values(tagCategoriesData).forEach((tags) => {
                tags.forEach((tag) => {
                    if (tempSelectedTags.has(tag.id)) {
                        selectedTagLabels.push(tag.name);
                    }
                });
            });
        }

        setPersonTags(selectedTagLabels);
        setIsTagDialogOpen(false);
    };

    // 删除标签
    const handleRemoveTag = (tagLabel: string) => {
        // 从personTags中移除
        setPersonTags(personTags.filter((tag) => tag !== tagLabel));

        // 从selectedTagIds中移除对应的ID
        const newSelectedIds = new Set(selectedTagIds);
        if (tagCategoriesData) {
            Object.values(tagCategoriesData).forEach((tags) => {
                tags.forEach((tag) => {
                    if (tag.name === tagLabel) {
                        newSelectedIds.delete(tag.id);
                    }
                });
            });
        }
        setSelectedTagIds(newSelectedIds);
    };

    // 计算已选人数（去重）
    const calculateSelectedCount = () => {
        const uniqueUserIds = new Set<string>();
        if (tagCategoriesData) {
            Object.values(tagCategoriesData).forEach((tags) => {
                tags.forEach((tag) => {
                    if (selectedTagIds.has(tag.id)) {
                        // 将该标签的所有用户ID添加到Set中，自动去重
                        tag.userIds.forEach((userId) =>
                            uniqueUserIds.add(userId)
                        );
                    }
                });
            });
        }
        return uniqueUserIds.size;
    };

    // 获取完整任务数据用于更新
    const { data: fullTaskData } = api.taskPublish.getById.useQuery({
        id: taskId,
    });

    // 更新任务mutation
    const updateTaskMutation = api.taskPublish.update.useMutation({
        onSuccess: () => {
            showSuccessToast('任务信息已更新');
            onClose();
            onSuccess?.();
        },
        onError: (error) => {
            showErrorToast(error.message || '更新失败');
        },
    });

    // 提交表单
    const handleSubmit = () => {
        if (!fullTaskData) {
            showErrorToast('任务数据加载失败');
            return;
        }

        const task = fullTaskData;

        // 构建完整的更新数据
        updateTaskMutation.mutate({
            id: taskId,
            data: {
                basicInfo: {
                    taskSystem: task.system || '',
                    taskName: task.title || '',
                    taskDescription: task.description || '',
                    testType: task.testTypes?.includes('ANDROID') ? '手机客户端' : 'PC客户端',
                    testRules: task.testRules || '',
                    testData: task.environment || '',
                    files: task.attachments
                        ? (typeof task.attachments === 'string' ? JSON.parse(task.attachments) : task.attachments)
                        : [],
                },
                testDesign: {
                    testCases: task.testCases?.map((tc: any, idx: number) => ({
                        id: idx,
                        sequence: idx + 1,
                        system: tc.system || '',
                        name: tc.title || '',
                        focus: tc.explanation || '',
                        originalId: tc.id,
                    })) || [],
                    testPoints: task.testPoints || '',
                },
                taskPublish: {
                    personTags,
                    selectedTagIds: Array.from(selectedTagIds),
                    taskDate: endDate || new Date().toISOString().split('T')[0],
                    participants: String(participantCount || task.maxParticipants || 0),
                    executePoints: String(task.executionPoints || 0),
                    ruleFilter: task.ruleFilter || '',
                    pointsOptions: task.rewardConfig?.pointsConfig
                        ? JSON.parse(task.rewardConfig.pointsConfig)
                        : [],
                    emailNotify: task.notificationConfig?.emailEnabled || false,
                    emailContent: task.notificationConfig?.emailTemplate || '',
                    selectedEmailTemplate: task.notificationConfig?.emailTemplateId || '',
                    smsNotify: task.notificationConfig?.lanxinEnabled || false,
                    smsContent: task.notificationConfig?.lanxinTemplate || '',
                    selectedSmsTemplate: task.notificationConfig?.lanxinTemplateId || '',
                    groupInvite: task.notificationConfig?.wechatEnabled || false,
                    wechatContent: task.notificationConfig?.wechatTemplate || '',
                    selectedWechatTemplate: task.notificationConfig?.wechatTemplateId || '',
                    thumbnailImage: task.thumbnailImage || null,
                    isPaused: isPaused,
                },
            } as any,
        });
    };

    return (
        <>
            <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
                <DialogBackdrop />
                <DialogContent maxW="720px" position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    maxH="80vh">
                    <DialogHeader>
                        <Text
                            fontSize="16px"
                            fontWeight="600"
                            color={COLORS.textPrimary}
                        >
                            修改任务信息
                        </Text>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody>
                        <VStack gap={6} align="stretch">
                            {/* 结束日期 */}
                            <Field.Root>
                                <Field.Label
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                    mb={2}
                                >
                                    <Text as="span" color={COLORS.primary} mr={1}>
                                        *
                                    </Text>
                                    结束日期
                                </Field.Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    placeholder="请选择结束日期"
                                    fontSize="14px"
                                    borderColor={COLORS.borderColor}
                                    _focus={{
                                        borderColor: COLORS.primary,
                                        boxShadow: `0 0 0 1px ${COLORS.primary}`,
                                    }}
                                />
                            </Field.Root>

                            {/* 参测人数 */}
                            <Field.Root>
                                <Field.Label
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                    mb={2}
                                >
                                    <Text as="span" color={COLORS.primary} mr={1}>
                                        *
                                    </Text>
                                    参测人数
                                </Field.Label>
                                <Input
                                    type="number"
                                    value={participantCount}
                                    onChange={(e) =>
                                        setParticipantCount(
                                            parseInt(e.target.value) || 0
                                        )
                                    }
                                    placeholder="请输入参测人数"
                                    min="0"
                                    fontSize="14px"
                                    borderColor={COLORS.borderColor}
                                    _focus={{
                                        borderColor: COLORS.primary,
                                        boxShadow: `0 0 0 1px ${COLORS.primary}`,
                                    }}
                                />
                            </Field.Root>

                            {/* 人员标签 */}
                            <Field.Root>
                                <Field.Label
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                    mb={2}
                                >
                                    <Text as="span" color={COLORS.primary} mr={1}>
                                        *
                                    </Text>
                                    人员标签
                                </Field.Label>
                                <Flex gap={2} wrap="wrap" mb={2}>
                                    {personTags.map((tag, index) => (
                                        <Flex
                                            key={index}
                                            align="center"
                                            bg={COLORS.bgSecondary}
                                            borderRadius="4px"
                                            px={3}
                                            py={1}
                                            gap={2}
                                        >
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.textSecondary}
                                            >
                                                {tag}
                                            </Text>
                                            <IconButton
                                                aria-label="删除标签"
                                                size="xs"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleRemoveTag(tag)
                                                }
                                            >
                                                <X size={14} />
                                            </IconButton>
                                        </Flex>
                                    ))}
                                </Flex>
                                <Flex gap={2} align="center">
                                    <Button
                                        variant="outline"
                                        borderColor={COLORS.borderColor}
                                        color={COLORS.textSecondary}
                                        flex={1}
                                        onClick={handleOpenTagDialog}
                                        justifyContent="flex-start"
                                        bg={COLORS.bgTertiary}
                                    >
                                        请选择标签
                                    </Button>
                                    {selectedTagIds.size > 0 && (
                                        <Text
                                            fontSize="14px"
                                            color="#165DFF"
                                        >
                                            已选择：{calculateSelectedCount()}
                                            人
                                        </Text>
                                    )}
                                </Flex>
                            </Field.Root>

                            {/* 是否开启任务 */}
                            <Field.Root>
                                <Field.Label
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                    mb={2}
                                >
                                    <Text as="span" color={COLORS.primary} mr={1}>
                                        *
                                    </Text>
                                    是否开启任务
                                </Field.Label>
                                <HStack gap={6}>
                                    <Flex align="center" gap={2}>
                                        <input
                                            type="radio"
                                            id="paused"
                                            name="isPaused"
                                            value="true"
                                            checked={isPaused === true}
                                            onChange={() =>
                                                setIsPaused(true)
                                            }
                                        />
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                        >
                                            暂停
                                        </Text>
                                    </Flex>
                                    <Flex align="center" gap={2}>
                                        <input
                                            type="radio"
                                            id="enabled"
                                            name="isPaused"
                                            value="false"
                                            checked={isPaused === false}
                                            onChange={() =>
                                                setIsPaused(false)
                                            }
                                        />
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                        >
                                            开启
                                        </Text>
                                    </Flex>
                                </HStack>
                            </Field.Root>
                        </VStack>
                    </DialogBody>
                    <DialogFooter>
                        <Flex gap={2} justify="flex-end">
                            <Button
                                variant="outline"
                                borderColor={COLORS.borderColor}
                                color={COLORS.textSecondary}
                                onClick={onClose}
                            >
                                取消
                            </Button>
                            <Button
                                bg={COLORS.primary}
                                color="white"
                                onClick={handleSubmit}
                                loading={updateTaskMutation.isPending}
                            >
                                提交
                            </Button>
                        </Flex>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>

            {/* 标签选择对话框 */}
            <DialogRoot
                open={isTagDialogOpen}
                onOpenChange={(e) => !e.open && handleCloseTagDialog()}
            >
                <DialogBackdrop />
                <DialogContent maxW="600px" position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    maxH="80vh">
                    <DialogHeader>
                        <Text
                            fontSize="16px"
                            fontWeight="600"
                            color={COLORS.textPrimary}
                        >
                            选择人员标签
                        </Text>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody maxH="400px" overflowY="auto">
                        <VStack gap={4} align="stretch">
                            {tagCategoriesData &&
                                Object.entries(tagCategoriesData).map(
                                    ([category, tags]) => (
                                        <Box key={category}>
                                            <Text
                                                fontSize="14px"
                                                fontWeight="600"
                                                color={COLORS.textPrimary}
                                                mb={2}
                                            >
                                                {category}
                                            </Text>
                                            <Flex gap={2} wrap="wrap">
                                                {tags.map((tag) => (
                                                    <Box
                                                        key={tag.id}
                                                        as="button"
                                                        px={3}
                                                        py={1}
                                                        borderRadius="4px"
                                                        border="1px solid"
                                                        borderColor={
                                                            tempSelectedTags.has(
                                                                tag.id
                                                            )
                                                                ? COLORS.primary
                                                                : COLORS.borderColor
                                                        }
                                                        bg={
                                                            tempSelectedTags.has(
                                                                tag.id
                                                            )
                                                                ? 'rgba(227, 20, 36, 0.1)'
                                                                : 'white'
                                                        }
                                                        color={
                                                            tempSelectedTags.has(
                                                                tag.id
                                                            )
                                                                ? COLORS.primary
                                                                : COLORS.textPrimary
                                                        }
                                                        fontSize="14px"
                                                        cursor="pointer"
                                                        onClick={() =>
                                                            handleToggleTag(
                                                                tag.id
                                                            )
                                                        }
                                                        _hover={{
                                                            borderColor:
                                                                COLORS.primary,
                                                        }}
                                                        display="flex"
                                                        alignItems="center"
                                                        gap={1}
                                                    >
                                                        {tag.name}
                                                        {tempSelectedTags.has(
                                                            tag.id
                                                        ) && (
                                                                <Text
                                                                    fontSize="16px"
                                                                    ml={1}
                                                                >
                                                                    ✓
                                                                </Text>
                                                            )}
                                                    </Box>
                                                ))}
                                            </Flex>
                                        </Box>
                                    )
                                )}
                        </VStack>
                    </DialogBody>
                    <DialogFooter>
                        <Flex gap={2} justify="flex-end">
                            <Button
                                variant="outline"
                                borderColor={COLORS.borderColor}
                                color={COLORS.textSecondary}
                                onClick={handleCloseTagDialog}
                            >
                                取消
                            </Button>
                            <Button
                                bg={COLORS.primary}
                                color="white"
                                onClick={handleConfirmTags}
                            >
                                确认
                            </Button>
                        </Flex>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>
        </>
    );
}
