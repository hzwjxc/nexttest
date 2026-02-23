'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Flex,
    Text,
    Button,
    Image,
    CloseButton,
} from '@chakra-ui/react';
import { api } from '@/trpc/react';

const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    borderColor: '#E5E6EB',
};

interface HomepagePopup {
    id: string;
    type: string;
    title: string;
    image?: string;
    content?: string;
    link?: string;
    startTime: string | Date;
    endTime: string | Date;
    isActive: boolean;
}

export default function HomepagePopupModal() {
    const [popups, setPopups] = useState<HomepagePopup[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    // 获取所有启用的首页弹窗
    const { data: popupData } = api.homepagePopup.getAllActive.useQuery(
        {},
        {
            refetchOnMount: 'always',
            staleTime: 0,
        }
    );

    // 标记弹窗为已读的mutation
    const markPopupAsReadMutation = api.announcement.markPopupAsRead.useMutation();

    useEffect(() => {
        if (popupData && popupData.length > 0) {
            setPopups(popupData as HomepagePopup[]);
            setCurrentIndex(0);
            setIsOpen(true);
        }
    }, [popupData]);

    const currentPopup = popups[currentIndex];

    const handleClose = () => {
        if (currentPopup) {
            // 标记为已读
            markPopupAsReadMutation.mutate({ popupId: currentPopup.id });
        }
        setIsOpen(false);
    };

    const handleNext = () => {
        if (currentPopup) {
            // 标记为已读
            markPopupAsReadMutation.mutate({ popupId: currentPopup.id });
        }

        if (currentIndex < popups.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            handleClose();
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleLinkClick = () => {
        if (currentPopup?.link) {
            window.open(currentPopup.link, '_blank');
        }
        handleNext();
    };

    if (!currentPopup || !isOpen) {
        return null;
    }

    return (
        <>
            {/* 背景遮罩 */}
            <Box
                position="fixed"
                inset={0}
                bg="rgba(0, 0, 0, 0.5)"
                zIndex={999}
                onClick={handleClose}
            />

            {/* 弹窗容器 */}
            <Box
                position="fixed"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                zIndex={1000}
                bg={COLORS.bgPrimary}
                borderRadius="12px"
                boxShadow="0 10px 40px rgba(0, 0, 0, 0.15)"
                maxW="600px"
                w="90%"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 关闭按钮 */}
                <Box position="absolute" top={4} right={4} zIndex={10}>
                    <CloseButton
                        size="lg"
                        onClick={handleClose}
                        color={COLORS.textSecondary}
                        _hover={{ color: COLORS.textPrimary }}
                    />
                </Box>

                {/* 图片弹窗 */}
                {currentPopup.type === 'IMAGE' && currentPopup.image && (
                    <Box>
                        <Image
                            src={currentPopup.image}
                            alt={currentPopup.title}
                            w="100%"
                            h="auto"
                            borderRadius="12px 12px 0 0"
                            objectFit="cover"
                        />
                        <Box p={6}>
                            <Text
                                fontSize="18px"
                                fontWeight="600"
                                color={COLORS.textPrimary}
                                mb={4}
                            >
                                {currentPopup.title}
                            </Text>
                            <Flex gap={3} justify="flex-end">
                                {currentIndex > 0 && (
                                    <Button
                                        variant="outline"
                                        borderColor={COLORS.borderColor}
                                        color={COLORS.textSecondary}
                                        onClick={handlePrevious}
                                        _hover={{ bg: COLORS.bgSecondary }}
                                    >
                                        上一个
                                    </Button>
                                )}
                                {currentPopup.link && (
                                    <Button
                                        bg={COLORS.primary}
                                        color="white"
                                        onClick={handleLinkClick}
                                        _hover={{ opacity: 0.9 }}
                                    >
                                        查看详情
                                    </Button>
                                )}
                                {currentIndex < popups.length - 1 && (
                                    <Button
                                        bg={COLORS.primary}
                                        color="white"
                                        onClick={handleNext}
                                        _hover={{ opacity: 0.9 }}
                                    >
                                        下一个
                                    </Button>
                                )}
                            </Flex>
                        </Box>
                    </Box>
                )}

                {/* 文字弹窗 */}
                {currentPopup.type === 'TEXT' && (
                    <Box p={6}>
                        <Text
                            fontSize="20px"
                            fontWeight="600"
                            color={COLORS.textPrimary}
                            mb={4}
                        >
                            {currentPopup.title}
                        </Text>
                        <Text
                            fontSize="14px"
                            color={COLORS.textSecondary}
                            lineHeight="1.6"
                            mb={6}
                            whiteSpace="pre-wrap"
                        >
                            {currentPopup.content}
                        </Text>
                        <Flex gap={3} justify="flex-end">
                            {currentIndex > 0 && (
                                <Button
                                    variant="outline"
                                    borderColor={COLORS.borderColor}
                                    color={COLORS.textSecondary}
                                    onClick={handlePrevious}
                                    _hover={{ bg: COLORS.bgSecondary }}
                                >
                                    上一个
                                </Button>
                            )}
                            {currentPopup.link && (
                                <Button
                                    bg={COLORS.primary}
                                    color="white"
                                    onClick={handleLinkClick}
                                    _hover={{ opacity: 0.9 }}
                                >
                                    查看详情
                                </Button>
                            )}
                            {currentIndex < popups.length - 1 && (
                                <Button
                                    bg={COLORS.primary}
                                    color="white"
                                    onClick={handleNext}
                                    _hover={{ opacity: 0.9 }}
                                >
                                    下一个
                                </Button>
                            )}
                        </Flex>
                    </Box>
                )}

                {/* 分页指示器 */}
                {popups.length > 1 && (
                    <Box
                        textAlign="center"
                        py={3}
                        borderTop="1px"
                        borderColor={COLORS.borderColor}
                        fontSize="12px"
                        color={COLORS.textTertiary}
                    >
                        {currentIndex + 1} / {popups.length}
                    </Box>
                )}
            </Box>
        </>
    );
}
