'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Flex,
  Text,
  Button,
  Table,
  Tabs,
} from '@chakra-ui/react';
import { LuChevronRight, LuPencil, LuTrash2 } from 'react-icons/lu';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';
import { NotificationTemplateType } from '@prisma/client';

const COLORS = {
  primary: '#E31424',
  textPrimary: '#1D2129',
  textSecondary: '#4E5969',
  textTertiary: '#86909C',
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F2F3F5',
  borderColor: '#E5E6EB',
};

type Notification = {
  id: string;
  name: string;
  content: string;
  type: NotificationTemplateType;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  isActive: boolean;
  tags?: Array<{ tagId: string; value: string }>;
};

export default function MessageNotificationPage() {
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [currentTab, setCurrentTab] = useState<NotificationTemplateType>(
    NotificationTemplateType.EMAIL
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // 查询消息通知列表（不是模板列表）
  const { data, isLoading, refetch } = api.notification.getAll.useQuery(
    {
      type: currentTab,
    },
    {
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    }
  );

  // 删除消息通知
  const deleteMutation = api.notification.delete.useMutation({
    onSuccess: () => {
      showSuccessToast('删除成功');
      void refetch();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  const currentData: Notification[] = (data || []) as Notification[];

  // 前端分页
  const totalItems = currentData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = currentData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleNew = () => {
    router.push(`/crowdsource/admin/message-notification/release?type=${currentTab}`);
  };

  const handleEdit = (item: Notification) => {
    router.push(`/crowdsource/admin/message-notification/release?id=${item.id}`);
  };

  const handleDelete = (item: Notification) => {
    if (window.confirm('确定要删除这条通知吗?')) {
      deleteMutation.mutate({ id: item.id });
    }
  };

  const formatDateTime = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const getTabLabel = (type: NotificationTemplateType) => {
    switch (type) {
      case NotificationTemplateType.EMAIL:
        return '邮件通知';
      case NotificationTemplateType.SMS:
        return '微信小程序通知';
      case NotificationTemplateType.WECHAT:
        return '蓝信通知';
      default:
        return '';
    }
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value as NotificationTemplateType);
    setCurrentPage(1);
  };

  return (
    <Box h="calc(100vh - 72px)" overflow="hidden">
      {/* 面包屑导航 */}
      <Flex align="center" gap={2} mb={4} px={6}>
        <Text fontSize="14px" color={COLORS.textTertiary}>
          后台管理
        </Text>
        <LuChevronRight size={14} color={COLORS.textTertiary} />
        <Text fontSize="14px" color={COLORS.textTertiary}>
          公告与消息管理
        </Text>
        <LuChevronRight size={14} color={COLORS.textTertiary} />
        <Text fontSize="14px" color={COLORS.textPrimary} fontWeight="500">
          消息通知
        </Text>
      </Flex>

      {/* 主容器 */}
      <Box
        bg={COLORS.bgPrimary}
        borderRadius="8px"
        h="calc(100% - 36px)"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {/* 标题和发布按钮 */}
        <Flex justify="space-between" align="center" px={6} pt={6} pb={4} flexShrink={0}>
          {/* Tab 切换 */}
          <Box flexShrink={0}>
            <Tabs.Root
              value={currentTab}
              onValueChange={(e) => handleTabChange(e.value)}
              variant="enclosed"
            >
              <Tabs.List bg="#fff">
                <Tabs.Trigger
                  value={NotificationTemplateType.EMAIL}
                  px={4}
                  py={3}
                  fontSize="14px"
                  color={COLORS.textSecondary}
                  borderBottom="2px solid transparent"
                  _selected={{
                    color: COLORS.primary,
                    borderBottomColor: COLORS.primary,
                    fontWeight: '500',
                    _before: {
                      bg: 'transparent',
                    },
                  }}
                  _before={{
                    bg: 'transparent',
                  }}
                >
                  {getTabLabel(NotificationTemplateType.EMAIL)}
                </Tabs.Trigger>
                <Tabs.Trigger
                  value={NotificationTemplateType.SMS}
                  px={4}
                  py={3}
                  fontSize="14px"
                  color={COLORS.textSecondary}
                  borderBottom="2px solid transparent"
                  _selected={{
                    color: COLORS.primary,
                    borderBottomColor: COLORS.primary,
                    fontWeight: '500',
                    _before: {
                      bg: 'transparent',
                    },
                  }}
                  _before={{
                    bg: 'transparent',
                  }}
                >
                  {getTabLabel(NotificationTemplateType.SMS)}
                </Tabs.Trigger>
                <Tabs.Trigger
                  value={NotificationTemplateType.WECHAT}
                  px={4}
                  py={3}
                  fontSize="14px"
                  color={COLORS.textSecondary}
                  borderBottom="2px solid transparent"
                  _selected={{
                    color: COLORS.primary,
                    borderBottomColor: COLORS.primary,
                    fontWeight: '500',
                    _before: {
                      bg: 'transparent',
                    },
                  }}
                  _before={{
                    bg: 'transparent',
                  }}
                >
                  {getTabLabel(NotificationTemplateType.WECHAT)}
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
          </Box>
          <Button
            bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
            color="white"
            fontSize="14px"
            fontWeight="500"
            borderRadius="4px"
            h="36px"
            px={6}
            _hover={{ opacity: 0.9 }}
            onClick={handleNew}
          >
            发布通知
          </Button>
        </Flex>

        {/* 灰色间隙 */}
        <Box h="16px" bg={COLORS.bgSecondary} flexShrink={0} />

        {/* 表格区域 - 可滚动 */}
        <Box flex="1" overflowY="auto" bg={COLORS.bgPrimary}>
          <Box px={6} py={4}>
            {isLoading ? (
              <Flex justify="center" align="center" py={8}>
                <Text color={COLORS.textSecondary}>加载中...</Text>
              </Flex>
            ) : paginatedData.length === 0 ? (
              <Flex justify="center" align="center" py={8}>
                <Text color={COLORS.textSecondary}>暂无数据</Text>
              </Flex>
            ) : (
              <Table.Root variant="outline" size="sm">
                <Table.Header>
                  <Table.Row bg={COLORS.bgSecondary}>
                    <Table.ColumnHeader
                      py={4}
                      px={4}
                      fontSize="14px"
                      fontWeight="500"
                      color={COLORS.textSecondary}
                      textAlign="center"
                      w="80px"
                    >
                      序号
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      py={4}
                      px={4}
                      fontSize="14px"
                      fontWeight="500"
                      color={COLORS.textSecondary}
                    >
                      内容摘要
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      py={4}
                      px={4}
                      fontSize="14px"
                      fontWeight="500"
                      color={COLORS.textSecondary}
                      w="180px"
                    >
                      编辑时间
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      py={4}
                      px={4}
                      fontSize="14px"
                      fontWeight="500"
                      color={COLORS.textSecondary}
                      textAlign="center"
                      w="120px"
                    >
                      操作
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {paginatedData.map((item, index) => (
                    <Table.Row
                      key={item.id}
                      borderBottom="1px solid"
                      borderColor={COLORS.borderColor}
                      _hover={{ bg: COLORS.bgSecondary }}
                    >
                      <Table.Cell
                        py={4}
                        px={4}
                        fontSize="14px"
                        color={COLORS.textPrimary}
                        textAlign="center"
                      >
                        {startIndex + index + 1}
                      </Table.Cell>
                      <Table.Cell py={4} px={4} fontSize="14px" color={COLORS.textPrimary}>
                        <Box
                          dangerouslySetInnerHTML={{ __html: item.content }}
                          css={{
                            '& p': { margin: 0, display: 'inline' },
                            '& img': { maxWidth: '100px', maxHeight: '60px', verticalAlign: 'middle' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as const,
                          }}
                        />
                      </Table.Cell>
                      <Table.Cell py={4} px={4} fontSize="14px" color={COLORS.textPrimary}>
                        {formatDateTime(item.updatedAt)}
                      </Table.Cell>
                      <Table.Cell py={4} px={4} textAlign="center">
                        <Flex justify="center" align="center" gap={3}>
                          <Box
                            as="button"
                            cursor="pointer"
                            color={COLORS.textSecondary}
                            _hover={{ color: COLORS.primary }}
                            onClick={() => handleEdit(item)}
                          >
                            <LuPencil size={18} />
                          </Box>
                          <Box
                            as="button"
                            cursor="pointer"
                            color={COLORS.textSecondary}
                            _hover={{ color: COLORS.primary }}
                            onClick={() => handleDelete(item)}
                          >
                            <LuTrash2 size={18} />
                          </Box>
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Box>
        </Box>

        {/* 灰色间隙 */}
        <Box h="16px" bg={COLORS.bgSecondary} flexShrink={0} />

        {/* 分页区域 */}
        {totalItems > 0 && (
          <Flex justify="space-between" align="center" p={6} bg={COLORS.bgPrimary} flexShrink={0}>
            <Text fontSize="14px" color={COLORS.textSecondary}>
              共{totalItems}条
            </Text>

            <Flex align="center" gap={2}>
              {/* 上一页按钮 */}
              <Button
                minW="32px"
                h="32px"
                px={3}
                fontSize="14px"
                bg="transparent"
                color={COLORS.textSecondary}
                border="1px solid"
                borderColor={COLORS.borderColor}
                borderRadius="4px"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                opacity={currentPage === 1 ? 0.5 : 1}
                cursor={currentPage === 1 ? 'not-allowed' : 'pointer'}
                _hover={{
                  bg: currentPage === 1 ? 'transparent' : COLORS.bgSecondary,
                }}
              >
                上一页
              </Button>

              {/* 页码 */}
              {getPageNumbers().map((page, index) =>
                typeof page === 'number' ? (
                  <Button
                    key={index}
                    minW="32px"
                    h="32px"
                    px={2}
                    fontSize="14px"
                    bg={currentPage === page ? '#FFE8E8' : 'transparent'}
                    color={currentPage === page ? COLORS.primary : COLORS.textSecondary}
                    border="1px solid"
                    borderColor={COLORS.borderColor}
                    borderRadius="4px"
                    onClick={() => handlePageChange(page)}
                    _hover={{
                      bg: currentPage === page ? '#FFE8E8' : COLORS.bgSecondary,
                    }}
                  >
                    {page}
                  </Button>
                ) : (
                  <Text key={index} px={2} color={COLORS.textTertiary}>
                    {page}
                  </Text>
                )
              )}

              {/* 下一页按钮 */}
              <Button
                minW="32px"
                h="32px"
                px={3}
                fontSize="14px"
                bg="transparent"
                color={COLORS.textSecondary}
                border="1px solid"
                borderColor={COLORS.borderColor}
                borderRadius="4px"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                opacity={currentPage === totalPages ? 0.5 : 1}
                cursor={currentPage === totalPages ? 'not-allowed' : 'pointer'}
                _hover={{
                  bg: currentPage === totalPages ? 'transparent' : COLORS.bgSecondary,
                }}
              >
                下一页
              </Button>
            </Flex>
          </Flex>
        )}
      </Box>
    </Box>
  );
}
