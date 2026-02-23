'use client';

import React, { useState } from 'react';
import {
    Box,
    Flex,
    Text,
    Textarea,
} from '@chakra-ui/react';
import {
    DialogRoot,
    DialogBackdrop,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogCloseTrigger,
} from "@/app/_components/ui/dialog";
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';

const COLORS = {
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgSecondary: '#F2F3F5',
    borderColor: '#E5E6EB',
    orange: '#FF9565',
    red: '#FE626B',
};

interface RewardDistributionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    taskId?: string;
    onSuccess?: () => void;
}

export function RewardDistributionDialog({
    isOpen,
    onClose,
    taskId,
    onSuccess,
}: RewardDistributionDialogProps) {
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const [reason, setReason] = useState('');

    // 积分发放申请的mutation
    const applyDistributionMutation = api.review.applyRewardDistribution.useMutation({
        onSuccess: () => {
            showSuccessToast('积分发放申请已提交');
            onSuccess?.();
            handleCancel();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    const handleSubmit = () => {
        if (!taskId) {
            showErrorToast('任务ID不存在');
            return;
        }

        if (!reason.trim()) {
            showErrorToast('请输入事由');
            return;
        }

        applyDistributionMutation.mutate({
            taskId,
            reason: reason.trim(),
        });
    };

    const handleCancel = () => {
        setReason('');
        onClose();
    };

    return (
        <DialogRoot open={isOpen} onOpenChange={(details) => !details.open && handleCancel()}>
            <DialogBackdrop />
            <DialogContent
                maxW="600px"
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
                        积分发放申请
                    </Text>
                    <DialogCloseTrigger />
                </DialogHeader>

                {/* Body */}
                <DialogBody p={0}>
                    <Box p={6}>
                        {/* Reason Textarea */}
                        <Box>
                            <Text fontSize="14px" color={COLORS.textSecondary} mb={2}>
                                事由
                            </Text>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="请输入事由..."
                                bg={COLORS.bgSecondary}
                                borderColor={COLORS.bgSecondary}
                                borderRadius="2px"
                                minH="200px"
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
