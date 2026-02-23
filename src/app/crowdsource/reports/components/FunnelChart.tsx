import React from 'react';
import { Box, VStack, HStack, Text } from '@chakra-ui/react';
import { Info } from 'lucide-react';

const COLORS = {
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    line: '#999999',
};

interface FunnelChartProps {
    participationStats: {
        totalUsers: number;
        usersWithOrders: number;
        usersWithDefects: number;
        participationRate: number;
        totalTasks: number;
        totalDefects: number;
        validDefects: number;
        feedbackRate: number;
    };
    isLoading?: boolean;
}

export default function FunnelChart({ participationStats, isLoading = false }: FunnelChartProps) {
    const trapezoidHeight = 70;
    const centerX = 200; // Increased to make funnel wider

    // Trapezoid dimensions - inverted funnel (top narrow, bottom wide)
    const trapezoids = [
        {
            topWidth: 200,
            bottomWidth: 170,
            color: '#3078e7',
            label: '领取任务情况',
        },
        {
            topWidth: 170,
            bottomWidth: 140,
            color: '#5f98f1',
            label: '提交缺陷情况',
        },
        {
            topWidth: 140,
            bottomWidth: 110,
            color: '#96befc',
            label: '有效缺陷情况',
        },
    ];

    const metrics = [
        {
            label: '用户参测率',
            value: '39.36%',
            arrow: '/images/reports/arrow_1.png',
        },
        {
            label: '有效反馈率',
            value: '18.32%',
            arrow: '/images/reports/arrow_2.png',
        },
    ];

    return (
        <VStack gap={6} align="center" w="100%" position="relative">
            {/* Funnel visualization with trapezoids */}
            <Box position="relative" w="100%">
                <svg
                    width="100%"
                    height="280"
                    viewBox="0 0 700 280"
                    style={{ overflow: 'visible' }}
                >
                    {/* Draw trapezoids without gaps */}
                    {trapezoids.map((trap, index) => {
                        const yOffset = index * trapezoidHeight;

                        // Trapezoid points - inverted trapezoid (top narrow, bottom wide)
                        const topLeft = centerX - trap.topWidth / 2;
                        const topRight = centerX + trap.topWidth / 2;
                        const bottomLeft = centerX - trap.bottomWidth / 2;
                        const bottomRight = centerX + trap.bottomWidth / 2;

                        const points = `${topLeft},${yOffset} ${topRight},${yOffset} ${bottomRight},${yOffset + trapezoidHeight} ${bottomLeft},${yOffset + trapezoidHeight}`;

                        return (
                            <g key={index}>
                                {/* Trapezoid */}
                                <polygon
                                    points={points}
                                    fill={trap.color}
                                    opacity="0.85"
                                    strokeWidth="0"
                                />

                                {/* Label text */}
                                <text
                                    x={centerX}
                                    y={yOffset + trapezoidHeight / 2}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="white"
                                    fontSize="15"
                                    fontWeight="500"
                                    fontFamily="PingFang SC, sans-serif"
                                >
                                    {trap.label}
                                </text>

                                {/* Arrow images and metrics to the right */}
                                {index < trapezoids.length - 1 && (
                                    <>
                                        {/* Arrow image - made larger */}
                                        <image
                                            href={metrics[index].arrow}
                                            x={
                                                bottomRight -
                                                (index === 0 ? 60 : 50)
                                            }
                                            y={yOffset + trapezoidHeight - 20}
                                            width="150"
                                            height="60"
                                        />
                                        {/* Metric label */}
                                        {/* <text
                                            x={
                                                bottomRight +
                                                (index === 0 ? 50 : 65)
                                            }
                                            y={yOffset + trapezoidHeight}
                                            fontSize="12"
                                            fill={COLORS.textSecondary}
                                            fontFamily="PingFang SC, sans-serif"
                                        >
                                            {metrics[index].label}
                                        </text> */}
                                        {/* Metric value */}
                                        {/* <text
                                            x={
                                                bottomRight +
                                                (index === 0 ? 50 : 65)
                                            }
                                            y={yOffset + trapezoidHeight + 20}
                                            fontSize="13"
                                            fontWeight="600"
                                            fill={COLORS.textPrimary}
                                            fontFamily="PingFang SC, sans-serif"
                                        >
                                            {metrics[index].value}
                                        </text> */}
                                    </>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </Box>

            {/* Legend and metrics below */}
            <VStack
                gap={4}
                align="stretch"
                w="100%"
                position="relative"
                left={635}
                top={-240}
            >
                <HStack
                    justify="space-around"
                    align="start"
                    flexDirection="column"
                    gap={6}
                >
                    <VStack align="start" gap={0}>
                        <HStack gap={1}>
                            <Text fontSize="10px" color={COLORS.textSecondary}>
                                用户参测率
                            </Text>
                            <Info size={16} color={COLORS.textTertiary} />
                        </HStack>
                        <Text
                            fontSize="16px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                        >
                            {isLoading ? '...' : `${participationStats.participationRate}%`}
                        </Text>
                    </VStack>

                    <VStack align="start" gap={1}>
                        <HStack gap={1}>
                            <Text fontSize="10px" color={COLORS.textSecondary}>
                                有效反馈率
                            </Text>
                            <Info size={16} color={COLORS.textTertiary} />
                        </HStack>
                        <Text
                            fontSize="16px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                        >
                            {isLoading ? '...' : `${participationStats.feedbackRate}%`}
                        </Text>
                    </VStack>
                </HStack>
            </VStack>
        </VStack>
    );
}
