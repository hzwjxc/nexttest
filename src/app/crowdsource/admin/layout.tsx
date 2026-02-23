'use client';

import React, { useState } from 'react';
import { Box, Container, Flex, Text, Spinner } from '@chakra-ui/react';
import { usePathname, useRouter } from 'next/navigation';
import { LuChevronDown, LuChevronRight } from 'react-icons/lu';
import { usePermissions, ADMIN_MENU_ITEMS } from '@/app/hooks/usePermissions';
import PermissionGuard from '@/app/_components/PermissionGuard';

const COLORS = {
  primary: '#E31424',
  textPrimary: '#1D2129',
  textSecondary: '#4E5969',
  textTertiary: '#86909C',
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F2F3F5',
  borderColor: '#E5E6EB',
};

interface MenuItem {
  id: string;
  label: string;
  href?: string;
  children?: MenuItem[];
}

interface SidebarMenuItemProps {
  item: MenuItem;
  level: number;
}

function SidebarMenuItem({ item, level }: SidebarMenuItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(
    item.children?.some((child) => pathname === child.href) || false
  );

  const isActive = item.href && pathname === item.href;
  const hasActiveChild = item.children?.some((child) => pathname === child.href);

  const handleClick = () => {
    if (item.children) {
      setIsExpanded(!isExpanded);
    } else if (item.href) {
      router.push(item.href);
    }
  };

  const paddingLeft = level === 0 ? 6 : 12;

  return (
    <Box>
      <Flex
        align="center"
        justify="space-between"
        pl={paddingLeft}
        pr={6}
        py={3}
        cursor="pointer"
        bg={isActive ? '#FFF4F5' : 'transparent'}
        color={
          isActive || hasActiveChild ? COLORS.primary : COLORS.textPrimary
        }
        fontSize="14px"
        fontWeight={isActive || hasActiveChild ? '600' : '400'}
        onClick={handleClick}
        _hover={{
          bg: isActive ? '#FFF4F5' : COLORS.bgSecondary,
        }}
        transition="all 0.2s"
        position="relative"
      >
        <Text>{item.label}</Text>
        {item.children && (
          <Box color={isExpanded ? COLORS.primary : COLORS.textTertiary}>
            {isExpanded ? (
              <LuChevronDown size={16} />
            ) : (
              <LuChevronRight size={16} />
            )}
          </Box>
        )}
        {isActive && (
          <Box
            position="absolute"
            left={0}
            top={0}
            bottom={0}
            w="3px"
            bg={COLORS.primary}
          />
        )}
      </Flex>
      {item.children && isExpanded && (
        <Box bg="#FAFAFA">
          {item.children.map((child, index) => (
            <SidebarMenuItem key={index} item={child} level={level + 1} />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { filteredAdminMenuItems, isLoading } = usePermissions();

  // 转换菜单项格式以兼容现有组件
  const menuItems: MenuItem[] = filteredAdminMenuItems.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    children: item.children?.map((child) => ({
      id: child.id,
      label: child.label,
      href: child.href,
    })),
  }));

  return (
    <PermissionGuard>
      <Box bg={COLORS.bgSecondary} minH="100vh" pt={6}>
        <Container maxW="1400px" px={6}>
          <Flex>
            {/* 左侧导航 */}
            <Box
              w="200px"
              bg={COLORS.bgPrimary}
              borderRadius="8px"
              borderRight="1px solid"
              borderColor={COLORS.borderColor}
              flexShrink={0}
              overflowY="auto"
              mr={6}
              alignSelf="flex-start"
            >
              <Box py={2}>
                {menuItems.map((item, index) => (
                  <SidebarMenuItem key={item.id} item={item} level={0} />
                ))}
              </Box>
            </Box>

            {/* 右侧内容区 */}
            <Box flex={1}>
              {children}
            </Box>
          </Flex>
        </Container>
      </Box>
    </PermissionGuard>
  );
}
