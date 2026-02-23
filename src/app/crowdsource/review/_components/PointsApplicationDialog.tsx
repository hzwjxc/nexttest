'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Flex,
    Text,
    Input,
    Textarea,
    Grid,
    GridItem,
} from '@chakra-ui/react';
import {
    DialogRoot,
    DialogBackdrop,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogCloseTrigger,
} from "@/app/_components/ui/dialog";
import { Switch } from "@/app/_components/ui/switch";
import { InputGroup } from "@/app/_components/ui/input-group";
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';

const COLORS = {
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgSecondary: '#F2F3F5',
    borderColor: '#E5E6EB',
    blue: '#165DFF',
    orange: '#FF9565',
    red: '#FE626B',
};

interface PointsApplicationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    taskId?: string;
    defaultPoints?: number;
    onSuccess?: () => void;
}

export function PointsApplicationDialog({
    isOpen,
    onClose,
    taskId,
    defaultPoints,
    onSuccess,
}: PointsApplicationDialogProps) {
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const [isManualInput, setIsManualInput] = useState(false);
    const [points, setPoints] = useState('');
    const [rewardRule, setRewardRule] = useState('');
    const [reason, setReason] = useState('');
    const [calculatedPoints, setCalculatedPoints] = useState(0);
    const [taskStats, setTaskStats] = useState({
        participationRate: '0',
        validFeedbackRate: '0',
        pointsPerFeedback: 0,
        participantCount: 0,
        executionScore: 0,
    });

    // 获取任务详情以获取默认积分
    const { data: taskData } = api.review.getById.useQuery(
        { id: taskId || '' },
        { enabled: !!taskId && isOpen }
    );

    // 创建积分申请的mutation
    const createApplicationMutation = api.pointsApplication.create.useMutation({
        onSuccess: () => {
            showSuccessToast('积分申请已提交');
            onSuccess?.();
            handleCancel();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    useEffect(() => {
        if (isOpen && taskData?.data) {
            // 计算预计发放积分范围的中间值
            const minPoints = Math.floor((taskData.data.totalBudget || 0) * 0.5);
            const maxPoints = Math.floor(taskData.data.totalBudget || 0);
            const avgPoints = Math.floor((minPoints + maxPoints) / 2);
            setCalculatedPoints(avgPoints);
            setPoints(avgPoints.toString());

            // 设置任务统计信息
            const totalParticipants = taskData.data.maxParticipants || 1;
            const currentParticipants = taskData.data.currentParticipants || 0;
            const participationRate = Math.round((currentParticipants / totalParticipants) * 100);

            setTaskStats({
                participationRate: participationRate.toString(),
                validFeedbackRate: '0', // TODO: 从任务数据获取
                pointsPerFeedback: 0, // TODO: 从任务数据获取
                participantCount: currentParticipants,
                executionScore: 0, // TODO: 从任务数据获取
            });
        } else if (isOpen && defaultPoints) {
            setCalculatedPoints(defaultPoints);
            setPoints(defaultPoints.toString());
        }
    }, [isOpen, taskData, defaultPoints]);

    const handleSubmit = () => {
        if (!taskId) {
            showErrorToast('任务ID不存在');
            return;
        }

        const appliedPoints = parseFloat(points);
        if (isNaN(appliedPoints) || appliedPoints <= 0) {
            showErrorToast('请输入有效的积分数');
            return;
        }

        createApplicationMutation.mutate({
            taskId,
            appliedPoints,
            isManualInput,
            participationRate: isManualInput ? undefined : parseFloat(taskStats.participationRate),
            validFeedbackRate: isManualInput ? undefined : parseFloat(taskStats.validFeedbackRate),
            pointsPerFeedback: isManualInput ? undefined : taskStats.pointsPerFeedback,
            participantCount: isManualInput ? undefined : taskStats.participantCount,
            executionScore: isManualInput ? undefined : taskStats.executionScore,
            rewardRule: isManualInput ? undefined : rewardRule,
            reason,
        });
    };

    const handleCancel = () => {
        setIsManualInput(false);
        setPoints(calculatedPoints.toString());
        setRewardRule('');
        setReason('');
        onClose();
    };

    return (
        <DialogRoot open={isOpen} onOpenChange={(details) => !details.open && handleCancel()}>
            <DialogBackdrop />
            <DialogContent
                maxW="870px"
                borderRadius="8px"
                p={0}
                boxShadow="0px 4px 16px rgba(0, 0, 0, 0.15)"
            >
                {/* Header */}
                <DialogHeader
                    borderBottom="1px solid"
                    borderColor={COLORS.borderColor}
                    px={4}
                    py={3}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Text fontSize="16px" fontWeight="500" color={COLORS.textPrimary}>
                        积分申请
                    </Text>
                    <DialogCloseTrigger />
                </DialogHeader>

                {/* Body */}
                <DialogBody p={0} maxH="600px" overflowY="auto">
                    <Box p={6}>
                        {/* Manual Input Toggle */}
                        <Flex justify="space-between" mb={6} gap={4}>
                            <Text fontSize="14px" color={COLORS.textSecondary}>
                                手动填写
                            </Text>
                            <Switch
                                checked={isManualInput}
                                onCheckedChange={(details) => setIsManualInput(details.checked)}
                            />
                        </Flex>

                        {/* Points Input */}
                        <Box mb={6}>
                            <Text fontSize="14px" color={COLORS.textSecondary} mb={2}>
                                申请积分
                            </Text>
                            <Input
                                value={points}
                                onChange={(e) => setPoints(e.target.value)}
                                disabled={false}
                                bg={COLORS.bgSecondary}
                                borderColor={COLORS.bgSecondary}
                                borderRadius="2px"
                                h="32px"
                                fontSize="14px"
                                color={COLORS.textPrimary}
                                _placeholder={{ color: COLORS.textTertiary }}
                            />
                        </Box>

                        {/* Task Statistics Grid - Only show when manual input is OFF */}
                        {!isManualInput && (
                            <Box mb={6}>
                                <Grid templateColumns="repeat(5, 1fr)" gap={3}>
                                    {/* 参测率 */}
                                    <GridItem>
                                        <Text fontSize="12px" color={COLORS.textSecondary} mb={1}>
                                            参测率
                                        </Text>
                                        <InputGroup
                                            endElement={
                                                <Text fontSize="14px" color={COLORS.textSecondary} pr={2}>
                                                    %
                                                </Text>
                                            }
                                        >
                                            <Input
                                                value={taskStats.participationRate}
                                                onChange={(e) => setTaskStats({ ...taskStats, participationRate: e.target.value })}
                                                bg={COLORS.bgSecondary}
                                                borderColor={COLORS.bgSecondary}
                                                borderRadius="2px"
                                                h="32px"
                                                fontSize="14px"
                                                color={COLORS.textPrimary}
                                                _placeholder={{ color: COLORS.textTertiary }}
                                            />
                                        </InputGroup>
                                    </GridItem>

                                    {/* 有效反馈率 */}
                                    <GridItem>
                                        <Text fontSize="12px" color={COLORS.textSecondary} mb={1}>
                                            有效反馈率
                                        </Text>
                                        <InputGroup
                                            endElement={
                                                <Text fontSize="14px" color={COLORS.textSecondary} pr={2}>
                                                    %
                                                </Text>
                                            }
                                        >
                                            <Input
                                                value={taskStats.validFeedbackRate}
                                                onChange={(e) => setTaskStats({ ...taskStats, validFeedbackRate: e.target.value })}
                                                bg={COLORS.bgSecondary}
                                                borderColor={COLORS.bgSecondary}
                                                borderRadius="2px"
                                                h="32px"
                                                fontSize="14px"
                                                color={COLORS.textPrimary}
                                                _placeholder={{ color: COLORS.textTertiary }}
                                            />
                                        </InputGroup>
                                    </GridItem>

                                    {/* 每反馈积分 */}
                                    <GridItem>
                                        <Text fontSize="12px" color={COLORS.textSecondary} mb={1}>
                                            每反馈积分
                                        </Text>
                                        <Input
                                            value={taskStats.pointsPerFeedback}
                                            onChange={(e) => setTaskStats({ ...taskStats, pointsPerFeedback: parseInt(e.target.value) || 0 })}
                                            bg={COLORS.bgSecondary}
                                            borderColor={COLORS.bgSecondary}
                                            borderRadius="2px"
                                            h="32px"
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                            _placeholder={{ color: COLORS.textTertiary }}
                                        />
                                    </GridItem>

                                    {/* 参测人数 */}
                                    <GridItem>
                                        <Text fontSize="12px" color={COLORS.textSecondary} mb={1}>
                                            参测人数
                                        </Text>
                                        <Input
                                            value={taskStats.participantCount}
                                            onChange={(e) => setTaskStats({ ...taskStats, participantCount: parseInt(e.target.value) || 0 })}
                                            bg={COLORS.bgSecondary}
                                            borderColor={COLORS.bgSecondary}
                                            borderRadius="2px"
                                            h="32px"
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                            _placeholder={{ color: COLORS.textTertiary }}
                                        />
                                    </GridItem>

                                    {/* 执行分 */}
                                    <GridItem>
                                        <Text fontSize="12px" color={COLORS.textSecondary} mb={1}>
                                            执行分
                                        </Text>
                                        <Input
                                            value={taskStats.executionScore}
                                            onChange={(e) => setTaskStats({ ...taskStats, executionScore: parseInt(e.target.value) || 0 })}
                                            bg={COLORS.bgSecondary}
                                            borderColor={COLORS.bgSecondary}
                                            borderRadius="2px"
                                            h="32px"
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                            _placeholder={{ color: COLORS.textTertiary }}
                                        />
                                    </GridItem>
                                </Grid>
                            </Box>
                        )}

                        {/* Reward Rule Textarea - Only show when manual input is OFF */}
                        {!isManualInput && (
                            <Box mb={6}>
                                <Text fontSize="14px" color={COLORS.textSecondary} mb={2}>
                                    奖励规则
                                </Text>
                                <Textarea
                                    value={rewardRule}
                                    onChange={(e) => setRewardRule(e.target.value)}
                                    placeholder="请输入奖励规则..."
                                    bg={COLORS.bgSecondary}
                                    borderColor={COLORS.bgSecondary}
                                    borderRadius="2px"
                                    minH="80px"
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                    _placeholder={{ color: COLORS.textTertiary }}
                                    resize="vertical"
                                />
                            </Box>
                        )}

                        {/* Reason Textarea */}
                        <Box>
                            <Text fontSize="14px" color={COLORS.textSecondary} mb={2}>
                                事由
                            </Text>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="请输入申请事由..."
                                bg={COLORS.bgSecondary}
                                borderColor={COLORS.bgSecondary}
                                borderRadius="2px"
                                minH={isManualInput ? '306px' : '120px'}
                                fontSize="14px"
                                color={COLORS.textPrimary}
                                _placeholder={{ color: COLORS.textTertiary }}
                                resize="vertical"
                            />
                        </Box>
                    </Box>
                </DialogBody>

                {/* Footer */}
                <Flex
                    borderTop="1px solid"
                    borderColor={COLORS.borderColor}
                    p={4}
                    justify="flex-end"
                    gap={2}
                >
                    <Box
                        as="button"
                        px={6}
                        h="36px"
                        bg={COLORS.bgSecondary}
                        color={COLORS.textSecondary}
                        borderRadius="999px"
                        fontSize="14px"
                        fontWeight="500"
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ bg: '#E8E9ED' }}
                        onClick={handleCancel}
                    >
                        取消
                    </Box>
                    <Box
                        as="button"
                        px={6}
                        h="36px"
                        bg={`linear-gradient(90deg, ${COLORS.orange} 0%, ${COLORS.red} 100%)`}
                        color="white"
                        borderRadius="999px"
                        fontSize="14px"
                        fontWeight="500"
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ opacity: 0.9 }}
                        onClick={handleSubmit}
                    >
                        提交
                    </Box>
                </Flex>
            </DialogContent>
        </DialogRoot>
    );
}
