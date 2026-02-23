'use client';

import React, { useState } from 'react';
import {
    Box,
    Container,
    Flex,
    Text,
    Button,
    Image,
    Spinner,
} from '@chakra-ui/react';
import { LuCrown, LuMedal } from 'react-icons/lu';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';

// 设计系统颜色
const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    bgTertiary: '#F3F7FB',
    borderColor: '#E5E6EB',
    yellow: '#FFD93B',
    gold: '#FFB800',
    pink: '#FF5179',
};

// 排行榜数据类型
type RankingUser = {
    id: string;
    rank: number;
    name: string;
    department: string;
    points: number;
    avatar: string;
};

// 排名徽章组件
function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <Flex align="center" justify="center" position="relative">
                <LuCrown size={24} color={COLORS.yellow} />
                <Text
                    position="absolute"
                    fontSize="10px"
                    fontWeight="700"
                    color={COLORS.textPrimary}
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                >
                    1
                </Text>
            </Flex>
        );
    } else if (rank === 2) {
        return (
            <Flex align="center" justify="center" position="relative">
                <LuMedal size={24} color="#C0C0C0" />
                <Text
                    position="absolute"
                    fontSize="10px"
                    fontWeight="700"
                    color={COLORS.textPrimary}
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                >
                    2
                </Text>
            </Flex>
        );
    } else if (rank === 3) {
        return (
            <Flex align="center" justify="center" position="relative">
                <LuMedal size={24} color="#CD7F32" />
                <Text
                    position="absolute"
                    fontSize="10px"
                    fontWeight="700"
                    color={COLORS.textPrimary}
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                >
                    3
                </Text>
            </Flex>
        );
    }
    return (
        <Text fontSize="14px" fontWeight="500" color={COLORS.textSecondary}>
            {rank}
        </Text>
    );
}

// 前三名展示卡片
function TopThreeCard({
    users,
    iconType,
}: {
    users: RankingUser[];
    iconType: 'coin' | 'gift';
}) {
    const orderedUsers = [
        users.find((u: RankingUser) => u.rank === 2)!,
        users.find((u: RankingUser) => u.rank === 1)!,
        users.find((u: RankingUser) => u.rank === 3)!,
    ];

    return (
        <Flex justify="center" align="flex-end" gap={8} py={8} px={4}>
            {orderedUsers.map((user) => {
                const isFirst = user.rank === 1;
                const isSecond = user.rank === 2;
                const isThird = user.rank === 3;

                return (
                    <Flex
                        key={user.id}
                        direction="column"
                        align="center"
                        gap={3}
                        position="relative"
                        mt={isFirst ? 0 : isSecond ? 4 : 6}
                    >
                        {/* 排名数字背景 */}
                        <Text
                            position="absolute"
                            top={isFirst ? '-30px' : isSecond ? '-20px' : '-15px'}
                            fontSize={isFirst ? '100px' : isSecond ? '80px' : '70px'}
                            fontWeight="900"
                            color="rgba(0,0,0,0.03)"
                            lineHeight={1}
                            zIndex={0}
                            pointerEvents="none"
                        >
                            {user.rank}
                        </Text>

                        {/* 头像容器 */}
                        <Box
                            position="relative"
                            zIndex={1}
                        >
                            {/* 皇冠图标 */}
                            {isFirst && (
                                <Box
                                    position="absolute"
                                    top="-16px"
                                    left="50%"
                                    transform="translateX(-50%)"
                                    zIndex={2}
                                >
                                    <LuCrown size={28} color={COLORS.yellow} />
                                </Box>
                            )}

                            {/* 头像 */}
                            <Box
                                borderRadius="full"
                                border={isFirst ? `4px solid ${COLORS.yellow}` : isSecond ? '3px solid #C0C0C0' : '3px solid #CD7F32'}
                                p={isFirst ? '4px' : '3px'}
                                bg={COLORS.bgPrimary}
                            >
                                <Image
                                    src={user.avatar || "/placeholder.svg"}
                                    alt={user.name}
                                    w={isFirst ? '80px' : isSecond ? '64px' : '56px'}
                                    h={isFirst ? '80px' : isSecond ? '64px' : '56px'}
                                    borderRadius="full"
                                    objectFit="cover"
                                />
                            </Box>

                            {/* 排名徽章 */}
                            <Box
                                position="absolute"
                                bottom="-8px"
                                left="50%"
                                transform="translateX(-50%)"
                                bg={COLORS.bgPrimary}
                                borderRadius="full"
                                p={1}
                                boxShadow="0 2px 4px rgba(0,0,0,0.1)"
                            >
                                <RankBadge rank={user.rank} />
                            </Box>
                        </Box>

                        {/* 用户信息 */}
                        <Flex direction="column" align="center" gap={1} zIndex={1}>
                            <Text
                                fontSize={isFirst ? '18px' : '16px'}
                                fontWeight="600"
                                color={COLORS.textPrimary}
                            >
                                {user.name}
                            </Text>
                            <Text fontSize="12px" color={COLORS.textTertiary}>
                                {user.department}
                            </Text>
                            <Flex align="center" gap={1} mt={1}>
                                <Text
                                    fontSize={isFirst ? '18px' : '16px'}
                                    fontWeight="700"
                                    color={iconType === 'coin' ? COLORS.gold : COLORS.pink}
                                >
                                    {user.points}
                                </Text>
                                {iconType === 'coin' ? (
                                    <Image w="16px" src="/images/task-hall/jinbi.png" alt="金币" />
                                ) : (
                                    <Image w="18px" src="/images/academy/bug-fill.png" alt="缺陷" />
                                )}
                            </Flex>
                        </Flex>
                    </Flex>
                );
            })}
        </Flex>
    );
}

// 排名卡片组件 - 用于展示单个榜单
function RankingSection({
    title,
    icon,
    users,
    iconType,
    searchQuery,
    isLoading,
    onPeriodChange,
}: {
    title: string;
    icon: React.ReactNode;
    users: RankingUser[];
    iconType: 'coin' | 'gift';
    searchQuery: string;
    isLoading: boolean;
    onPeriodChange: (period: 'month' | 'quarter') => void;
}) {
    const [activeTimeRange, setActiveTimeRange] = useState<'month' | 'quarter'>('month');

    const handlePeriodChange = (period: 'month' | 'quarter') => {
        setActiveTimeRange(period);
        onPeriodChange(period);
    };

    // 过滤搜索
    const filteredData = users.filter((user: RankingUser) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 只显示前10条数据
    const topTenData = filteredData.slice(0, 10);

    // 获取前三名
    const topThree = topTenData.slice(0, 3);
    // 获取剩余排名（4-10名）
    const restRanking = topTenData.slice(3);

    return (
        <Box bg={COLORS.bgPrimary} borderRadius="12px" p={6} boxShadow="0 1px 2px rgba(0,0,0,0.05)">
            {/* 前三名展示区域 - 包含标题 */}
            <Box
                bg="linear-gradient(265deg, #F9D9F4 1.06%, #F4E7D2 99.1%)"
                borderRadius="12px"
                overflow="hidden"
                pb={4}
            >
                {/* 标题 */}
                <Flex align="center" gap={2} px={6} pt={6} pb={4}>
                    <Text fontSize="20px" fontWeight="700" color={COLORS.textPrimary}>
                        {title}
                    </Text>
                    {icon}
                </Flex>

                {/* 前三名 */}
                {isLoading ? (
                    <Flex justify="center" align="center" py={8}>
                        <Spinner size="lg" color={COLORS.primary} />
                    </Flex>
                ) : topThree.length >= 3 ? (
                    <TopThreeCard users={topThree} iconType={iconType} />
                ) : (
                    <Box textAlign="center" py={8}>
                        <Text color={COLORS.textTertiary}>暂无数据</Text>
                    </Box>
                )}
            </Box>

            {/* 月榜/季榜切换按钮 - 左对齐,灰色背景 */}
            <Flex gap={2} mt={4} mb={4}>
                <Button
                    size="sm"
                    bg={activeTimeRange === 'month'
                        ? 'linear-gradient(90deg, #FFA37C 0%, #C43BF4 100%)'
                        : COLORS.bgSecondary
                    }
                    color={activeTimeRange === 'month' ? 'white' : COLORS.textSecondary}
                    fontSize="14px"
                    fontWeight="500"
                    px={4}
                    h="32px"
                    borderRadius="6px"
                    border="none"
                    onClick={() => handlePeriodChange('month')}
                    _hover={{
                        opacity: 0.9,
                    }}
                >
                    月榜
                </Button>
                <Button
                    size="sm"
                    bg={activeTimeRange === 'quarter'
                        ? 'linear-gradient(90deg, #FFA37C 0%, #C43BF4 100%)'
                        : COLORS.bgSecondary
                    }
                    color={activeTimeRange === 'quarter' ? 'white' : COLORS.textSecondary}
                    fontSize="14px"
                    fontWeight="500"
                    px={4}
                    h="32px"
                    borderRadius="6px"
                    border="none"
                    onClick={() => handlePeriodChange('quarter')}
                    _hover={{
                        opacity: 0.9,
                    }}
                >
                    季榜
                </Button>
            </Flex>

            {/* 排名列表 */}
            <Box borderRadius="12px" overflow="hidden" border="1px solid" borderColor={COLORS.borderColor}>
                {isLoading ? (
                    <Flex justify="center" align="center" py={8}>
                        <Spinner size="md" color={COLORS.primary} />
                    </Flex>
                ) : restRanking.length > 0 ? (
                    restRanking.map((user: RankingUser, index: number) => (
                        <Flex
                            key={user.id}
                            align="center"
                            py={4}
                            px={6}
                            borderBottom={index !== restRanking.length - 1 ? "1px solid" : "none"}
                            borderColor={COLORS.borderColor}
                            _hover={{ bg: COLORS.bgTertiary }}
                            transition="background-color 0.2s"
                        >
                            {/* 排名 */}
                            <Flex align="center" justify="center" w="80px" flexShrink={0}>
                                <Text
                                    fontSize="16px"
                                    fontWeight="600"
                                    color={COLORS.textPrimary}
                                    w="32px"
                                    h="32px"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    bg={COLORS.bgSecondary}
                                    borderRadius="full"
                                >
                                    {user.rank}
                                </Text>
                            </Flex>

                            {/* 用户头像和姓名 */}
                            <Flex align="center" gap={3} w="200px" flexShrink={0}>
                                <Image
                                    src={user.avatar || "/placeholder.svg"}
                                    alt={user.name}
                                    w="40px"
                                    h="40px"
                                    borderRadius="full"
                                    objectFit="cover"
                                />
                                <Text fontSize="15px" fontWeight="500" color={COLORS.textPrimary}>
                                    {user.name}
                                </Text>
                            </Flex>

                            {/* 分行/部门 */}
                            <Box flex={1}>
                                <Text fontSize="14px" color={COLORS.textSecondary}>
                                    {user.department}
                                </Text>
                            </Box>

                            {/* 积分/贡献数 */}
                            <Flex align="center" gap={2} w="120px" flexShrink={0} justify="flex-end">
                                <Text
                                    fontSize="16px"
                                    fontWeight="600"
                                    color={iconType === 'coin' ? COLORS.gold : COLORS.pink}
                                >
                                    {user.points}
                                </Text>
                                {iconType === 'coin' ? (
                                    <Image w="16px" src="/images/task-hall/jinbi.png" alt="金币" />
                                ) : (
                                    <Image w="18px" src="/images/academy/bug-fill.png" alt="缺陷" />
                                )}
                            </Flex>
                        </Flex>
                    ))
                ) : (
                    <Box textAlign="center" py={8}>
                        <Text color={COLORS.textTertiary}>暂无数据</Text>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default function RankingListPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [pointsPeriod, setPointsPeriod] = useState<'month' | 'quarter'>('month');
    const [contributionPeriod, setContributionPeriod] = useState<'month' | 'quarter'>('month');

    // 查询积分榜数据
    const { data: pointsData, isLoading: isPointsLoading } = api.academy.getPointsRanking.useQuery({
        period: pointsPeriod,
        limit: 15,
    });

    // 查询贡献榜数据
    const { data: contributionData, isLoading: isContributionLoading } = api.academy.getContributionRanking.useQuery({
        period: contributionPeriod,
        limit: 15,
    });

    return (
        <Box bg={COLORS.bgTertiary} minH="100vh" pb={8}>
            <Container maxW="1400px" px={6} py={6}>
                {/* 面包屑导航 */}
                <Flex align="center" mb={6} fontSize="14px" color={COLORS.textTertiary}>
                    <Text
                        cursor="pointer"
                        _hover={{ color: COLORS.textPrimary }}
                        onClick={() => router.push('/crowdsource/academy')}
                    >
                        众测学堂
                    </Text>
                    <Text mx={2}>/</Text>
                    <Text color={COLORS.textPrimary}>排行榜</Text>
                </Flex>

                {/* 积分榜和贡献榜并排显示 */}
                <Flex gap={6}>
                    {/* 积分榜 */}
                    <Box flex={1}>
                        <RankingSection
                            title="积分榜"
                            icon={<Image w={6} src="/images/task-hall/jinbi.png" alt="金币" />}
                            users={pointsData ?? []}
                            iconType="coin"
                            searchQuery={searchQuery}
                            isLoading={isPointsLoading}
                            onPeriodChange={setPointsPeriod}
                        />
                    </Box>

                    {/* 贡献榜 */}
                    <Box flex={1}>
                        <RankingSection
                            title="贡献榜"
                            icon={<Image w={6} src="/images/academy/bug-fill.png" alt="缺陷" />}
                            users={contributionData ?? []}
                            iconType="gift"
                            searchQuery={searchQuery}
                            isLoading={isContributionLoading}
                            onPeriodChange={setContributionPeriod}
                        />
                    </Box>
                </Flex>
            </Container>
        </Box>
    );
}
