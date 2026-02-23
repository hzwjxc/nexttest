'use client';

import React from 'react';
import { Box, Flex, Text, Grid, GridItem, Image } from '@chakra-ui/react';
import { api } from '@/trpc/react';

export default function ShortcutsCard() {
    // 获取滑动标签数据，只获取PC端渠道的标签
    const { data: slidingTabsData } = api.slidingTab.getAll.useQuery();

    // 筛选PC端渠道的滑动标签
    const shortcuts = slidingTabsData?.filter((tab) =>
        tab.channels.includes('PC')
    ) || [];

    const handleShortcutClick = (link: string) => {
        if (link) {
            // 检查是否是外部链接
            if (link.startsWith('http://') || link.startsWith('https://')) {
                window.open(link, '_blank');
            } else {
                // 内部链接，使用路由导航
                window.location.href = link;
            }
        }
    };

    return (
        <Box bg="white" borderRadius="8px" boxShadow="0 1px 2px rgba(0,0,0,0.05)" p={6}>
            <Text fontSize="16px" fontWeight="600" color="#1D2129" mb={6}>
                快捷入口
            </Text>

            {shortcuts.length === 0 ? (
                <Box textAlign="center" py={8}>
                    <Text fontSize="14px" color="#86909C">
                        暂无快捷入口
                    </Text>
                </Box>
            ) : (
                <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                    {shortcuts.map((shortcut) => (
                        <GridItem
                            key={shortcut.id}
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            gap={2}
                            cursor="pointer"
                            _hover={{ transform: 'scale(1.05)' }}
                            transition="transform 0.2s"
                            onClick={() => handleShortcutClick(shortcut.link)}
                        >
                            <Box
                                w="48px"
                                h="48px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                bg="#F2F3F5"
                                borderRadius="6px"
                                overflow="hidden"
                            >
                                <Image
                                    src={shortcut.image}
                                    alt={shortcut.text}
                                    w="100%"
                                    h="100%"
                                    objectFit="cover"
                                />
                            </Box>
                            <Text fontSize="12px" textAlign="center" color="#1D2129">
                                {shortcut.text}
                            </Text>
                        </GridItem>
                    ))}
                </Grid>
            )}
        </Box>
    );
}
