'use client';
import React, { useState } from 'react';
import { Box, Flex, Image, Text, Button } from '@chakra-ui/react';
import { Info, Calendar } from 'lucide-react';
import { LuX } from 'react-icons/lu';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogCloseTrigger,
} from '@/app/_components/ui/dialog';
import { api } from '@/trpc/react';

export default function UserCard() {
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const router = useRouter();

    // 获取用户积分和等级信息
    const { data: userInfo, isLoading } = api.user.getUserPointsInfo.useQuery();

    const handleLogout = async () => {
        setShowLogoutDialog(false);
        await signOut({ callbackUrl: '/login', redirect: true });
    };

    return (
        <Box
            bg="white"
            borderRadius="8px"
            boxShadow="0 1px 2px rgba(0,0,0,0.05)"
            overflow="hidden"
        >
            <Flex direction="column">
                <Box p={6}>
                    <Flex direction="column" gap={6}>
                        <Flex gap={3} align="center">
                            <Image
                                src="/images/task-hall/avatar-big.png"
                                alt="User Avatar"
                                w="72px"
                                h="72px"
                                borderRadius="full"
                                objectFit="cover"
                            />
                            <Flex direction="column" gap={2}>
                                <Text
                                    fontSize="18px"
                                    fontWeight="600"
                                    color="#1D2129"
                                >
                                    {isLoading
                                        ? '加载中...'
                                        : userInfo?.userName || '张三'}
                                </Text>
                                <Flex gap={2}>
                                    <Text
                                        fontSize="14px"
                                        color="#4E5969"
                                        fontWeight="500"
                                    >
                                        {isLoading
                                            ? '...'
                                            : userInfo?.levelName || '注册新人'}
                                    </Text>
                                    <Flex
                                        align="center"
                                        bg="linear-gradient(90deg, #FFD700 0%, #FFA500 100%)"
                                        px={2}
                                        py={0.5}
                                        borderRadius="12px"
                                        fontSize="12px"
                                        fontWeight="500"
                                        color="#fff"
                                    >
                                        <Text>✓</Text>
                                        {!isLoading && userInfo && (
                                            <Text
                                                fontSize="12px"
                                                color="#fff"
                                                fontWeight="600"
                                            >
                                                LV.{userInfo.level}
                                            </Text>
                                        )}
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Flex>

                        <Box borderTop="1px dashed" borderColor="#E5E6EB" />

                        <Flex gap={16} justify="space-around">
                            <Flex direction="column" gap={1} align="center">
                                <Flex gap={1} alignItems="center">
                                    <Text
                                        fontSize="18px"
                                        fontWeight="700"
                                        color="#1D2129"
                                    >
                                        {isLoading
                                            ? '...'
                                            : userInfo?.pendingPoints || 0}
                                    </Text>
                                    <Image
                                        src="/images/task-hall/jinbi.png"
                                        alt="金币"
                                        w={4}
                                        h={4}
                                    />
                                </Flex>
                                <Text fontSize="12px" color="#86909C">
                                    待兑换积分
                                </Text>
                            </Flex>
                            <Flex direction="column" gap={1} align="center">
                                <Flex gap={1} alignItems="center">
                                    <Text
                                        fontSize="18px"
                                        fontWeight="700"
                                        color="#1D2129"
                                    >
                                        {isLoading
                                            ? '...'
                                            : userInfo?.totalPoints || 0}
                                    </Text>
                                    <Image
                                        src="/images/task-hall/jinbi.png"
                                        alt="金币"
                                        w={4}
                                        h={4}
                                    />
                                </Flex>
                                <Text fontSize="12px" color="#86909C">
                                    累计积分
                                </Text>
                            </Flex>
                        </Flex>
                    </Flex>
                </Box>

                <Button
                    w="calc(100% - 24px)"
                    mx={3}
                    borderRadius="999px"
                    borderTop="none"
                    py={3}
                    bg="linear-gradient(to right, #ff9266, #fe626b)"
                    color="white"
                    fontSize="14px"
                    fontWeight="500"
                    _hover={{ opacity: 0.9 }}
                    _active={{ opacity: 0.8 }}
                    onClick={() => {
                        router.push('/crowdsource/pointsDetails');
                    }}
                >
                    个人中心
                </Button>

                <Flex
                    direction="row"
                    borderTop="1px"
                    borderColor="#E5E6EB"
                    gap={0}
                >
                    <Box
                        flex={1}
                        p={3}
                        cursor="pointer"
                        _hover={{ bg: '#F9F9F9' }}
                        borderRight="1px"
                        borderColor="#E5E6EB"
                        onClick={() => {
                            router.push('/crowdsource/settings');
                        }}
                    >
                        <Flex gap={2} justify="center" align="center">
                            <Image
                                src="/images/task-hall/setting.png"
                                alt="设置"
                                w={3.5}
                                h={3.5}
                            />
                            <Text fontSize="14px" color="#86909C">
                                设置
                            </Text>
                        </Flex>
                    </Box>
                    <Box
                        flex={1}
                        p={3}
                        cursor="pointer"
                        _hover={{ bg: '#F9F9F9' }}
                        borderRight="1px"
                        borderColor="#E5E6EB"
                        onClick={() => {
                            router.push('/crowdsource/pointsDetails');
                        }}
                    >
                        <Flex gap={2} justify="center" align="center">
                            <Image
                                src="/images/task-hall/card-coin.png"
                                alt="设置"
                                w={3.5}
                                h={3.5}
                            />
                            <Text fontSize="14px" color="#86909C">
                                积分明细
                            </Text>
                        </Flex>
                    </Box>
                    <Box
                        flex={1}
                        p={3}
                        cursor="pointer"
                        _hover={{ bg: '#F9F9F9' }}
                        onClick={() => setShowLogoutDialog(true)}
                    >
                        <Flex gap={2} justify="center" align="center">
                            <Image
                                src="/images/task-hall/logout.png"
                                alt="设置"
                                w={3.5}
                                h={3.5}
                            />
                            <Text fontSize="14px" color="#86909C">
                                退出登录
                            </Text>
                        </Flex>
                    </Box>
                </Flex>
            </Flex>

            {/* 退出登录确认对话框 */}
            <DialogRoot
                open={showLogoutDialog}
                onOpenChange={(e) => setShowLogoutDialog(e.open)}
            >
                <DialogContent
                    maxW="520px"
                    borderRadius="8px"
                    bg="white"
                    boxShadow="0px 0px 18px rgba(0, 65, 215, 0.06)"
                >
                    <DialogHeader
                        borderBottom="1px solid"
                        borderColor="#e5e6eb"
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        px={4}
                        py={3}
                    >
                        <Text fontSize="16px" fontWeight="500" color="#1d2129">
                            确认退出
                        </Text>
                        <Box
                            as="button"
                            onClick={() => setShowLogoutDialog(false)}
                            cursor="pointer"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            w="24px"
                            h="24px"
                            borderRadius="4px"
                            _hover={{ bg: '#f2f3f5' }}
                            transition="background-color 0.2s"
                        >
                            <LuX size={16} color="#4e5969" />
                        </Box>
                    </DialogHeader>
                    <DialogBody px={7} py={6}>
                        <Text fontSize="14px" color="#1d2129" lineHeight="24px">
                            您确定要退出登录吗？退出后需要重新登录才能使用完整功能。
                        </Text>
                    </DialogBody>
                    <DialogFooter
                        borderTop="1px solid"
                        borderColor="#e5e6eb"
                        px={4}
                        py={4}
                        display="flex"
                        justifyContent="flex-end"
                        gap={3}
                    >
                        <Button
                            variant="outline"
                            fontSize="14px"
                            fontWeight="500"
                            borderRadius="999px"
                            h="36px"
                            px={4}
                            borderColor="#e5e6eb"
                            color="#4e5969"
                            onClick={() => setShowLogoutDialog(false)}
                            _hover={{
                                bg: '#f2f3f5',
                                borderColor: '#e5e6eb',
                            }}
                        >
                            取消
                        </Button>
                        <Button
                            bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                            color="white"
                            fontSize="14px"
                            fontWeight="500"
                            borderRadius="999px"
                            h="36px"
                            px={4}
                            onClick={handleLogout}
                            _hover={{
                                opacity: 0.9,
                            }}
                        >
                            确认退出
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>
        </Box>
    );
}
