'use client';

import React from 'react';
import { Box, Container, Flex, Text, Button } from '@chakra-ui/react';
import { FiUser, FiFileText, FiAlertCircle, FiUsers, FiGift } from 'react-icons/fi';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';

const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    border: '#E5E6EB',
    cardBg: '#FFFFFF',
    statBg: '#F7F8FA',
};

// 统计卡片组件
interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    items: Array<{ label: string; value: string | number | React.ReactNode }>;
    iconBg: string;
    iconColor: string;
    showButton?: boolean;
    onButtonClick?: () => void;
}

function StatCard({ icon, title, items, iconBg, iconColor, showButton, onButtonClick }: StatCardProps) {
    return (
        <Box
            bg={COLORS.cardBg}
            borderRadius="8px"
            boxShadow="0 2px 8px rgba(0,0,0,0.08)"
            p={6}
            pb={10}
            h="100%"
            display="flex"
            flexDirection="column"
        >
            {/* 标题行 */}
            <Flex align="center" gap={3} mb={5}>
                <Box
                    w="40px"
                    h="40px"
                    borderRadius="8px"
                    bg={iconBg}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color={iconColor}
                    fontSize="20px"
                >
                    {icon}
                </Box>
                <Text fontSize="16px" fontWeight="600" color={COLORS.textPrimary}>
                    {title}
                </Text>
            </Flex>

            {/* 统计项 */}
            <Flex direction="column" gap={3} flex={1}>
                {items.map((item, index) => (
                    <Flex
                        key={index}
                        align="center"
                        justify="flex-start"
                        bg={COLORS.statBg}
                        borderRadius="6px"
                        px={4}
                        py={3}
                        gap={2}
                    >
                        <Text fontSize="16px" color={COLORS.textSecondary}>
                            {item.label}
                        </Text>
                        {item.value && (
                            <Text fontSize="16px" fontWeight="600" color={COLORS.textSecondary}>
                                {item.value}
                            </Text>
                        )}
                    </Flex>
                ))}
            </Flex>

            {/* 按钮（如果有） */}
            {showButton && (
                <Button
                    mt={20}
                    w="60%"
                    mx="auto"
                    bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                    color="white"
                    fontSize="14px"
                    fontWeight="500"
                    borderRadius="20px"
                    h="40px"
                    onClick={onButtonClick}
                    _hover={{
                        opacity: 0.9,
                    }}
                >
                    积分明细
                </Button>
            )}
        </Box>
    );
}

export default function WorkbenchPage() {
    const router = useRouter();
    const { data: stats, isLoading } = api.workbench.getStats.useQuery();

    if (isLoading) {
        return (
            <Box minH="calc(100vh - 72px)" pt="72px" bg="#F5F7FA">
                <Container maxW="1400px" py={8}>
                    <Text>加载中...</Text>
                </Container>
            </Box>
        );
    }

    return (
        <Box minH="calc(100vh - 72px)" pt="72px" bg="#F5F7FA">
            <Container maxW="1400px" py={8}>
                {/* 第一行：3个卡片 */}
                <Flex gap={6} mb={6}>
                    {/* 我发起的任务 */}
                    <Box flex={1}>
                        <StatCard
                            icon={<FiUser />}
                            title="我发起的任务"
                            items={[
                                { label: '共计', value: `${stats?.createdTasks.total ?? 0}个` },
                                { label: '已结束', value: `${stats?.createdTasks.completed ?? 0}个` },
                                { label: '未结束', value: `${stats?.createdTasks.pending ?? 0}个` },
                            ]}
                            iconBg="rgba(118, 133, 253, 0.1)"
                            iconColor="#7685FD"
                        />
                    </Box>

                    {/* 待审核缺陷/建议 */}
                    <Box flex={1}>
                        <StatCard
                            icon={<FiFileText />}
                            title="待审核缺陷/建议"
                            items={[
                                { label: '待判定', value: `${stats?.pendingReview.total ?? 0}个` },
                            ]}
                            iconBg="rgba(255, 120, 117, 0.1)"
                            iconColor="#FF7875"
                        />
                    </Box>

                    {/* 缺陷/建议管理 */}
                    <Box flex={1}>
                        <StatCard
                            icon={<FiAlertCircle />}
                            title="缺陷/建议管理"
                            items={[
                                { label: '有效缺陷共计', value: `${stats?.defectManagement.validDefects ?? 0}个` },
                                { label: '有效建议共计', value: `${stats?.defectManagement.validSuggestions ?? 0}个` },
                            ]}
                            iconBg="rgba(255, 178, 55, 0.1)"
                            iconColor="#FFB237"
                        />
                    </Box>
                </Flex>

                {/* 第二行：2个卡片 */}
                <Flex gap={6}>
                    {/* 注册用户 */}
                    <Box flex={1}>
                        <StatCard
                            icon={<FiUsers />}
                            title="注册用户"
                            items={[
                                { label: '注册用户数', value: stats?.registeredUsers.total ?? 0 },
                            ]}
                            iconBg="rgba(255, 146, 102, 0.1)"
                            iconColor="#FF9266"
                        />
                    </Box>

                    {/* 剩余积分 */}
                    <Box flex={1}>
                        <StatCard
                            icon={<FiGift />}
                            title="剩余积分"
                            items={[
                                { label: `${stats?.remainingPoints.total ?? 0}积分`, value: '' },
                            ]}
                            iconBg="rgba(255, 178, 55, 0.1)"
                            iconColor="#FFB237"
                            showButton
                            onButtonClick={() => router.push('/crowdsource/workbench/pointsDetails')}
                        />
                    </Box>
                    <Box flex={1}></Box>
                </Flex>
            </Container>
        </Box>
    );
}
