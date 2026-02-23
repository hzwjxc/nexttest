'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Box, Container, Flex, Text, Image, Button } from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LuX } from 'react-icons/lu';
import { useAuth } from '@/app/hooks/useAuth';
import { signOut } from 'next-auth/react';
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
} from '@/app/_components/ui/dialog';
import { usePermissions } from '@/app/hooks/usePermissions';

const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
};

export default function CrowdsourceNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { logout } = useAuth();
    const { filteredTopNavItems, isLoading } = usePermissions();

    const isActive = (href: string) => {
        return pathname.startsWith(href);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleLogout = async () => {
        setIsMenuOpen(false);
        setShowLogoutDialog(false);
        await signOut({ callbackUrl: '/login', redirect: true });
    };

    const handleNavClick = (href: string) => {
        router.push(href);
    };

    return (
        <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            zIndex={1000}
            bg="white"
            borderBottom="1px solid"
            borderColor="#e5e6eb"
            boxShadow="0px 10px 20px rgba(38,18,120,0.04)"
            h="72px"
        >
            <Container maxW="1460px" h="100%">
                <Flex
                    align="center"
                    justify="space-between"
                    h="100%"
                    px={6}
                    position="relative"
                >
                    {/* Logo */}
                    <Box w="165.636px" h="40px" flexShrink={0}>
                        <Image
                            src="/images/task-hall/logo.png"
                            alt="广发众测"
                            w="100%"
                            h="100%"
                            objectFit="contain"
                        />
                    </Box>

                    {/* 导航菜单 */}
                    <Flex
                        gap={6}
                        display={{ base: 'none', lg: 'flex' }}
                        flex={1}
                        ml={6}
                    >
                        {filteredTopNavItems.map((item) => (
                            <Box
                                key={item.href}
                                position="relative"
                                cursor="pointer"
                                onClick={() => handleNavClick(item.href)}
                            >
                                <Text
                                    as="span"
                                    fontSize="14px"
                                    fontWeight={
                                        isActive(item.href) ? '600' : '400'
                                    }
                                    whiteSpace="nowrap"
                                    color={
                                        isActive(item.href)
                                            ? COLORS.primary
                                            : COLORS.textSecondary
                                    }
                                    transition="color 0.2s"
                                    _hover={{ color: COLORS.primary }}
                                >
                                    {item.label}
                                </Text>
                                {isActive(item.href) && (
                                    <Box
                                        position="absolute"
                                        bottom="-24px"
                                        left="50%"
                                        transform="translateX(-50%)"
                                        w="38px"
                                        h="4px"
                                        bg={COLORS.primary}
                                        borderRadius="2px"
                                    />
                                )}
                            </Box>
                        ))}
                    </Flex>

                    {/* 用户头像下拉菜单 */}
                    <Box position="relative" ref={menuRef}>
                        <Image
                            src="/images/task-hall/avatar.png"
                            alt="用户头像"
                            w="32px"
                            h="32px"
                            borderRadius="50%"
                            cursor="pointer"
                            objectFit="cover"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        />
                        {isMenuOpen && (
                            <Box
                                position="absolute"
                                top="100%"
                                right={0}
                                mt={2}
                                bg="white"
                                borderRadius="8px"
                                boxShadow="0 2px 8px rgba(0,0,0,0.15)"
                                zIndex={10}
                                display="flex"
                                flexDirection="column"
                                p={2}
                                gap={1}
                            >
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    cursor="pointer"
                                    px={3}
                                    py={2}
                                    _hover={{ bg: '#F2F3F5' }}
                                    borderRadius="4px"
                                    whiteSpace="nowrap"
                                    onClick={() => {
                                        router.push('/crowdsource/workbench');
                                    }}
                                >
                                    工作台
                                </Text>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    cursor="pointer"
                                    px={3}
                                    py={2}
                                    _hover={{ bg: '#F2F3F5' }}
                                    borderRadius="4px"
                                    whiteSpace="nowrap"
                                    onClick={() => {
                                        router.push(
                                            '/crowdsource/messageCenter'
                                        );
                                    }}
                                >
                                    消息中心
                                </Text>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    cursor="pointer"
                                    px={3}
                                    py={2}
                                    _hover={{ bg: '#F2F3F5' }}
                                    borderRadius="4px"
                                    whiteSpace="nowrap"
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        router.push('/crowdsource/settings');
                                    }}
                                >
                                    设置
                                </Text>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    cursor="pointer"
                                    px={3}
                                    py={2}
                                    _hover={{ bg: '#F2F3F5' }}
                                    borderRadius="4px"
                                    whiteSpace="nowrap"
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        router.push(
                                            '/crowdsource/pointsDetails'
                                        );
                                    }}
                                >
                                    积分明细
                                </Text>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    cursor="pointer"
                                    px={3}
                                    py={2}
                                    _hover={{ bg: '#F2F3F5' }}
                                    borderRadius="4px"
                                    whiteSpace="nowrap"
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        setShowLogoutDialog(true);
                                    }}
                                >
                                    退出登录
                                </Text>
                            </Box>
                        )}
                    </Box>
                </Flex>
            </Container>

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
