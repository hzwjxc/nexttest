'use client';

import {
    Box,
    Container,
    Flex,
    Text,
    Button,
    Input,
    VStack,
    Grid,
    HStack,
    Image,
    Link,
    Icon,
    useDisclosure,
    Center,
    DialogRoot,
    DialogBackdrop,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogCloseTrigger,
    Spinner,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react';
import { useState, useMemo } from 'react';
import { Checkbox } from '@/app/_components/ui/checkbox';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Download, Bug, Play } from 'lucide-react';
import { LuX, LuDownload, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { api } from '@/trpc/react';
import * as XLSX from 'xlsx';
import { toaster } from '@/app/_components/ui/toaster';

// 圆环图组件
function CircleChart({
    data,
}: {
    data: { label: string; value: number; color: string }[];
}) {
    return (
        <Box position="relative" w="180px" h="180px">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                style={{
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                }}
                            />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
            <VStack
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                gap={0}
                pointerEvents="none"
            >
                {data.map((item, index) => (
                    <Flex key={index} align="center" gap={1}>
                        <Box
                            w="6px"
                            h="6px"
                            borderRadius="full"
                            bg={item.color}
                        />
                        <Text fontSize="10px" color="#4E5969">
                            {item.label} {item.value}%
                        </Text>
                    </Flex>
                ))}
            </VStack>
        </Box>
    );
}

interface Attachment {
    id: string;
    url: string;
    isVideo?: boolean;
}

export default function DefectManagement() {
    // 筛选条件状态
    const [searchText, setSearchText] = useState('');
    const [taskFilter, setTaskFilter] = useState('');
    const [testCaseFilter, setTestCaseFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // 分页状态
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // UI状态
    const [selectedDefects, setSelectedDefects] = useState<string[]>([]);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewType, setPreviewType] = useState<'image' | 'video' | null>(
        null
    );
    const {
        open: isPreviewOpen,
        onOpen: onPreviewOpen,
        onClose: onPreviewClose,
    } = useDisclosure();
    const {
        open: isStepsOpen,
        onOpen: onStepsOpen,
        onClose: onStepsClose,
    } = useDisclosure();
    const [currentSteps, setCurrentSteps] = useState<string[]>([]);

    // 获取任务列表
    const { data: tasksData } = api.taskPublish.list.useQuery({
        page: 1,
        pageSize: 100,
    });

    // 获取所有用例列表（不依赖任务筛选）
    const { data: allTestCasesData } = api.testCase.list.useQuery({
        page: 1,
        pageSize: 100, // API限制最大100
    });

    // 获取当前任务的用例列表（如果选择了任务）
    const { data: taskTestCasesData } = api.review.getTaskTestCases.useQuery(
        {
            taskId: taskFilter,
            page: 1,
            pageSize: 100,
        },
        {
            enabled: !!taskFilter,
        }
    );

    // 根据是否选择任务来决定显示哪个用例列表
    const testCasesData = taskFilter ? taskTestCasesData : allTestCasesData;

    // 获取数据字典
    const { data: defectSeverityDict } =
        api.dataDictionary.getByCode.useQuery('DEFECT_SEVERITY');
    const { data: suggestionLevelDict } =
        api.dataDictionary.getByCode.useQuery('SUGGESTION_LEVEL');

    // 获取缺陷列表 - 默认查询所有任务的缺陷
    const {
        data: defectsData,
        isLoading: isLoadingDefects,
        refetch: refetchDefects,
    } = api.review.getTaskDefects.useQuery({
        taskId: taskFilter || '', // 空字符串表示查询所有任务
        page: currentPage,
        pageSize: pageSize,
        type: typeFilter as any,
        status: statusFilter as any,
        testCaseId: testCaseFilter,
        keyword: searchText,
    });

    // 获取实际的缺陷列表数据
    const defects = defectsData?.data || [];
    const pagination = defectsData?.pagination;
    const totalItems = pagination?.total || 0;
    const totalPages = pagination?.totalPages || 0;

    // 分页辅助函数
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 4) {
                pages.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(
                    1,
                    '...',
                    totalPages - 4,
                    totalPages - 3,
                    totalPages - 2,
                    totalPages - 1,
                    totalPages
                );
            } else {
                pages.push(
                    1,
                    '...',
                    currentPage - 1,
                    currentPage,
                    currentPage + 1,
                    '...',
                    totalPages
                );
            }
        }
        return pages;
    };

    // 计算统计数据
    const statistics = useMemo(() => {
        if (!defects.length) {
            return {
                typeDistribution: [
                    { label: '建议', value: 50, color: '#14c9c9' },
                    { label: '缺陷', value: 50, color: '#165dff' },
                ],
                severityDistribution: [
                    { label: '示例', value: 100, color: '#165dff' },
                ],
                statusDistribution: [
                    { label: '待解决', value: 100, color: '#165dff' },
                ],
                platformDistribution: [
                    { label: 'iOS', value: 50, color: '#F7BA1E' },
                    { label: 'Android', value: 50, color: '#86DF6C' },
                ],
            };
        }

        const total = defects.length;
        const bugCount = defects.filter((d: any) => d.type === 'BUG').length;
        const suggestionCount = defects.filter(
            (d: any) => d.type === 'SUGGESTION'
        ).length;

        return {
            typeDistribution: [
                {
                    label: '建议',
                    value: total
                        ? Math.round((suggestionCount / total) * 100)
                        : 0,
                    color: '#14c9c9',
                },
                {
                    label: '缺陷',
                    value: total ? Math.round((bugCount / total) * 100) : 0,
                    color: '#165dff',
                },
            ],
            severityDistribution: [
                { label: '一般', value: 40, color: '#165dff' },
                { label: '严重', value: 30, color: '#ff7d00' },
                { label: '致命', value: 30, color: '#d91ad9' },
            ],
            statusDistribution: [
                { label: '待解决', value: 40, color: '#165dff' },
                { label: '已解决', value: 30, color: '#14c9c9' },
                { label: '已忽略', value: 30, color: '#722ed1' },
            ],
            platformDistribution: [
                { label: 'iOS', value: 40, color: '#F7BA1E' },
                { label: 'Android', value: 60, color: '#86DF6C' },
            ],
        };
    }, [defects]);

    // 辅助函数
    function getStatusLabel(status: string): string {
        const statusMap: Record<string, string> = {
            SUBMITTED: '待解决',
            REVIEWING: '判定中',
            TO_CONFIRM: '待确认',
            APPROVED: '已通过',
            REJECTED: '无效',
            DUPLICATE: '重复',
            CLOSED: '已关闭',
        };
        return statusMap[status] || status;
    }

    // 获取 Badge 显示文本（状态或等级）
    function getBadgeText(defect: any): string {
        // 只有在 APPROVED 状态下才显示等级
        if (defect.status === 'APPROVED') {
            return getSeverityLabel(defect);
        }
        // 其他状态显示流程状态
        return getStatusLabel(defect.status);
    }

    function getSeverityLabel(defect: any): string {
        if (defect.type === 'BUG' && defect.severity) {
            return (
                defectSeverityDict?.items?.find(
                    (i: any) => i.code === defect.severity
                )?.label || defect.severity
            );
        }
        if (defect.type === 'SUGGESTION' && defect.suggestionLevel) {
            return (
                suggestionLevelDict?.items?.find(
                    (i: any) => i.code === defect.suggestionLevel
                )?.label || defect.suggestionLevel
            );
        }
        // 如果没有等级但有类型，显示"未判定"
        if (defect.type === 'BUG' || defect.type === 'SUGGESTION') {
            return '未判定';
        }
        return '-';
    }

    function getSeverityBadgeStyle(defect: any): { bg: string; color: string } {
        // 只有在 APPROVED 状态下才显示等级的颜色
        if (defect.status === 'APPROVED') {
            if (defect.type === 'BUG' && defect.severity) {
                const colorMap: Record<string, { bg: string; color: string }> = {
                    CRITICAL: { bg: 'rgba(227, 20, 36, 0.1)', color: '#E31424' },
                    MAJOR: { bg: 'rgba(227, 20, 36, 0.1)', color: '#D54531' },
                    MINOR: { bg: 'rgba(255, 125, 0, 0.1)', color: '#F77234' },
                    TRIVIAL: { bg: 'rgba(255, 237, 232, 1)', color: '#F77234' },
                };
                return (
                    colorMap[defect.severity] || {
                        bg: 'rgba(255, 125, 0, 0.1)',
                        color: '#F77234',
                    }
                );
            } else if (defect.type === 'SUGGESTION' && defect.suggestionLevel) {
                return { bg: 'rgba(0, 180, 42, 0.1)', color: '#3AB385' };
            } else {
                // APPROVED 状态但没有等级，显示"未判定"
                return { bg: '#FFF7E6', color: '#FF8800' };
            }
        }
        // 非 APPROVED 状态，显示状态的颜色
        if (defect.status === 'REVIEWING') {
            return { bg: 'rgba(22, 93, 255, 0.1)', color: '#2067F6' };
        }
        if (defect.status === 'TO_CONFIRM') {
            return { bg: 'rgba(255, 125, 0, 0.1)', color: '#FF7D00' };
        }
        if (defect.status === 'REJECTED') {
            return { bg: 'rgba(134, 144, 156, 0.1)', color: '#86909C' };
        }
        if (defect.status === 'DUPLICATE') {
            return { bg: 'rgba(134, 144, 156, 0.1)', color: '#86909C' };
        }
        if (defect.status === 'CLOSED') {
            return { bg: 'rgba(134, 144, 156, 0.1)', color: '#86909C' };
        }
        // 默认样式（SUBMITTED 等）
        return { bg: '#FFF7E6', color: '#FF8800' };
    }

    // 处理选择
    const handleSelectDefect = (id: string) => {
        if (selectedDefects.includes(id)) {
            setSelectedDefects(
                selectedDefects.filter((defectId) => defectId !== id)
            );
        } else {
            setSelectedDefects([...selectedDefects, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedDefects.length === defects.length && defects.length > 0) {
            setSelectedDefects([]);
        } else {
            setSelectedDefects(defects.map((d: any) => d.id));
        }
    };

    // 处理查询
    const handleSearch = () => {
        setCurrentPage(1);
        void refetchDefects();
    };

    // 处理批量导出
    const handleBatchExport = () => {
        if (selectedDefects.length === 0) {
            toaster.create({
                title: '请至少选择一个缺陷',
                type: 'error',
                duration: 3000,
            });
            return;
        }

        const exportDefects = defects.filter((d: any) =>
            selectedDefects.includes(d.id)
        );

        const exportData = exportDefects.map((defect: any) => ({
            缺陷编号: defect.id,
            标题: defect.title,
            描述: defect.description,
            类型: defect.type === 'BUG' ? '缺陷' : '建议',
            状态: getStatusLabel(defect.status),
            等级: getSeverityLabel(defect),
            等级积分: defect.basePoints || 0,
            实际积分: defect.earnedPoints || 0,
            所属用例: defect.testCase?.title || '-',
            审核意见: defect.reviewComment || '-',
            提交人: defect.user?.name || '-',
            提交时间: new Date(defect.createdAt).toLocaleString('zh-CN'),
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        XLSX.utils.book_append_sheet(workbook, worksheet, '缺陷列表');

        const fileName = `缺陷导出_${new Date().toLocaleDateString()}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        toaster.create({
            title: '导出成功',
            type: 'success',
            duration: 3000,
        });
    };

    // 处理附件预览
    const handlePreview = (attachment: Attachment) => {
        setPreviewUrl(attachment.url);
        setPreviewType(attachment.isVideo ? 'video' : 'image');
        onPreviewOpen();
    };

    // 处理查看详细步骤
    const handleViewSteps = (steps: string[]) => {
        setCurrentSteps(steps);
        onStepsOpen();
    };

    // 处理全部下载
    const handleDownloadAll = async (attachments: Attachment[]) => {
        if (!attachments || attachments.length === 0) {
            toaster.create({
                title: '没有可下载的附件',
                type: 'warning',
                duration: 3000,
            });
            return;
        }

        for (const attachment of attachments) {
            try {
                const response = await fetch(attachment.url);
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = attachment.url.split('/').pop() || 'download';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
                // Add delay to avoid browser blocking multiple downloads
                await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (error) {
                console.error('Download failed:', error);
                toaster.create({
                    title: '下载失败',
                    type: 'error',
                    duration: 3000,
                });
            }
        }
    };

    return (
        <Box minH="100vh" bg="#F7F8FA">
            <Container maxW="1400px" py={6}>
                {/* 顶部统计图表 */}
                <Grid templateColumns="repeat(4, 1fr)" gap={4} mb={6}>
                    <Box
                        bg="white"
                        borderRadius="lg"
                        p={4}
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <CircleChart data={statistics.typeDistribution} />
                    </Box>
                    <Box
                        bg="white"
                        borderRadius="lg"
                        p={4}
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <CircleChart data={statistics.severityDistribution} />
                    </Box>
                    <Box
                        bg="white"
                        borderRadius="lg"
                        p={4}
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <CircleChart data={statistics.statusDistribution} />
                    </Box>
                    <Box
                        bg="white"
                        borderRadius="lg"
                        p={4}
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <CircleChart data={statistics.platformDistribution} />
                    </Box>
                </Grid>

                {/* 筛选栏 */}
                <Box bg="white" borderRadius="lg" p={4} mb={4}>
                    <Flex gap={3} wrap="wrap" align="center">
                        <Checkbox
                            checked={
                                selectedDefects.length === defects.length &&
                                defects.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                        >
                            全选
                        </Checkbox>
                        <NativeSelectRoot w="150px" size="sm">
                            <NativeSelectField
                                placeholder="所属任务"
                                value={taskFilter}
                                onChange={(e) => setTaskFilter(e.target.value)}
                                bg="white"
                                borderColor="#E5E6EB"
                            >
                                <option value="">全部任务</option>
                                {tasksData?.data?.map((task: any) => (
                                    <option key={task.id} value={task.id}>
                                        {task.title}
                                    </option>
                                ))}
                            </NativeSelectField>
                        </NativeSelectRoot>
                        <NativeSelectRoot w="150px" size="sm">
                            <NativeSelectField
                                placeholder="所属用例"
                                value={testCaseFilter}
                                onChange={(e) =>
                                    setTestCaseFilter(e.target.value)
                                }
                                bg="white"
                                borderColor="#E5E6EB"
                            >
                                <option value="">全部用例</option>
                                {testCasesData?.data
                                    ?.filter(
                                        (tc: any) => tc.title || tc.caseName
                                    )
                                    ?.map((testCase: any) => (
                                        <option
                                            key={testCase.id}
                                            value={testCase.id}
                                        >
                                            {testCase.title ||
                                                testCase.caseName}
                                        </option>
                                    ))}
                            </NativeSelectField>
                        </NativeSelectRoot>
                        <NativeSelectRoot w="150px" size="sm">
                            <NativeSelectField
                                placeholder="缺陷类型"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                bg="white"
                                borderColor="#E5E6EB"
                            >
                                <option value="">全部类型</option>
                                <option value="BUG">缺陷</option>
                                <option value="SUGGESTION">建议</option>
                            </NativeSelectField>
                        </NativeSelectRoot>
                        <NativeSelectRoot w="150px" size="sm">
                            <NativeSelectField
                                placeholder="缺陷状态"
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                                bg="white"
                                borderColor="#E5E6EB"
                            >
                                <option value="">全部状态</option>
                                <option value="SUBMITTED">已提交</option>
                                <option value="REVIEWING">判定中</option>
                                <option value="APPROVED">已通过</option>
                                <option value="REJECTED">无效</option>
                            </NativeSelectField>
                        </NativeSelectRoot>
                        <Input
                            placeholder="缺陷标题、编号或描述"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            size="sm"
                            w="200px"
                            bg="white"
                            borderColor="#E5E6EB"
                        />
                        <Button
                            size="sm"
                            bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                            color="white"
                            _hover={{ opacity: 0.9 }}
                            onClick={handleSearch}
                        >
                            查询
                        </Button>
                        <Button
                            size="sm"
                            bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                            color="white"
                            _hover={{ opacity: 0.9 }}
                            onClick={handleBatchExport}
                            disabled={selectedDefects.length === 0}
                        >
                            批量导出
                        </Button>
                    </Flex>
                </Box>

                {/* 缺陷列表 */}
                {isLoadingDefects ? (
                    <Center py={10}>
                        <Spinner size="xl" color="#ff9266" />
                    </Center>
                ) : defects.length === 0 ? (
                    <Center py={10} bg="white" borderRadius="lg">
                        <Text color="gray.500">暂无缺陷数据</Text>
                    </Center>
                ) : (
                    <VStack gap={4} align="stretch">
                        {defects.map((defect: any, index: number) => {
                            // 安全解析附件数据
                            let attachments: Attachment[] = [];
                            try {
                                if (
                                    defect.attachments &&
                                    typeof defect.attachments === 'string'
                                ) {
                                    const parsed = JSON.parse(
                                        defect.attachments
                                    );
                                    attachments = Array.isArray(parsed)
                                        ? parsed.map(
                                            (url: string, idx: number) => ({
                                                id: `${defect.id}-${idx}`,
                                                url,
                                                isVideo:
                                                    url.endsWith('.mp4') ||
                                                    url.endsWith('.mov') ||
                                                    url.endsWith('.avi'),
                                            })
                                        )
                                        : [];
                                } else if (Array.isArray(defect.attachments)) {
                                    // 如果已经是数组,直接使用
                                    attachments = defect.attachments.map(
                                        (url: string, idx: number) => ({
                                            id: `${defect.id}-${idx}`,
                                            url,
                                            isVideo:
                                                url.endsWith('.mp4') ||
                                                url.endsWith('.mov') ||
                                                url.endsWith('.avi'),
                                        })
                                    );
                                }
                            } catch (e) {
                                console.error(
                                    '解析附件数据失败:',
                                    e,
                                    defect.attachments
                                );
                            }

                            // 安全解析步骤数据
                            let steps: string[] = [];
                            try {
                                if (defect.steps) {
                                    if (typeof defect.steps === 'string') {
                                        steps = defect.steps
                                            .split(',')
                                            .filter((s: string) => s.trim());
                                    } else if (Array.isArray(defect.steps)) {
                                        steps = defect.steps;
                                    }
                                }
                            } catch (e) {
                                console.error(
                                    '解析步骤数据失败:',
                                    e,
                                    defect.steps
                                );
                            }

                            const badgeStyle = getSeverityBadgeStyle(defect);

                            return (
                                <Box
                                    key={defect.id}
                                    bg="white"
                                    borderRadius="lg"
                                    overflow="hidden"
                                    borderBottom="1px solid"
                                    borderColor="#E5E6EB"
                                >
                                    {/* Header */}
                                    <Flex
                                        align="center"
                                        px={6}
                                        py={4}
                                        bg="#f2f3f5"
                                        gap={6}
                                    >
                                        <Checkbox
                                            checked={selectedDefects.includes(
                                                defect.id
                                            )}
                                            onCheckedChange={() =>
                                                handleSelectDefect(defect.id)
                                            }
                                        />
                                        <Text
                                            fontSize="14px"
                                            color="#1D2129"
                                            fontWeight="500"
                                            w="30px"
                                        >
                                            {(currentPage - 1) * pageSize +
                                                index +
                                                1}
                                        </Text>
                                        <Text
                                            fontSize="14px"
                                            color="#1D2129"
                                            fontWeight="500"
                                            minW="160px"
                                        >
                                            {defect.id}
                                        </Text>

                                        <HStack gap={1} w="auto" minW="180px">
                                            <Text
                                                fontSize="14px"
                                                color="#4E5969"
                                            >
                                                缺陷/建议积分：
                                            </Text>
                                            <Text
                                                fontSize="14px"
                                                color="#1D2129"
                                                fontWeight="600"
                                            >
                                                {defect.earnedPoints || 0}
                                            </Text>
                                            <Image
                                                src="/images/task-hall/jinbi.png"
                                                alt="积分"
                                                w="16px"
                                                h="16px"
                                            />
                                        </HStack>

                                        <HStack gap={1} w="auto" minW="60px">
                                            <Icon
                                                color={
                                                    defect.type === 'BUG'
                                                        ? '#165DFF'
                                                        : '#00B42A'
                                                }
                                            >
                                                <Bug size={16} />
                                            </Icon>
                                            <Text
                                                fontSize="14px"
                                                color="#1D2129"
                                            >
                                                {defect.type === 'BUG'
                                                    ? '缺陷'
                                                    : '建议'}
                                            </Text>
                                        </HStack>

                                        <Box
                                            ml="auto"
                                            px={3}
                                            py={1}
                                            borderRadius="12px"
                                            bg={badgeStyle.bg}
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            minW="80px"
                                        >
                                            <Text
                                                fontSize="14px"
                                                color={badgeStyle.color}
                                                fontWeight="500"
                                            >
                                                {getBadgeText(defect)}
                                            </Text>
                                        </Box>
                                    </Flex>

                                    {/* Content */}
                                    <Grid
                                        templateColumns="1fr 1px 1fr"
                                        gap={0}
                                        p={6}
                                        minH="200px"
                                    >
                                        {/* Left Column */}
                                        <Box pr={6}>
                                            <VStack align="stretch" gap={4}>
                                                <HStack
                                                    align="flex-start"
                                                    gap={2}
                                                >
                                                    <Text
                                                        fontSize="14px"
                                                        color="#4E5969"
                                                        flexShrink={0}
                                                    >
                                                        标题：
                                                    </Text>
                                                    <Text
                                                        fontSize="14px"
                                                        color="#4E5969"
                                                    >
                                                        {defect.title}
                                                    </Text>
                                                </HStack>
                                                <HStack
                                                    align="flex-start"
                                                    gap={2}
                                                >
                                                    <Text
                                                        fontSize="14px"
                                                        color="#4E5969"
                                                        flexShrink={0}
                                                    >
                                                        描述：
                                                    </Text>
                                                    <Text
                                                        fontSize="14px"
                                                        color="#4E5969"
                                                        lineHeight="1.6"
                                                    >
                                                        {defect.description}
                                                    </Text>
                                                </HStack>
                                                {attachments.length > 0 && (
                                                    <VStack
                                                        align="stretch"
                                                        gap={2}
                                                    >
                                                        <Flex
                                                            justify="space-between"
                                                            align="center"
                                                        >
                                                            <Text
                                                                fontSize="14px"
                                                                color="#4E5969"
                                                            >
                                                                附件：
                                                            </Text>
                                                            <HStack
                                                                gap={1}
                                                                cursor="pointer"
                                                                color="#86909C"
                                                                _hover={{
                                                                    color: '#1D2129',
                                                                }}
                                                                onClick={() =>
                                                                    handleDownloadAll(
                                                                        attachments
                                                                    )
                                                                }
                                                            >
                                                                <LuDownload
                                                                    size={14}
                                                                />
                                                                <Text fontSize="12px">
                                                                    全部下载
                                                                </Text>
                                                            </HStack>
                                                        </Flex>
                                                        <Flex
                                                            gap="12px"
                                                            wrap="wrap"
                                                        >
                                                            {attachments.map(
                                                                (
                                                                    attachment
                                                                ) => (
                                                                    <Box
                                                                        key={
                                                                            attachment.id
                                                                        }
                                                                        w="95px"
                                                                        h="95px"
                                                                        borderRadius="4px"
                                                                        overflow="hidden"
                                                                        position="relative"
                                                                        cursor="pointer"
                                                                        onClick={() =>
                                                                            handlePreview(
                                                                                attachment
                                                                            )
                                                                        }
                                                                    >
                                                                        {attachment.isVideo ? (
                                                                            <>
                                                                                <video
                                                                                    src={
                                                                                        attachment.url
                                                                                    }
                                                                                    style={{
                                                                                        width: '100%',
                                                                                        height: '100%',
                                                                                        objectFit:
                                                                                            'cover',
                                                                                        pointerEvents:
                                                                                            'none',
                                                                                    }}
                                                                                />
                                                                                <Center
                                                                                    position="absolute"
                                                                                    top={
                                                                                        0
                                                                                    }
                                                                                    left={
                                                                                        0
                                                                                    }
                                                                                    right={
                                                                                        0
                                                                                    }
                                                                                    bottom={
                                                                                        0
                                                                                    }
                                                                                    bg="blackAlpha.400"
                                                                                >
                                                                                    <Icon color="white">
                                                                                        <Play
                                                                                            size={
                                                                                                20
                                                                                            }
                                                                                            fill="white"
                                                                                        />
                                                                                    </Icon>
                                                                                </Center>
                                                                            </>
                                                                        ) : (
                                                                            <Image
                                                                                src={
                                                                                    attachment.url
                                                                                }
                                                                                alt="附件"
                                                                                width="100%"
                                                                                height="100%"
                                                                                objectFit="cover"
                                                                            />
                                                                        )}
                                                                    </Box>
                                                                )
                                                            )}
                                                        </Flex>
                                                    </VStack>
                                                )}
                                            </VStack>
                                        </Box>

                                        {/* Divider */}
                                        <Box
                                            w="1px"
                                            h="100%"
                                            borderLeft="1px dashed"
                                            borderColor="#E5E6EB"
                                        />

                                        {/* Right Column */}
                                        <Box pl={6}>
                                            <VStack align="stretch" gap={4}>
                                                <HStack
                                                    align="flex-start"
                                                    gap={2}
                                                >
                                                    <Text
                                                        fontSize="14px"
                                                        color="#4E5969"
                                                        flexShrink={0}
                                                    >
                                                        所属用例：
                                                    </Text>
                                                    <Text
                                                        fontSize="14px"
                                                        color="#1D2129"
                                                    >
                                                        {defect.testCase
                                                            ?.title || '-'}
                                                    </Text>
                                                </HStack>
                                                <HStack
                                                    align="flex-start"
                                                    gap={2}
                                                >
                                                    <Text
                                                        fontSize="14px"
                                                        color="#4E5969"
                                                        flexShrink={0}
                                                    >
                                                        关联步骤：
                                                    </Text>
                                                    <HStack gap={1} wrap="wrap">
                                                        <Text
                                                            fontSize="14px"
                                                            color="#1D2129"
                                                        >
                                                            {steps.length > 0
                                                                ? defect.steps
                                                                : '-'}
                                                        </Text>
                                                        {steps.length > 0 &&
                                                            defect.testCase
                                                                ?.id && (
                                                                <Link
                                                                    color="#165DFF"
                                                                    fontSize="14px"
                                                                    ml={2}
                                                                    cursor="pointer"
                                                                    onClick={() =>
                                                                        handleViewSteps(
                                                                            steps
                                                                        )
                                                                    }
                                                                >
                                                                    查看详细
                                                                </Link>
                                                            )}
                                                    </HStack>
                                                </HStack>
                                                <HStack
                                                    align="flex-start"
                                                    gap={2}
                                                >
                                                    <Text
                                                        fontSize="14px"
                                                        color="#4E5969"
                                                        flexShrink={0}
                                                    >
                                                        审核意见：
                                                    </Text>
                                                    <Text
                                                        fontSize="14px"
                                                        color="#1D2129"
                                                    >
                                                        {defect.reviewComment ||
                                                            '-'}
                                                    </Text>
                                                </HStack>
                                                <HStack
                                                    align="flex-start"
                                                    gap={2}
                                                >
                                                    <Text
                                                        fontSize="14px"
                                                        color="#4E5969"
                                                        flexShrink={0}
                                                    >
                                                        补充说明：
                                                    </Text>
                                                    <Text
                                                        fontSize="14px"
                                                        color="#1D2129"
                                                    >
                                                        {defect.supplementaryExplanation ||
                                                            '-'}
                                                    </Text>
                                                </HStack>
                                            </VStack>
                                        </Box>
                                    </Grid>

                                    {/* Footer */}
                                    <Flex
                                        px={6}
                                        py={3}
                                        borderTop="1px dashed"
                                        borderColor="#E5E6EB"
                                        gap={10}
                                    >
                                        <HStack gap={1}>
                                            <Text
                                                fontSize="12px"
                                                color="#86909C"
                                            >
                                                机型：
                                            </Text>
                                            <Text
                                                fontSize="12px"
                                                color="#4E5969"
                                            >
                                                {defect.deviceModel || '-'}
                                            </Text>
                                        </HStack>
                                        <HStack gap={1}>
                                            <Text
                                                fontSize="12px"
                                                color="#86909C"
                                            >
                                                系统：
                                            </Text>
                                            <Text
                                                fontSize="12px"
                                                color="#4E5969"
                                            >
                                                {defect.system || '-'}
                                            </Text>
                                        </HStack>
                                        <HStack gap={1}>
                                            <Text
                                                fontSize="12px"
                                                color="#86909C"
                                            >
                                                提交人：
                                            </Text>
                                            <Text
                                                fontSize="12px"
                                                color="#4E5969"
                                            >
                                                {defect.user?.name ||
                                                    defect.user?.phone ||
                                                    '-'}
                                            </Text>
                                        </HStack>
                                        <HStack gap={1}>
                                            <Text
                                                fontSize="12px"
                                                color="#86909C"
                                            >
                                                提交时间：
                                            </Text>
                                            <Text
                                                fontSize="12px"
                                                color="#4E5969"
                                            >
                                                {new Date(
                                                    defect.createdAt
                                                ).toLocaleString('zh-CN')}
                                            </Text>
                                        </HStack>
                                    </Flex>
                                </Box>
                            );
                        })}
                    </VStack>
                )}

                {/* Pagination */}
                {!isLoadingDefects && defects.length > 0 && (
                    <Box bg="white" borderRadius="lg" p={4} mt={4}>
                        <Flex align="center" justify="center" gap={3}>
                            <Text fontSize="14px" color="#4E5969">
                                共{totalItems}条
                            </Text>

                            <Box
                                as="button"
                                p={2}
                                color={
                                    currentPage === 1 ? '#86909C' : '#4E5969'
                                }
                                cursor={
                                    currentPage === 1
                                        ? 'not-allowed'
                                        : 'pointer'
                                }
                                onClick={() =>
                                    currentPage > 1 &&
                                    setCurrentPage(currentPage - 1)
                                }
                            >
                                <LuChevronLeft size={16} />
                            </Box>

                            {getPageNumbers().map((page, index) =>
                                typeof page === 'number' ? (
                                    <Box
                                        key={index}
                                        as="button"
                                        w="32px"
                                        h="32px"
                                        borderRadius="4px"
                                        fontSize="14px"
                                        border={
                                            currentPage === page
                                                ? '1px solid'
                                                : 'none'
                                        }
                                        borderColor="#E31424"
                                        bg={
                                            currentPage === page
                                                ? 'rgba(227, 20, 36, 0.05)'
                                                : 'transparent'
                                        }
                                        color={
                                            currentPage === page
                                                ? '#E31424'
                                                : '#4E5969'
                                        }
                                        cursor="pointer"
                                        _hover={{
                                            bg:
                                                currentPage === page
                                                    ? 'rgba(227, 20, 36, 0.05)'
                                                    : '#F2F3F5',
                                        }}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Box>
                                ) : (
                                    <Text key={index} px={1} color="#86909C">
                                        {page}
                                    </Text>
                                )
                            )}

                            <Box
                                as="button"
                                p={2}
                                color={
                                    currentPage === totalPages
                                        ? '#86909C'
                                        : '#4E5969'
                                }
                                cursor={
                                    currentPage === totalPages
                                        ? 'not-allowed'
                                        : 'pointer'
                                }
                                onClick={() =>
                                    currentPage < totalPages &&
                                    setCurrentPage(currentPage + 1)
                                }
                            >
                                <LuChevronRight size={16} />
                            </Box>

                            <NativeSelectRoot w="90px" size="sm">
                                <NativeSelectField
                                    value={pageSize.toString()}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    fontSize="14px"
                                    borderColor="#E5E6EB"
                                >
                                    <option value="10">10条/页</option>
                                    <option value="20">20条/页</option>
                                    <option value="50">50条/页</option>
                                </NativeSelectField>
                            </NativeSelectRoot>

                            <Flex align="center" gap={2}>
                                <Text fontSize="14px" color="#4E5969">
                                    前往
                                </Text>
                                <Input
                                    w="50px"
                                    h="32px"
                                    fontSize="14px"
                                    textAlign="center"
                                    borderColor="#E5E6EB"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const value = parseInt(
                                                (e.target as HTMLInputElement)
                                                    .value
                                            );
                                            if (
                                                value >= 1 &&
                                                value <= totalPages
                                            ) {
                                                setCurrentPage(value);
                                            }
                                        }
                                    }}
                                />
                            </Flex>
                        </Flex>
                    </Box>
                )}

                {/* Preview Modal */}
                <DialogRoot
                    open={isPreviewOpen}
                    onOpenChange={(details) =>
                        !details.open && onPreviewClose()
                    }
                    closeOnInteractOutside={true}
                >
                    <DialogBackdrop />
                    <DialogContent
                        maxW={{ base: '90%', md: '80%', lg: '60%' }}
                        borderRadius="8px"
                        bg="white"
                        position="fixed"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        maxH="85vh"
                        m={4}
                        zIndex={2000}
                    >
                        <DialogHeader
                            borderBottom="1px solid"
                            borderColor="#e5e6eb"
                        >
                            <Text fontSize="16px" fontWeight="500">
                                {previewType === 'image'
                                    ? '图片预览'
                                    : '视频预览'}
                            </Text>
                            <DialogCloseTrigger onClick={onPreviewClose} />
                        </DialogHeader>
                        <DialogBody py={6} px={4}>
                            <Center>
                                {previewType === 'image' ? (
                                    <Image
                                        src={previewUrl}
                                        alt="预览"
                                        maxH="70vh"
                                        objectFit="contain"
                                    />
                                ) : previewType === 'video' ? (
                                    <Box w="100%" maxH="70vh">
                                        <video
                                            src={previewUrl}
                                            controls
                                            style={{
                                                width: '100%',
                                                maxHeight: '70vh',
                                                objectFit: 'contain',
                                            }}
                                            controlsList="nodownload"
                                        >
                                            您的浏览器不支持视频播放
                                        </video>
                                    </Box>
                                ) : null}
                            </Center>
                        </DialogBody>
                    </DialogContent>
                </DialogRoot>

                {/* Steps Modal */}
                <DialogRoot
                    open={isStepsOpen}
                    onOpenChange={(details) => !details.open && onStepsClose()}
                >
                    <DialogBackdrop />
                    <DialogContent
                        maxW="500px"
                        borderRadius="8px"
                        bg="white"
                        position="fixed"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        maxH="85vh"
                        m={4}
                        zIndex={2000}
                    >
                        <DialogHeader
                            borderBottom="1px solid"
                            borderColor="#e5e6eb"
                        >
                            <Text fontSize="16px" fontWeight="500">
                                关联步骤详情
                            </Text>
                            <DialogCloseTrigger onClick={onStepsClose} />
                        </DialogHeader>
                        <DialogBody px={4} py={6}>
                            <VStack gap={3} alignItems="stretch">
                                {currentSteps.map((step, index) => (
                                    <Flex key={index} align="center" py={1}>
                                        <Flex
                                            align="center"
                                            justify="center"
                                            width="24px"
                                            height="24px"
                                            borderRadius="50%"
                                            bg="#E2E8F0"
                                            fontSize="sm"
                                            mr={3}
                                            flexShrink={0}
                                        >
                                            {index + 1}
                                        </Flex>
                                        <Text fontSize="sm">{step}</Text>
                                    </Flex>
                                ))}
                            </VStack>
                        </DialogBody>
                    </DialogContent>
                </DialogRoot>
            </Container>
        </Box>
    );
}
