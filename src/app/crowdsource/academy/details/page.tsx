'use client';

import React from 'react';
import {
    Box,
    Container,
    Flex,
    Text,
    Image,
    Spinner,
} from '@chakra-ui/react';
import Link from 'next/link';
import { LuMenu } from 'react-icons/lu';
import { useSearchParams } from 'next/navigation';
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
};

export default function Details() {
    const searchParams = useSearchParams();
    const articleId = searchParams.get('id');

    // 获取文章详情
    const { data: article, isLoading: isLoadingArticle, error: articleError } = api.academy.getById.useQuery(
        { id: articleId || '' },
        { enabled: !!articleId }
    );

    // 获取更多文章列表（用于右侧推荐）
    const { data: relatedArticlesData } = api.academy.list.useQuery(
        { page: 1, pageSize: 4 },
        { enabled: !!articleId }
    );

    const relatedArticles = relatedArticlesData?.data || [];

    // 格式化发布日期
    const formattedDate = article?.publishTime
        ? new Date(article.publishTime).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).replace(/\//g, '年').replace(/(\d+)年(\d+)月/, '$1年$2月') + '日'
        : '';
    return (
        <Box bg={COLORS.bgTertiary} minH="100vh">
            <Container maxW="1400px" px={6} py={6} pb={20}>
                {/* 面包屑导航 */}
                <Flex align="center" gap={2} mb={6}>
                    <Box color={COLORS.textTertiary}>
                        <LuMenu size={18} />
                    </Box>
                    <Link href="/crowdsource/academy">
                        <Text
                            fontSize="14px"
                            color={COLORS.textSecondary}
                            cursor="pointer"
                            _hover={{ color: COLORS.primary }}
                        >
                            众测学堂
                        </Text>
                    </Link>
                    <Text fontSize="14px" color={COLORS.textTertiary}>
                        &gt;
                    </Text>
                    <Text fontSize="14px" color={COLORS.textSecondary}>
                        详情
                    </Text>
                </Flex>

                {/* 主内容区域 */}
                <Flex gap={6}>
                    {/* 加载状态 */}
                    {isLoadingArticle ? (
                        <Box
                            flex={1}
                            bg={COLORS.bgPrimary}
                            borderRadius="8px"
                            p={8}
                            textAlign="center"
                        >
                            <Spinner size="lg" color={COLORS.primary} />
                            <Text mt={4} color={COLORS.textTertiary}>加载中...</Text>
                        </Box>
                    ) : articleError || !article ? (
                        <Box
                            flex={1}
                            bg={COLORS.bgPrimary}
                            borderRadius="8px"
                            p={8}
                            textAlign="center"
                        >
                            <Text color={COLORS.primary}>
                                {articleError?.message || '文章不存在'}
                            </Text>
                        </Box>
                    ) : (
                        <>
                            {/* 左侧文章详情 */}
                            <Box
                                flex={1}
                                bg={COLORS.bgPrimary}
                                borderRadius="8px"
                                p={8}
                                boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                            >
                                {/* 文章标题 */}
                                <Text
                                    fontSize="24px"
                                    fontWeight="600"
                                    color={COLORS.textPrimary}
                                    lineHeight="1.4"
                                    mb={3}
                                >
                                    {article.title}
                                </Text>

                                {/* 发布时间 */}
                                <Text fontSize="14px" color={COLORS.textTertiary} mb={6}>
                                    发布时间：{formattedDate}
                                </Text>

                                {/* 文章内容 - 渲染富文本HTML */}
                                <Box
                                    mb={6}
                                    css={{
                                        '& p': {
                                            fontSize: '14px',
                                            color: COLORS.textSecondary,
                                            lineHeight: '1.6',
                                            margin: '0.5em 0',
                                        },
                                        '& h1': {
                                            fontSize: '2em',
                                            fontWeight: 'bold',
                                            color: COLORS.textPrimary,
                                            margin: '0.67em 0',
                                        },
                                        '& h2': {
                                            fontSize: '1.5em',
                                            fontWeight: 'bold',
                                            color: COLORS.textPrimary,
                                            margin: '0.75em 0',
                                        },
                                        '& h3': {
                                            fontSize: '1.17em',
                                            fontWeight: 'bold',
                                            color: COLORS.textPrimary,
                                            margin: '0.83em 0',
                                        },
                                        '& ul, & ol': {
                                            paddingLeft: '2em',
                                            margin: '0.5em 0',
                                        },
                                        '& li': {
                                            fontSize: '14px',
                                            color: COLORS.textSecondary,
                                            lineHeight: '1.6',
                                        },
                                        '& img': {
                                            maxWidth: '100%',
                                            height: 'auto',
                                            display: 'block',
                                            margin: '1em 0',
                                            borderRadius: '4px',
                                        },
                                        '& video': {
                                            width: '100%',
                                            height: 'auto',
                                            display: 'block',
                                            margin: '1em 0',
                                            borderRadius: '4px',
                                            backgroundColor: '#000',
                                        },
                                        '& source': {
                                            display: 'none',
                                        },
                                        '& a': {
                                            color: COLORS.primary,
                                            textDecoration: 'underline',
                                        },
                                        '& code': {
                                            backgroundColor: COLORS.bgSecondary,
                                            padding: '2px 4px',
                                            borderRadius: '2px',
                                            fontSize: '0.9em',
                                        },
                                        '& strong': {
                                            fontWeight: 'bold',
                                        },
                                        '& em': {
                                            fontStyle: 'italic',
                                        },
                                        '& blockquote': {
                                            borderLeft: `4px solid ${COLORS.borderColor}`,
                                            paddingLeft: '1em',
                                            margin: '0.5em 0',
                                            color: COLORS.textSecondary,
                                        },
                                    }}
                                    dangerouslySetInnerHTML={{ __html: article.content }}
                                />
                            </Box>

                            {/* 右侧相关文章 */}
                            <Box
                                w="280px"
                                flexShrink={0}
                                bg={COLORS.bgPrimary}
                                borderRadius="8px"
                                p={5}
                                boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                                h="fit-content"
                            >
                                {/* 标题行 */}
                                <Flex justify="space-between" align="center" mb={4}>
                                    <Text
                                        fontSize="16px"
                                        fontWeight="600"
                                        color={COLORS.textPrimary}
                                    >
                                        更多文章
                                    </Text>
                                    <Link href="/crowdsource/academy">
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textTertiary}
                                            cursor="pointer"
                                            _hover={{ color: COLORS.primary }}
                                        >
                                            查看全部&gt;
                                        </Text>
                                    </Link>
                                </Flex>

                                {/* 文章列表 */}
                                <Flex direction="column" gap={4}>
                                    {relatedArticles.length > 0 ? (
                                        relatedArticles
                                            .filter(a => a.id !== articleId)
                                            .slice(0, 4)
                                            .map((relatedArticle) => {
                                                const relatedDate = new Date(relatedArticle.publishTime).toLocaleDateString('zh-CN');
                                                return (
                                                    <Link
                                                        key={relatedArticle.id}
                                                        href={`/crowdsource/academy/details?id=${relatedArticle.id}`}
                                                    >
                                                        <Box
                                                            cursor="pointer"
                                                            pb={4}
                                                            borderBottom="1px solid"
                                                            borderColor={COLORS.borderColor}
                                                            _last={{ borderBottom: 'none', pb: 0 }}
                                                            _hover={{
                                                                '& > p:first-of-type': {
                                                                    color: COLORS.primary,
                                                                },
                                                            }}
                                                        >
                                                            <Text
                                                                fontSize="14px"
                                                                color={COLORS.textPrimary}
                                                                lineHeight="1.6"
                                                                mb={2}
                                                                transition="color 0.2s"
                                                                css={{
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden',
                                                                }}
                                                            >
                                                                {relatedArticle.title}
                                                            </Text>
                                                            <Text
                                                                fontSize="12px"
                                                                color={COLORS.textTertiary}
                                                            >
                                                                {relatedDate}
                                                            </Text>
                                                        </Box>
                                                    </Link>
                                                );
                                            })
                                    ) : (
                                        <Text fontSize="14px" color={COLORS.textTertiary} textAlign="center">
                                            暂无更多文章
                                        </Text>
                                    )}
                                </Flex>
                            </Box>
                        </>
                    )}
                </Flex>
            </Container>

            {/* 页脚 */}
            <Box
                bg={COLORS.textPrimary}
                py={4}
                mt={8}
                position="fixed"
                bottom={0}
                left={0}
                right={0}
            >
                <Container maxW="870px" px={6}>
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
