'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    Box,
    Flex,
    Text,
    Button,
    Input,
    Field,
    Image,
} from '@chakra-ui/react';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';
import { LuX, LuUpload } from 'react-icons/lu';

const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    borderColor: '#E5E6EB',
};

const CHANNEL_OPTIONS = [
    { value: 'MINI_PROGRAM', label: '小程序' },
    { value: 'PC', label: 'PC端' },
];

type CarouselDialogProps = {
    open: boolean;
    onClose: () => void;
    carouselId?: string;
    onSuccess: () => void;
};

export default function CarouselDialog({
    open,
    onClose,
    carouselId,
    onSuccess,
}: CarouselDialogProps) {
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        image: '',
        link: '',
        channels: [] as string[],
    });

    const utils = api.useUtils();

    // 获取轮播图详情（编辑模式）
    const { data: carouselData } = api.carousel.getById.useQuery(
        { id: carouselId! },
        { enabled: !!carouselId }
    );

    // 新增轮播图
    const createMutation = api.carousel.create.useMutation({
        onSuccess: () => {
            showSuccessToast('新增轮播图成功');
            onSuccess();
            onClose();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 更新轮播图
    const updateMutation = api.carousel.update.useMutation({
        onSuccess: () => {
            showSuccessToast('更新轮播图成功');
            // 清除缓存，强制重新获取数据
            void utils.carousel.list.invalidate();
            void utils.carousel.getById.invalidate();
            onSuccess();
            onClose();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 加载编辑数据
    useEffect(() => {
        if (open && carouselId && carouselData) {
            console.log('Loading carousel data:', carouselData);
            console.log('Channels from data:', carouselData.channels);
            setFormData({
                image: carouselData.image,
                link: carouselData.link,
                channels: carouselData.channels || [],
            });
        } else if (open && !carouselId) {
            // 新增模式，重置表单
            console.log('New carousel mode, resetting form');
            resetForm();
        }
    }, [open, carouselId, carouselData]);

    const resetForm = () => {
        setFormData({
            image: '',
            link: '',
            channels: [],
        });
    };

    const handleChannelChange = (channelValue: string, checked: boolean) => {
        console.log('handleChannelChange called:', { channelValue, checked });
        setFormData((prev) => {
            const newChannels = checked
                ? [...prev.channels, channelValue]
                : prev.channels.filter((c) => c !== channelValue);
            console.log('New channels:', newChannels);
            return {
                ...prev,
                channels: newChannels,
            };
        });
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            showErrorToast('请上传图片文件');
            return;
        }

        // 验证文件大小（限制5MB）
        if (file.size > 5 * 1024 * 1024) {
            showErrorToast('图片大小不能超过5MB');
            return;
        }

        try {
            setUploading(true);

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
                folder: 'carousel',
            });

            if (result.success) {
                setFormData((prev) => ({
                    ...prev,
                    image: result.url,
                }));
                showSuccessToast('图片上传成功');
            } else {
                showErrorToast('图片上传失败');
            }
        } catch (error) {
            console.error('图片上传失败:', error);
            showErrorToast('图片上传失败');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = () => {
        // 验证
        if (!formData.image.trim()) {
            showErrorToast('请上传图片');
            return;
        }
        if (!formData.link.trim()) {
            showErrorToast('请输入链接URL');
            return;
        }
        if (formData.channels.length === 0) {
            showErrorToast('请至少选择一个渠道');
            return;
        }

        if (carouselId) {
            // 更新
            updateMutation.mutate({
                id: carouselId,
                ...formData,
            });
        } else {
            // 新增
            createMutation.mutate(formData);
        }
    };

    const handleClose = () => {
        onClose();
        resetForm();
    };

    return (
        <Dialog.Root open={open} onOpenChange={(e) => !e.open && handleClose()}>
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content
                    maxW="600px"
                    bg={COLORS.bgPrimary}
                    borderRadius="8px"
                    p={0}
                >
                    {/* 标题栏 */}
                    <Flex
                        justify="space-between"
                        align="center"
                        px={6}
                        py={4}
                        borderBottom="1px solid"
                        borderColor={COLORS.borderColor}
                    >
                        <Dialog.Title
                            fontSize="18px"
                            fontWeight="600"
                            color={COLORS.textPrimary}
                        >
                            {carouselId ? '编辑轮播图' : '新增轮播图'}
                        </Dialog.Title>
                        <Dialog.CloseTrigger asChild>
                            <Box
                                as="button"
                                cursor="pointer"
                                color={COLORS.textSecondary}
                                _hover={{ color: COLORS.primary }}
                            >
                                <LuX size={20} />
                            </Box>
                        </Dialog.CloseTrigger>
                    </Flex>

                    {/* 表单内容 */}
                    <Box px={6} py={6}>
                        <Flex direction="column" gap={5}>
                            {/* 图片上传 */}
                            <Field.Root>
                                <Field.Label
                                    fontSize="14px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                    mb={2}
                                >
                                    轮播图图片
                                    <Text as="span" color={COLORS.primary}>
                                        *
                                    </Text>
                                </Field.Label>
                                <Box>
                                    {formData.image ? (
                                        <Box position="relative" w="200px" h="120px">
                                            <Image
                                                src={formData.image}
                                                alt="轮播图"
                                                w="100%"
                                                h="100%"
                                                objectFit="cover"
                                                borderRadius="8px"
                                                border="1px solid"
                                                borderColor={COLORS.borderColor}
                                            />
                                            <Button
                                                position="absolute"
                                                top={2}
                                                right={2}
                                                size="sm"
                                                colorScheme="red"
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        image: '',
                                                    }))
                                                }
                                            >
                                                <LuX />
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Box>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                style={{ display: 'none' }}
                                            />
                                            <Button
                                                onClick={() => fileInputRef.current?.click()}
                                                variant="outline"
                                                borderColor={COLORS.borderColor}
                                                color={COLORS.textSecondary}
                                                _hover={{ bg: COLORS.bgSecondary }}
                                                loading={uploading}
                                            >
                                                <LuUpload />
                                                <Text ml={2}>上传图片</Text>
                                            </Button>
                                            <Text
                                                fontSize="12px"
                                                color={COLORS.textTertiary}
                                                mt={2}
                                            >
                                                支持 JPG、PNG 格式，大小不超过 5MB
                                            </Text>
                                        </Box>
                                    )}
                                </Box>
                            </Field.Root>

                            {/* 链接URL */}
                            <Field.Root>
                                <Field.Label
                                    fontSize="14px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                    mb={2}
                                >
                                    链接URL
                                    <Text as="span" color={COLORS.primary}>
                                        *
                                    </Text>
                                </Field.Label>
                                <Input
                                    value={formData.link}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            link: e.target.value,
                                        }))
                                    }
                                    placeholder="请输入链接URL"
                                    fontSize="14px"
                                    borderColor={COLORS.borderColor}
                                    _focus={{
                                        borderColor: COLORS.primary,
                                        boxShadow: 'none',
                                    }}
                                />
                            </Field.Root>

                            {/* 渠道（多选） */}
                            <Field.Root>
                                <Field.Label
                                    fontSize="14px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                    mb={2}
                                >
                                    渠道
                                    <Text as="span" color={COLORS.primary}>
                                        *
                                    </Text>
                                </Field.Label>
                                <Flex gap={4}>
                                    {CHANNEL_OPTIONS.map((option) => (
                                        <Box key={option.value}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.channels.includes(option.value)}
                                                    onChange={(e) => {
                                                        console.log('Native checkbox clicked:', option.value, 'Checked:', e.target.checked);
                                                        console.log('Current formData.channels:', formData.channels);
                                                        handleChannelChange(option.value, e.target.checked);
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textPrimary}
                                                >
                                                    {option.label}
                                                </Text>
                                            </label>
                                        </Box>
                                    ))}
                                </Flex>
                            </Field.Root>
                        </Flex>
                    </Box>

                    {/* 底部按钮 */}
                    <Flex
                        justify="flex-end"
                        gap={3}
                        px={6}
                        py={4}
                        borderTop="1px solid"
                        borderColor={COLORS.borderColor}
                    >
                        <Button
                            variant="outline"
                            fontSize="14px"
                            h="36px"
                            px={6}
                            borderColor={COLORS.borderColor}
                            color={COLORS.textSecondary}
                            _hover={{ bg: COLORS.bgSecondary }}
                            onClick={handleClose}
                        >
                            取消
                        </Button>
                        <Button
                            bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                            color="white"
                            fontSize="14px"
                            h="36px"
                            px={6}
                            _hover={{ opacity: 0.9 }}
                            onClick={handleSubmit}
                            loading={
                                createMutation.isPending ||
                                updateMutation.isPending
                            }
                        >
                            确定
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}
