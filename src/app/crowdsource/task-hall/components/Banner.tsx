'use client';

import React, { useState, useEffect } from 'react';
import { Box, Flex, Image, Button, Heading, Text } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/trpc/react';

interface BannerSlide {
    id: string;
    image: string;
    link: string;
}

interface BannerProps {
    autoPlay?: boolean;
    autoPlayInterval?: number;
}

export default function Banner({
    autoPlay = true,
    autoPlayInterval = 5000,
}: BannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // 获取轮播图数据，只获取PC端渠道的轮播图
    const { data: carouselData } = api.carousel.getAll.useQuery();

    // 筛选PC端渠道的轮播图
    const slides = carouselData?.filter((carousel) =>
        carousel.channels.includes('PC')
    ) || [];

    useEffect(() => {
        if (!autoPlay || slides.length === 0) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, autoPlayInterval);
        return () => clearInterval(timer);
    }, [autoPlay, autoPlayInterval, slides.length]);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const handleSlideClick = (link: string) => {
        if (link) {
            window.open(link, '_blank');
        }
    };

    // 如果没有轮播图数据，显示空状态
    if (slides.length === 0) {
        return (
            <Box
                position="relative"
                borderRadius="8px"
                overflow="hidden"
                bg="gray.100"
                h="300px"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Text color="gray.500" fontSize="sm">
                    暂无轮播图
                </Text>
            </Box>
        );
    }

    return (
        <Box position="relative" borderRadius="8px" overflow="hidden" bg="white" h="300px">
            <Flex position="relative" h="100%" overflow="hidden">
                {slides.map((slide, index) => (
                    <Box
                        key={slide.id}
                        position="absolute"
                        top={0}
                        left={0}
                        w="100%"
                        h="100%"
                        opacity={index === currentIndex ? 1 : 0}
                        transition="opacity 0.5s ease-in-out"
                        pointerEvents={index === currentIndex ? 'auto' : 'none'}
                        cursor={slide.link ? 'pointer' : 'default'}
                        onClick={() => handleSlideClick(slide.link)}
                    >
                        <Image
                            src={slide.image}
                            alt={`Carousel ${index + 1}`}
                            w="100%"
                            h="100%"
                            objectFit="cover"
                        />
                    </Box>
                ))}
            </Flex>

            {/* 只有多于1张图片时才显示导航按钮 */}
            {slides.length > 1 && (
                <>
                    <Button
                        position="absolute"
                        left={4}
                        top="50%"
                        transform="translateY(-50%)"
                        zIndex={10}
                        bg="rgba(0, 0, 0, 0.3)"
                        color="white"
                        borderRadius="50%"
                        w="40px"
                        h="40px"
                        minW="40px"
                        p={0}
                        _hover={{ bg: 'rgba(0, 0, 0, 0.5)' }}
                        onClick={goToPrevious}
                    >
                        <ChevronLeft size={24} />
                    </Button>

                    <Button
                        position="absolute"
                        right={4}
                        top="50%"
                        transform="translateY(-50%)"
                        zIndex={10}
                        bg="rgba(0, 0, 0, 0.3)"
                        color="white"
                        borderRadius="50%"
                        w="40px"
                        h="40px"
                        minW="40px"
                        p={0}
                        _hover={{ bg: 'rgba(0, 0, 0, 0.5)' }}
                        onClick={goToNext}
                    >
                        <ChevronRight size={24} />
                    </Button>

                    <Flex
                        position="absolute"
                        bottom={4}
                        left="50%"
                        transform="translateX(-50%)"
                        gap={2}
                        zIndex={10}
                    >
                        {slides.map((_, index) => (
                            <Box
                                key={index}
                                w={index === currentIndex ? '28px' : '8px'}
                                h="8px"
                                borderRadius="4px"
                                bg={
                                    index === currentIndex
                                        ? 'rgba(227, 20, 36, 0.3)'
                                        : 'rgba(255, 255, 255, 0.5)'
                                }
                                cursor="pointer"
                                transition="all 0.3s ease"
                                onClick={() => goToSlide(index)}
                                _hover={{
                                    bg:
                                        index === currentIndex
                                            ? 'rgba(227, 20, 36, 0.5)'
                                            : 'rgba(255, 255, 255, 0.8)',
                                }}
                            />
                        ))}
                    </Flex>
                </>
            )}
        </Box>
    );
}
