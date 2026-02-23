'use client';

import React, { useState } from 'react';
import {
    Box,
    Container,
    Flex,
    Input,
    Text,
    Image,
    Button,
    Spinner,
} from '@chakra-ui/react';
import { LuSearch, LuStar, LuCrown } from 'react-icons/lu';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    yellow: '#FECA01',
    orange: '#FF9565',
};

// 排行榜用户数据类型
type RankingUser = {
    id: string;
    rank: number;
    name: string;
    department: string;
    points: number;
    avatar: string;
};

// 文章类型（从 API 获取的数据）
type Article = {
    id: string;
    title: string;
    content: string;
    coverImage: string;
    publishTime: string | Date; // API 返回的是字符串，需要支持两种类型
    sequence: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    isFavorite?: boolean;
};

// 排名用户卡片组件
function RankingUserCard({
    user,
    isFirst,
    iconType,
}: {
    user: RankingUser;
    isFirst: boolean;
    iconType: 'coin' | 'gift';
}) {
    return (
        <Flex
            direction="column"
            align="center"
            gap={2}
            position="relative"
            mt={isFirst ? 0 : 6}
        >
            {/* 排名数字背景 */}
            <Text
                position="absolute"
                top={isFirst ? '-20px' : '-10px'}
                fontSize={isFirst ? '80px' : '60px'}
                fontWeight="900"
                color="rgba(255,255,255,0.15)"
                lineHeight={1}
                zIndex={0}
            >
                {user.rank}
            </Text>

            {/* 头像 */}
            <Box
                position="relative"
                zIndex={1}
                borderRadius="full"
                border={isFirst ? '3px solid #FFD93B' : '2px solid rgba(255,255,255,0.5)'}
                p={isFirst ? '3px' : '2px'}
            >
                <Image
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.name}
                    w={isFirst ? '64px' : '48px'}
                    h={isFirst ? '64px' : '48px'}
                    borderRadius="full"
                    objectFit="cover"
                />
                {isFirst && (
                    <Box
                        position="absolute"
                        top="-12px"
                        left="50%"
                        transform="translateX(-50%)"
                    >
                        <LuCrown size={20} color="#FFD93B" />
                    </Box>
                )}
            </Box>

            {/* 用户信息 */}
            <Flex direction="column" align="center" gap={0.5} zIndex={1}>
                <Text
                    fontSize={isFirst ? '16px' : '14px'}
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
                        fontSize={isFirst ? '16px' : '14px'}
                        fontWeight="600"
                        color={iconType === 'coin' ? '#FFB800' : '#FF5179'}
                    >
                        {user.points}
                    </Text>
                    {iconType === 'coin' ? (
                        <Image w="3" src="/images/task-hall/jinbi.png" alt="金币" />
                    ) : (
                        <Image w="4" src="/images/academy/bug-fill.png" alt="" />
                    )}
                </Flex>
            </Flex>
        </Flex>
    );
}

// 排行榜卡片组件
function LeaderboardCard({
    title,
    titleIcon,
    users,
    gradient,
    iconType,
    isLoading,
}: {
    title: string;
    titleIcon: React.ReactNode;
    users: RankingUser[];
    gradient: string;
    iconType: 'coin' | 'gift';
    isLoading: boolean;
}) {
    // 重新排列用户顺序：第2名、第1名、第3名
    const orderedUsers = users.length >= 3 ? [
        users.find((u: RankingUser) => u.rank === 2)!,
        users.find((u: RankingUser) => u.rank === 1)!,
        users.find((u: RankingUser) => u.rank === 3)!,
    ] : [];

    const router = useRouter();

    return (
        <Box
            flex={1}
            borderRadius="12px"
            overflow="hidden"
            bg={gradient}
            p={5}
            position="relative"
        >
            {/* 标题行 */}
            <Flex justify="space-between" align="center" mb={4}>
                <Flex align="center" gap={2}>
                    <Text fontSize="20px" fontWeight="700" color={COLORS.textPrimary}>
                        {title}
                    </Text>
                    {titleIcon}
                </Flex>
                <Button
                    size="sm"
                    borderRadius="999px"
                    bg="linear-gradient(263deg, #FFA37C -3.74%, #C43BF4 100%)"
                    color="white"
                    fontSize="12px"
                    fontWeight="500"
                    px={4}
                    h="28px"
                    _hover={{ opacity: 0.9 }}
                    onClick={() => {
                        router.push('/crowdsource/academy/rankingList');
                    }}
                >
                    <LuCrown size={12} style={{ marginRight: '4px' }} />
                    完整榜单
                </Button>
            </Flex>

            {/* 用户排名 */}
            {isLoading ? (
                <Flex justify="center" align="center" py={8}>
                    <Spinner size="md" color={COLORS.primary} />
                </Flex>
            ) : orderedUsers.length === 3 ? (
                <Flex justify="center" align="flex-end" gap={6} pt={4} pb={2}>
                    {orderedUsers.map((user: RankingUser) => (
                        <RankingUserCard
                            key={user.id}
                            user={user}
                            isFirst={user.rank === 1}
                            iconType={iconType}
                        />
                    ))}
                </Flex>
            ) : (
                <Box textAlign="center" py={8}>
                    <Text color={COLORS.textTertiary}>暂无排名数据</Text>
                </Box>
            )}
        </Box>
    );
}

// 文章卡片组件
function ArticleCard({
    article,
    onToggleFavorite,
}: {
    article: Article;
    onToggleFavorite: (id: string) => void;
}) {
    // 格式化发布时间（精确到时分秒）
    const formattedDate = new Date(article.publishTime).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).replace(/\//g, '-');

    return (
        <Link href={`/crowdsource/academy/details?id=${article.id}`} style={{ display: 'block' }}>
            <Flex
                bg={COLORS.bgPrimary}
                borderRadius="8px"
                overflow="hidden"
                boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                _hover={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                transition="box-shadow 0.2s"
                cursor="pointer"
            >
                {/* 左侧banner图片 */}
                <Box
                    w="180px"
                    h="100px"
                    flexShrink={0}
                    overflow="hidden"
                >
                    <Image
                        src={article.coverImage || "/placeholder.svg"}
                        alt="文章封面"
                        w="100%"
                        h="100%"
                        objectFit="cover"
                    />
                </Box>

                {/* 中间内容 */}
                <Flex flex={1} direction="column" justify="center" px={5} py={3}>
                    <Text
                        fontSize="14px"
                        color={COLORS.textPrimary}
                        lineHeight="1.6"
                        mb={2}
                        css={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {article.title}
                    </Text>
                    <Text fontSize="12px" color={COLORS.textTertiary}>
                        {formattedDate}
                    </Text>
                </Flex>

                {/* 右侧收藏按钮 */}
                <Flex align="center" px={4}>
                    <Box
                        as="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleFavorite(article.id);
                        }}
                        cursor="pointer"
                        p={2}
                        borderRadius="4px"
                        _hover={{ bg: COLORS.bgSecondary }}
                        transition="background-color 0.2s"
                    >
                        <LuStar
                            size={20}
                            color={article.isFavorite ? '#FFB800' : COLORS.textTertiary}
                            fill={article.isFavorite ? '#FFB800' : 'none'}
                        />
                    </Box>
                </Flex>
            </Flex>
        </Link>
    );
}

export default function AcademyPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const utils = api.useUtils();

    // 使用 API 获取文章列表
    const { data, isLoading, error } = api.academy.getAll.useQuery();

    // 获取用户收藏的文章ID列表
    const { data: favoriteIds = [] } = api.academy.getFavoriteIds.useQuery(undefined, {
        // 如果用户未登录，不发送请求
        enabled: true,
        retry: false,
    });

    // 获取积分榜前3名（总榜）
    const { data: pointsRankingData = [], isLoading: isPointsLoading } = api.academy.getPointsRanking.useQuery({
        period: 'all',
        limit: 3,
    });

    // 获取贡献榜前3名（总榜）
    const { data: contributionRankingData = [], isLoading: isContributionLoading } = api.academy.getContributionRanking.useQuery({
        period: 'all',
        limit: 3,
    });

    // 切换收藏的mutation
    const toggleFavoriteMutation = api.academy.toggleFavorite.useMutation({
        onSuccess: () => {
            // 刷新收藏列表
            void utils.academy.getFavoriteIds.invalidate();
        },
    });

    // 处理收藏切换
    const handleToggleFavorite = (id: string) => {
        toggleFavoriteMutation.mutate({ academyId: id });
    };

    // 将 API 数据转换为带收藏状态的文章列表
    const articles: Article[] = (data || []).map(article => ({
        ...article,
        isFavorite: favoriteIds.includes(article.id),
    })) as Article[];

    // 过滤文章
    const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box bg={COLORS.bgTertiary} minH="100vh" pb="60px" position="relative">
            <Container maxW="100%" bg="linear-gradient(180deg, #F3F7FB 0%, #FFF 100%)" px={6} py={6}>
                <Box maxW="1350px" mx="auto">
                    {/* 排行榜区域 */}
                    <Flex gap={6} mb={6}>
                        {/* 积分榜 */}
                        <LeaderboardCard
                            title="积分榜"
                            titleIcon={<Image w={6} src="/images/task-hall/jinbi.png" alt="金币" />}
                            users={pointsRankingData}
                            gradient="linear-gradient(265deg, #F9D9F4 1.06%, #F4E7D2 99.1%)"
                            iconType="coin"
                            isLoading={isPointsLoading}
                        />

                        {/* 贡献榜 */}
                        <LeaderboardCard
                            title="贡献榜"
                            titleIcon={<Image src="/images/academy/bug-fill.png" alt="" />}
                            users={contributionRankingData}
                            gradient="linear-gradient(265deg, #F9D9F4 1.06%, #F4E7D2 99.1%)"
                            iconType="gift"
                            isLoading={isContributionLoading}
                        />
                    </Flex>

                    {/* 搜索框 */}
                    <Box position="relative" w="100%" maxW="480px" mb={2}>
                        <Input
                            type="text"
                            placeholder="请输入文章关键词"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            bg={COLORS.bgPrimary}
                            border="1px solid"
                            borderColor={COLORS.borderColor}
                            borderRadius="8px"
                            fontSize="14px"
                            color={COLORS.textPrimary}
                            _placeholder={{ color: COLORS.textTertiary }}
                            _focus={{ borderColor: COLORS.primary, boxShadow: 'none' }}
                            pl={4}
                            pr={10}
                            py={2}
                            h="40px"
                        />
                        <Box
                            position="absolute"
                            right={3}
                            top="50%"
                            transform="translateY(-50%)"
                            cursor="pointer"
                            p={1}
                            borderRadius="4px"
                            _hover={{ bg: COLORS.bgSecondary }}
                        >
                            <LuSearch size={18} color={COLORS.textSecondary} />
                        </Box>
                    </Box>
                </Box>

            </Container>
            <Container maxW="1400px" px={6} py={6}>
                {/* 文章列表 */}
                <Flex direction="column" gap={4}>
                    {isLoading ? (
                        <Box textAlign="center" py={8} bg={COLORS.bgPrimary} borderRadius="8px">
                            <Spinner size="lg" color={COLORS.primary} />
                            <Text mt={4} color={COLORS.textTertiary}>加载中...</Text>
                        </Box>
                    ) : error ? (
                        <Box textAlign="center" py={8} bg={COLORS.bgPrimary} borderRadius="8px">
                            <Text color={COLORS.primary}>加载失败：{error.message}</Text>
                        </Box>
                    ) : filteredArticles.length > 0 ? (
                        filteredArticles.map(article => (
                            <ArticleCard
                                key={article.id}
                                article={article}
                                onToggleFavorite={handleToggleFavorite}
                            />
                        ))
                    ) : (
                        <Box textAlign="center" py={8} bg={COLORS.bgPrimary} borderRadius="8px">
                            <Text color={COLORS.textTertiary}>
                                {searchQuery ? '未找到相关文章' : '暂无文章'}
                            </Text>
                        </Box>
                    )}
                </Flex>
            </Container>

            {/* 页脚 - 固定在底部 */}
            <Box
                position="fixed"
                bottom={0}
                left={0}
                right={0}
                bg={COLORS.textPrimary}
                py={4}
                zIndex={10}
            >
                <Container maxW="1400px" px={6}>
                    <Text
                        fontSize="14px"
                        color={COLORS.textTertiary}
                        textAlign="center"
                    >
                        备案信息
                    </Text>
                </Container>
            </Box>
        </Box>
    );
}
