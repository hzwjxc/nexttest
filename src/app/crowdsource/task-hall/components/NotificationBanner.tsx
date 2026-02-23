'use client';

import React from 'react';
import { Box, Flex, Text, Icon } from '@chakra-ui/react';
import { Volume2, X } from 'lucide-react';
import { api } from '@/trpc/react';

const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    bgWarning: '#FFF7E6',
    borderWarning: '#FFE7BA',
};

export default function NotificationBanner() {
    // 获取未读的系统公告
    const { data: announcements, refetch } = api.announcement.getUnread.useQuery();

    // 标记已读 mutation
    const markAsReadMutation = api.announcement.markAsRead.useMutation({
        onSuccess: () => {
            // 标记成功后重新获取未读公告列表
            void refetch();
        },
    });

    // 只显示第一条未读公告
    const announcement = announcements?.[0];

    // 如果没有公告，不显示
    if (!announcement) {
        return null;
    }

    const handleDismiss = () => {
        // 调用标记已读接口
        markAsReadMutation.mutate({
            announcementId: announcement.id,
        });
    };

    return (
        <Box
            bg={COLORS.bgWarning}
            borderBottom="1px solid"
            borderColor={COLORS.borderWarning}
            py={2}
            px={6}
        >
            <Flex
                maxW="1400px"
                mx="auto"
                align="center"
                justify="space-between"
                gap={4}
            >
                <Flex align="center" gap={3} flex={1}>
                    {/* 喇叭图标 */}
                    <Icon
                        as={Volume2}
                        boxSize={5}
                        color={COLORS.primary}
                        flexShrink={0}
                    />

                    {/* 公告标题 */}
                    <Text
                        fontSize="14px"
                        fontWeight="500"
                        color={COLORS.textPrimary}
                        flexShrink={0}
                    >
                        {announcement.title}：
                    </Text>

                    {/* 公告内容 */}
                    <Text
                        fontSize="14px"
                        color={COLORS.textSecondary}
                        flex={1}
                        lineClamp={1}
                        dangerouslySetInnerHTML={{ __html: announcement.content }}
                    />
                </Flex>

                {/* 关闭按钮 */}
                <Box
                    as="button"
                    onClick={handleDismiss}
                    cursor={markAsReadMutation.isPending ? 'default' : 'pointer'}
                    p={1}
                    borderRadius="4px"
                    _hover={markAsReadMutation.isPending ? {} : { bg: 'rgba(0, 0, 0, 0.05)' }}
                    flexShrink={0}
                    opacity={markAsReadMutation.isPending ? 0.5 : 1}
                    pointerEvents={markAsReadMutation.isPending ? 'none' : 'auto'}
                >
                    <Icon as={X} boxSize={4} color={COLORS.textSecondary} />
                </Box>
            </Flex>
        </Box>
    );
}
