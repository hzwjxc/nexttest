import React from 'react';
import { Box, Flex, VStack, HStack, Text } from '@chakra-ui/react';
import { ChevronUp, ChevronDown, Info } from 'lucide-react';

interface StatCardProps {
    icon: string;
    title: string;
    value: string;
    change: string;
    changeType: 'up' | 'down';
}

const COLORS = {
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgSecondary: '#F2F3F5',
    borderColor: '#E5E6EB',
};

export default function StatCard({
    icon,
    title,
    value,
    change,
    changeType,
}: StatCardProps) {
    return (
        <Flex gap={4} align="center">
            {/* Icon */}
            <Box
                bg={COLORS.bgSecondary}
                borderRadius="6px"
                p={2}
                display="flex"
                alignItems="center"
                justifyContent="center"
                w="48px"
                h="48px"
                fontSize="24px"
                flexShrink={0}
            >
                {icon}
            </Box>

            {/* Content */}
            <VStack align="start" gap={2} flex={1}>
                <HStack gap={1}>
                    <Text fontSize="14px" color={COLORS.textSecondary}>
                        {title}
                    </Text>
                    <Info size={16} color={COLORS.textTertiary} />
                </HStack>

                <VStack align="start" gap={2}>
                    <Text
                        fontSize="28px"
                        fontWeight="600"
                        color={COLORS.textPrimary}
                    >
                        {value}
                    </Text>

                    <HStack gap={1} fontSize="12px" color={COLORS.textTertiary}>
                        <Text>较前一日</Text>
                        <HStack gap={0.5}>
                            {changeType === 'up' ? (
                                <ChevronUp
                                    size={10}
                                    color={COLORS.textPrimary}
                                />
                            ) : (
                                <ChevronDown
                                    size={10}
                                    color={COLORS.textPrimary}
                                />
                            )}
                            <Text color={COLORS.textPrimary}>{change}</Text>
                        </HStack>
                    </HStack>
                </VStack>
            </VStack>
        </Flex>
    );
}
