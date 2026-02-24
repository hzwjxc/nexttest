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
    Textarea,
} from '@chakra-ui/react';
import { Radio, RadioGroup } from '@/app/_components/ui/radio';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';
import { LuX, LuUpload, LuCalendar } from 'react-icons/lu';

const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    borderColor: '#E5E6EB',
};

// 格式化日期函数，替代 date-fns
const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const POPUP_TYPES = [
    { value: 'IMAGE', label: '图片弹窗' },
    { value: 'TEXT', label: '文字弹窗' },
];

type HomepagePopupDialogProps = {
    open: boolean;
    onClose: () => void;
    popupId?: string;
    initialType?: string; // 新增：初始弹窗类型
    onSuccess: () => void;
};

export default function HomepagePopupDialog({
    open,
    onClose,
    popupId,
    initialType = 'IMAGE', // 默认为图片弹窗
    onSuccess,
}: HomepagePopupDialogProps) {
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        type: initialType, // 使用传入的初始类型
        title: '',
        image: '',
        content: '',
        link: '',
        startTime: formatDate(new Date()),
        endTime: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        isActive: true,
    });

    const utils = api.useUtils();

    // 获取弹窗详情（编辑模式）
    const { data: popupData } = api.homepagePopup.getById.useQuery(
        { id: popupId! },
        { enabled: !!popupId }
    );

    // 新增弹窗
    const createMutation = api.homepagePopup.create.useMutation({
        onSuccess: () => {
            showSuccessToast('新增首页弹窗成功');
            onSuccess();
            onClose();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 更新弹窗
    const updateMutation = api.homepagePopup.update.useMutation({
        onSuccess: () => {
            showSuccessToast('更新首页弹窗成功');
            // 清除缓存，强制重新获取数据
            void utils.homepagePopup.list.invalidate();
            void utils.homepagePopup.getById.invalidate();
            onSuccess();
            onClose();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 加载编辑数据
    useEffect(() => {
        if (open && popupId && popupData) {
            console.log('Loading popup data:', popupData);
            setFormData({
                type: popupData.type,
                title: popupData.title,
                image: popupData.image || '',
                content: popupData.content || '',
                link: popupData.link || '',
                startTime: formatDate(new Date(popupData.startTime)),
                endTime: formatDate(new Date(popupData.endTime)),
                isActive: popupData.isActive,
            });
        } else if (open && !popupId) {
            // 新增模式，重置表单
            console.log('New popup mode, resetting form');
            resetForm();
        }
    }, [open, popupId, popupData]);

    const resetForm = () => {
        setFormData({
            type: initialType, // 使用传入的初始类型
            title: '',
            image: '',
            content: '',
            link: '',
            startTime: formatDate(new Date()),
            endTime: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
            isActive: true,
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
                folder: 'homepage-popups',
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
        if (!formData.title.trim()) {
            showErrorToast('请输入弹窗标题');
            return;
        }

        if (formData.type === 'IMAGE' && !formData.image.trim()) {
            showErrorToast('请上传图片');
            return;
        }

        if (formData.type === 'TEXT' && !formData.content.trim()) {
            showErrorToast('请输入内容摘要');
            return;
        }

        // 验证时间
        const startTime = new Date(formData.startTime);
        const endTime = new Date(formData.endTime);
        
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            showErrorToast('请输入正确的时间格式');
            return;
        }

        if (startTime >= endTime) {
            showErrorToast('起始时间必须早于关闭时间');
            return;
        }

        const submitData = {
            type: formData.type,
            title: formData.title,
            image: formData.type === 'IMAGE' ? formData.image : undefined,
            content: formData.type === 'TEXT' ? formData.content : undefined,
            link: formData.link || undefined,
            startTime,
            endTime,
            isActive: formData.isActive,
        };

        if (popupId) {
            // 更新
            updateMutation.mutate({
                id: popupId,
                ...submitData,
            });
        } else {
            // 新增
            createMutation.mutate(submitData);
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
                    maxW="700px"
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
                            {popupId ? '编辑首页弹窗' : '新增首页弹窗'}
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
                            {/* 弹窗类型 */}
                            <Field.Root>
                                <Field.Label
                                    fontSize="14px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                    mb={2}
                                >
                                    弹窗类型
                                    <Text as="span" color={COLORS.primary}>
                                        *
                                    </Text>
                                </Field.Label>
                                <RadioGroup
                                    value={formData.type}
                                    onValueChange={(e) => 
                                        setFormData(prev => ({ ...prev, type: e.value }))
                                    }
                                >
                                    <Flex gap={6}>
                                        {POPUP_TYPES.map((option) => (
                                            <Radio
                                                key={option.value}
                                                value={option.value}
                                                colorPalette="red"
                                            >
                                                <Text fontSize="14px" color={COLORS.textPrimary}>
                                                    {option.label}
                                                </Text>
                                            </Radio>
                                        ))}
                                    </Flex>
                                </RadioGroup>
                            </Field.Root>

                            {/* 弹窗标题 */}
                            <Field.Root>
                                <Field.Label
                                    fontSize="14px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                    mb={2}
                                >
                                    弹窗标题
                                    <Text as="span" color={COLORS.primary}>
                                        *
                                    </Text>
                                </Field.Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                        }))
                                    }
                                    placeholder="请输入弹窗标题"
                                    fontSize="14px"
                                    borderColor={COLORS.borderColor}
                                    _focus={{
                                        borderColor: COLORS.primary,
                                        boxShadow: 'none',
                                    }}
                                />
                            </Field.Root>

                            {/* 图片上传（仅图片弹窗显示） */}
                            {formData.type === 'IMAGE' && (
                                <Field.Root>
                                    <Field.Label
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textPrimary}
                                        mb={2}
                                    >
                                        弹窗图片
                                        <Text as="span" color={COLORS.primary}>
                                            *
                                        </Text>
                                    </Field.Label>
                                    <Box>
                                        {formData.image ? (
                                            <Box position="relative" w="200px" h="120px">
                                                <Image
                                                    src={formData.image}
                                                    alt="弹窗图片"
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
                            )}

                            {/* 内容摘要（仅文字弹窗显示） */}
                            {formData.type === 'TEXT' && (
                                <Field.Root>
                                    <Field.Label
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textPrimary}
                                        mb={2}
                                    >
                                        内容摘要
                                        <Text as="span" color={COLORS.primary}>
                                            *
                                        </Text>
                                    </Field.Label>
                                    <Textarea
                                        value={formData.content}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                content: e.target.value,
                                            }))
                                        }
                                        placeholder="请输入内容摘要"
                                        fontSize="14px"
                                        borderColor={COLORS.borderColor}
                                        _focus={{
                                            borderColor: COLORS.primary,
                                            boxShadow: 'none',
                                        }}
                                        rows={4}
                                    />
                                </Field.Root>
                            )}

                            {/* 链接地址 */}
                            <Field.Root>
                                <Field.Label
                                    fontSize="14px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                    mb={2}
                                >
                                    链接地址
                                </Field.Label>
                                <Input
                                    value={formData.link}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            link: e.target.value,
                                        }))
                                    }
                                    placeholder="请输入链接地址（选填）"
                                    fontSize="14px"
                                    borderColor={COLORS.borderColor}
                                    _focus={{
                                        borderColor: COLORS.primary,
                                        boxShadow: 'none',
                                    }}
                                />
                            </Field.Root>

                            {/* 时间设置 */}
                            <Flex gap={4}>
                                <Field.Root flex={1}>
                                    <Field.Label
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textPrimary}
                                        mb={2}
                                    >
                                        起始时间
                                        <Text as="span" color={COLORS.primary}>
                                            *
                                        </Text>
                                    </Field.Label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.startTime.substring(0, 16)}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                startTime: e.target.value + ':00',
                                            }))
                                        }
                                        fontSize="14px"
                                        borderColor={COLORS.borderColor}
                                        _focus={{
                                            borderColor: COLORS.primary,
                                            boxShadow: 'none',
                                        }}
                                    />
                                </Field.Root>

                                <Field.Root flex={1}>
                                    <Field.Label
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textPrimary}
                                        mb={2}
                                    >
                                        关闭时间
                                        <Text as="span" color={COLORS.primary}>
                                            *
                                        </Text>
                                    </Field.Label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.endTime.substring(0, 16)}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                endTime: e.target.value + ':00',
                                            }))
                                        }
                                        fontSize="14px"
                                        borderColor={COLORS.borderColor}
                                        _focus={{
                                            borderColor: COLORS.primary,
                                            boxShadow: 'none',
                                        }}
                                    />
                                </Field.Root>
                            </Flex>
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