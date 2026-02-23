
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Flex,
  Text,
  Button,
  Textarea,
  NativeSelectRoot,
  NativeSelectField,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
  DialogActionTrigger,
  DialogBackdrop,
  Input,
} from '@chakra-ui/react';
import { LuChevronRight } from 'react-icons/lu';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';
import { Field } from '@/app/_components/ui/field';
import RichTextEditor from '@/app/_components/ui/rich-text-editor';
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

function ReleasePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const id = searchParams.get('id');
  const typeParam = searchParams.get('type'); // 从 URL 获取 type

  const [formData, setFormData] = useState<{
    type: NotificationTemplateType;
    content: string;
    tags: Array<{ tagId: string; value: string }>;
  }>({
    type: (typeParam as NotificationTemplateType) || NotificationTemplateType.EMAIL,
    content: '',
    tags: [],
  });

  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Array<{ tagId: string; value: string }>>([]);

  // 模板相关状态
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateDialogMode, setTemplateDialogMode] = useState<'add' | 'edit'>('add');
  const [currentTemplate, setCurrentTemplate] = useState<{
    id?: string;
    name: string;
    content: string;
  }>({
    name: '',
    content: '',
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // 获取所有标签
  const { data: tagsData } = api.tagManagement.getAll.useQuery();

  // 获取模板列表
  const { data: templatesData, refetch: refetchTemplates } = api.notificationTemplate.getAll.useQuery(
    { type: formData.type },
    { refetchOnMount: 'always' }
  );

  // 获取详情(编辑模式) - 从 notification 表获取
  const { data: detailData } = api.notification.getById.useQuery(
    { id: id || '' },
    { enabled: !!id }
  );
  
  // 创建消息通知
  const createMutation = api.notification.create.useMutation({
    onSuccess: async () => {
      showSuccessToast('发布成功');
      // 使缓存失效，确保列表页面能获取到最新数据
      await utils.notification.getAll.invalidate();
      router.push('/crowdsource/admin/message-notification');
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });
  
  // 获取 tRPC utils 用于缓存失效
  const utils = api.useUtils();

  // 更新消息通知
  const updateMutation = api.notification.update.useMutation({
    onSuccess: async () => {
      showSuccessToast('更新成功');
      // 使缓存失效，确保列表页面能获取到最新数据
      await utils.notification.getAll.invalidate();
      router.push('/crowdsource/admin/message-notification');
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  // 创建通知模板
  const createTemplateMutation = api.notificationTemplate.create.useMutation({
    onSuccess: () => {
      showSuccessToast('模板创建成功');
      setIsTemplateDialogOpen(false);
      setCurrentTemplate({ name: '', content: '' });
      void refetchTemplates();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });
  
  // 更新通知模板
  const updateTemplateMutation = api.notificationTemplate.update.useMutation({
    onSuccess: () => {
      showSuccessToast('模板更新成功');
      setIsTemplateDialogOpen(false);
      setCurrentTemplate({ name: '', content: '' });
      void refetchTemplates();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });
  
  // 删除通知模板
  const deleteTemplateMutation = api.notificationTemplate.delete.useMutation({
    onSuccess: () => {
      showSuccessToast('模板删除成功');
      setSelectedTemplateId('');
      void refetchTemplates();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  // 加载详情数据
  useEffect(() => {
    if (detailData) {
      setFormData({
        type: detailData.type,
        content: detailData.content,
        tags: detailData.tags || [],
      });
      setSelectedTags(detailData.tags || []);
    }
  }, [detailData]);

  // 打开标签选择对话框
  const handleOpenTagDialog = () => {
    setSelectedTags(formData.tags);
    setIsTagDialogOpen(true);
  };

  // 切换标签选择
  const handleToggleTag = (tagId: string, value: string) => {
    setSelectedTags((prev) => {
      const exists = prev.find((t) => t.tagId === tagId && t.value === value);
      if (exists) {
        return prev.filter((t) => !(t.tagId === tagId && t.value === value));
      } else {
        return [...prev, { tagId, value }];
      }
    });
  };

  // 提交标签选择
  const handleSubmitTags = () => {
    setFormData((prev) => ({ ...prev, tags: selectedTags }));
    setIsTagDialogOpen(false);
  };

  // 打开新增模板对话框
  const handleOpenAddTemplateDialog = () => {
    setTemplateDialogMode('add');
    setCurrentTemplate({ name: '', content: '' });
    setIsTemplateDialogOpen(true);
  };

  // 打开编辑模板对话框
  const handleOpenEditTemplateDialog = (template: any) => {
    setTemplateDialogMode('edit');
    setCurrentTemplate({
      id: template.id,
      name: template.name,
      content: template.content,
    });
    setIsTemplateDialogOpen(true);
  };

  // 选择模板
  const handleSelectTemplate = (templateId: string) => {
    const template = templatesData?.find((t: any) => t.id === templateId);
    if (template) {
      setFormData((prev) => ({ ...prev, content: template.content }));
      setSelectedTemplateId(templateId);
    }
  };

  // 删除模板
  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('确定要删除这个模板吗？')) {
      deleteTemplateMutation.mutate({ id: templateId });
    }
  };

  // 提交模板
  const handleSubmitTemplate = () => {
    if (!currentTemplate.name.trim()) {
      showErrorToast('请输入模板名称');
      return;
    }
    if (!currentTemplate.content.trim()) {
      showErrorToast('请输入模板内容');
      return;
    }

    if (templateDialogMode === 'add') {
      createTemplateMutation.mutate({
        type: formData.type,
        name: currentTemplate.name,
        content: currentTemplate.content,
      });
    } else {
      updateTemplateMutation.mutate({
        id: currentTemplate.id!,
        name: currentTemplate.name,
        content: currentTemplate.content,
      });
    }
  };

  // 提交表单(发布通知)
  const handleSubmit = () => {
    if (!formData.content.trim()) {
      showErrorToast('请输入通知内容');
      return;
    }

    if (id) {
      // 编辑模式:更新现有通知(包含标签)
      updateMutation.mutate({
        id,
        content: formData.content,
        tags: formData.tags,
      });
    } else {
      // 创建模式:发布新通知(包含标签)
      createMutation.mutate({
        type: formData.type,
        content: formData.content,
        tags: formData.tags,
      });
    }
  };

  const handleCancel = () => {
    router.push('/crowdsource/admin/message-notification');
  };

  return (
    <>
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
        <Text
          fontSize="14px"
          color={COLORS.textTertiary}
          cursor="pointer"
          onClick={() => router.push('/crowdsource/admin/message-notification')}
          _hover={{ color: COLORS.primary }}
        >
          消息通知
        </Text>
        <LuChevronRight size={14} color={COLORS.textTertiary} />
        <Text fontSize="14px" color={COLORS.textPrimary} fontWeight="500">
          {id ? '编辑' : '发布'}
        </Text>
      </Flex>

      {/* 主容器 */}
      <Box
        bg={COLORS.bgPrimary}
        borderRadius="8px"
        h="calc(100% - 36px)"
        overflowY="auto"
        p={6}
      >
        {/* 通知类型提示 */}
        <Box
          bg={formData.type === NotificationTemplateType.EMAIL ? '#E6F4FF' : '#FFF7E6'}
          border="1px solid"
          borderColor={formData.type === NotificationTemplateType.EMAIL ? '#1890FF' : '#FF9C6E'}
          borderRadius="8px"
          px={4}
          py={3}
          mb={6}
        >
          <Flex align="center" gap={2}>
            <Box
              w="8px"
              h="8px"
              borderRadius="full"
              bg={formData.type === NotificationTemplateType.EMAIL ? '#1890FF' : '#FF9C6E'}
            />
            <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary}>
              当前编辑：
            </Text>
            <Text fontSize="14px" color={formData.type === NotificationTemplateType.EMAIL ? '#1890FF' : '#FF9C6E'} fontWeight="600">
              {formData.type === NotificationTemplateType.EMAIL
                ? '邮件通知'
                : formData.type === NotificationTemplateType.SMS
                  ? '微信小程序通知'
                  : '蓝信通知'}
            </Text>
          </Flex>
        </Box>

        {/* 表单内容 */}
        <Box maxW="800px" mx="auto">
          {/* 人员标签 */}
          <Field label="人员标签" mb={6}>
            <Flex align="center" gap={3}>
              <Button
                variant="outline"
                borderColor={COLORS.borderColor}
                fontSize="14px"
                h="40px"
                px={4}
                onClick={handleOpenTagDialog}
              >
                {formData.tags.length > 0 ? `已选 ${formData.tags.length} 个标签` : '选择标签'}
              </Button>
              {formData.tags.length > 0 && (
                <Flex gap={2} flexWrap="wrap" flex="1">
                  {formData.tags.map((tag) => {
                    const tagInfo = tagsData?.find((t) => t.id === tag.tagId);
                    return (
                      <Box
                        key={`${tag.tagId}-${tag.value}`}
                        px={3}
                        py={1}
                        borderRadius="4px"
                        bg={COLORS.bgSecondary}
                        fontSize="14px"
                        color={COLORS.textPrimary}
                      >
                        {tagInfo?.category}: {tag.value}
                      </Box>
                    );
                  })}
                </Flex>
              )}
            </Flex>
          </Field>

          {/* 通知内容 */}
          <Field label="通知内容" mb={6}>
            {/* 模板选择和操作 */}
            <Flex align="center" gap={3} mb={4}>
              <Box flex="1">
                <NativeSelectRoot size="md">
                  <NativeSelectField
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    borderColor={COLORS.borderColor}
                    fontSize="14px"
                    h="40px"
                  >
                    <option value="">请选择内容模板</option>
                    {(templatesData || []).map((template: any) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </NativeSelectField>
                </NativeSelectRoot>
              </Box>
              <Button
                size="md"
                variant="outline"
                borderColor={COLORS.borderColor}
                fontSize="14px"
                h="40px"
                px={4}
                onClick={handleOpenAddTemplateDialog}
              >
                新增模板
              </Button>
              <Button
                size="md"
                variant="outline"
                borderColor={COLORS.borderColor}
                fontSize="14px"
                h="40px"
                px={4}
                onClick={() => {
                  const template = templatesData?.find((t: any) => t.id === selectedTemplateId);
                  if (template) {
                    handleOpenEditTemplateDialog(template);
                  } else {
                    showErrorToast('请先选择一个模板');
                  }
                }}
              >
                编辑模板
              </Button>
              <Button
                size="md"
                variant="outline"
                borderColor={COLORS.borderColor}
                color={COLORS.textSecondary}
                fontSize="14px"
                h="40px"
                px={4}
                onClick={() => {
                  if (selectedTemplateId) {
                    handleDeleteTemplate(selectedTemplateId);
                  } else {
                    showErrorToast('请先选择一个模板');
                  }
                }}
              >
                删除模板
              </Button>
            </Flex>

            {/* 编辑器 */}
            {formData.type === NotificationTemplateType.EMAIL ? (
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="请输入邮件内容"
                minHeight="400px"
              />
            ) : (
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={
                  formData.type === NotificationTemplateType.SMS
                    ? '请输入微信小程序通知内容'
                    : '请输入蓝信通知内容'
                }
                bg={COLORS.bgSecondary}
                fontSize="14px"
                minH="400px"
                resize="none"
                border="none"
                _focus={{ outline: 'none', boxShadow: 'none' }}
              />
            )}
          </Field>

          {/* 操作按钮 */}
          <Flex justify="center" gap={4} mt={8}>
            <Button
              variant="outline"
              borderColor={COLORS.borderColor}
              color={COLORS.textSecondary}
              fontSize="14px"
              h="40px"
              px={8}
              onClick={handleCancel}
            >
              关闭
            </Button>
            <Button
              bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
              color="white"
              fontSize="14px"
              h="40px"
              px={8}
              _hover={{ opacity: 0.9 }}
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              确认
            </Button>
          </Flex>
        </Box>
      </Box>
    </Box>

    {/* 标签选择对话框 */}
    <TagSelectionDialog
      isOpen={isTagDialogOpen}
      onClose={() => setIsTagDialogOpen(false)}
      tagsData={tagsData || []}
      selectedTags={selectedTags}
      onToggleTag={handleToggleTag}
      onSubmit={handleSubmitTags}
    />

    {/* 模板管理对话框 */}
    <TemplateDialog
      isOpen={isTemplateDialogOpen}
      onClose={() => setIsTemplateDialogOpen(false)}
      mode={templateDialogMode}
      template={currentTemplate}
      templateType={formData.type}
      onChange={(field, value) => setCurrentTemplate((prev) => ({ ...prev, [field]: value }))}
      onSubmit={handleSubmitTemplate}
      isLoading={createTemplateMutation.isPending || updateTemplateMutation.isPending}
    />
    </>
  );
}

export default function ReleasePage() {
  return (
    <Suspense fallback={<Box>Loading...</Box>}>
      <ReleasePageContent />
    </Suspense>
  );
}

// 标签选择对话框组件
function TagSelectionDialog({
  isOpen,
  onClose,
  tagsData,
  selectedTags,
  onToggleTag,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  tagsData: any[];
  selectedTags: Array<{ tagId: string; value: string }>;
  onToggleTag: (tagId: string, value: string) => void;
  onSubmit: () => void;
}) {
  const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    borderColor: '#E5E6EB',
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <DialogBackdrop />
      <DialogContent
        maxW="600px"
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
      >
        <DialogHeader>
          <DialogTitle fontSize="18px" fontWeight="600">
            选择标签
          </DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <Box>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary}>
                选择标签(可多选):
              </Text>
              {selectedTags.length > 0 && (
                <Text fontSize="14px" color={COLORS.textSecondary}>
                  已选 {selectedTags.length} 个
                </Text>
              )}
            </Flex>
            {!tagsData || tagsData.length === 0 ? (
              <Text fontSize="14px" color={COLORS.textTertiary} textAlign="center" py={4}>
                暂无可用标签
              </Text>
            ) : (
              <Box maxH="400px" overflowY="auto">
                {/* 按分类显示标签 */}
                {tagsData.map((tag) => {
                  // 解析 rules 字段(JSON 数组)
                  let tagOptions: string[] = [];
                  try {
                    tagOptions = tag.rules ? JSON.parse(tag.rules) : [];
                  } catch (e) {
                    console.error('解析标签规则失败:', e);
                  }

                  return (
                    <Box key={tag.id} mb={4}>
                      {/* 分类标题 */}
                      <Box bg={COLORS.bgSecondary} p={3} borderRadius="6px" mb={2}>
                        <Text fontSize="14px" fontWeight="600" color={COLORS.textPrimary}>
                          {tag.category}
                        </Text>
                      </Box>
                      {/* 该分类下的标签选项 */}
                      <Flex gap={2} flexWrap="wrap" px={2}>
                        {tagOptions.length > 0 ? (
                          tagOptions.map((option) => {
                            const isSelected = selectedTags.some(
                              (t) => t.tagId === tag.id && t.value === option
                            );
                            return (
                              <Box
                                key={`${tag.id}-${option}`}
                                px={4}
                                py={2}
                                borderRadius="6px"
                                border="1px solid"
                                borderColor={isSelected ? COLORS.primary : COLORS.borderColor}
                                bg={isSelected ? '#FFF1F0' : COLORS.bgPrimary}
                                cursor="pointer"
                                transition="all 0.2s"
                                _hover={{
                                  borderColor: COLORS.primary,
                                  bg: '#FFF1F0',
                                }}
                                onClick={() => onToggleTag(tag.id, option)}
                              >
                                <Flex align="center" gap={2}>
                                  <Box
                                    w="16px"
                                    h="16px"
                                    borderRadius="3px"
                                    border="2px solid"
                                    borderColor={isSelected ? COLORS.primary : COLORS.borderColor}
                                    bg={isSelected ? COLORS.primary : 'transparent'}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    flexShrink={0}
                                  >
                                    {isSelected && (
                                      <Box
                                        w="8px"
                                        h="5px"
                                        borderLeft="2px solid white"
                                        borderBottom="2px solid white"
                                        transform="rotate(-45deg)"
                                        mt="-2px"
                                      />
                                    )}
                                  </Box>
                                  <Text fontSize="14px" color={COLORS.textPrimary}>
                                    {option}
                                  </Text>
                                </Flex>
                              </Box>
                            );
                          })
                        ) : (
                          <Text fontSize="12px" color={COLORS.textTertiary}>
                            该分类暂无标签选项
                          </Text>
                        )}
                      </Flex>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline" fontSize="14px">
              取消
            </Button>
          </DialogActionTrigger>
          <Button
            bg={COLORS.primary}
            color="white"
            fontSize="14px"
            _hover={{ bg: '#c70f20' }}
            onClick={onSubmit}
          >
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

// 模板管理对话框组件
function TemplateDialog({
  isOpen,
  onClose,
  mode,
  template,
  templateType,
  onChange,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  template: { name: string; content: string };
  templateType: NotificationTemplateType;
  onChange: (field: 'name' | 'content', value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    borderColor: '#E5E6EB',
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <DialogBackdrop />
      <DialogContent
        maxW={templateType === NotificationTemplateType.EMAIL ? '800px' : '600px'}
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
      >
        <DialogHeader>
          <DialogTitle fontSize="18px" fontWeight="600">
            {mode === 'add' ? '新增模板' : '编辑模板'}
          </DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <Box>
            <Text fontSize="14px" color={COLORS.textSecondary} mb={4}>
              {mode === 'add' ? '新增' : '编辑'}
              {templateType === NotificationTemplateType.EMAIL
                ? '邮件'
                : templateType === NotificationTemplateType.SMS
                  ? '微信小程序'
                  : '蓝信'}
              通知模板
            </Text>
            <Box mb={4}>
              <Text fontSize="14px" color={COLORS.textPrimary} mb={2}>
                模板名称
              </Text>
              <Input
                value={template.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="请输入模板名称"
                borderColor={COLORS.borderColor}
                fontSize="14px"
                h="40px"
              />
            </Box>
            <Box>
              <Text fontSize="14px" color={COLORS.textPrimary} mb={2}>
                模板内容
              </Text>
              {templateType === NotificationTemplateType.EMAIL ? (
                <RichTextEditor
                  value={template.content}
                  onChange={(value) => onChange('content', value)}
                  placeholder="请输入模板内容"
                  minHeight="300px"
                />
              ) : (
                <Textarea
                  value={template.content}
                  onChange={(e) => onChange('content', e.target.value)}
                  placeholder={
                    templateType === NotificationTemplateType.SMS
                      ? '请输入微信小程序通知模板内容'
                      : '请输入蓝信通知模板内容'
                  }
                  bg={COLORS.bgSecondary}
                  fontSize="14px"
                  minH="200px"
                  resize="none"
                  borderColor={COLORS.borderColor}
                />
              )}
            </Box>
          </Box>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline" fontSize="14px">
              取消
            </Button>
          </DialogActionTrigger>
          <Button
            bg={COLORS.primary}
            color="white"
            fontSize="14px"
            _hover={{ bg: '#c70f20' }}
            onClick={onSubmit}
            loading={isLoading}
          >
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
