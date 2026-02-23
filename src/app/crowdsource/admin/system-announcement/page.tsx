'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Flex,
  Text,
  Button,
  Table,
} from '@chakra-ui/react';
import { LuChevronRight, LuPencil, LuTrash2, LuChevronUp, LuChevronDown } from 'react-icons/lu';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';

const COLORS = {
  primary: '#E31424',
  textPrimary: '#1D2129',
  textSecondary: '#4E5969',
  textTertiary: '#86909C',
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F2F3F5',
  borderColor: '#E5E6EB',
};

type AnnouncementItem = {
  id: string;
  sort: number;
  title: string;
  content: string;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
};

export default function SystemAnnouncementPage() {
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 查询公告列表
  const { data, isLoading, refetch } = api.announcement.list.useQuery(
    {
      page: currentPage,
      pageSize: pageSize,
    },
    {
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    }
  );

  // 删除公告
  const deleteMutation = api.announcement.delete.useMutation({
    onSuccess: () => {
      showSuccessToast('删除成功');
      void refetch();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  // 上移公告
  const moveUpMutation = api.announcement.moveUp.useMutation({
    onSuccess: () => {
      void refetch();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  // 下移公告
  const moveDownMutation = api.announcement.moveDown.useMutation({
    onSuccess: () => {
      void refetch();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  const totalItems = data?.pagination.total || 0;
  const totalPages = data?.pagination.totalPages || 0;
  const currentData: AnnouncementItem[] = (data?.data || []) as AnnouncementItem[];

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleNew = () => {
    router.push('/crowdsource/admin/system-announcement/announcement-release');
  };

  const handleEdit = (item: AnnouncementItem) => {
    router.push(`/crowdsource/admin/system-announcement/announcement-release?id=${item.id}`);
  };

  const handleDelete = (item: AnnouncementItem) => {
    if (window.confirm('确定要删除这条公告吗?')) {
      deleteMutation.mutate({ id: item.id });
    }
  };

  const handleMoveUp = (item: AnnouncementItem) => {
    moveUpMutation.mutate({ id: item.id });
  };

  const handleMoveDown = (item: AnnouncementItem) => {
    moveDownMutation.mutate({ id: item.id });
  };

  const formatDateTime = (date: string | Date | null | undefined) => {
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
          系统公告
        </Text>
      </Flex>

      {/* 主容器 - 白色背景，固定高度，内部滚动 */}
      <Box
        bg={COLORS.bgPrimary}
        borderRadius="8px"
        h="calc(100% - 36px)"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {/* 标题和操作按钮 */}
        <Flex justify="space-between" align="center" p={6} flexShrink={0}>
          <Text fontSize="18px" fontWeight="600" color={COLORS.textPrimary}>
            系统公告
          </Text>
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
            新增
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
            ) : currentData.length === 0 ? (
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
                      w={28}
                      fontSize="14px"
                      fontWeight="500"
                      color={COLORS.textSecondary}
                    >
                      公告标题
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
                      起始时间
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      py={4}
                      px={4}
                      fontSize="14px"
                      fontWeight="500"
                      color={COLORS.textSecondary}
                      w="180px"
                    >
                      关闭时间
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
                  {currentData.map((item, index) => (
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
                        {index + 1}
                      </Table.Cell>
                      <Table.Cell py={4} px={4} fontSize="14px" color={COLORS.textPrimary}>
                        {item.title}
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
                        {formatDateTime(item.startTime)}
                      </Table.Cell>
                      <Table.Cell py={4} px={4} fontSize="14px" color={COLORS.textPrimary}>
                        {formatDateTime(item.endTime)}
                      </Table.Cell>
                      <Table.Cell py={4} px={4} textAlign="center">
                        <Flex justify="center" align="center" gap={3}>
                          <Box
                            as="button"
                            cursor="pointer"
                            color={COLORS.textSecondary}
                            _hover={{ color: COLORS.primary }}
                            onClick={() => handleMoveUp(item)}
                          >
                            <LuChevronUp size={18} />
                          </Box>
                          <Box
                            as="button"
                            cursor="pointer"
                            color={COLORS.textSecondary}
                            _hover={{ color: COLORS.primary }}
                            onClick={() => handleMoveDown(item)}
                          >
                            <LuChevronDown size={18} />
                          </Box>
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

        {/* 分页区域 - 固定在底部 */}
        {totalItems > 0 && (
          <Flex justify="space-between" align="center" p={6} bg={COLORS.bgPrimary} flexShrink={0}>
            <Text fontSize="14px" color={COLORS.textSecondary}>
              共{totalItems}条
            </Text>

            <Flex align="center" gap={2}>
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

              <Text px={2} color={COLORS.textSecondary}>
                {pageSize}条/页
              </Text>

              <Button
                fontSize="14px"
                h="32px"
                px={3}
                variant="outline"
                borderColor={COLORS.borderColor}
                color={COLORS.textSecondary}
                _hover={{ bg: COLORS.bgSecondary }}
              >
                前往
              </Button>
            </Flex>
          </Flex>
        )}
      </Box>
    </Box>
  );
}
