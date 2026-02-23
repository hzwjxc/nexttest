'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Container,
    Flex,
    Input,
    Text,
    Button,
    NativeSelectRoot,
    NativeSelectField,
    Table,
    Textarea,
} from '@chakra-ui/react';
import { Checkbox } from '@/app/_components/ui/checkbox';
import { DialogRoot, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogCloseTrigger } from '@/app/_components/ui/dialog';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';
import Pagination from '../../task-hall/components/Pagination';
import { ChevronDown, X } from 'lucide-react';
import useCustomToast from '@/app/hooks/useCustomToast';

// 设计系统颜色
const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    bgTertiary: '#F7F8FA',
    borderColor: '#E5E6EB',
};

export default function PointsDetailsPage() {
    const router = useRouter();
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [keyword, setKeyword] = useState('');
    const [type, setType] = useState<'ALL' | 'EARN' | 'WITHDRAW'>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [isRewardMenuOpen, setIsRewardMenuOpen] = useState(false);
    const rewardMenuRef = useRef<HTMLDivElement>(null);

    // 单人奖励弹窗
    const [isSingleRewardOpen, setIsSingleRewardOpen] = useState(false);
    const [singleRewardName, setSingleRewardName] = useState('');
    const [singleRewardPhone, setSingleRewardPhone] = useState('');
    const [singleRewardTask, setSingleRewardTask] = useState('');
    const [singleRewardPoints, setSingleRewardPoints] = useState('');
    const [singleRewardReason, setSingleRewardReason] = useState('');

    // 导入奖励弹窗
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 获取任务列表用于筛选
    const { data: tasksData } = api.taskPublish.list.useQuery({
        page: 1,
        pageSize: 100,
    });

    const taskOptions = tasksData?.data ?? [];

    // 获取积分明细数据
    const { data, isLoading, refetch } = api.workbench.getPointsDetails.useQuery({
        page: currentPage,
        pageSize,
        keyword: keyword || undefined,
        type,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        taskId: selectedTask || undefined,
    });

    const transactions = data?.data ?? [];
    const pagination = data?.pagination;
    const totalPages = pagination?.totalPages ?? 1;
    const totalItems = pagination?.total ?? 0;

    // 单人奖励mutation
    const addSingleRewardMutation = api.workbench.addSingleReward.useMutation({
        onSuccess: () => {
            showSuccessToast('奖励发放成功');
            setIsSingleRewardOpen(false);
            setSingleRewardPhone('');
            setSingleRewardPoints('');
            setSingleRewardReason('');
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 批量导入奖励mutation
    const importRewardsMutation = api.workbench.importRewards.useMutation({
        onSuccess: (result) => {
            showSuccessToast(result.message);
            setIsImportOpen(false);
            setImportText('');
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 关闭下拉菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (rewardMenuRef.current && !rewardMenuRef.current.contains(event.target as Node)) {
                setIsRewardMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 格式化日期时间
    const formatDateTime = (date: Date | string) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hour = String(d.getHours()).padStart(2, '0');
        const minute = String(d.getMinutes()).padStart(2, '0');
        const second = String(d.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    };

    // 全选/取消全选
    const handleSelectAll = () => {
        if (selectedItems.length === transactions.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(transactions.map((t: any) => t.id));
        }
    };

    // 单选
    const handleSelectItem = (id: string) => {
        setSelectedItems((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    // 重置筛选
    const handleReset = () => {
        setKeyword('');
        setType('ALL');
        setStartDate('');
        setEndDate('');
        setSelectedTask('');
        setCurrentPage(1);
    };

    // 处理单人奖励提交
    const handleSingleRewardSubmit = async () => {
        if (!singleRewardPhone || !singleRewardPoints) {
            showErrorToast('请填写手机号和奖励积分');
            return;
        }

        addSingleRewardMutation.mutate({
            name: singleRewardName || undefined,
            phone: singleRewardPhone,
            taskId: singleRewardTask || undefined,
            points: parseFloat(singleRewardPoints),
            reason: singleRewardReason || undefined,
        });
    };

    // 处理导入奖励提交
    const handleImportSubmit = () => {
        if (!importText.trim()) {
            showErrorToast('请输入奖励数据');
            return;
        }

        try {
            const lines = importText.trim().split('\n');
            const rewards = lines
                .filter(line => line.trim() && !line.startsWith('手机号')) // 过滤空行和标题行
                .map(line => {
                    const parts = line.split(',').map(p => p.trim());
                    if (parts.length < 2) {
                        throw new Error(`数据格式不正确：${line}`);
                    }
                    return {
                        phone: parts[0]!,
                        points: parseFloat(parts[1]!),
                        reason: parts[2] || undefined, // 原因可选，没有则为undefined
                    };
                });

            if (rewards.length === 0) {
                showErrorToast('没有有效的奖励数据');
                return;
            }

            importRewardsMutation.mutate({ rewards });
        } catch (error) {
            showErrorToast(error instanceof Error ? error.message : '数据格式不正确');
        }
    };

    // 处理文件上传
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setImportText(text);
        };
        reader.readAsText(file);
    };

    // 下载模板
    const handleDownloadTemplate = () => {
        const template = `手机号,积分,原因(可选)
13800138000,100,优秀表现奖励
13900139000,50,`;

        const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '奖励导入模板.csv';
        link.click();
        setIsRewardMenuOpen(false);
    };

    // 导出数据
    const handleExport = () => {
        if (transactions.length === 0) {
            showErrorToast('暂无数据可导出');
            return;
        }

        const headers = '序号,发放积分,姓名,手机号码,所属任务,交易时间,奖励类型,订单编号\n';
        const rows = transactions.map((item: any, index: number) => {
            return `${index + 1},${item.points.toFixed(2)},${item.userName},${item.phoneNumber},${item.taskTitle},${formatDateTime(item.createdAt)},${item.typeName},${item.orderId || '-'}`;
        }).join('\n');

        const csv = headers + rows;
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `积分明细_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <Box minH="calc(100vh - 72px)" bg={COLORS.bgTertiary}>
            <Container maxW="1400px" py={6}>
                {/* 顶部返回导航 */}
                <Flex align="center" mb={4}>
                    <Button
                        px={0}
                        variant="ghost"
                        onClick={() => router.push('/crowdsource/workbench')}
                        fontSize="14px"
                        color={COLORS.textSecondary}
                        _hover={{ color: COLORS.primary }}
                    >
                        工作台
                    </Button>
                    <Text mx={2} color={COLORS.textTertiary}>/</Text>
                    <Text fontSize="14px" color={COLORS.textPrimary} fontWeight="500">
                        积分明细
                    </Text>
                </Flex>

                {/* 筛选区域 */}
                <Box bg={COLORS.bgPrimary} borderRadius="8px" p={4} mb={4} boxShadow="0 1px 2px rgba(0,0,0,0.05)">
                    <Flex gap={4} mb={4} flexWrap="wrap">
                        {/* 开始时间选择 */}
                        <Box flex="1" minW="200px">
                            <Text fontSize="14px" color={COLORS.textSecondary} mb={2}>
                                开始时间
                            </Text>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setCurrentPage(1);
                                }}
                                size="md"
                                borderColor={COLORS.borderColor}
                                borderRadius="4px"
                                fontSize="14px"
                                _focus={{
                                    borderColor: COLORS.primary,
                                    boxShadow: `0 0 0 1px ${COLORS.primary}`,
                                }}
                            />
                        </Box>

                        {/* 结束时间选择 */}
                        <Box flex="1" minW="200px">
                            <Text fontSize="14px" color={COLORS.textSecondary} mb={2}>
                                结束时间
                            </Text>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setCurrentPage(1);
                                }}
                                size="md"
                                borderColor={COLORS.borderColor}
                                borderRadius="4px"
                                fontSize="14px"
                                _focus={{
                                    borderColor: COLORS.primary,
                                    boxShadow: `0 0 0 1px ${COLORS.primary}`,
                                }}
                            />
                        </Box>

                        {/* 所属任务筛选 */}
                        <Box flex="1" minW="200px">
                            <Text fontSize="14px" color={COLORS.textSecondary} mb={2}>
                                所属任务
                            </Text>
                            <NativeSelectRoot size="md">
                                <NativeSelectField
                                    value={selectedTask}
                                    onChange={(e) => {
                                        setSelectedTask(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    borderColor={COLORS.borderColor}
                                    borderRadius="4px"
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                    _focus={{
                                        borderColor: COLORS.primary,
                                        boxShadow: `0 0 0 1px ${COLORS.primary}`,
                                    }}
                                >
                                    <option value="">全部</option>
                                    {taskOptions.map((task: any) => (
                                        <option key={task.id} value={task.id}>
                                            {task.title}
                                        </option>
                                    ))}
                                </NativeSelectField>
                            </NativeSelectRoot>
                        </Box>

                        {/* 手机号码搜索 */}
                        <Box flex="1" minW="200px">
                            <Text fontSize="14px" color={COLORS.textSecondary} mb={2}>
                                手机号码
                            </Text>
                            <Input
                                placeholder="请输入"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                size="md"
                                borderColor={COLORS.borderColor}
                                borderRadius="4px"
                                fontSize="14px"
                                _placeholder={{ color: COLORS.textTertiary }}
                                _focus={{
                                    borderColor: COLORS.primary,
                                    boxShadow: `0 0 0 1px ${COLORS.primary}`,
                                }}
                            />
                        </Box>
                    </Flex>

                    <Flex justifyContent="space-between">
                        <Flex gap={2}>
                            {/* 搜索按钮 */}
                            <Button
                                bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                                color="white"
                                fontSize="14px"
                                fontWeight="500"
                                borderRadius="4px"
                                h="36px"
                                px={6}
                                onClick={() => setCurrentPage(1)}
                                _hover={{
                                    opacity: 0.9,
                                }}
                            >
                                搜索
                            </Button>

                            {/* 重置按钮 */}
                            <Button
                                variant="outline"
                                borderColor={COLORS.borderColor}
                                color={COLORS.textSecondary}
                                fontSize="14px"
                                fontWeight="500"
                                borderRadius="4px"
                                h="36px"
                                px={6}
                                onClick={handleReset}
                                _hover={{
                                    borderColor: COLORS.primary,
                                    color: COLORS.primary,
                                }}
                            >
                                重置
                            </Button>

                            {/* 导出按钮 */}
                            <Button
                                variant="outline"
                                borderColor={COLORS.borderColor}
                                color={COLORS.textSecondary}
                                fontSize="14px"
                                fontWeight="500"
                                borderRadius="4px"
                                h="36px"
                                px={6}
                                onClick={handleExport}
                                _hover={{
                                    borderColor: COLORS.primary,
                                    color: COLORS.primary,
                                }}
                            >
                                导出
                            </Button>
                        </Flex>

                        {/* 补充奖励按钮区域 */}
                        <Flex justify="flex-end" mb={4}>
                            <Box position="relative" ref={rewardMenuRef}>
                                <Button
                                    bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                                    color="white"
                                    fontSize="14px"
                                    fontWeight="500"
                                    borderRadius="20px"
                                    h="40px"
                                    px={8}
                                    onClick={() => setIsRewardMenuOpen(!isRewardMenuOpen)}
                                    _hover={{
                                        opacity: 0.9,
                                    }}
                                >
                                    <Flex align="center" gap={2}>
                                        <Text>补充奖励</Text>
                                        <ChevronDown size={16} />
                                    </Flex>
                                </Button>

                                {/* 下拉菜单 */}
                                {isRewardMenuOpen && (
                                    <Box
                                        position="absolute"
                                        top="100%"
                                        right={0}
                                        mt={2}
                                        bg="white"
                                        borderRadius="8px"
                                        boxShadow="0 4px 12px rgba(0,0,0,0.15)"
                                        zIndex={10}
                                        minW="160px"
                                        overflow="hidden"
                                    >
                                        <Box
                                            px={4}
                                            py={3}
                                            cursor="pointer"
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                            _hover={{ bg: COLORS.bgSecondary }}
                                            onClick={() => {
                                                setIsRewardMenuOpen(false);
                                                setIsSingleRewardOpen(true);
                                            }}
                                        >
                                            单人奖励
                                        </Box>
                                        <Box
                                            px={4}
                                            py={3}
                                            cursor="pointer"
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                            _hover={{ bg: COLORS.bgSecondary }}
                                            onClick={() => {
                                                setIsRewardMenuOpen(false);
                                                setIsImportOpen(true);
                                            }}
                                        >
                                            导入奖励名单
                                        </Box>
                                        <Box
                                            px={4}
                                            py={3}
                                            cursor="pointer"
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                            _hover={{ bg: COLORS.bgSecondary }}
                                            onClick={handleDownloadTemplate}
                                        >
                                            下载奖励模板
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Flex>
                    </Flex>
                </Box>

                {/* 表格 */}
                <Box bg={COLORS.bgPrimary} borderRadius="8px" overflow="hidden" boxShadow="0 1px 2px rgba(0,0,0,0.05)">
                    {isLoading ? (
                        <Box textAlign="center" py={8}>
                            <Text color={COLORS.textTertiary}>加载中...</Text>
                        </Box>
                    ) : (
                        <Table.Root size="sm" variant="outline">
                            <Table.Header>
                                <Table.Row bg={COLORS.bgSecondary}>
                                    <Table.ColumnHeader w="60px" textAlign="center">
                                        <Checkbox
                                            checked={
                                                transactions.length > 0 &&
                                                selectedItems.length === transactions.length
                                            }
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader w="80px" textAlign="center">
                                        <Text fontSize="14px" color={COLORS.textTertiary} fontWeight="400">
                                            序号
                                        </Text>
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader w="120px" textAlign="center">
                                        <Text fontSize="14px" color={COLORS.textTertiary} fontWeight="400">
                                            发放积分
                                        </Text>
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader w="120px" textAlign="center">
                                        <Text fontSize="14px" color={COLORS.textTertiary} fontWeight="400">
                                            姓名
                                        </Text>
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader w="150px" textAlign="center">
                                        <Text fontSize="14px" color={COLORS.textTertiary} fontWeight="400">
                                            手机号码
                                        </Text>
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader textAlign="center">
                                        <Text fontSize="14px" color={COLORS.textTertiary} fontWeight="400">
                                            所属任务
                                        </Text>
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader w="180px" textAlign="center">
                                        <Text fontSize="14px" color={COLORS.textTertiary} fontWeight="400">
                                            交易时间
                                        </Text>
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader w="120px" textAlign="center">
                                        <Text fontSize="14px" color={COLORS.textTertiary} fontWeight="400">
                                            奖励类型
                                        </Text>
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader w="180px" textAlign="center">
                                        <Text fontSize="14px" color={COLORS.textTertiary} fontWeight="400">
                                            订单编号
                                        </Text>
                                    </Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {transactions.length > 0 ? (
                                    transactions.map((item: any, index: number) => (
                                        <Table.Row
                                            key={item.id}
                                            borderBottom="1px solid"
                                            borderColor={COLORS.borderColor}
                                            _hover={{ bg: COLORS.bgTertiary }}
                                        >
                                            <Table.Cell textAlign="center">
                                                <Checkbox
                                                    checked={selectedItems.includes(item.id)}
                                                    onCheckedChange={() => handleSelectItem(item.id)}
                                                />
                                            </Table.Cell>
                                            <Table.Cell textAlign="center">
                                                <Text fontSize="14px" color={COLORS.textPrimary}>
                                                    {(currentPage - 1) * pageSize + index + 1}
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell textAlign="center">
                                                <Text fontSize="14px" color={COLORS.textPrimary}>
                                                    {item.points.toFixed(2)}
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell textAlign="center">
                                                <Text fontSize="14px" color={COLORS.textPrimary}>
                                                    {item.userName}
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell textAlign="center">
                                                <Text fontSize="14px" color={COLORS.textPrimary}>
                                                    {item.phoneNumber}
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell textAlign="center">
                                                <Text fontSize="14px" color={COLORS.textPrimary}>
                                                    {item.taskTitle}
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell textAlign="center">
                                                <Text fontSize="14px" color={COLORS.textPrimary}>
                                                    {formatDateTime(item.createdAt)}
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell textAlign="center">
                                                <Text fontSize="14px" color={COLORS.textPrimary}>
                                                    {item.typeName}
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell textAlign="center">
                                                <Text fontSize="14px" color={COLORS.textPrimary}>
                                                    {item.orderId || '-'}
                                                </Text>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))
                                ) : (
                                    <Table.Row>
                                        <Table.Cell colSpan={9} textAlign="center" py={8}>
                                            <Text color={COLORS.textTertiary}>暂无数据</Text>
                                        </Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table.Root>
                    )}
                </Box>

                {/* 分页 */}
                {totalItems > 0 && (
                    <Box mt={4}>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            onPageChange={setCurrentPage}
                        />
                        <Flex justify="flex-end" mt={2}>
                            <NativeSelectRoot size="sm" w="120px">
                                <NativeSelectField
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(parseInt(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    borderColor={COLORS.borderColor}
                                    borderRadius="4px"
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                >
                                    <option value={10}>10条/页</option>
                                    <option value={20}>20条/页</option>
                                    <option value={50}>50条/页</option>
                                </NativeSelectField>
                            </NativeSelectRoot>
                        </Flex>
                    </Box>
                )}
            </Container>

            {/* 单人奖励弹窗 */}
            <DialogRoot open={isSingleRewardOpen} onOpenChange={(e) => setIsSingleRewardOpen(e.open)}>
                <DialogContent maxW="600px">
                    <DialogHeader>
                        <Text fontSize="18px" fontWeight="600" color={COLORS.textPrimary}>
                            补充奖励
                        </Text>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody>
                        <Flex direction="column" gap={4}>
                            {/* 姓名 */}
                            <Box>
                                <Text fontSize="14px" color={COLORS.textSecondary} mb={2}>
                                    姓名
                                </Text>
                                <Input
                                    placeholder="请输入姓名"
                                    value={singleRewardName}
                                    onChange={(e) => setSingleRewardName(e.target.value)}
                                    size="md"
                                    borderColor={COLORS.borderColor}
                                    _focus={{
                                        borderColor: COLORS.primary,
                                        boxShadow: `0 0 0 1px ${COLORS.primary}`,
                                    }}
                                />
                            </Box>
                            {/* 手机 */}
                            <Box>
                                <Text fontSize="14px" color={COLORS.textSecondary} mb={2}>
                                    手机
                                </Text>
                                <Input
                                    placeholder="请输入手机号码"
                                    value={singleRewardPhone}
                                    onChange={(e) => setSingleRewardPhone(e.target.value)}
                                    size="md"
                                    borderColor={COLORS.borderColor}
                                    _focus={{
                                        borderColor: COLORS.primary,
                                        boxShadow: `0 0 0 1px ${COLORS.primary}`,
                                    }}
                                />
                            </Box>
                            {/* 任务名称 */}
                            <Box>
                                <Text fontSize="14px" color={COLORS.textSecondary} mb={2}>
                                    任务名称
                                </Text>
                                <NativeSelectRoot size="md">
                                    <NativeSelectField
                                        value={singleRewardTask}
                                        onChange={(e) => setSingleRewardTask(e.target.value)}
                                        borderColor={COLORS.borderColor}
                                        borderRadius="4px"
                                        fontSize="14px"
                                        color={COLORS.textPrimary}
                                        _focus={{
                                            borderColor: COLORS.primary,
                                            boxShadow: `0 0 0 1px ${COLORS.primary}`,
                                        }}
                                    >
                                        <option value="">请选择任务</option>
                                        {taskOptions.map((task: any) => (
                                            <option key={task.id} value={task.id}>
                                                {task.title}
                                            </option>
                                        ))}
                                    </NativeSelectField>
                                </NativeSelectRoot>
                            </Box>
                            {/* 奖励积分 */}
                            <Box>
                                <Text fontSize="14px" color={COLORS.textSecondary} mb={2}>
                                    奖励积分
                                </Text>
                                <Input
                                    type="number"
                                    placeholder="请输入奖励积分"
                                    value={singleRewardPoints}
                                    onChange={(e) => setSingleRewardPoints(e.target.value)}
                                    size="md"
                                    borderColor={COLORS.borderColor}
                                    _focus={{
                                        borderColor: COLORS.primary,
                                        boxShadow: `0 0 0 1px ${COLORS.primary}`,
                                    }}
                                />
                            </Box>
                            {/* 备注 */}
                            <Box>
                                <Text fontSize="14px" color={COLORS.textSecondary} mb={2}>
                                    备注
                                </Text>
                                <Textarea
                                    placeholder="请输入备注信息"
                                    value={singleRewardReason}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value.length <= 200) {
                                            setSingleRewardReason(value);
                                        }
                                    }}
                                    rows={3}
                                    borderColor={COLORS.borderColor}
                                    _focus={{
                                        borderColor: COLORS.primary,
                                        boxShadow: `0 0 0 1px ${COLORS.primary}`,
                                    }}
                                />
                                <Text fontSize="12px" color={COLORS.textTertiary} mt={1} textAlign="right">
                                    {singleRewardReason.length}/200
                                </Text>
                            </Box>
                        </Flex>
                    </DialogBody>
                    <DialogFooter>
                        <Flex gap={2} w="100%" justify="flex-end">
                            <Button
                                variant="outline"
                                onClick={() => setIsSingleRewardOpen(false)}
                                borderColor={COLORS.borderColor}
                                color={COLORS.textSecondary}
                                fontSize="14px"
                                px={6}
                                _hover={{
                                    borderColor: COLORS.primary,
                                    color: COLORS.primary,
                                }}
                            >
                                取消
                            </Button>
                            <Button
                                bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                                color="white"
                                fontSize="14px"
                                px={6}
                                onClick={handleSingleRewardSubmit}
                                loading={addSingleRewardMutation.isPending}
                                _hover={{ opacity: 0.9 }}
                            >
                                确认
                            </Button>
                        </Flex>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>

            {/* 导入奖励名单弹窗 */}
            <DialogRoot open={isImportOpen} onOpenChange={(e) => setIsImportOpen(e.open)} size="lg">
                <DialogContent>
                    <DialogHeader>
                        <Text fontSize="18px" fontWeight="600" color={COLORS.textPrimary}>
                            导入奖励名单
                        </Text>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody>
                        <Flex direction="column" gap={4}>
                            <Box>
                                <Text fontSize="14px" color={COLORS.textSecondary} mb={2}>
                                    数据格式：手机号,积分,原因（每行一条记录）
                                </Text>
                                <Textarea
                                    placeholder="示例：13800138000,100,优秀表现奖励"
                                    value={importText}
                                    onChange={(e) => setImportText(e.target.value)}
                                    rows={8}
                                    borderColor={COLORS.borderColor}
                                    fontFamily="monospace"
                                    fontSize="13px"
                                    _focus={{
                                        borderColor: COLORS.primary,
                                        boxShadow: `0 0 0 1px ${COLORS.primary}`,
                                    }}
                                />
                            </Box>
                            <Box>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={handleFileUpload}
                                    style={{ display: 'none' }}
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    borderColor={COLORS.borderColor}
                                    color={COLORS.textSecondary}
                                    fontSize="14px"
                                    _hover={{
                                        borderColor: COLORS.primary,
                                        color: COLORS.primary,
                                    }}
                                >
                                    选择文件
                                </Button>
                            </Box>
                        </Flex>
                    </DialogBody>
                    <DialogFooter>
                        <Flex gap={2} w="100%" justify="flex-end">
                            <Button
                                variant="outline"
                                onClick={() => setIsImportOpen(false)}
                                borderColor={COLORS.borderColor}
                                color={COLORS.textSecondary}
                                _hover={{
                                    borderColor: COLORS.primary,
                                    color: COLORS.primary,
                                }}
                            >
                                取消
                            </Button>
                            <Button
                                bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                                color="white"
                                onClick={handleImportSubmit}
                                loading={importRewardsMutation.isPending}
                                _hover={{ opacity: 0.9 }}
                            >
                                确定导入
                            </Button>
                        </Flex>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>
        </Box>
    );
}
