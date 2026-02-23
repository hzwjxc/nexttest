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
    Textarea,
    IconButton,
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
import { LuPlus, LuTrash2, LuPencil, LuX } from 'react-icons/lu';
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

type Dictionary = {
    id: string;
    code: string;
    name: string;
    category: string;
    description?: string | null;
    valueType: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    items: DictionaryItem[];
};

type DictionaryItem = {
    id: string;
    dictionaryId: string;
    code?: string | null;
    label: string;
    value?: string | null;
    description?: string | null;
    sort: number;
    isActive: boolean;
    createdAt: string;
};

export default function DataDictionaryPage() {
    const { showSuccessToast, showErrorToast } = useCustomToast();

    // 字典弹窗状态
    const [isDictOpen, setIsDictOpen] = useState(false);
    const [editingDict, setEditingDict] = useState<Dictionary | null>(null);

    // 字典项弹窗状态
    const [isItemOpen, setIsItemOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<DictionaryItem | null>(null);
    const [selectedDictId, setSelectedDictId] = useState<string | null>(null);

    // 字典表单数据
    const [dictFormData, setDictFormData] = useState({
        code: '',
        name: '',
        description: '',
    });

    // 字典项表单数据
    const [itemFormData, setItemFormData] = useState({
        code: '',
        label: '',
        value: '',
        description: '',
        sort: 0,
    });

    // 查询所有数据字典
    const {
        data: allDicts,
        isLoading,
        refetch,
    } = api.dataDictionary.getAll.useQuery(undefined, {
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    // 创建字典
    const createDictMutation = api.dataDictionary.create.useMutation({
        onSuccess: () => {
            showSuccessToast('创建字典成功');
            void refetch();
            setIsDictOpen(false);
            resetDictForm();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 更新字典
    const updateDictMutation = api.dataDictionary.update.useMutation({
        onSuccess: () => {
            showSuccessToast('更新字典成功');
            void refetch();
            setIsDictOpen(false);
            resetDictForm();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 删除字典
    const deleteDictMutation = api.dataDictionary.delete.useMutation({
        onSuccess: () => {
            showSuccessToast('删除字典成功');
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 创建字典项
    const createItemMutation = api.dataDictionary.createItem.useMutation({
        onSuccess: () => {
            showSuccessToast('添加子标签成功');
            void refetch();
            setIsItemOpen(false);
            resetItemForm();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 更新字典项
    const updateItemMutation = api.dataDictionary.updateItem.useMutation({
        onSuccess: () => {
            showSuccessToast('更新子标签成功');
            void refetch();
            setIsItemOpen(false);
            resetItemForm();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 删除字典项
    const deleteItemMutation = api.dataDictionary.deleteItem.useMutation({
        onSuccess: () => {
            showSuccessToast('删除子标签成功');
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    const dictionaries = (allDicts || []) as Dictionary[];

    // 重置表单
    const resetDictForm = () => {
        setDictFormData({
            code: '',
            name: '',
            description: '',
        });
        setEditingDict(null);
    };

    const resetItemForm = () => {
        setItemFormData({
            code: '',
            label: '',
            value: '',
            description: '',
            sort: 0,
        });
        setEditingItem(null);
    };

    // 打开字典弹窗
    const handleOpenDictModal = (dict?: Dictionary) => {
        if (dict) {
            setEditingDict(dict);
            setDictFormData({
                code: dict.code,
                name: dict.name,
                description: dict.description || '',
            });
        } else {
            resetDictForm();
        }
        setIsDictOpen(true);
    };

    // 打开字典项弹窗
    const handleOpenItemModal = (dictId: string, item?: DictionaryItem) => {
        setSelectedDictId(dictId);
        if (item) {
            setEditingItem(item);
            setItemFormData({
                code: item.code || '',
                label: item.label,
                value: item.value || '',
                description: item.description || '',
                sort: item.sort,
            });
        } else {
            setEditingItem(null); // 清空编辑状态
            const dict = dictionaries.find((d) => d.id === dictId);
            const maxSort =
                dict?.items.reduce(
                    (max, item) => Math.max(max, item.sort),
                    0
                ) || 0;
            setItemFormData({
                code: '',
                label: '',
                value: '',
                description: '',
                sort: maxSort + 1,
            });
        }
        setIsItemOpen(true);
    };

    // 提交字典表单
    const handleSubmitDict = () => {
        if (!dictFormData.code.trim()) {
            showErrorToast('请填写字典编码');
            return;
        }
        if (!dictFormData.name.trim()) {
            showErrorToast('请填写字典名称');
            return;
        }

        if (editingDict) {
            updateDictMutation.mutate({
                id: editingDict.id,
                name: dictFormData.name,
                description: dictFormData.description,
            });
        } else {
            createDictMutation.mutate({
                code: dictFormData.code,
                name: dictFormData.name,
                category: '默认分类', // 默认分类
                description: dictFormData.description,
                valueType: 'LIST', // 默认列表类型
            });
        }
    };

    // 提交字典项表单
    const handleSubmitItem = () => {
        if (!itemFormData.code.trim()) {
            showErrorToast('请填写码值');
            return;
        }
        if (!itemFormData.label.trim()) {
            showErrorToast('请填写标签');
            return;
        }
        if (!selectedDictId) {
            showErrorToast('请选择字典');
            return;
        }

        if (editingItem) {
            updateItemMutation.mutate({
                id: editingItem.id,
                label: itemFormData.label,
                value: itemFormData.value,
                description: itemFormData.description,
                sort: itemFormData.sort,
            });
        } else {
            createItemMutation.mutate({
                dictionaryId: selectedDictId,
                code: itemFormData.code,
                label: itemFormData.label,
                value: itemFormData.value,
                description: itemFormData.description,
                sort: itemFormData.sort,
            });
        }
    };

    // 删除字典
    const handleDeleteDict = (id: string, name: string) => {
        if (
            window.confirm(
                `确定要删除"${name}"字典吗？这将同时删除所有子标签。`
            )
        ) {
            deleteDictMutation.mutate(id);
        }
    };

    // 删除字典项
    const handleDeleteItem = (id: string) => {
        if (window.confirm('确定要删除这个子标签吗？')) {
            deleteItemMutation.mutate(id);
        }
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
                    数据字典管理
                </Text>
            </Flex>

            {/* 页面标题和新增按钮 */}
            <Flex justify="space-between" align="center" mb={6}>
                <Text
                    fontSize="20px"
                    fontWeight="600"
                    color={COLORS.textPrimary}
                >
                    数据字典管理
                </Text>
                <Button
                    bg={COLORS.primary}
                    color="white"
                    fontSize="14px"
                    onClick={() => handleOpenDictModal()}
                    _hover={{ bg: '#c70f20' }}
                >
                    <LuPlus style={{ marginRight: '0.5rem' }} />
                    新增字典
                </Button>
            </Flex>

            {/* 数据字典列表 - 简化展示 */}
            <Box
                bg={COLORS.bgPrimary}
                borderRadius="8px"
                p={6}
                boxShadow="0 1px 4px rgba(0, 0, 0, 0.08)"
            >
                {isLoading ? (
                    <Text color={COLORS.textSecondary}>加载中...</Text>
                ) : dictionaries.length === 0 ? (
                    <Flex direction="column" align="center" py={8} gap={4}>
                        <Text color={COLORS.textSecondary}>
                            暂无数据，请点击右上角"新增字典"按钮创建
                        </Text>
                    </Flex>
                ) : (
                    <VStack gap={4} align="stretch">
                        {dictionaries.map((dict) => (
                            <Box key={dict.id}>
                                {/* 字典项卡片 - 简化样式 */}
                                <Box
                                    bg={COLORS.bgSecondary}
                                    borderRadius="4px"
                                    p={4}
                                >
                                    {/* 标题行 */}
                                    <Flex
                                        justify="space-between"
                                        align="center"
                                        mb={3}
                                    >
                                        <Flex align="center" gap={2}>
                                            <Text
                                                fontSize="14px"
                                                fontWeight="500"
                                                color={COLORS.textPrimary}
                                            >
                                                {dict.name}
                                            </Text>
                                        </Flex>
                                        <HStack gap={1}>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                fontSize="12px"
                                                onClick={() =>
                                                    handleOpenItemModal(dict.id)
                                                }
                                                color="#52c41a"
                                                _hover={{
                                                    bg: 'rgba(82, 196, 26, 0.1)',
                                                }}
                                            >
                                                <Flex align="center" gap={1}>
                                                    <LuPlus size={14} />
                                                    <Text>新增子标签</Text>
                                                </Flex>
                                            </Button>
                                            <IconButton
                                                aria-label="删除字典"
                                                size="sm"
                                                variant="ghost"
                                                colorScheme="red"
                                                onClick={() =>
                                                    handleDeleteDict(
                                                        dict.id,
                                                        dict.name
                                                    )
                                                }
                                            >
                                                <LuTrash2 size={14} />
                                            </IconButton>
                                        </HStack>
                                    </Flex>

                                    {/* 值显示区域 */}
                                    <Box>
                                        {dict.valueType === 'LIST' ? (
                                            // 列表类型：显示所有标签
                                            <HStack gap={2} flexWrap="wrap">
                                                {dict.items
                                                    .sort(
                                                        (a, b) =>
                                                            a.sort - b.sort
                                                    )
                                                    .map((item, index) => {
                                                        // 循环使用不同的颜色方案
                                                        const colorSchemes = [
                                                            'blue',
                                                            'green',
                                                            'purple',
                                                            'orange',
                                                            'cyan',
                                                            'pink',
                                                        ];
                                                        const colorScheme =
                                                            colorSchemes[
                                                                index %
                                                                    colorSchemes.length
                                                            ];

                                                        return (
                                                            <Box
                                                                key={item.id}
                                                                display="inline-flex"
                                                                alignItems="center"
                                                                gap={1}
                                                                px={3}
                                                                py={1.5}
                                                                borderRadius="4px"
                                                                border="1px solid"
                                                                borderColor={`${colorScheme}.200`}
                                                                bg={`${colorScheme}.50`}
                                                                fontSize="12px"
                                                                _hover={{
                                                                    borderColor: `${colorScheme}.300`,
                                                                    bg: `${colorScheme}.100`,
                                                                    cursor: 'pointer',
                                                                }}
                                                                transition="all 0.2s"
                                                                onClick={() =>
                                                                    handleOpenItemModal(
                                                                        dict.id,
                                                                        item
                                                                    )
                                                                }
                                                            >
                                                                <Text
                                                                    color={`${colorScheme}.700`}
                                                                    fontWeight="500"
                                                                >
                                                                    {item.label}
                                                                </Text>
                                                                <Box
                                                                    as="button"
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteItem(
                                                                            item.id
                                                                        );
                                                                    }}
                                                                    ml={1}
                                                                    color={`${colorScheme}.400`}
                                                                    _hover={{
                                                                        color: 'red.500',
                                                                    }}
                                                                    display="inline-flex"
                                                                    alignItems="center"
                                                                    transition="color 0.2s"
                                                                >
                                                                    <LuX
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                </Box>
                                                            </Box>
                                                        );
                                                    })}
                                            </HStack>
                                        ) : (
                                            // 数值类型：显示所有值
                                            <HStack gap={2} flexWrap="wrap">
                                                {dict.items
                                                    .sort(
                                                        (a, b) =>
                                                            a.sort - b.sort
                                                    )
                                                    .map((item, index) => {
                                                        const colorSchemes = [
                                                            'blue',
                                                            'green',
                                                            'purple',
                                                            'orange',
                                                            'cyan',
                                                            'pink',
                                                        ];
                                                        const colorScheme =
                                                            colorSchemes[
                                                                index %
                                                                    colorSchemes.length
                                                            ];

                                                        return (
                                                            <Box
                                                                key={item.id}
                                                                display="inline-flex"
                                                                alignItems="center"
                                                                gap={1}
                                                                px={3}
                                                                py={1.5}
                                                                borderRadius="4px"
                                                                border="1px solid"
                                                                borderColor={`${colorScheme}.200`}
                                                                bg={`${colorScheme}.50`}
                                                                fontSize="12px"
                                                                _hover={{
                                                                    borderColor: `${colorScheme}.300`,
                                                                    bg: `${colorScheme}.100`,
                                                                    cursor: 'pointer',
                                                                }}
                                                                transition="all 0.2s"
                                                                onClick={() =>
                                                                    handleOpenItemModal(
                                                                        dict.id,
                                                                        item
                                                                    )
                                                                }
                                                            >
                                                                <Text
                                                                    color={`${colorScheme}.700`}
                                                                    fontWeight="500"
                                                                >
                                                                    {item.label}
                                                                    :{' '}
                                                                    {item.value ||
                                                                        '-'}
                                                                </Text>
                                                                <Box
                                                                    as="button"
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteItem(
                                                                            item.id
                                                                        );
                                                                    }}
                                                                    ml={1}
                                                                    color={`${colorScheme}.400`}
                                                                    _hover={{
                                                                        color: 'red.500',
                                                                    }}
                                                                    display="inline-flex"
                                                                    alignItems="center"
                                                                    transition="color 0.2s"
                                                                >
                                                                    <LuX
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                </Box>
                                                            </Box>
                                                        );
                                                    })}
                                            </HStack>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </VStack>
                )}
            </Box>

            {/* 字典编辑/新增模态框 */}
            <DialogRoot
                open={isDictOpen}
                onOpenChange={(details) =>
                    !details.open && setIsDictOpen(false)
                }
            >
                <DialogContent maxW="500px">
                    <DialogHeader>
                        <DialogTitle>
                            {editingDict ? '编辑父级标签' : '新增父级标签'}
                        </DialogTitle>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody>
                        <VStack gap={4}>
                            <Field label="字典编码" required>
                                <Input
                                    placeholder="例如: DEFECT_SEVERITY"
                                    value={dictFormData.code}
                                    onChange={(e) =>
                                        setDictFormData({
                                            ...dictFormData,
                                            code: e.target.value,
                                        })
                                    }
                                    disabled={!!editingDict}
                                    fontSize="14px"
                                />
                                {!editingDict && (
                                    <Text
                                        fontSize="12px"
                                        color={COLORS.textTertiary}
                                        mt={1}
                                    >
                                        编码创建后不可修改，建议使用大写字母和下划线
                                    </Text>
                                )}
                            </Field>
                            <Field label="字典名称" required>
                                <Input
                                    placeholder="例如: 测试等级"
                                    value={dictFormData.name}
                                    onChange={(e) =>
                                        setDictFormData({
                                            ...dictFormData,
                                            name: e.target.value,
                                        })
                                    }
                                    fontSize="14px"
                                />
                            </Field>
                            <Field label="描述">
                                <Textarea
                                    placeholder="字典描述（可选）"
                                    value={dictFormData.description}
                                    onChange={(e) =>
                                        setDictFormData({
                                            ...dictFormData,
                                            description: e.target.value,
                                        })
                                    }
                                    fontSize="14px"
                                    minH="80px"
                                />
                            </Field>
                        </VStack>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDictOpen(false)}
                            fontSize="14px"
                        >
                            取消
                        </Button>
                        <Button
                            bg={COLORS.primary}
                            color="white"
                            onClick={handleSubmitDict}
                            loading={
                                createDictMutation.isPending ||
                                updateDictMutation.isPending
                            }
                            fontSize="14px"
                            _hover={{ bg: '#c70f20' }}
                        >
                            {editingDict ? '更新' : '创建'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>

            {/* 字典项编辑/新增模态框 */}
            <DialogRoot
                open={isItemOpen}
                onOpenChange={(details) =>
                    !details.open && setIsItemOpen(false)
                }
            >
                <DialogContent maxW="500px">
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem ? '编辑子标签' : '新增子标签'}
                        </DialogTitle>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody>
                        <VStack gap={4}>
                            <Field label="码值" required>
                                <Input
                                    placeholder="例如: EXCELLENT_SPECIAL"
                                    value={itemFormData.code}
                                    onChange={(e) =>
                                        setItemFormData({
                                            ...itemFormData,
                                            code: e.target.value,
                                        })
                                    }
                                    disabled={!!editingItem}
                                    fontSize="14px"
                                />
                                {!editingItem && (
                                    <Text
                                        fontSize="12px"
                                        color={COLORS.textTertiary}
                                        mt={1}
                                    >
                                        码值创建后不可修改，建议使用大写字母和下划线
                                    </Text>
                                )}
                            </Field>
                            <Field label="标签" required>
                                <Input
                                    placeholder="例如: 特别优秀"
                                    value={itemFormData.label}
                                    onChange={(e) =>
                                        setItemFormData({
                                            ...itemFormData,
                                            label: e.target.value,
                                        })
                                    }
                                    fontSize="14px"
                                />
                            </Field>
                            <Field label="值">
                                <Input
                                    placeholder="例如: 40（用于积分等数值）"
                                    value={itemFormData.value}
                                    onChange={(e) =>
                                        setItemFormData({
                                            ...itemFormData,
                                            value: e.target.value,
                                        })
                                    }
                                    fontSize="14px"
                                />
                            </Field>
                            <Field label="描述">
                                <Textarea
                                    placeholder="标签描述（可选）"
                                    value={itemFormData.description}
                                    onChange={(e) =>
                                        setItemFormData({
                                            ...itemFormData,
                                            description: e.target.value,
                                        })
                                    }
                                    fontSize="14px"
                                    minH="60px"
                                />
                            </Field>
                            <Field label="排序">
                                <Input
                                    placeholder="数字越小越靠前"
                                    type="number"
                                    value={itemFormData.sort}
                                    onChange={(e) =>
                                        setItemFormData({
                                            ...itemFormData,
                                            sort: Number(e.target.value),
                                        })
                                    }
                                    fontSize="14px"
                                />
                            </Field>
                        </VStack>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsItemOpen(false)}
                            fontSize="14px"
                        >
                            取消
                        </Button>
                        <Button
                            bg={COLORS.primary}
                            color="white"
                            onClick={handleSubmitItem}
                            loading={
                                createItemMutation.isPending ||
                                updateItemMutation.isPending
                            }
                            fontSize="14px"
                            _hover={{ bg: '#c70f20' }}
                        >
                            {editingItem ? '更新' : '创建'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>
        </Box>
    );
}
