'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  Image,
} from '@chakra-ui/react';
import { LuChevronRight, LuUpload } from 'react-icons/lu';
import RichTextEditor from '@/app/_components/ui/rich-text-editor';
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

export default function AcademyPublishPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { showSuccessToast, showErrorToast } = useCustomToast();

  // 获取 tRPC utils 用于刷新缓存
  const utils = api.useUtils();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0); // 用于强制重新创建编辑器
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取文章详情（编辑模式）
  const { data: articleData } = api.academy.getById.useQuery(
    { id: editId || '' },
    { enabled: !!editId }
  );

  // 加载文章数据到表单
  useEffect(() => {
    if (articleData) {
      console.log('加载文章数据:', {
        title: articleData.title,
        contentLength: articleData.content?.length,
        contentPreview: articleData.content?.substring(0, 200),
        hasImages: articleData.content?.includes('<img'),
        hasVideos: articleData.content?.includes('<video'),
        rawContent: articleData.content,
      });

      setTitle(articleData.title);
      // 确保内容是字符串类型
      const contentStr = articleData.content || '';
      console.log('设置 content 状态:', {
        type: typeof contentStr,
        length: contentStr.length,
        value: contentStr,
      });
      setContent(contentStr);
      setCoverImage(articleData.coverImage);

      // 将Date转换为datetime-local格式 (YYYY-MM-DDThh:mm)
      const date = new Date(articleData.publishTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      setPublishDate(`${year}-${month}-${day}T${hours}:${minutes}`);

      // 强制重新创建编辑器
      setEditorKey(prev => prev + 1);
    }
  }, [articleData]);

  // 创建文章
  const createMutation = api.academy.create.useMutation({
    onSuccess: async () => {
      showSuccessToast('新增文章成功');
      // 刷新列表缓存
      await utils.academy.list.invalidate();
      router.push('/crowdsource/admin/academy');
    },
    onError: (error) => {
      showErrorToast(`新增文章失败: ${error.message}`);
    },
  });

  // 更新文章
  const updateMutation = api.academy.update.useMutation({
    onSuccess: async () => {
      showSuccessToast('更新文章成功');
      // 刷新列表缓存和详情缓存
      await utils.academy.list.invalidate();
      await utils.academy.getById.invalidate({ id: editId || '' });
      router.push('/crowdsource/admin/academy');
    },
    onError: (error) => {
      showErrorToast(`更新文章失败: ${error.message}`);
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // 将文件转为 Base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // 上传到服务器
        const result = await utils.client.util.uploadRichTextFile.mutate({
          file: base64,
          filename: file.name,
          folder: 'academy',
        });

        if (result.success) {
          setCoverImage(result.url);
        } else {
          showErrorToast('封面图片上传失败');
        }
      } catch (error) {
        console.error('封面图片上传失败:', error);
        showErrorToast('封面图片上传失败');
      }
    }
  };

  // 文件上传处理函数（用于富文本编辑器）
  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      // 将文件转为 Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 使用 tRPC 上传文件到服务器
      const result = await utils.client.util.uploadRichTextFile.mutate({
        file: base64,
        filename: file.name,
        folder: 'academy', // 保存到 output/uploads/academy
      });

      if (result.success) {
        return result.url;
      } else {
        throw new Error('上传失败');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      throw error;
    }
  };

  const handleSubmit = () => {
    // 验证必填字段
    if (!title.trim()) {
      showErrorToast('请输入文章标题');
      return;
    }

    if (!content.trim()) {
      showErrorToast('请输入文章内容');
      return;
    }

    if (!publishDate) {
      showErrorToast('请选择发布时间');
      return;
    }

    if (!coverImage) {
      showErrorToast('请上传封面图片');
      return;
    }

    if (editId) {
      // 编辑模式
      updateMutation.mutate({
        id: editId,
        title,
        content,
        publishTime: publishDate,
        coverImage,
      });
    } else {
      // 新增模式
      createMutation.mutate({
        title,
        content,
        publishTime: publishDate,
        coverImage,
      });
    }
  };

  const handleCancel = () => {
    router.push('/crowdsource/admin/academy');
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
        <Text
          fontSize="14px"
          color={COLORS.textTertiary}
          cursor="pointer"
          onClick={() => router.push('/crowdsource/admin/academy')}
          _hover={{ color: COLORS.primary }}
        >
          众测学堂
        </Text>
        <LuChevronRight size={14} color={COLORS.textTertiary} />
        <Text fontSize="14px" color={COLORS.textPrimary} fontWeight="500">
          文章发布
        </Text>
      </Flex>

      {/* 主内容卡片 */}
      <Box bg={COLORS.bgPrimary} borderRadius="8px" p={6}>
        <Flex direction="column" gap={6} maxW="1000px">
          {/* Article Title */}
          <Box>
            <Flex mb={2}>
              <Text color={COLORS.primary} mr={1}>
                *
              </Text>
              <Text fontSize="14px" color={COLORS.textSecondary}>
                文章标题
              </Text>
            </Flex>
            <Input
              placeholder="请输入文章标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fontSize="14px"
              h="40px"
              borderColor={COLORS.borderColor}
              _focus={{ borderColor: COLORS.primary }}
            />
          </Box>

          {/* Article Content */}
          <Box>
            <Text fontSize="14px" color={COLORS.textSecondary} mb={2}>
              文章内容
            </Text>
            <RichTextEditor
              key={editorKey}
              value={content}
              onChange={setContent}
              placeholder="请输入文章内容"
              minHeight="400px"
              onUploadFile={handleFileUpload}
            />
          </Box>

          {/* Publish Date */}
          <Box>
            <Flex mb={2}>
              <Text color={COLORS.primary} mr={1}>
                *
              </Text>
              <Text fontSize="14px" color={COLORS.textSecondary}>
                发布时间
              </Text>
            </Flex>
            <Input
              type="datetime-local"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              placeholder="请选择日期"
              fontSize="14px"
              h="40px"
              borderColor={COLORS.borderColor}
              _focus={{ borderColor: COLORS.primary }}
              maxW="400px"
            />
          </Box>

          {/* Cover Image Upload */}
          <Box>
            <Flex mb={2}>
              <Text color={COLORS.primary} mr={1}>
                *
              </Text>
              <Text fontSize="14px" color={COLORS.textSecondary}>
                上传封面
              </Text>
            </Flex>
            <Box
              border="2px dashed"
              borderColor={COLORS.borderColor}
              borderRadius="4px"
              p={6}
              textAlign="center"
              cursor="pointer"
              onClick={() => fileInputRef.current?.click()}
              _hover={{ borderColor: COLORS.primary, bg: COLORS.bgSecondary }}
              position="relative"
              maxW="600px"
            >
              {coverImage ? (
                <Box>
                  <Image
                    src={coverImage}
                    alt="Cover preview"
                    maxH="300px"
                    mx="auto"
                    borderRadius="4px"
                  />
                  <Text fontSize="12px" color={COLORS.textSecondary} mt={3}>
                    点击更换图片
                  </Text>
                </Box>
              ) : (
                <Flex direction="column" align="center" gap={3} py={12}>
                  <Box
                    w="60px"
                    h="60px"
                    borderRadius="50%"
                    bg={COLORS.bgSecondary}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <LuUpload size={30} color={COLORS.textTertiary} />
                  </Box>
                  <Text fontSize="16px" color={COLORS.textSecondary} fontWeight="500">
                    上传图片
                  </Text>
                  <Text fontSize="14px" color={COLORS.textTertiary}>
                    (宽度为200px，高度为120px，jpg&png格式)
                  </Text>
                </Flex>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </Box>
          </Box>

          {/* Action Buttons */}
          <Flex gap={4} pt={4}>
            <Button
              variant="outline"
              fontSize="14px"
              h="40px"
              px={8}
              borderColor={COLORS.borderColor}
              color={COLORS.textSecondary}
              onClick={handleCancel}
              _hover={{ bg: COLORS.bgSecondary }}
            >
              关闭
            </Button>
            <Button
              bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
              color="white"
              fontSize="14px"
              h="40px"
              px={8}
              onClick={handleSubmit}
              _hover={{ opacity: 0.9 }}
            >
              确认
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}
