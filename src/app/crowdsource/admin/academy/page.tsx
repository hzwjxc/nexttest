'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Flex,
  Text,
  Button,
  Table,
  Image,
  Menu,
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

type AcademyItem = {
  id: string;
  sequence: number;
  title: string;
  coverImage: string;
  publishTime: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
};

export default function AcademyManagementPage() {
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 查询文章列表（包含未发布的文章）
  const { data, isLoading, refetch } = api.academy.list.useQuery(
    {
      page: currentPage,
      pageSize: pageSize,
      includeUnpublished: true, // 后台管理需要显示所有文章
    },
    {
      // 确保页面挂载时重新获取数据
      refetchOnMount: 'always',
      // 当窗口重新获得焦点时刷新数据
      refetchOnWindowFocus: true,
    }
  );

  // 删除文章
  const deleteMutation = api.academy.delete.useMutation({
    onSuccess: () => {
      showSuccessToast('删除成功');
      void refetch();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  // 上移文章
  const moveUpMutation = api.academy.moveUp.useMutation({
    onSuccess: () => {
      void refetch();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  // 下移文章
  const moveDownMutation = api.academy.moveDown.useMutation({
    onSuccess: () => {
      void refetch();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  const totalItems = data?.pagination.total || 0;
  const totalPages = data?.pagination.totalPages || 0;
  const currentData: AcademyItem[] = (data?.data || []) as AcademyItem[];

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleNewArticle = () => {
    router.push('/crowdsource/admin/academy/publish');
  };

  const handleEditArticle = (item: AcademyItem) => {
    router.push(`/crowdsource/admin/academy/publish?id=${item.id}`);
  };

  const handleDeleteArticle = (item: AcademyItem) => {
    if (window.confirm('确定要删除这篇文章吗?')) {
      deleteMutation.mutate({ id: item.id });
    }
  };

  const handleMoveUp = (item: AcademyItem) => {
    moveUpMutation.mutate({ id: item.id });
  };

  const handleMoveDown = (item: AcademyItem) => {
    moveDownMutation.mutate({ id: item.id });
  };

  const formatDateTime = (date: string | Date) => {
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
    <Box p={6}>
      {/* 面包屑导航 */}
      <Flex align="center" gap={2} mb={4}>
        <Text fontSize="14px" color={COLORS.textTertiary}>
          后台管理
        </Text>
        <LuChevronRight size={14} color={COLORS.textTertiary} />
        <Text fontSize="14px" color={COLORS.textTertiary}>
          公告与消息管理
        </Text>
        <LuChevronRight size={14} color={COLORS.textTertiary} />
        <Text fontSize="14px" color={COLORS.textPrimary} fontWeight="500">
          众测学堂
        </Text>
      </Flex>

      {/* 主内容卡片 */}
      <Box bg={COLORS.bgPrimary} borderRadius="8px" p={6}>
        {/* 标题和操作按钮 */}
        <Flex justify="space-between" align="center" mb={6}>
          <Text fontSize="18px" fontWeight="600" color={COLORS.textPrimary}>
            众测学堂
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
            onClick={handleNewArticle}
          >
            新增
          </Button>
        </Flex>

        {/* 表格 */}
        <Box overflowX="auto">
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
                    fontSize="14px"
                    fontWeight="500"
                    color={COLORS.textSecondary}
                    w="200px"
                  >
                    文章标题
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    py={4}
                    px={4}
                    fontSize="14px"
                    fontWeight="500"
                    color={COLORS.textSecondary}
                  >
                    文章配图
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    py={4}
                    px={4}
                    fontSize="14px"
                    fontWeight="500"
                    color={COLORS.textSecondary}
                    w="180px"
                  >
                    发布时间
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
                {currentData.map((item) => (
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
                      {item.sequence}
                    </Table.Cell>
                    <Table.Cell py={4} px={4} fontSize="14px" color={COLORS.textPrimary}>
                      {item.title}
                    </Table.Cell>
                    <Table.Cell py={4} px={4}>
                      <Image
                        src={item.coverImage}
                        alt="封面图"
                        w="160px"
                        h="90px"
                        objectFit="cover"
                        borderRadius="4px"
                      />
                    </Table.Cell>
                    <Table.Cell py={4} px={4} fontSize="14px" color={COLORS.textPrimary}>
                      {formatDateTime(item.publishTime)}
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
                          onClick={() => handleEditArticle(item)}
                        >
                          <LuPencil size={18} />
                        </Box>
                        <Box
                          as="button"
                          cursor="pointer"
                          color={COLORS.textSecondary}
                          _hover={{ color: COLORS.primary }}
                          onClick={() => handleDeleteArticle(item)}
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

        {/* 分页 */}
        <Flex justify="space-between" align="center" mt={6}>
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
                  bg={currentPage === page ? COLORS.primary : 'transparent'}
                  color={currentPage === page ? 'white' : COLORS.textSecondary}
                  border="1px solid"
                  borderColor={currentPage === page ? COLORS.primary : COLORS.borderColor}
                  borderRadius="4px"
                  onClick={() => handlePageChange(page)}
                  _hover={{
                    bg: currentPage === page ? COLORS.primary : COLORS.bgSecondary,
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

            <Box w="1px" h="20px" bg={COLORS.borderColor} mx={2} />

            <Menu.Root>
              <Menu.Trigger asChild>
                <Button
                  variant="outline"
                  fontSize="14px"
                  h="32px"
                  px={3}
                  borderColor={COLORS.borderColor}
                  color={COLORS.textSecondary}
                  _hover={{ bg: COLORS.bgSecondary }}
                >
                  {pageSize}条/页
                </Button>
              </Menu.Trigger>
              <Menu.Content>
                {[10, 20, 50, 100].map((size) => (
                  <Menu.Item
                    key={size}
                    value={size.toString()}
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                  >
                    {size}条/页
                  </Menu.Item>
                ))}
              </Menu.Content>
            </Menu.Root>

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
      </Box>
    </Box>
  );
}
