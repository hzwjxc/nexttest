'use client';

import React, { useState } from 'react';
import {
    Box,
    Flex,
    Text,
    Button,
    Input,
    Badge,
    NativeSelectRoot,
    NativeSelectField,
    Table,
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogTitle,
    DialogCloseTrigger,
    DialogActionTrigger,
    DialogBackdrop,
} from '@chakra-ui/react';
import { LuSearch, LuPlus } from 'react-icons/lu';
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

// 角色映射
const ROLE_MAP: Record<string, string> = {
    SUPER_ADMIN: '超级管理员',
    TEST_ADMIN: '众测管理员',
    LIAISON: '分行众测联络员',
    TESTER: '众测测试人员',
    DEPT_MANAGER: '部门经理',
    GENERAL_MANAGER: '总经理',
};

// 等级映射
const LEVEL_MAP: Record<string, string> = {
    LEVEL_1: '新人',
    LEVEL_2: '资深老手',
    LEVEL_3: '资深老手2',
};

// 角色颜色
const ROLE_COLOR_MAP: Record<string, string> = {
    SUPER_ADMIN: 'red',
    TEST_ADMIN: 'purple',
    LIAISON: 'orange',
    TESTER: 'blue',
    DEPT_MANAGER: 'green',
    GENERAL_MANAGER: 'pink',
};

export default function TestersPage() {
    const { showSuccessToast, showErrorToast } = useCustomToast();

    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [keyword, setKeyword] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [selectedTester, setSelectedTester] = useState<any>(null);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
    const [selectedTags, setSelectedTags] = useState<
        Array<{ tagId: string; value: string }>
    >([]);
    const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
    const [filterTags, setFilterTags] = useState<
        Array<{ tagId: string; value: string }>
    >([]);
    const [tempFilterTags, setTempFilterTags] = useState<
        Array<{ tagId: string; value: string }>
    >([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [importTagId, setImportTagId] = useState('');
    const [importTagValue, setImportTagValue] = useState('');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importPreview, setImportPreview] = useState<string[]>([]);

    // 查询众测人员列表
    const { data, isLoading, refetch } = api.tester.list.useQuery(
        {
            page,
            pageSize,
            keyword: searchKeyword,
            role: roleFilter || undefined,
            status: statusFilter || undefined,
            tags: filterTags.length > 0 ? filterTags : undefined,
        },
        {
            refetchOnMount: 'always',
            refetchOnWindowFocus: true,
        }
    );

    // 查询所有标签
    const { data: tagsData } = api.tagManagement.getAll.useQuery();

    // 导入标签
    const importTagUsersMutation = api.tester.importTagUsers.useMutation({
        onSuccess: (result) => {
            showSuccessToast(
                `导入成功！共 ${result.total} 条记录，匹配 ${result.matched} 个用户，添加 ${result.added} 个标签`
            );
            setIsImportDialogOpen(false);
            setImportTagId('');
            setImportTagValue('');
            setImportFile(null);
            setImportPreview([]);
            // 清除筛选条件，显示所有用户
            setKeyword('');
            setSearchKeyword('');
            setFilterTags([]);
            setPage(1);
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message || '导入失败');
        },
    });

    // 设置角色
    const setRoleMutation = api.tester.setRole.useMutation({
        onSuccess: () => {
            showSuccessToast('角色设置成功');
            setIsRoleDialogOpen(false);
            setSelectedTester(null);
            setSelectedRoles([]);
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message || '角色设置失败');
        },
    });

    // 设置标签
    const setTagsMutation = api.tester.setTags.useMutation({
        onSuccess: () => {
            showSuccessToast('标签设置成功');
            setIsTagDialogOpen(false);
            setSelectedTester(null);
            setSelectedTags([]);
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message || '标签设置失败');
        },
    });

    // 切换状态
    const toggleStatusMutation = api.tester.toggleStatus.useMutation({
        onSuccess: () => {
            showSuccessToast('状态更新成功');
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message || '状态更新失败');
        },
    });

    // 搜索
    const handleSearch = () => {
        setSearchKeyword(keyword);
        setPage(1);
    };

    // 重置搜索
    const handleReset = () => {
        setKeyword('');
        setSearchKeyword('');
        setRoleFilter('');
        setStatusFilter('');
        setTagFilter('');
        setFilterTags([]);
        setPage(1);
    };

    // 打开设置角色对话框
    const handleSetRole = (tester: any) => {
        setSelectedTester(tester);
        setSelectedRoles(tester.roles || []);
        setIsRoleDialogOpen(true);
    };

    // 打开设置标签对话框
    const handleSetTags = (tester: any) => {
        setSelectedTester(tester);
        // 获取用户已有的标签（格式：{tagId, value}）
        const userTags =
            tester.tags?.map((t: any) => ({
                tagId: t.tagId,
                value: t.value || '',
            })) || [];
        setSelectedTags(userTags);
        setIsTagDialogOpen(true);
    };

    // 切换角色选择
    const handleToggleRole = (roleCode: string) => {
        setSelectedRoles((prev) => {
            if (prev.includes(roleCode)) {
                return prev.filter((r) => r !== roleCode);
            } else {
                return [...prev, roleCode];
            }
        });
    };

    // 切换标签选择
    const handleToggleTag = (tagId: string, value: string) => {
        setSelectedTags((prev) => {
            const exists = prev.find(
                (t) => t.tagId === tagId && t.value === value
            );
            if (exists) {
                return prev.filter(
                    (t) => !(t.tagId === tagId && t.value === value)
                );
            } else {
                return [...prev, { tagId, value }];
            }
        });
    };

    // 切换筛选标签选择
    const handleToggleFilterTag = (tagId: string, value: string) => {
        setTempFilterTags((prev) => {
            const exists = prev.find(
                (t) => t.tagId === tagId && t.value === value
            );
            if (exists) {
                return prev.filter(
                    (t) => !(t.tagId === tagId && t.value === value)
                );
            } else {
                return [...prev, { tagId, value }];
            }
        });
    };

    // 提交角色设置
    const handleSubmitRole = () => {
        if (!selectedTester || selectedRoles.length === 0) {
            showErrorToast('请至少选择一个角色');
            return;
        }

        setRoleMutation.mutate({
            id: selectedTester.id,
            roles: selectedRoles,
        });
    };

    // 提交标签设置
    const handleSubmitTags = () => {
        if (!selectedTester) {
            showErrorToast('请选择人员');
            return;
        }

        setTagsMutation.mutate({
            id: selectedTester.id,
            tags: selectedTags,
        });
    };

    // 打开筛选标签对话框
    const handleOpenFilterDialog = () => {
        setTempFilterTags(filterTags);
        setIsFilterDialogOpen(true);
    };

    // 提交筛选标签
    const handleSubmitFilterTags = () => {
        setFilterTags(tempFilterTags);
        setIsFilterDialogOpen(false);
        setPage(1);
    };

    // 切换状态
    const handleToggleStatus = (tester: any) => {
        const newStatus = !tester.status;
        const statusText = newStatus ? '启用' : '禁用';

        if (confirm(`确定要${statusText}该人员吗？`)) {
            toggleStatusMutation.mutate({
                id: tester.id,
                status: newStatus,
            });
        }
    };

    // 导出测试用户明细
    const handleExport = () => {
        if (!data || data.list.length === 0) {
            showErrorToast('暂无数据可导出');
            return;
        }

        // 准备导出数据
        const exportData = data.list.map((tester, index) => ({
            序号: (page - 1) * pageSize + index + 1,
            姓名: tester.name || '-',
            角色: tester.roles
                .map((role: string) => ROLE_MAP[role] || role)
                .join(', '),
            手机号: tester.phone || '-',
            OA账号: tester.oaId || '-',
            注册时间: tester.createdAt
                ? new Date(tester.createdAt).toLocaleString('zh-CN')
                : '-',
            总积分: tester.totalPoints || 0,
            可用积分: tester.availablePoints || 0,
            最后登录IP: tester.lastLoginIp || '-',
            参与活动数: tester.activityCount || 0,
            机构: tester.organization || '-',
            部门: tester.department || '-',
            二级部门: tester.subDepartment || '-',
            状态: tester.status ? '启用' : '禁用',
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
            `测试用户明细_${new Date().toLocaleDateString()}.csv`
        );
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showSuccessToast('导出成功');
    };

    // 触发文件选择
    const handleImportClick = () => {
        setIsImportDialogOpen(true);
    };

    // 处理文件选择
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportFile(file);

        // 动态导入 xlsx 库
        const XLSX = await import('xlsx');

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                    header: 1,
                }) as string[][];

                // 提取标识符（手机号或OA账号）
                const identifiers: string[] = [];

                // 查找表头行，定位手机号和OA账号列
                let phoneColIndex = -1;
                let oaColIndex = -1;

                if (jsonData.length > 0) {
                    const headerRow = jsonData[0];
                    phoneColIndex = headerRow.findIndex(
                        (cell) => cell && String(cell).includes('手机')
                    );
                    oaColIndex = headerRow.findIndex(
                        (cell) =>
                            cell &&
                            (String(cell).includes('OA') ||
                                String(cell).includes('oa'))
                    );
                }

                // 如果找到了表头，从第二行开始提取数据
                if (phoneColIndex >= 0 || oaColIndex >= 0) {
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (phoneColIndex >= 0 && row[phoneColIndex]) {
                            const phone = String(row[phoneColIndex]).trim();
                            if (phone && !identifiers.includes(phone)) {
                                identifiers.push(phone);
                            }
                        }
                        if (oaColIndex >= 0 && row[oaColIndex]) {
                            const oaId = String(row[oaColIndex]).trim();
                            if (oaId && !identifiers.includes(oaId)) {
                                identifiers.push(oaId);
                            }
                        }
                    }
                } else {
                    // 如果没有找到表头，提取所有非空单元格
                    jsonData.forEach((row) => {
                        row.forEach((cell) => {
                            if (cell && String(cell).trim()) {
                                const value = String(cell).trim();
                                if (!identifiers.includes(value)) {
                                    identifiers.push(value);
                                }
                            }
                        });
                    });
                }

                setImportPreview(identifiers.slice(0, 10)); // 只显示前10条预览

                if (identifiers.length === 0) {
                    showErrorToast('未找到有效的手机号或OA账号数据');
                }
            } catch (error) {
                showErrorToast('文件解析失败，请检查文件格式');
            }
        };
        reader.readAsBinaryString(file);
    };

    // 提交导入
    const handleSubmitImport = async () => {
        if (!importTagId) {
            showErrorToast('请选择标签');
            return;
        }
        if (!importTagValue) {
            showErrorToast('请选择标签值');
            return;
        }
        if (!importFile) {
            showErrorToast('请选择文件');
            return;
        }

        // 重新解析文件获取所有标识符
        const XLSX = await import('xlsx');
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                    header: 1,
                }) as string[][];

                // 提取标识符（手机号或OA账号）
                const identifiers: string[] = [];

                // 查找表头行，定位手机号和OA账号列
                let phoneColIndex = -1;
                let oaColIndex = -1;

                if (jsonData.length > 0) {
                    const headerRow = jsonData[0];
                    phoneColIndex = headerRow.findIndex(
                        (cell) => cell && String(cell).includes('手机')
                    );
                    oaColIndex = headerRow.findIndex(
                        (cell) =>
                            cell &&
                            (String(cell).includes('OA') ||
                                String(cell).includes('oa'))
                    );
                }

                // 如果找到了表头，从第二行开始提取数据
                if (phoneColIndex >= 0 || oaColIndex >= 0) {
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (phoneColIndex >= 0 && row[phoneColIndex]) {
                            const phone = String(row[phoneColIndex]).trim();
                            if (phone && !identifiers.includes(phone)) {
                                identifiers.push(phone);
                            }
                        }
                        if (oaColIndex >= 0 && row[oaColIndex]) {
                            const oaId = String(row[oaColIndex]).trim();
                            if (oaId && !identifiers.includes(oaId)) {
                                identifiers.push(oaId);
                            }
                        }
                    }
                } else {
                    // 如果没有找到表头，提取所有非空单元格
                    jsonData.forEach((row) => {
                        row.forEach((cell) => {
                            if (cell && String(cell).trim()) {
                                const value = String(cell).trim();
                                if (!identifiers.includes(value)) {
                                    identifiers.push(value);
                                }
                            }
                        });
                    });
                }

                if (identifiers.length === 0) {
                    showErrorToast('未找到有效的手机号或OA账号数据');
                    return;
                }

                // 调用导入API
                importTagUsersMutation.mutate({
                    tagId: importTagId,
                    tagValue: importTagValue,
                    identifiers,
                });
            } catch (error) {
                showErrorToast('文件解析失败，请检查文件格式');
            }
        };
        reader.readAsBinaryString(importFile);
    };

    return (
        <Box
            bg={COLORS.bgSecondary}
            minH="calc(100vh - 72px)"
            p={6}
            maxW="1150px"
        >
            {/* 面包屑导航 */}
            <Flex align="center" gap={2} mb={4}>
                <Text fontSize="14px" color={COLORS.textSecondary}>
                    后台管理
                </Text>
                <Text fontSize="14px" color={COLORS.textSecondary}>
                    /
                </Text>
                <Text fontSize="14px" color={COLORS.textPrimary}>
                    众测人员管理
                </Text>
            </Flex>

            {/* 页面标题 */}
            <Flex justify="space-between" align="center" mb={6}>
                <Text
                    fontSize="20px"
                    fontWeight="600"
                    color={COLORS.textPrimary}
                >
                    众测人员管理
                </Text>
            </Flex>

            {/* 搜索和筛选 */}
            <Box
                bg={COLORS.bgPrimary}
                borderRadius="8px"
                p={4}
                mb={4}
                boxShadow="0 1px 4px rgba(0, 0, 0, 0.08)"
            >
                <Flex gap={3} flexWrap="wrap">
                    <Input
                        placeholder="搜索姓名、手机号、OA账号"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        width="300px"
                        fontSize="14px"
                    />
                    <Button
                        variant="outline"
                        onClick={handleOpenFilterDialog}
                        fontSize="14px"
                        width="180px"
                    >
                        {filterTags.length > 0
                            ? `已选 ${filterTags.length} 个标签`
                            : '选择标签'}
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={handleSearch}
                        fontSize="14px"
                    >
                        <LuSearch style={{ marginRight: '8px' }} />
                        搜索
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        fontSize="14px"
                    >
                        重置
                    </Button>
                    <Button
                        colorScheme="green"
                        onClick={handleImportClick}
                        fontSize="14px"
                    >
                        导入标签
                    </Button>
                    <Button
                        colorScheme="purple"
                        onClick={handleExport}
                        fontSize="14px"
                    >
                        导出用户明细
                    </Button>
                </Flex>
            </Box>

            {/* 数据表格 */}
            <Box
                bg={COLORS.bgPrimary}
                borderRadius="8px"
                boxShadow="0 1px 4px rgba(0, 0, 0, 0.08)"
                overflow="hidden"
            >
                {isLoading ? (
                    <Flex justify="center" align="center" py={8}>
                        <Text color={COLORS.textSecondary}>加载中...</Text>
                    </Flex>
                ) : !data || data.list.length === 0 ? (
                    <Flex justify="center" align="center" py={8}>
                        <Text color={COLORS.textSecondary}>暂无数据</Text>
                    </Flex>
                ) : (
                    <>
                        <Box overflowX="auto" overflowY="hidden" maxW="100%">
                            <table
                                style={{
                                    minWidth: '1800px',
                                    width: '100%',
                                    borderCollapse: 'separate',
                                    borderSpacing: 0,
                                    fontSize: '14px',
                                    border: '1px solid ' + COLORS.borderColor,
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            backgroundColor: COLORS.bgSecondary,
                                        }}
                                    >
                                        <th
                                            style={{
                                                minWidth: '60px',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: 600,
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            序号
                                        </th>
                                        <th
                                            style={{
                                                minWidth: '100px',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: 600,
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            姓名
                                        </th>
                                        <th
                                            style={{
                                                minWidth: '200px',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: 600,
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            角色
                                        </th>
                                        <th
                                            style={{
                                                minWidth: '120px',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: 600,
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            手机号
                                        </th>
                                        <th
                                            style={{
                                                minWidth: '100px',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: 600,
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            OA账号
                                        </th>
                                        <th
                                            style={{
                                                minWidth: '160px',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: 600,
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            注册时间
                                        </th>
                                        <th
                                            style={{
                                                minWidth: '80px',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: 600,
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            总积分
                                        </th>
                                        <th
                                            style={{
                                                minWidth: '80px',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: 600,
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            总积分
                                        </th>
                                        <th
                                            style={{
                                                minWidth: '90px',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: 600,
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            可用积分
                                        </th>
                                        <th
                                            style={{
                                                minWidth: '120px',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: 600,
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            最后登录IP
                                        </th>
                                        <th
                                            style={{
                                                minWidth: '100px',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: 600,
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            参与活动数
                                        </th>
                                        <th
                                            style={{
                                                minWidth: '100px',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: 600,
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            机构
                                        </th>
                                        <th
                                            style={{
                                                minWidth: '100px',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: 600,
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            部门
                                        </th>
                                        <th
                                            style={{
                                                minWidth: '100px',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: 600,
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            二级部门
                                        </th>
                                        <th
                                            style={{
                                                minWidth: '80px',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: 600,
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            状态
                                        </th>
                                        <th
                                            style={{
                                                position: 'sticky',
                                                right: 0,
                                                zIndex: 3,
                                                backgroundColor:
                                                    COLORS.bgSecondary,
                                                boxShadow:
                                                    '-2px 0 4px rgba(0,0,0,0.05)',
                                                minWidth: '240px',
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontWeight: 600,
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            操作
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.list.map((tester, index) => (
                                        <tr
                                            key={tester.id}
                                            style={{
                                                borderBottom:
                                                    '1px solid ' +
                                                    COLORS.borderColor,
                                            }}
                                        >
                                            <td
                                                style={{
                                                    padding: '12px 16px',
                                                }}
                                            >
                                                {(page - 1) * pageSize +
                                                    index +
                                                    1}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '12px 16px',
                                                }}
                                            >
                                                {tester.name || '-'}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '12px 16px',
                                                }}
                                            >
                                                <Flex gap={1} flexWrap="wrap">
                                                    {tester.roles.map(
                                                        (role: string) => (
                                                            <Badge
                                                                key={role}
                                                                colorPalette={
                                                                    ROLE_COLOR_MAP[
                                                                        role
                                                                    ] || 'gray'
                                                                }
                                                                fontSize="12px"
                                                            >
                                                                {ROLE_MAP[
                                                                    role
                                                                ] || role}
                                                            </Badge>
                                                        )
                                                    )}
                                                </Flex>
                                            </td>
                                            <td
                                                style={{ padding: '12px 16px' }}
                                            >
                                                {tester.phone || '-'}
                                            </td>
                                            <td
                                                style={{ padding: '12px 16px' }}
                                            >
                                                {tester.oaId || '-'}
                                            </td>
                                            <td
                                                style={{ padding: '12px 16px' }}
                                            >
                                                {tester.createdAt
                                                    ? new Date(
                                                          tester.createdAt
                                                      ).toLocaleString(
                                                          'zh-CN',
                                                          {
                                                              year: 'numeric',
                                                              month: '2-digit',
                                                              day: '2-digit',
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                              second: '2-digit',
                                                          }
                                                      )
                                                    : '-'}
                                            </td>
                                            <td
                                                style={{ padding: '12px 16px' }}
                                            >
                                                {tester.totalPoints || 0}
                                            </td>
                                            <td
                                                style={{ padding: '12px 16px' }}
                                            >
                                                {tester.totalPoints || 0}
                                            </td>
                                            <td
                                                style={{ padding: '12px 16px' }}
                                            >
                                                {tester.availablePoints || 0}
                                            </td>
                                            <td
                                                style={{ padding: '12px 16px' }}
                                            >
                                                {tester.lastLoginIp || '-'}
                                            </td>
                                            <td
                                                style={{ padding: '12px 16px' }}
                                            >
                                                {tester.activityCount || 0}
                                            </td>
                                            <td
                                                style={{ padding: '12px 16px' }}
                                            >
                                                {tester.organization || '-'}
                                            </td>
                                            <td
                                                style={{ padding: '12px 16px' }}
                                            >
                                                {tester.department || '-'}
                                            </td>
                                            <td
                                                style={{ padding: '12px 16px' }}
                                            >
                                                {tester.subDepartment || '-'}
                                            </td>
                                            <td
                                                style={{ padding: '12px 16px' }}
                                            >
                                                <Badge
                                                    colorPalette={
                                                        tester.status
                                                            ? 'green'
                                                            : 'red'
                                                    }
                                                    fontSize="12px"
                                                >
                                                    {tester.status
                                                        ? '启用'
                                                        : '禁用'}
                                                </Badge>
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
                                                }}
                                            >
                                                <Flex gap={2}>
                                                    <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        colorScheme="blue"
                                                        fontSize="12px"
                                                        onClick={() =>
                                                            handleSetRole(
                                                                tester
                                                            )
                                                        }
                                                    >
                                                        设置角色
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        colorScheme="purple"
                                                        fontSize="12px"
                                                        onClick={() =>
                                                            handleSetTags(
                                                                tester
                                                            )
                                                        }
                                                    >
                                                        设置标签
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        colorScheme={
                                                            tester.status
                                                                ? 'red'
                                                                : 'green'
                                                        }
                                                        fontSize="12px"
                                                        onClick={() =>
                                                            handleToggleStatus(
                                                                tester
                                                            )
                                                        }
                                                        loading={
                                                            toggleStatusMutation.isPending
                                                        }
                                                    >
                                                        {tester.status
                                                            ? '禁用'
                                                            : '启用'}
                                                    </Button>
                                                </Flex>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Box>

                        {/* 分页 */}
                        <Flex
                            justify="space-between"
                            align="center"
                            p={4}
                            borderTop="1px solid"
                            borderColor={COLORS.borderColor}
                        >
                            <Text fontSize="14px" color={COLORS.textSecondary}>
                                共 {data.total} 条记录，第 {page} /{' '}
                                {data.totalPages} 页
                            </Text>
                            <Flex gap={2} align="center">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    fontSize="14px"
                                >
                                    上一页
                                </Button>

                                {/* 页码按钮 */}
                                {(() => {
                                    const pageNumbers = [];
                                    const totalPages = data.totalPages;
                                    const currentPage = page;

                                    // 始终显示第一页
                                    if (totalPages > 0) {
                                        pageNumbers.push(1);
                                    }

                                    // 计算显示范围
                                    let startPage = Math.max(
                                        2,
                                        currentPage - 2
                                    );
                                    let endPage = Math.min(
                                        totalPages - 1,
                                        currentPage + 2
                                    );

                                    // 如果当前页靠近开始，多显示后面的页码
                                    if (currentPage <= 3) {
                                        endPage = Math.min(totalPages - 1, 5);
                                    }

                                    // 如果当前页靠近结束，多显示前面的页码
                                    if (currentPage >= totalPages - 2) {
                                        startPage = Math.max(2, totalPages - 4);
                                    }

                                    // 添加省略号（前）
                                    if (startPage > 2) {
                                        pageNumbers.push('...');
                                    }

                                    // 添加中间页码
                                    for (let i = startPage; i <= endPage; i++) {
                                        pageNumbers.push(i);
                                    }

                                    // 添加省略号（后）
                                    if (endPage < totalPages - 1) {
                                        pageNumbers.push('...');
                                    }

                                    // 始终显示最后一页
                                    if (totalPages > 1) {
                                        pageNumbers.push(totalPages);
                                    }

                                    return pageNumbers.map((pageNum, index) => {
                                        if (pageNum === '...') {
                                            return (
                                                <Text
                                                    key={`ellipsis-${index}`}
                                                    fontSize="14px"
                                                    color={COLORS.textSecondary}
                                                    px={2}
                                                >
                                                    ...
                                                </Text>
                                            );
                                        }

                                        const isCurrentPage =
                                            pageNum === currentPage;
                                        return (
                                            <Button
                                                key={pageNum}
                                                size="sm"
                                                variant={
                                                    isCurrentPage
                                                        ? 'solid'
                                                        : 'outline'
                                                }
                                                onClick={() =>
                                                    setPage(pageNum as number)
                                                }
                                                fontSize="14px"
                                                minW="36px"
                                                bg={
                                                    isCurrentPage
                                                        ? COLORS.primary
                                                        : 'transparent'
                                                }
                                                color={
                                                    isCurrentPage
                                                        ? 'white'
                                                        : COLORS.textPrimary
                                                }
                                                borderColor={
                                                    isCurrentPage
                                                        ? COLORS.primary
                                                        : COLORS.borderColor
                                                }
                                                _hover={{
                                                    bg: isCurrentPage
                                                        ? '#c70f20'
                                                        : COLORS.bgSecondary,
                                                }}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    });
                                })()}

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPage(page + 1)}
                                    disabled={page >= data.totalPages}
                                    fontSize="14px"
                                >
                                    下一页
                                </Button>
                            </Flex>
                        </Flex>
                    </>
                )}
            </Box>

            {/* 设置角色对话框 */}
            <DialogRoot
                open={isRoleDialogOpen}
                onOpenChange={(e) => setIsRoleDialogOpen(e.open)}
                size="lg"
                placement="center"
            >
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
                            设置角色
                        </DialogTitle>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody>
                        <Box>
                            <Flex
                                align="center"
                                mb={4}
                                pb={3}
                                borderBottom="1px solid"
                                borderColor={COLORS.borderColor}
                            >
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    minW="80px"
                                >
                                    人员姓名：
                                </Text>
                                <Text
                                    fontSize="14px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                >
                                    {selectedTester?.name || '-'}
                                </Text>
                            </Flex>
                            <Flex align="center" mb={4}>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    minW="80px"
                                >
                                    当前角色：
                                </Text>
                                <Flex gap={1} flexWrap="wrap">
                                    {selectedTester?.roles?.map(
                                        (role: string) => (
                                            <Badge
                                                key={role}
                                                colorPalette={
                                                    ROLE_COLOR_MAP[role] ||
                                                    'gray'
                                                }
                                                fontSize="12px"
                                            >
                                                {ROLE_MAP[role] || role}
                                            </Badge>
                                        )
                                    )}
                                </Flex>
                            </Flex>
                            <Box>
                                <Text
                                    fontSize="14px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                    mb={3}
                                >
                                    选择角色（可多选）：
                                </Text>
                                <Flex direction="column" gap={2}>
                                    {Object.entries(ROLE_MAP).map(
                                        ([code, name]) => (
                                            <Box
                                                key={code}
                                                p={3}
                                                borderRadius="6px"
                                                border="1px solid"
                                                borderColor={
                                                    selectedRoles.includes(code)
                                                        ? COLORS.primary
                                                        : COLORS.borderColor
                                                }
                                                bg={
                                                    selectedRoles.includes(code)
                                                        ? '#FFF1F0'
                                                        : COLORS.bgPrimary
                                                }
                                                cursor="pointer"
                                                transition="all 0.2s"
                                                _hover={{
                                                    borderColor: COLORS.primary,
                                                    bg: '#FFF1F0',
                                                }}
                                                onClick={() =>
                                                    handleToggleRole(code)
                                                }
                                            >
                                                <Flex
                                                    align="center"
                                                    justify="space-between"
                                                >
                                                    <Flex
                                                        align="center"
                                                        gap={3}
                                                    >
                                                        <Box
                                                            w="18px"
                                                            h="18px"
                                                            borderRadius="4px"
                                                            border="2px solid"
                                                            borderColor={
                                                                selectedRoles.includes(
                                                                    code
                                                                )
                                                                    ? COLORS.primary
                                                                    : COLORS.borderColor
                                                            }
                                                            bg={
                                                                selectedRoles.includes(
                                                                    code
                                                                )
                                                                    ? COLORS.primary
                                                                    : 'transparent'
                                                            }
                                                            display="flex"
                                                            alignItems="center"
                                                            justifyContent="center"
                                                        >
                                                            {selectedRoles.includes(
                                                                code
                                                            ) && (
                                                                <Box
                                                                    w="10px"
                                                                    h="6px"
                                                                    borderLeft="2px solid white"
                                                                    borderBottom="2px solid white"
                                                                    transform="rotate(-45deg)"
                                                                    mt="-2px"
                                                                />
                                                            )}
                                                        </Box>
                                                        <Text
                                                            fontSize="14px"
                                                            fontWeight="500"
                                                            color={
                                                                COLORS.textPrimary
                                                            }
                                                        >
                                                            {name}
                                                        </Text>
                                                    </Flex>
                                                    <Badge
                                                        colorPalette={
                                                            ROLE_COLOR_MAP[
                                                                code
                                                            ] || 'gray'
                                                        }
                                                        fontSize="11px"
                                                    >
                                                        {code}
                                                    </Badge>
                                                </Flex>
                                            </Box>
                                        )
                                    )}
                                </Flex>
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
                            onClick={handleSubmitRole}
                            loading={setRoleMutation.isPending}
                        >
                            确定
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>

            {/* 设置标签对话框 */}
            <DialogRoot
                open={isTagDialogOpen}
                onOpenChange={(e) => setIsTagDialogOpen(e.open)}
                size="lg"
                placement="center"
            >
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
                            设置标签
                        </DialogTitle>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody>
                        <Box>
                            <Flex
                                align="center"
                                mb={4}
                                pb={3}
                                borderBottom="1px solid"
                                borderColor={COLORS.borderColor}
                            >
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    minW="80px"
                                >
                                    人员姓名：
                                </Text>
                                <Text
                                    fontSize="14px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                >
                                    {selectedTester?.name || '-'}
                                </Text>
                            </Flex>
                            <Flex align="center" mb={4}>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    minW="80px"
                                >
                                    当前标签：
                                </Text>
                                <Flex gap={1} flexWrap="wrap">
                                    {selectedTester?.tags?.length > 0 ? (
                                        selectedTester.tags.map(
                                            (t: any, index: number) => (
                                                <Badge
                                                    key={`${t.tagId}-${index}`}
                                                    colorPalette="blue"
                                                    fontSize="12px"
                                                >
                                                    {t.tag?.category}:{' '}
                                                    {t.value || t.tag?.name}
                                                </Badge>
                                            )
                                        )
                                    ) : (
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.textTertiary}
                                        >
                                            暂无标签
                                        </Text>
                                    )}
                                </Flex>
                            </Flex>
                            <Box>
                                <Text
                                    fontSize="14px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                    mb={3}
                                >
                                    选择标签（可多选）：
                                </Text>
                                {!tagsData || tagsData.length === 0 ? (
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                        textAlign="center"
                                        py={4}
                                    >
                                        暂无可用标签
                                    </Text>
                                ) : (
                                    <Box maxH="400px" overflowY="auto">
                                        {/* 按分类显示标签 */}
                                        {tagsData.map((tag) => {
                                            // 解析 rules 字段（JSON 数组）
                                            let tagOptions: string[] = [];
                                            try {
                                                tagOptions = tag.rules
                                                    ? JSON.parse(tag.rules)
                                                    : [];
                                            } catch (e) {
                                                console.error(
                                                    '解析标签规则失败:',
                                                    e
                                                );
                                            }

                                            return (
                                                <Box key={tag.id} mb={4}>
                                                    {/* 分类标题 */}
                                                    <Box
                                                        bg={COLORS.bgSecondary}
                                                        p={3}
                                                        borderRadius="6px"
                                                        mb={2}
                                                    >
                                                        <Text
                                                            fontSize="14px"
                                                            fontWeight="600"
                                                            color={
                                                                COLORS.textPrimary
                                                            }
                                                        >
                                                            {tag.category}
                                                        </Text>
                                                    </Box>
                                                    {/* 该分类下的标签选项 */}
                                                    <Flex
                                                        gap={2}
                                                        flexWrap="wrap"
                                                        px={2}
                                                    >
                                                        {tagOptions.length >
                                                        0 ? (
                                                            tagOptions.map(
                                                                (option) => {
                                                                    const isSelected =
                                                                        selectedTags.some(
                                                                            (
                                                                                t
                                                                            ) =>
                                                                                t.tagId ===
                                                                                    tag.id &&
                                                                                t.value ===
                                                                                    option
                                                                        );
                                                                    return (
                                                                        <Box
                                                                            key={`${tag.id}-${option}`}
                                                                            px={
                                                                                4
                                                                            }
                                                                            py={
                                                                                2
                                                                            }
                                                                            borderRadius="6px"
                                                                            border="1px solid"
                                                                            borderColor={
                                                                                isSelected
                                                                                    ? COLORS.primary
                                                                                    : COLORS.borderColor
                                                                            }
                                                                            bg={
                                                                                isSelected
                                                                                    ? '#FFF1F0'
                                                                                    : COLORS.bgPrimary
                                                                            }
                                                                            cursor="pointer"
                                                                            transition="all 0.2s"
                                                                            _hover={{
                                                                                borderColor:
                                                                                    COLORS.primary,
                                                                                bg: '#FFF1F0',
                                                                            }}
                                                                            onClick={() =>
                                                                                handleToggleTag(
                                                                                    tag.id,
                                                                                    option
                                                                                )
                                                                            }
                                                                        >
                                                                            <Flex
                                                                                align="center"
                                                                                gap={
                                                                                    2
                                                                                }
                                                                            >
                                                                                <Box
                                                                                    w="16px"
                                                                                    h="16px"
                                                                                    borderRadius="3px"
                                                                                    border="2px solid"
                                                                                    borderColor={
                                                                                        isSelected
                                                                                            ? COLORS.primary
                                                                                            : COLORS.borderColor
                                                                                    }
                                                                                    bg={
                                                                                        isSelected
                                                                                            ? COLORS.primary
                                                                                            : 'transparent'
                                                                                    }
                                                                                    display="flex"
                                                                                    alignItems="center"
                                                                                    justifyContent="center"
                                                                                    flexShrink={
                                                                                        0
                                                                                    }
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
                                                                                <Text
                                                                                    fontSize="14px"
                                                                                    color={
                                                                                        COLORS.textPrimary
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        option
                                                                                    }
                                                                                </Text>
                                                                            </Flex>
                                                                        </Box>
                                                                    );
                                                                }
                                                            )
                                                        ) : (
                                                            <Text
                                                                fontSize="12px"
                                                                color={
                                                                    COLORS.textTertiary
                                                                }
                                                            >
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
                            onClick={handleSubmitTags}
                            loading={setTagsMutation.isPending}
                        >
                            确定
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>

            {/* 导入标签对话框 */}
            <DialogRoot
                open={isImportDialogOpen}
                onOpenChange={(e) => setIsImportDialogOpen(e.open)}
            >
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
                            导入标签
                        </DialogTitle>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody>
                        <Box>
                            <Box mb={4}>
                                <Text
                                    fontSize="14px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                    mb={2}
                                >
                                    选择标签分类：
                                </Text>
                                <NativeSelectRoot>
                                    <NativeSelectField
                                        placeholder="请选择标签分类"
                                        value={importTagId}
                                        onChange={(e) => {
                                            setImportTagId(e.target.value);
                                            setImportTagValue('');
                                        }}
                                        fontSize="14px"
                                    >
                                        {tagsData?.map((tag) => (
                                            <option key={tag.id} value={tag.id}>
                                                {tag.category}
                                            </option>
                                        ))}
                                    </NativeSelectField>
                                </NativeSelectRoot>
                            </Box>
                            {importTagId && (
                                <Box mb={4}>
                                    <Text
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textPrimary}
                                        mb={2}
                                    >
                                        选择标签值：
                                    </Text>
                                    <NativeSelectRoot>
                                        <NativeSelectField
                                            placeholder="请选择标签值"
                                            value={importTagValue}
                                            onChange={(e) =>
                                                setImportTagValue(
                                                    e.target.value
                                                )
                                            }
                                            fontSize="14px"
                                        >
                                            {(() => {
                                                const selectedTag =
                                                    tagsData?.find(
                                                        (t) =>
                                                            t.id === importTagId
                                                    );
                                                if (!selectedTag) return null;
                                                let tagOptions: string[] = [];
                                                try {
                                                    tagOptions =
                                                        selectedTag.rules
                                                            ? JSON.parse(
                                                                  selectedTag.rules
                                                              )
                                                            : [];
                                                } catch (e) {
                                                    console.error(
                                                        '解析标签规则失败:',
                                                        e
                                                    );
                                                }
                                                return tagOptions.map(
                                                    (option) => (
                                                        <option
                                                            key={option}
                                                            value={option}
                                                        >
                                                            {option}
                                                        </option>
                                                    )
                                                );
                                            })()}
                                        </NativeSelectField>
                                    </NativeSelectRoot>
                                </Box>
                            )}
                            <Box mb={4}>
                                <Text
                                    fontSize="14px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                    mb={2}
                                >
                                    上传文件：
                                </Text>
                                <Input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileSelect}
                                    fontSize="14px"
                                />
                                <Text
                                    fontSize="12px"
                                    color={COLORS.textTertiary}
                                    mt={2}
                                >
                                    支持 CSV、Excel
                                    格式，文件中的所有单元格内容将被识别为手机号或OA账号
                                </Text>
                            </Box>
                            {importPreview.length > 0 && (
                                <Box mb={4}>
                                    <Text
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textPrimary}
                                        mb={2}
                                    >
                                        数据预览（前10条）：
                                    </Text>
                                    <Box
                                        p={3}
                                        bg={COLORS.bgSecondary}
                                        borderRadius="6px"
                                        maxH="150px"
                                        overflowY="auto"
                                    >
                                        {importPreview.map((item, index) => (
                                            <Text
                                                key={index}
                                                fontSize="12px"
                                                color={COLORS.textSecondary}
                                            >
                                                {item}
                                            </Text>
                                        ))}
                                    </Box>
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
                            onClick={handleSubmitImport}
                            loading={importTagUsersMutation.isPending}
                        >
                            确定导入
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>

            {/* 筛选标签对话框 */}
            <DialogRoot
                open={isFilterDialogOpen}
                onOpenChange={(e) => setIsFilterDialogOpen(e.open)}
                size="lg"
                placement="center"
            >
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
                            选择标签筛选
                        </DialogTitle>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody>
                        <Box>
                            {!tagsData || tagsData.length === 0 ? (
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textTertiary}
                                    textAlign="center"
                                    py={4}
                                >
                                    暂无可用标签
                                </Text>
                            ) : (
                                <Box maxH="400px" overflowY="auto">
                                    {/* 按分类显示标签 */}
                                    {tagsData.map((tag) => {
                                        // 解析 rules 字段（JSON 数组）
                                        let tagOptions: string[] = [];
                                        try {
                                            tagOptions = tag.rules
                                                ? JSON.parse(tag.rules)
                                                : [];
                                        } catch (e) {
                                            console.error(
                                                '解析标签规则失败:',
                                                e
                                            );
                                        }

                                        return (
                                            <Box key={tag.id} mb={4}>
                                                {/* 分类标题 */}
                                                <Box
                                                    bg={COLORS.bgSecondary}
                                                    p={3}
                                                    borderRadius="6px"
                                                    mb={2}
                                                >
                                                    <Text
                                                        fontSize="14px"
                                                        fontWeight="600"
                                                        color={
                                                            COLORS.textPrimary
                                                        }
                                                    >
                                                        {tag.category}
                                                    </Text>
                                                </Box>
                                                {/* 该分类下的标签选项 */}
                                                <Flex
                                                    gap={2}
                                                    flexWrap="wrap"
                                                    px={2}
                                                >
                                                    {tagOptions.length > 0 ? (
                                                        tagOptions.map(
                                                            (option) => {
                                                                const isSelected =
                                                                    tempFilterTags.some(
                                                                        (t) =>
                                                                            t.tagId ===
                                                                                tag.id &&
                                                                            t.value ===
                                                                                option
                                                                    );
                                                                return (
                                                                    <Box
                                                                        key={`${tag.id}-${option}`}
                                                                        px={4}
                                                                        py={2}
                                                                        borderRadius="6px"
                                                                        border="1px solid"
                                                                        borderColor={
                                                                            isSelected
                                                                                ? COLORS.primary
                                                                                : COLORS.borderColor
                                                                        }
                                                                        bg={
                                                                            isSelected
                                                                                ? '#FFF1F0'
                                                                                : COLORS.bgPrimary
                                                                        }
                                                                        cursor="pointer"
                                                                        transition="all 0.2s"
                                                                        _hover={{
                                                                            borderColor:
                                                                                COLORS.primary,
                                                                            bg: '#FFF1F0',
                                                                        }}
                                                                        onClick={() =>
                                                                            handleToggleFilterTag(
                                                                                tag.id,
                                                                                option
                                                                            )
                                                                        }
                                                                    >
                                                                        <Flex
                                                                            align="center"
                                                                            gap={
                                                                                2
                                                                            }
                                                                        >
                                                                            <Box
                                                                                w="16px"
                                                                                h="16px"
                                                                                borderRadius="3px"
                                                                                border="2px solid"
                                                                                borderColor={
                                                                                    isSelected
                                                                                        ? COLORS.primary
                                                                                        : COLORS.borderColor
                                                                                }
                                                                                bg={
                                                                                    isSelected
                                                                                        ? COLORS.primary
                                                                                        : 'transparent'
                                                                                }
                                                                                display="flex"
                                                                                alignItems="center"
                                                                                justifyContent="center"
                                                                                flexShrink={
                                                                                    0
                                                                                }
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
                                                                            <Text
                                                                                fontSize="14px"
                                                                                color={
                                                                                    COLORS.textPrimary
                                                                                }
                                                                            >
                                                                                {
                                                                                    option
                                                                                }
                                                                            </Text>
                                                                        </Flex>
                                                                    </Box>
                                                                );
                                                            }
                                                        )
                                                    ) : (
                                                        <Text
                                                            fontSize="12px"
                                                            color={
                                                                COLORS.textTertiary
                                                            }
                                                        >
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
                            onClick={handleSubmitFilterTags}
                        >
                            确定
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>
        </Box>
    );
}
