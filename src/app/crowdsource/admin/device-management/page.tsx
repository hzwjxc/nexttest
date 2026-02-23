'use client';

import React, { useState } from 'react';
import {
    Box,
    Flex,
    Text,
    Button,
    Input,
    NativeSelectRoot,
    NativeSelectField,
    DialogRoot,
    DialogBackdrop,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogTitle,
    DialogCloseTrigger,
    DialogActionTrigger,
} from '@chakra-ui/react';
import { LuSearch, LuPlus, LuTrash2 } from 'react-icons/lu';
import { FiAlignJustify, FiEdit } from 'react-icons/fi';
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

export default function DeviceManagementPage() {
    const { showSuccessToast, showErrorToast } = useCustomToast();

    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [brandFilter, setBrandFilter] = useState('');
    const [brandZhFilter, setBrandZhFilter] = useState('');
    const [systemVersionFilter, setSystemVersionFilter] = useState('');
    const [modelFilter, setModelFilter] = useState('');
    const [modelAliasFilter, setModelAliasFilter] = useState('');

    // 对话框状态
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<any>(null);

    // 编辑表单数据
    const [formData, setFormData] = useState({
        brand: '',
        brandZh: '',
        model: '',
        modelAlias: '',
        systemVersion: '',
        resolution: '',
        cpuModel: '',
        cpuCores: '',
        memory: '',
        sdkVersion: '',
        cpuFrequency: '',
    });

    // 查询设备列表
    const { data, isLoading, refetch } = api.device.list.useQuery(
        {
            page,
            pageSize,
            brand: brandFilter || undefined,
            brandZh: brandZhFilter || undefined,
            systemVersion: systemVersionFilter || undefined,
            model: modelFilter || undefined,
            modelAlias: modelAliasFilter || undefined,
        },
        {
            refetchOnMount: 'always',
            refetchOnWindowFocus: true,
        }
    );

    // 创建/更新设备
    const createDeviceMutation = api.device.create.useMutation({
        onSuccess: () => {
            showSuccessToast('设备创建成功');
            setIsEditDialogOpen(false);
            resetForm();
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message || '设备创建失败');
        },
    });

    const updateDeviceMutation = api.device.update.useMutation({
        onSuccess: () => {
            showSuccessToast('设备更新成功');
            setIsEditDialogOpen(false);
            setEditingDevice(null);
            resetForm();
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message || '设备更新失败');
        },
    });

    // 删除设备
    const deleteDeviceMutation = api.device.delete.useMutation({
        onSuccess: () => {
            showSuccessToast('设备删除成功');
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message || '设备删除失败');
        },
    });

    // 导出设备数据
    const exportDevicesMutation = api.device.exportDevices.useMutation({
        onSuccess: (devices) => {
            if (devices.length === 0) {
                showErrorToast('暂无数据可导出');
                return;
            }

            // 准备导出数据
            const exportData = devices.map((device, index) => ({
                序号: index + 1,
                品牌: device.brand,
                品牌中文: device.brandZh,
                型号: device.model,
                型号别名: device.modelAlias || '-',
                系统版本: device.systemVersion,
                分辨率: device.resolution || '-',
                CPU型号: device.cpuModel || '-',
                CPU核数: device.cpuCores || '-',
                内存: device.memory || '-',
                SDK版本: device.sdkVersion || '-',
                CPU频率: device.cpuFrequency || '-',
                创建时间: new Date(device.createdAt).toLocaleString('zh-CN'),
            }));

            // 转换为CSV
            const headers = Object.keys(exportData[0]);
            const csvContent = [
                headers.join(','),
                ...exportData.map((row) =>
                    headers
                        .map((header) => `"${row[header as keyof typeof row]}"`)
                        .join(',')
                ),
            ].join('\n');

            // 添加BOM以支持中文
            const blob = new Blob(['\ufeff' + csvContent], {
                type: 'text/csv;charset=utf-8;',
            });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute(
                'download',
                `设备管理_${new Date().toLocaleDateString()}.csv`
            );
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showSuccessToast('导出成功');
        },
        onError: (error) => {
            showErrorToast(error.message || '导出失败');
        },
    });

    const devices = data?.data || [];
    const pagination = data?.pagination;

    // 生成页码
    const totalPages = pagination?.totalPages || 0;
    const pageNumbers = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }
    } else {
        if (page <= 4) {
            pageNumbers.push(1, 2, 3, 4, 5, -1, totalPages);
        } else if (page >= totalPages - 3) {
            pageNumbers.push(
                1,
                -1,
                totalPages - 4,
                totalPages - 3,
                totalPages - 2,
                totalPages - 1,
                totalPages
            );
        } else {
            pageNumbers.push(1, -1, page - 1, page, page + 1, -1, totalPages);
        }
    }

    // 搜索
    const handleSearch = () => {
        setPage(1);
    };

    // 重置
    const handleReset = () => {
        setBrandFilter('');
        setBrandZhFilter('');
        setSystemVersionFilter('');
        setModelFilter('');
        setModelAliasFilter('');
        setPage(1);
    };

    // 打开编辑对话框
    const handleOpenEditDialog = (device?: any) => {
        if (device) {
            setEditingDevice(device);
            setFormData({
                brand: device.brand,
                brandZh: device.brandZh,
                model: device.model,
                modelAlias: device.modelAlias || '',
                systemVersion: device.systemVersion,
                resolution: device.resolution || '',
                cpuModel: device.cpuModel || '',
                cpuCores: device.cpuCores?.toString() || '',
                memory: device.memory || '',
                sdkVersion: device.sdkVersion || '',
                cpuFrequency: device.cpuFrequency || '',
            });
        } else {
            setEditingDevice(null);
            resetForm();
        }
        setIsEditDialogOpen(true);
    };

    // 关闭编辑对话框
    const handleCloseEditDialog = () => {
        setIsEditDialogOpen(false);
        setEditingDevice(null);
        resetForm();
    };

    // 重置表单
    const resetForm = () => {
        setFormData({
            brand: '',
            brandZh: '',
            model: '',
            modelAlias: '',
            systemVersion: '',
            resolution: '',
            cpuModel: '',
            cpuCores: '',
            memory: '',
            sdkVersion: '',
            cpuFrequency: '',
        });
    };

    // 提交表单
    const handleSubmit = () => {
        if (!formData.brand.trim()) {
            showErrorToast('请输入品牌');
            return;
        }
        if (!formData.brandZh.trim()) {
            showErrorToast('请输入品牌中文');
            return;
        }
        if (!formData.model.trim()) {
            showErrorToast('请输入型号');
            return;
        }
        if (!formData.systemVersion.trim()) {
            showErrorToast('请输入系统版本');
            return;
        }

        const submitData = {
            brand: formData.brand.trim(),
            brandZh: formData.brandZh.trim(),
            model: formData.model.trim(),
            modelAlias: formData.modelAlias.trim() || undefined,
            systemVersion: formData.systemVersion.trim(),
            resolution: formData.resolution.trim() || undefined,
            cpuModel: formData.cpuModel.trim() || undefined,
            cpuCores: formData.cpuCores
                ? parseInt(formData.cpuCores, 10)
                : undefined,
            memory: formData.memory.trim() || undefined,
            sdkVersion: formData.sdkVersion.trim() || undefined,
            cpuFrequency: formData.cpuFrequency.trim() || undefined,
        };

        if (editingDevice) {
            updateDeviceMutation.mutate({
                id: editingDevice.id,
                ...submitData,
            });
        } else {
            createDeviceMutation.mutate(submitData);
        }
    };

    // 删除设备
    const handleDelete = (deviceId: string) => {
        if (confirm('确定要删除这个设备吗？')) {
            deleteDeviceMutation.mutate({ id: deviceId });
        }
    };

    // 导出报表
    const handleExport = () => {
        exportDevicesMutation.mutate({
            brand: brandFilter || undefined,
            brandZh: brandZhFilter || undefined,
            systemVersion: systemVersionFilter || undefined,
            model: modelFilter || undefined,
            modelAlias: modelAliasFilter || undefined,
        });
    };

    return (
        <Box>
            {/* 面包屑 */}
            <Flex align="center" gap={2} mb={4}>
                <FiAlignJustify />
                <Text fontSize="14px" color={COLORS.textTertiary}>
                    /
                </Text>
                <Text fontSize="14px" color={COLORS.textSecondary}>
                    后台管理
                </Text>
                <Text fontSize="14px" color={COLORS.textTertiary}>
                    /
                </Text>
                <Text
                    fontSize="14px"
                    color={COLORS.textPrimary}
                    fontWeight="500"
                >
                    设备管理
                </Text>
            </Flex>
            <Box
                bg={COLORS.bgPrimary}
                borderRadius="8px"
                p={6}
                boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                maxW="1150px"
            >
                {/* 筛选区域 */}
                <Flex gap={4} mb={6} wrap="wrap">
                    {/* 品牌筛选 */}
                    <Box flex="0 0 100px">
                        <Text
                            fontSize="14px"
                            color={COLORS.textSecondary}
                            mb={2}
                            pl={3}
                        >
                            品牌
                        </Text>
                        <Input
                            value={brandFilter}
                            onChange={(e) => setBrandFilter(e.target.value)}
                            placeholder="请输入品牌"
                            borderColor={COLORS.borderColor}
                            borderRadius="4px"
                            fontSize="14px"
                            _focus={{
                                borderColor: COLORS.primary,
                                boxShadow: `0 0 0 1px ${COLORS.primary}`,
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                        />
                    </Box>

                    {/* 品牌中文筛选 */}
                    <Box flex="0 0 130px">
                        <Text
                            fontSize="14px"
                            color={COLORS.textSecondary}
                            mb={2}
                            pl={3}
                        >
                            品牌中文
                        </Text>
                        <Input
                            value={brandZhFilter}
                            onChange={(e) => setBrandZhFilter(e.target.value)}
                            placeholder="请输入品牌中文"
                            borderColor={COLORS.borderColor}
                            borderRadius="4px"
                            fontSize="14px"
                            _focus={{
                                borderColor: COLORS.primary,
                                boxShadow: `0 0 0 1px ${COLORS.primary}`,
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                        />
                    </Box>

                    {/* 系统版本筛选 */}
                    <Box flex="0 0 130px">
                        <Text
                            fontSize="14px"
                            color={COLORS.textSecondary}
                            mb={2}
                            pl={3}
                        >
                            系统版本
                        </Text>
                        <Input
                            value={systemVersionFilter}
                            onChange={(e) =>
                                setSystemVersionFilter(e.target.value)
                            }
                            placeholder="请输入系统版本"
                            borderColor={COLORS.borderColor}
                            borderRadius="4px"
                            fontSize="14px"
                            _focus={{
                                borderColor: COLORS.primary,
                                boxShadow: `0 0 0 1px ${COLORS.primary}`,
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                        />
                    </Box>

                    {/* 型号筛选 */}
                    <Box flex="0 0 100px">
                        <Text
                            fontSize="14px"
                            color={COLORS.textSecondary}
                            mb={2}
                            pl={3}
                        >
                            型号
                        </Text>
                        <Input
                            value={modelFilter}
                            onChange={(e) => setModelFilter(e.target.value)}
                            placeholder="请输入型号"
                            borderColor={COLORS.borderColor}
                            borderRadius="4px"
                            fontSize="14px"
                            _focus={{
                                borderColor: COLORS.primary,
                                boxShadow: `0 0 0 1px ${COLORS.primary}`,
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                        />
                    </Box>

                    {/* 型号别名筛选 */}
                    <Box flex="0 0 130px">
                        <Text
                            fontSize="14px"
                            color={COLORS.textSecondary}
                            mb={2}
                            pl={3}
                        >
                            型号别名
                        </Text>
                        <Input
                            value={modelAliasFilter}
                            onChange={(e) =>
                                setModelAliasFilter(e.target.value)
                            }
                            placeholder="请输入型号别名"
                            borderColor={COLORS.borderColor}
                            borderRadius="4px"
                            fontSize="14px"
                            _focus={{
                                borderColor: COLORS.primary,
                                boxShadow: `0 0 0 1px ${COLORS.primary}`,
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                        />
                    </Box>

                    {/* 搜索和重置按钮 */}
                    <Flex gap={2} alignItems="flex-end">
                        <Button
                            background="linear-gradient(to right, #FF9566, #FE606B)"
                            color="white"
                            fontSize="14px"
                            px={6}
                            _hover={{ opacity: 0.9 }}
                            onClick={handleSearch}
                        >
                            <Flex align="center" gap={1}>
                                <LuSearch />
                                <Text>查询</Text>
                            </Flex>
                        </Button>
                        <Button
                            variant="outline"
                            fontSize="14px"
                            px={6}
                            borderColor={COLORS.borderColor}
                            color={COLORS.textSecondary}
                            _hover={{ bg: COLORS.bgSecondary }}
                            onClick={handleReset}
                        >
                            重置
                        </Button>
                    </Flex>

                    {/* 导出报表按钮 */}
                    <Box ml="auto" alignSelf="flex-end">
                        <Button
                            background="linear-gradient(to right, #FF9566, #FE606B)"
                            color="white"
                            fontSize="14px"
                            px={6}
                            _hover={{ opacity: 0.9 }}
                            onClick={handleExport}
                        >
                            导出报表
                        </Button>
                    </Box>
                </Flex>

                {/* 表格 */}
                <Box overflowX="auto">
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '14px',
                        }}
                    >
                        <thead>
                            <tr style={{ background: COLORS.bgSecondary }}>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '60px',
                                    }}
                                >
                                    序号
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '100px',
                                    }}
                                >
                                    品牌
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '100px',
                                    }}
                                >
                                    品牌中文
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '120px',
                                    }}
                                >
                                    型号
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '120px',
                                    }}
                                >
                                    型号别名
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '100px',
                                    }}
                                >
                                    系统版本
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '100px',
                                    }}
                                >
                                    分辨率
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '120px',
                                    }}
                                >
                                    CPU型号
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '80px',
                                    }}
                                >
                                    CPU核数
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '80px',
                                    }}
                                >
                                    内存
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '100px',
                                    }}
                                >
                                    SDK版本
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '100px',
                                    }}
                                >
                                    CPU频率
                                </th>
                                <th
                                    style={{
                                        position: 'sticky',
                                        right: 0,
                                        zIndex: 3,
                                        backgroundColor: COLORS.bgSecondary,
                                        boxShadow:
                                            '-2px 0 4px rgba(0,0,0,0.05)',
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '120px',
                                    }}
                                >
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={13}
                                        style={{
                                            padding: '40px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Text color={COLORS.textTertiary}>
                                            加载中...
                                        </Text>
                                    </td>
                                </tr>
                            ) : devices.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={13}
                                        style={{
                                            padding: '40px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Text color={COLORS.textTertiary}>
                                            暂无数据
                                        </Text>
                                    </td>
                                </tr>
                            ) : (
                                devices.map((device: any, index: number) => (
                                    <tr
                                        key={device.id}
                                        style={{
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {(page - 1) * pageSize + index + 1}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {device.brand}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {device.brandZh}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {device.model}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {device.modelAlias || '-'}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {device.systemVersion}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {device.resolution || '-'}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {device.cpuModel || '-'}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {device.cpuCores || '-'}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {device.memory || '-'}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {device.sdkVersion || '-'}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {device.cpuFrequency || '-'}
                                        </td>
                                        <td
                                            style={{
                                                position: 'sticky',
                                                right: 0,
                                                zIndex: 2,
                                                backgroundColor:
                                                    COLORS.bgPrimary,
                                                boxShadow:
                                                    '-2px 0 4px rgba(0,0,0,0.05)',
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            <Flex gap={2} justify="center">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    colorScheme="blue"
                                                    onClick={() =>
                                                        handleOpenEditDialog(
                                                            device
                                                        )
                                                    }
                                                >
                                                    <FiEdit size={14} />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    colorScheme="red"
                                                    onClick={() =>
                                                        handleDelete(device.id)
                                                    }
                                                >
                                                    <LuTrash2 size={14} />
                                                </Button>
                                            </Flex>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Box>

                {/* 分页 */}
                {pagination && pagination.total > 0 && (
                    <Flex justify="space-between" align="center" mt={6}>
                        <Text fontSize="14px" color={COLORS.textSecondary}>
                            共{pagination.total}条
                        </Text>
                        <Flex gap={2} align="center">
                            {pageNumbers.map((pageNum, idx) =>
                                pageNum === -1 ? (
                                    <Text
                                        key={`ellipsis-${idx}`}
                                        px={2}
                                        color={COLORS.textSecondary}
                                    >
                                        ...
                                    </Text>
                                ) : (
                                    <Box
                                        key={pageNum}
                                        as="button"
                                        minW="32px"
                                        h="32px"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        bg={
                                            page === pageNum
                                                ? '#FFECE8'
                                                : 'transparent'
                                        }
                                        color={
                                            page === pageNum
                                                ? COLORS.primary
                                                : COLORS.textPrimary
                                        }
                                        borderRadius="2px"
                                        fontSize="14px"
                                        cursor="pointer"
                                        transition="all 0.2s"
                                        _hover={{
                                            bg:
                                                page === pageNum
                                                    ? '#FFECE8'
                                                    : COLORS.bgSecondary,
                                        }}
                                        onClick={() => setPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Box>
                                )
                            )}
                            <Flex gap={2} align="center" ml={4}>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                >
                                    {pageSize}条/页
                                </Text>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    fontSize="14px"
                                    borderColor={COLORS.borderColor}
                                    color={COLORS.textSecondary}
                                    borderRadius="2px"
                                    disabled={page === 1}
                                    _disabled={{
                                        opacity: 0.5,
                                        cursor: 'not-allowed',
                                    }}
                                    onClick={() =>
                                        setPage(Math.max(1, page - 1))
                                    }
                                >
                                    上一页
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    fontSize="14px"
                                    borderColor={COLORS.borderColor}
                                    color={COLORS.textSecondary}
                                    borderRadius="2px"
                                    disabled={page === totalPages}
                                    _disabled={{
                                        opacity: 0.5,
                                        cursor: 'not-allowed',
                                    }}
                                    onClick={() =>
                                        setPage(Math.min(totalPages, page + 1))
                                    }
                                >
                                    下一页
                                </Button>
                            </Flex>
                        </Flex>
                    </Flex>
                )}
            </Box>

            {/* 编辑/新增设备对话框 */}
            <DialogRoot
                open={isEditDialogOpen}
                onOpenChange={(e) => !e.open && handleCloseEditDialog()}
            >
                <DialogBackdrop />
                <DialogContent
                    borderRadius="8px"
                    bg="white"
                    boxShadow="0px 0px 18px rgba(0, 65, 215, 0.06)"
                    position="fixed"
                    top="40%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    maxH="90vh"
                    w="440px"
                >
                    <DialogHeader>
                        <DialogTitle>
                            {editingDevice ? '编辑设备' : '新增设备'}
                        </DialogTitle>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody>
                        <Flex direction="row" gap={4} flexWrap="wrap">
                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    mb={2}
                                >
                                    品牌 *
                                </Text>
                                <Input
                                    value={formData.brand}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            brand: e.target.value,
                                        })
                                    }
                                    placeholder="请输入品牌"
                                    borderColor={COLORS.borderColor}
                                    borderRadius="4px"
                                    fontSize="14px"
                                />
                            </Box>

                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    mb={2}
                                >
                                    品牌中文 *
                                </Text>
                                <Input
                                    value={formData.brandZh}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            brandZh: e.target.value,
                                        })
                                    }
                                    placeholder="请输入品牌中文"
                                    borderColor={COLORS.borderColor}
                                    borderRadius="4px"
                                    fontSize="14px"
                                />
                            </Box>

                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    mb={2}
                                >
                                    型号 *
                                </Text>
                                <Input
                                    value={formData.model}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            model: e.target.value,
                                        })
                                    }
                                    placeholder="请输入型号"
                                    borderColor={COLORS.borderColor}
                                    borderRadius="4px"
                                    fontSize="14px"
                                />
                            </Box>

                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    mb={2}
                                >
                                    型号别名
                                </Text>
                                <Input
                                    value={formData.modelAlias}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            modelAlias: e.target.value,
                                        })
                                    }
                                    placeholder="请输入型号别名"
                                    borderColor={COLORS.borderColor}
                                    borderRadius="4px"
                                    fontSize="14px"
                                />
                            </Box>

                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    mb={2}
                                >
                                    系统版本 *
                                </Text>
                                <Input
                                    value={formData.systemVersion}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            systemVersion: e.target.value,
                                        })
                                    }
                                    placeholder="请输入系统版本"
                                    borderColor={COLORS.borderColor}
                                    borderRadius="4px"
                                    fontSize="14px"
                                />
                            </Box>

                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    mb={2}
                                >
                                    分辨率
                                </Text>
                                <Input
                                    value={formData.resolution}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            resolution: e.target.value,
                                        })
                                    }
                                    placeholder="请输入分辨率"
                                    borderColor={COLORS.borderColor}
                                    borderRadius="4px"
                                    fontSize="14px"
                                />
                            </Box>

                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    mb={2}
                                >
                                    CPU型号
                                </Text>
                                <Input
                                    value={formData.cpuModel}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            cpuModel: e.target.value,
                                        })
                                    }
                                    placeholder="请输入CPU型号"
                                    borderColor={COLORS.borderColor}
                                    borderRadius="4px"
                                    fontSize="14px"
                                />
                            </Box>

                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    mb={2}
                                >
                                    CPU核数
                                </Text>
                                <Input
                                    type="number"
                                    value={formData.cpuCores}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            cpuCores: e.target.value,
                                        })
                                    }
                                    placeholder="请输入CPU核数"
                                    borderColor={COLORS.borderColor}
                                    borderRadius="4px"
                                    fontSize="14px"
                                />
                            </Box>

                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    mb={2}
                                >
                                    内存
                                </Text>
                                <Input
                                    value={formData.memory}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            memory: e.target.value,
                                        })
                                    }
                                    placeholder="请输入内存大小"
                                    borderColor={COLORS.borderColor}
                                    borderRadius="4px"
                                    fontSize="14px"
                                />
                            </Box>

                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    mb={2}
                                >
                                    SDK版本
                                </Text>
                                <Input
                                    value={formData.sdkVersion}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            sdkVersion: e.target.value,
                                        })
                                    }
                                    placeholder="请输入SDK版本"
                                    borderColor={COLORS.borderColor}
                                    borderRadius="4px"
                                    fontSize="14px"
                                />
                            </Box>

                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    mb={2}
                                >
                                    CPU频率
                                </Text>
                                <Input
                                    value={formData.cpuFrequency}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            cpuFrequency: e.target.value,
                                        })
                                    }
                                    placeholder="请输入CPU频率"
                                    borderColor={COLORS.borderColor}
                                    borderRadius="4px"
                                    fontSize="14px"
                                />
                            </Box>
                        </Flex>
                    </DialogBody>
                    <DialogFooter>
                        <DialogActionTrigger asChild>
                            <Button
                                variant="outline"
                                onClick={handleCloseEditDialog}
                            >
                                取消
                            </Button>
                        </DialogActionTrigger>
                        <Button
                            background="linear-gradient(to right, #FF9566, #FE606B)"
                            color="white"
                            _hover={{ opacity: 0.9 }}
                            onClick={handleSubmit}
                            disabled={
                                createDeviceMutation.isPending ||
                                updateDeviceMutation.isPending
                            }
                        >
                            确定
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>
        </Box>
    );
}
