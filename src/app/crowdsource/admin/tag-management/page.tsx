'use client';

import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  Badge,
} from '@chakra-ui/react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
  Field,
} from '@/app/_components/ui';
import { LuPlus, LuTrash2 } from 'react-icons/lu';
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

type TagGroup = {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  rules?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function TagManagementPage() {
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [isOpen, setIsOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagGroup | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    tags: [] as string[],
  });
  const [currentTag, setCurrentTag] = useState('');

  // 查询标签组列表
  const { data, isLoading, refetch } = api.tagManagement.list.useQuery(
    {
      page: currentPage,
      pageSize: pageSize,
    },
    {
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    }
  );

  // 创建标签组
  const createMutation = api.tagManagement.create.useMutation({
    onSuccess: () => {
      showSuccessToast('新增标签组成功');
      void refetch();
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  // 更新标签组
  const updateMutation = api.tagManagement.update.useMutation({
    onSuccess: () => {
      showSuccessToast('更新标签组成功');
      void refetch();
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  // 删除标签组
  const deleteMutation = api.tagManagement.delete.useMutation({
    onSuccess: () => {
      showSuccessToast('删除成功');
      void refetch();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  const totalItems = data?.pagination.total || 0;
  const totalPages = data?.pagination.totalPages || 0;
  const currentData = (data?.data || []) as TagGroup[];

  const resetForm = () => {
    setFormData({ name: '', tags: [] });
    setCurrentTag('');
    setEditingTag(null);
  };

  const handleOpenModal = (tag?: TagGroup) => {
    if (tag) {
      setEditingTag(tag);
      // 从rules字段解析标签数组
      const parsedTags = tag.rules ? JSON.parse(tag.rules) : [];
      setFormData({
        name: tag.name,
        tags: parsedTags,
      });
    } else {
      resetForm();
    }
    setIsOpen(true);
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag.trim()],
      });
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tagToRemove),
    });
  };

  const handleSubmit = () => {
    if (!formData.name) {
      showErrorToast('请填写标签组名称');
      return;
    }

    const rules = JSON.stringify(formData.tags);

    if (editingTag) {
      updateMutation.mutate({
        id: editingTag.id,
        name: formData.name,
        category: formData.name, // 使用name作为category
        rules: rules,
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        category: formData.name, // 使用name作为category
        rules: rules,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个标签组吗?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
      pages.push(i);
    }

    return (
      <Flex align="center" gap={2} mt={6}>
        <Text fontSize="14px" color={COLORS.textSecondary}>
          共{totalItems}条
        </Text>
        <Flex gap={1} ml="auto">
          {pages.map((page) => (
            <Button
              key={page}
              size="sm"
              variant={currentPage === page ? 'solid' : 'outline'}
              colorScheme={currentPage === page ? 'red' : 'gray'}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          ))}
          {totalPages > 5 && <Text px={2}>...</Text>}
          {totalPages > 5 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(totalPages)}
            >
              {totalPages}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            下一页
          </Button>
        </Flex>
        <Text fontSize="14px" color={COLORS.textSecondary}>
          {pageSize}条/页
        </Text>
      </Flex>
    );
  };

  return (
    <Box bg={COLORS.bgSecondary} minH="calc(100vh - 72px)" p={6}>
      {/* 面包屑导航 */}
      <Flex align="center" gap={2} mb={4}>
        <Text fontSize="14px" color={COLORS.textSecondary}>
          后台管理
        </Text>
        <Text fontSize="14px" color={COLORS.textSecondary}>
          /
        </Text>
        <Text fontSize="14px" color={COLORS.textPrimary}>
          标签管理
        </Text>
      </Flex>

      {/* 主要内容区 */}
      <Box bg={COLORS.bgPrimary} borderRadius="8px" p={6}>
        {/* 标题和新增按钮 */}
        <Flex justify="space-between" align="center" mb={6}>
          <Text fontSize="20px" fontWeight="500" color={COLORS.textPrimary}>
            标签管理
          </Text>
          <Button
            onClick={() => handleOpenModal()}
            colorScheme="red"
            size="md"
          >
            新增文档标签组
          </Button>
        </Flex>

        {/* 标签组列表 */}
        {isLoading ? (
          <Text>加载中...</Text>
        ) : currentData.length === 0 ? (
          <Text color={COLORS.textSecondary}>暂无数据</Text>
        ) : (
          <VStack gap={4} align="stretch">
            {currentData.map((tagGroup) => {
              const tags = tagGroup.rules ? JSON.parse(tagGroup.rules) : [];
              return (
                <Box
                  key={tagGroup.id}
                  p={4}
                  borderWidth="1px"
                  borderColor={COLORS.borderColor}
                  borderRadius="8px"
                  bg={COLORS.bgPrimary}
                >
                  <Flex justify="space-between" align="flex-start" mb={3}>
                    <Box flex={1}>
                      <Text fontSize="16px" fontWeight="500" color={COLORS.textPrimary} mb={2}>
                        {tagGroup.name}
                      </Text>
                    </Box>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleDelete(tagGroup.id)}
                    >
                      删除
                    </Button>
                  </Flex>

                  {/* 标签显示 */}
                  <Flex flexWrap="wrap" gap={2} mb={3}>
                    {tags.map((tag: string, index: number) => (
                      <Badge
                        key={index}
                        px={3}
                        py={1}
                        borderRadius="full"
                        bg={COLORS.bgSecondary}
                        color={COLORS.textPrimary}
                        fontSize="14px"
                        display="flex"
                        alignItems="center"
                        gap={2}
                        cursor="pointer"
                        _hover={{ bg: COLORS.borderColor }}
                        onClick={() => {
                          // 删除单个标签
                          const newTags = tags.filter((_: string, i: number) => i !== index);
                          updateMutation.mutate({
                            id: tagGroup.id,
                            name: tagGroup.name,
                            category: tagGroup.name,
                            rules: JSON.stringify(newTags),
                          });
                        }}
                      >
                        {tag}
                        <Text fontSize="16px">×</Text>
                      </Badge>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenModal(tagGroup)}
                    >
                      添加
                    </Button>
                  </Flex>
                </Box>
              );
            })}
          </VStack>
        )}

        {/* 分页 */}
        {renderPagination()}
      </Box>

      {/* 新增/编辑标签组弹窗 */}
      <DialogRoot
        open={isOpen}
        onOpenChange={(e) => setIsOpen(e.open)}
      >
        <DialogContent maxW="500px">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? '编辑标签组' : '新增标签组'}
            </DialogTitle>
          </DialogHeader>
          <DialogBody pb={6}>
            <VStack gap={4}>
              <Field
                label="标签组名称"
                required
                helperText="例如：城市、等级、技能等"
              >
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="请输入标签组名称（如：城市）"
                />
              </Field>

              <Field label="标签">
                <VStack gap={2} align="stretch">
                  <HStack>
                    <Input
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="输入标签名称"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button onClick={handleAddTag} size="sm">
                      添加
                    </Button>
                  </HStack>
                  <Flex flexWrap="wrap" gap={2}>
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        px={3}
                        py={1}
                        borderRadius="full"
                        colorScheme="red"
                        display="flex"
                        alignItems="center"
                        gap={2}
                        cursor="pointer"
                        fontSize="14px"
                      >
                        {tag}
                        <Text
                          fontSize="16px"
                          fontWeight="bold"
                          onClick={() => handleRemoveTag(tag)}
                          _hover={{ opacity: 0.7 }}
                        >
                          ×
                        </Text>
                      </Badge>
                    ))}
                  </Flex>
                </VStack>
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsOpen(false)}>
              取消
            </Button>
            <Button
              colorScheme="red"
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              确定
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}
