'use client';

import React from 'react';
import { Box, Flex, Text, Link, Spinner } from '@chakra-ui/react';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';

interface Message {
    id: string;
    title: string;
    content: string;
    isRead: boolean;
    type: string;
    messageType: 'ANNOUNCEMENT' | 'POPUP';
}

export default function MessageCard() {
    const router = useRouter();
    const utils = api.useUtils();

    // 获取最新的4条消息
    const { data: messageData, isLoading } = api.announcement.getMessageList.useQuery({
        page: 1,
        pageSize: 4,
        showUnreadOnly: false,
    });

    const messages = messageData?.data ?? [];

    // 标记公告为已读
    const markAnnouncementAsRead = api.announcement.markAsRead.useMutation({
        onSuccess: () => {
            // 刷新消息列表
            void utils.announcement.getMessageList.invalidate();
        },
    });

    // 标记弹窗为已读
    const markPopupAsRead = api.announcement.markPopupAsRead.useMutation({
        onSuccess: () => {
            // 刷新消息列表
            void utils.announcement.getMessageList.invalidate();
        },
    });

    // 处理跳转到消息中心
    const handleViewMore = () => {
        router.push('/crowdsource/messageCenter');
    };

    // 处理点击消息项
    const handleMessageClick = async (message: Message) => {
        // 如果未读，则标记为已读
        if (!message.isRead) {
            try {
                if (message.messageType === 'ANNOUNCEMENT') {
                    await markAnnouncementAsRead.mutateAsync({
                        announcementId: message.id,
                    });
                } else if (message.messageType === 'POPUP') {
                    await markPopupAsRead.mutateAsync({
                        popupId: message.id,
                    });
                }
            } catch (error) {
                console.error('标记已读失败:', error);
            }
        }

        // 跳转到消息中心
        router.push('/crowdsource/messageCenter');
    };

    // 去除HTML标签，获取纯文本
    const stripHtml = (html: string) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    return (
        <Box bg="white" borderRadius="8px" boxShadow="0 1px 2px rgba(0,0,0,0.05)" overflow="hidden">
            <Box p={4} borderBottom="1px" borderColor="#E5E6EB">
                <Flex justify="space-between">
                    <Text fontSize="16px" fontWeight="600" color="#1D2129">
                        消息中心
                    </Text>
                    <Link
                        fontSize="14px"
                        color="#86909C"
                        _hover={{ textDecoration: 'underline' }}
                        onClick={handleViewMore}
                        cursor="pointer"
                    >
                        更多&gt;
                    </Link>
                </Flex>
            </Box>

            {isLoading ? (
                <Box py={8} textAlign="center">
                    <Spinner size="sm" color="#E31424" />
                </Box>
            ) : messages.length > 0 ? (
                <Flex direction="column">
                    {messages.map((message, index) => (
                        <Box
                            key={message.id}
                            p={3}
                            _hover={{ bg: '#F9F9F9' }}
                            cursor="pointer"
                            transition="background-color 0.2s"
                            borderTop={index > 0 ? '1px' : 'none'}
                            borderColor="#E5E6EB"
                            bg={!message.isRead ? '#FAFBFC' : 'white'}
                            onClick={() => handleMessageClick(message)}
                        >
                            <Flex align="center" justify="space-between">
                                <Text
                                    fontSize="14px"
                                    fontWeight={!message.isRead ? '500' : '400'}
                                    color="#1D2129"
                                    flex={1}
                                    lineClamp={1}
                                >
                                    {stripHtml(message.title)}
                                </Text>
                                {!message.isRead && (
                                    <Box
                                        w="8px"
                                        h="8px"
                                        borderRadius="50%"
                                        bg="#E31424"
                                        flexShrink={0}
                                        ml={2}
                                    />
                                )}
                            </Flex>
                            <Text
                                fontSize="12px"
                                color="#4E5969"
                                mt={1}
                                lineClamp={1}
                            >
                                {stripHtml(message.content)}
                            </Text>
                        </Box>
                    ))}
                </Flex>
            ) : (
                <Box py={6} textAlign="center">
                    <Text fontSize="14px" color="#86909C">
                        暂无消息
                    </Text>
                </Box>
            )}
        </Box>
    );
}
