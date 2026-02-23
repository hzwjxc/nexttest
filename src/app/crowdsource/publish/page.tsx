'use client';

import {
    Box,
    Flex,
    Text,
    Image,
    Container,
    Stack,
    Heading,
    Card,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useTaskPublishStore } from './useTaskPublishStore';

// 图片资源常量
const img12 =
    'https://www.figma.com/api/mcp/asset/013f2267-8c85-47a2-9613-b3c3bd47af69';
const imgGroup =
    "/images/publish/publish-icon-1.png";
const imgGroup5 =
    "/images/publish/publish-icon-2.png";

// 从MCP配置获取资源
const getMcpAssetUrl = (assetId: string) => {
    return `https://www.figma.com/api/mcp/asset/${assetId}`;
};

// 任务卡片组件
interface TaskCardProps {
    title: string;
    description: string;
    icon: string;
    bgColor: string;
    href?: string;
}

function TaskCard({ title, description, icon, bgColor, href }: TaskCardProps) {
    const router = useRouter();
    const { reset } = useTaskPublishStore();

    const handleClick = () => {
        if (href) {
            // 在跳转前重置store，确保是全新的表单
            reset();
            router.push(href);
        }
    };

    const cardContent = (
        <Card.Root
            w={{ base: '100%', md: '520px' }}
            h="460px"
            borderRadius="8px"
            backdropFilter="blur(15px)"
            boxShadow="0px 0px 30px rgba(15,3,149,0.06)"
            bg={bgColor}
            p={0}
            overflow="hidden"
            cursor={href ? 'pointer' : 'default'}
            transition="all 0.2s"
            _hover={href ? { transform: 'translateY(-4px)', boxShadow: '0px 4px 40px rgba(15,3,149,0.12)' } : {}}
            onClick={handleClick}
        >
            <Card.Body
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="flex-start"
                gap="54px"
                pt={12}
                pb={10}
                px={6}
            >
                {/* 图标 */}
                <Box
                    w="128px"
                    h="128px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                >
                    <Image
                        src={icon}
                        alt={title}
                        w="100%"
                        h="100%"
                        objectFit="contain"
                    />
                </Box>

                {/* 内容 */}
                <Stack
                    direction="column"
                    gap={6}
                    align="stretch"
                    w={{ base: '100%', md: '407px' }}
                >
                    <Heading
                        as="h3"
                        fontSize="28px"
                        fontWeight="medium"
                        color="#1d2129"
                        textAlign="center"
                        lineHeight="normal"
                    >
                        {title}
                    </Heading>
                    <Text
                        fontSize="14px"
                        lineHeight="24px"
                        color="#4e5969"
                        textAlign="left"
                    >
                        {description}
                    </Text>
                </Stack>
            </Card.Body>
        </Card.Root>
    );

    return cardContent;
}

// 主页面组件
export default function CrowdsourcePublishPage() {
    return (
        <Box bg="#f3f7fb" minH="100vh" position="relative">
            {/* 背景图片 */}
            <Box
                position="absolute"
                top={0}
                left={0}
                w="100%"
                h="652.5px"
                overflow="hidden"
                pointerEvents="none"
                zIndex={0}
            >
                <Image
                    src={img12}
                    alt=""
                    w="100%"
                    h="204.83%"
                    objectFit="cover"
                    position="absolute"
                    top="-104.83%"
                    left={0}
                />
            </Box>

            {/* 主内容区域 */}
            <Box position="relative" zIndex={10} pt="100px" pb="100px">
                <Container maxW="1920px" px={6}>
                    {/* 页面标题 */}
                    <Heading
                        as="h1"
                        fontSize="38px"
                        fontWeight="medium"
                        textAlign="center"
                        color="#1d2129"
                        mb="100px"
                        lineHeight="normal"
                    >
                        众测发布
                    </Heading>

                    {/* 卡片区域 */}
                    <Flex justify="center" gap={10} flexWrap="wrap">
                        <TaskCard
                            title="功能测试类"
                            description="示例文案，简单的功能测试类任务介绍：新版应用投产前，大规模内部众测，可以有效提升产品在用户体验方面、兼容性、功能等方面的能力。"
                            icon={imgGroup}
                            bgColor="white"
                            href="/crowdsource/publish/basicInformation"
                        />
                        {/* <TaskCard
                            title="问卷调查类"
                            description="示例文案，简单的问卷调查类任务介绍：可以进行产品在开发之前，或者投放市场后，获取真实用户反馈信息，助力我们去改善产品，做出满足用户需要的产品。"
                            icon={imgGroup5}
                            bgColor="#fafcfd"
                        /> */}
                    </Flex>
                </Container>
            </Box>
        </Box>
    );
}
