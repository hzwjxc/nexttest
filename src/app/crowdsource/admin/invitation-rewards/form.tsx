'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Input,
  Button,
  Image,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogBackdrop,
  DialogTitle,
  DialogCloseTrigger,
  IconButton,
  VStack
} from '@chakra-ui/react';
import { Field } from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react';
import { LuUpload } from 'react-icons/lu';
import { X } from 'lucide-react';
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

interface InvitationRewardFormProps {
  initialValues?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function InvitationRewardForm({
  initialValues,
  onSuccess,
  onCancel,
}: InvitationRewardFormProps) {
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [formData, setFormData] = useState({
    title: '',
    system: '',
    startTime: '',
    endTime: '',
    posterImage: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string>('');
  
  // 人员标签相关状态
  const [personTags, setPersonTags] = useState<string[]>(initialValues?.personTags || []);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set(initialValues?.selectedTagIds || []));
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [tempSelectedTags, setTempSelectedTags] = useState<Set<string>>(new Set());

  // 获取系统列表
  const { data: allSystemsData } = api.testSystem.getAll.useQuery();
  
  // 获取标签数据
  const { data: tagCategoriesData } = api.tagManagement.getAllWithUserCount.useQuery();
  
  // 文件上传 mutation
  const uploadFileMutation = api.util.uploadFile.useMutation();

  const systemsOptions = [
    { value: "", label: "所属系统" },
    ...(allSystemsData?.map(s => ({ value: s.name, label: s.name })) || [])
  ];

  // 新增或更新邀请有奖活动的mutation
  const createMutation = api.invitationReward.create.useMutation({
    onSuccess: () => {
      showSuccessToast('新增邀请有奖活动成功');
      onSuccess();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  const updateMutation = api.invitationReward.update.useMutation({
    onSuccess: () => {
      showSuccessToast('更新邀请有奖活动成功');
      onSuccess();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  // 初始化表单数据
  useEffect(() => {
    if (initialValues) {
      setFormData({
        title: initialValues.title || '',
        system: initialValues.system || '',
        startTime: initialValues.startTime ? new Date(initialValues.startTime).toISOString().slice(0, 16) : '',
        endTime: initialValues.endTime ? new Date(initialValues.endTime).toISOString().slice(0, 16) : '',
        posterImage: initialValues.posterImage || '',
        isActive: initialValues.isActive ?? true,
      });
      setPreviewImage(initialValues.posterImage || '');
      
      // 初始化人员标签
      if (initialValues.personTags) {
        setPersonTags(initialValues.personTags);
      }
      if (initialValues.selectedTagIds) {
        setSelectedTagIds(new Set(initialValues.selectedTagIds));
      }
    }
  }, [initialValues]);

  // 处理输入变化
  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };
  
  // 人员标签相关处理函数
  const handleOpenTagDialog = () => {
    setTempSelectedTags(new Set(selectedTagIds));
    setIsTagDialogOpen(true);
  };
  
  const handleCloseTagDialog = () => {
    setIsTagDialogOpen(false);
  };
  
  const handleToggleTag = (tagId: string) => {
    const newSelected = new Set(tempSelectedTags);
    if (newSelected.has(tagId)) {
      newSelected.delete(tagId);
    } else {
      newSelected.add(tagId);
    }
    setTempSelectedTags(newSelected);
  };
  
  const handleConfirmTags = () => {
    setSelectedTagIds(tempSelectedTags);
    
    // 根据选中的ID获取标签文本
    const selectedTagLabels: string[] = [];
    if (tagCategoriesData) {
      Object.values(tagCategoriesData).forEach(tags => {
        tags.forEach(tag => {
          if (tempSelectedTags.has(tag.id)) {
            selectedTagLabels.push(tag.name);
          }
        });
      });
    }
    
    setPersonTags(selectedTagLabels);
    setIsTagDialogOpen(false);
    
    // 清除人员标签错误
    if (errors.personnelTag) {
      setErrors(prev => ({
        ...prev,
        personnelTag: ''
      }));
    }
  };
  
  const handleRemoveTag = (tagLabel: string) => {
    // 从personTags中移除
    setPersonTags(personTags.filter(tag => tag !== tagLabel));
    
    // 从selectedTagIds中移除对应的ID
    const newSelectedIds = new Set(selectedTagIds);
    if (tagCategoriesData) {
      Object.values(tagCategoriesData).forEach(tags => {
        tags.forEach(tag => {
          if (tag.name === tagLabel) {
            newSelectedIds.delete(tag.id);
          }
        });
      });
    }
    setSelectedTagIds(newSelectedIds);
  };
  
  // 计算已选人数（去重）
  const calculateSelectedCount = () => {
    const uniqueUserIds = new Set<string>();
    if (tagCategoriesData) {
      Object.values(tagCategoriesData).forEach(tags => {
        tags.forEach(tag => {
          if (selectedTagIds.has(tag.id)) {
            // 将该标签的所有用户ID添加到Set中，自动去重
            tag.userIds.forEach(userId => uniqueUserIds.add(userId));
          }
        });
      });
    }
    return uniqueUserIds.size;
  };

  // 验证表单
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入活动标题';
    }

    if (!formData.system) {
      newErrors.system = '请选择系统';
    }

    if (personTags.length === 0) {
      newErrors.personnelTag = '请选择人员标签';
    }

    // 检查是否选择了标签但没有用户
    if (personTags.length > 0 && calculateSelectedCount() === 0) {
      newErrors.personnelTag = '所选标签下暂无用户';
    }

    if (!formData.startTime) {
      newErrors.startTime = '请选择开始日期';
    }

    if (!formData.endTime) {
      newErrors.endTime = '请选择结束日期';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      if (start >= end) {
        newErrors.endTime = '结束时间必须晚于开始时间';
      }
    }

    if (!formData.posterImage) {
      newErrors.posterImage = '请上传海报图片';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理提交
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    // 计算预计邀请人数
    const expectedInviteCount = calculateSelectedCount();

    const submitData = {
      title: formData.title.trim(),
      system: formData.system,
      personTags, // 人员标签数组
      selectedTagIds: Array.from(selectedTagIds), // 选中的标签ID
      expectedInviteCount, // 预计邀请人数
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime),
      posterImage: formData.posterImage,
      isActive: formData.isActive,
    };

    if (initialValues) {
      // 更新
      updateMutation.mutate({
        id: initialValues.id,
        ...submitData
      });
    } else {
      // 新增
      createMutation.mutate(submitData);
    }
  };

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      showErrorToast('请上传图片文件');
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('图片大小不能超过5MB');
      return;
    }

    try {
      // 显示上传状态
      showSuccessToast('正在上传图片...');
      
      // 将文件转换为 base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 使用通用文件上传 API
      const uploadResult: any = await uploadFileMutation.mutateAsync({
        file: base64,
        filename: file.name,
        folder: 'invitation-rewards',
      });

      if (uploadResult.success) {
        // 设置表单数据和预览
        handleChange('posterImage', uploadResult.url);
        setPreviewImage(base64);
        showSuccessToast('图片上传成功');
      } else {
        showErrorToast('图片上传失败');
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      showErrorToast('图片上传失败');
    }
  };

  return (
    <Box>
      <Flex direction="column" gap={4}>
        {/* 标题 */}
        <Box>
          <Text color={COLORS.textPrimary} fontWeight="500" mb={2}>
            <Text as="span" color={COLORS.primary}>*</Text> 标题
          </Text>
          <Input
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="请输入参测人数"
            borderColor={errors.title ? 'red.500' : COLORS.borderColor}
            borderRadius="4px"
            fontSize="14px"
            _focus={{
              borderColor: COLORS.primary,
              boxShadow: `0 0 0 1px ${COLORS.primary}`,
            }}
          />
          {errors.title && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.title}
            </Text>
          )}
        </Box>

        {/* 选择系统 */}
        <Field.Root required>
          <Field.Label fontSize="14px" color={COLORS.textPrimary} mb={2}>
            <Text as="span" color={COLORS.primary} mr={1}>*</Text>
            选择系统
          </Field.Label>
          <NativeSelectRoot>
            <NativeSelectField
              value={formData.system}
              onChange={(e) => handleChange('system', e.target.value)}
              bg="#F7F8FA"
              borderColor={errors.system ? '#e53e3e' : COLORS.borderColor}
              _hover={{ borderColor: "#C9CDD4" }}
              _focus={{ borderColor: COLORS.primary, boxShadow: `0 0 0 1px ${COLORS.primary}` }}
            >
              {systemsOptions.map((sys) => (
                <option key={sys.value} value={sys.value}>
                  {sys.label}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
          {errors.system && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.system}
            </Text>
          )}
        </Field.Root>

        {/* 人员标签 */}
        <Field.Root required>
          <Field.Label fontSize="14px" color={COLORS.textPrimary} mb={2}>
            <Text as="span" color={COLORS.primary} mr={1}>*</Text>
            人员标签
          </Field.Label>
          <Flex gap={2} wrap="wrap" mb={2}>
            {personTags.map((tag, index) => (
              <Flex
                key={index}
                align="center"
                bg="#F2F3F5"
                borderRadius="4px"
                px={3}
                py={1}
                gap={2}
              >
                <Text fontSize="14px" color="#4E5969">
                  {tag}
                </Text>
                <IconButton
                  aria-label="删除标签"
                  size="xs"
                  variant="ghost"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <X size={14} />
                </IconButton>
              </Flex>
            ))}
          </Flex>
          <Flex gap={2} align="center">
            <Button
              variant="outline"
              borderColor="#E5E6EB"
              color="#4E5969"
              flex={1}
              onClick={handleOpenTagDialog}
              justifyContent="flex-start"
              bg="#F7F8FA"
            >
              请选择标签
            </Button>
            {selectedTagIds.size > 0 && (
              <Text fontSize="14px" color="#165DFF">
                已选择：{calculateSelectedCount()}人
              </Text>
            )}
          </Flex>
          {errors.personnelTag && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.personnelTag}
            </Text>
          )}
        </Field.Root>

        {/* 开始日期 */}
        <Box>
          <Text color={COLORS.textPrimary} fontWeight="500" mb={2}>
            <Text as="span" color={COLORS.primary}>*</Text> 开始日期
          </Text>
          <Input
            type="datetime-local"
            value={formData.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
            borderColor={errors.startTime ? 'red.500' : COLORS.borderColor}
            borderRadius="4px"
            fontSize="14px"
            _focus={{
              borderColor: COLORS.primary,
              boxShadow: `0 0 0 1px ${COLORS.primary}`,
            }}
          />
          {errors.startTime && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.startTime}
            </Text>
          )}
        </Box>

        {/* 结束日期 */}
        <Box>
          <Text color={COLORS.textPrimary} fontWeight="500" mb={2}>
            <Text as="span" color={COLORS.primary}>*</Text> 结束日期
          </Text>
          <Input
            type="datetime-local"
            value={formData.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)}
            borderColor={errors.endTime ? 'red.500' : COLORS.borderColor}
            borderRadius="4px"
            fontSize="14px"
            _focus={{
              borderColor: COLORS.primary,
              boxShadow: `0 0 0 1px ${COLORS.primary}`,
            }}
          />
          {errors.endTime && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.endTime}
            </Text>
          )}
        </Box>

        {/* 上传海报 */}
        <Box>
          <Text color={COLORS.textPrimary} fontWeight="500" mb={2}>
            <Text as="span" color={COLORS.primary}>*</Text> 上传海报
          </Text>
          <Box
            border={`1px dashed ${errors.posterImage ? '#e53e3e' : COLORS.borderColor}`}
            borderRadius="4px"
            p={4}
            textAlign="center"
            cursor="pointer"
            position="relative"
            _hover={{
              borderColor: COLORS.primary,
            }}
          >
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              position="absolute"
              top={0}
              left={0}
              width="100%"
              height="100%"
              opacity={0}
              cursor="pointer"
            />
            {previewImage ? (
              <Image
                src={previewImage}
                alt="海报预览"
                maxH="200px"
                mx="auto"
                borderRadius="4px"
              />
            ) : (
              <Flex direction="column" align="center" gap={2}>
                <LuUpload size={24} color={COLORS.textTertiary} />
                <Text color={COLORS.textTertiary} fontSize="14px">
                  上传图片
                </Text>
              </Flex>
            )}
          </Box>
          {errors.posterImage && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.posterImage}
            </Text>
          )}
        </Box>

        {/* 是否开启 */}
        <Box>
          <Text color={COLORS.textPrimary} fontWeight="500" mb={2}>
            <Text as="span" color={COLORS.primary}>*</Text> 是否开启
          </Text>
          <Flex align="center" gap={4}>
            <Flex align="center" gap={2}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                }}
              />
              <Text color={COLORS.textPrimary} fontSize="14px">
                {formData.isActive ? '是' : '否'}
              </Text>
            </Flex>
          </Flex>
        </Box>
      </Flex>

      {/* 按钮组 */}
      <Flex justify="flex-end" gap={3} mt={8}>
        <Button
          variant="outline"
          fontSize="14px"
          px={6}
          borderColor={COLORS.borderColor}
          color={COLORS.textSecondary}
          _hover={{ bg: COLORS.bgSecondary }}
          onClick={onCancel}
        >
          关闭
        </Button>
        <Button
          background="linear-gradient(to right, #FF9566, #FE606B)"
          color="white"
          fontSize="14px"
          px={6}
          _hover={{ opacity: 0.9 }}
          onClick={handleSubmit}
          loading={createMutation.isPending || updateMutation.isPending}
        >
          确认
        </Button>
      </Flex>

      {/* 标签配置对话框 */}
      <DialogRoot
        open={isTagDialogOpen}
        onOpenChange={(e) => setIsTagDialogOpen(e.open)}
        size="xl"
        placement="center"
        motionPreset="slide-in-bottom"
      >
        <DialogBackdrop />
        <DialogContent
          maxW="800px"
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
        >
          <DialogHeader>
            <DialogTitle fontSize="18px" fontWeight="600" color="#1d2129">
              配置标签
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch" maxH="60vh" overflowY="auto">
              {tagCategoriesData && Object.entries(tagCategoriesData).map(([category, tags]) => (
                <Box key={category}>
                  <Text
                    fontSize="14px"
                    fontWeight="500"
                    color="#4E5969"
                    mb={3}
                    bg="#F2F3F5"
                    px={4}
                    py={2}
                  >
                    {category}
                  </Text>
                  <Flex gap={3} wrap="wrap" px={4}>
                    {tags.map((tag) => (
                      <Button
                        key={tag.id}
                        variant={tempSelectedTags.has(tag.id) ? "solid" : "outline"}
                        size="sm"
                        onClick={() => handleToggleTag(tag.id)}
                        bg={tempSelectedTags.has(tag.id) ? "#E31424" : "white"}
                        color={tempSelectedTags.has(tag.id) ? "white" : "#4E5969"}
                        borderColor="#E5E6EB"
                        _hover={{
                          bg: tempSelectedTags.has(tag.id) ? "#C21010" : "#F7F8FA",
                        }}
                      >
                        {tag.name} {tag.userCount}人
                      </Button>
                    ))}
                  </Flex>
                </Box>
              ))}
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Flex justify="space-between" align="center" w="100%">
              <Text fontSize="14px" color="#165DFF">
                已选择：{(() => {
                  const uniqueUserIds = new Set<string>();
                  if (tagCategoriesData) {
                    Object.values(tagCategoriesData).forEach(tags => {
                      tags.forEach(tag => {
                        if (tempSelectedTags.has(tag.id)) {
                          tag.userIds.forEach(userId => uniqueUserIds.add(userId));
                        }
                      });
                    });
                  }
                  return uniqueUserIds.size;
                })()}人
              </Text>
              <Flex gap={3}>
                <Button
                  variant="outline"
                  borderColor="#E5E6EB"
                  color="#4E5969"
                  onClick={handleCloseTagDialog}
                >
                  取消
                </Button>
                <Button
                  bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                  color="white"
                  onClick={handleConfirmTags}
                >
                  确认
                </Button>
              </Flex>
            </Flex>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}