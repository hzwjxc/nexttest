'use client';

import { useState } from 'react';
import {
    Box,
    Container,
    Flex,
    HStack,
    VStack,
    Text,
    Heading,
    Button,
    Icon,
    Grid,
    GridItem,
    Link,
    Table,
    Image,
    Circle,
    DialogRoot,
    DialogBackdrop,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogCloseTrigger,
    Input,
    Textarea,
    NativeSelect,
    IconButton,
} from '@chakra-ui/react';
import { Clock, Users, Menu, Eye, Download, X as LuX, Upload as LuUpload } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Check } from 'lucide-react';
import MyFeedBack from './components/myfeedBack';
import TaskTracker from './components/TaskTracker';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';
import useCustomToast from '@/app/hooks/useCustomToast';

interface TaskStep {
    id: number;
    title: string;
    timestamp: string;
    status: 'completed' | 'current' | 'pending';
}

const taskSteps = [
    {
        id: 1,
        title: '任务领取',
        timestamp: '2024-09-19 12:34:21',
    },
    {
        id: 2,
        title: '缺陷提交',
        timestamp: '2024-09-19 12:34:21',
    },
    {
        id: 3,
        title: '已判定',
        timestamp: '2024-09-19 12:34:21',
    },
    {
        id: 4,
        title: '积分发放',
        timestamp: '2024-09-19 12:34:21',
    },
];

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const taskId = params.id as string;

    // 从 API 获取任务详情
    const { data: taskData, isLoading } = api.taskPublish.getById.useQuery({
        id: taskId,
    });

    // 判断是否有测试用例
    const hasTestCases = taskData?.testCases && taskData.testCases.length > 0;

    // 获取任务状态
    const taskStatus = taskData?.taskStatus || 'status1';

    // 获取附件列表
    const attachments = taskData?.attachments || [];

    // 获取奖励规则
    const rewardRules = taskData?.rewardRules || [];

    // 获取任务跟踪步骤
    const taskTrackingSteps = taskData?.taskTrackingSteps || [];

    // 领取任务mutation
    const utils = api.useUtils();
    const claimTaskMutation = api.taskPublish.claimTask.useMutation({
        onSuccess: (data) => {
            showSuccessToast(data.message || '任务领取成功');
            // 使查询失效并重新获取数据
            utils.taskPublish.getById.invalidate({ id: taskId });
        },
        onError: (error) => {
            showErrorToast(error.message || '任务领取失败');
        },
    });

    const handleClaimTask = () => {
        claimTaskMutation.mutate({ taskId });
    };

    // 添加缺陷/建议相关状态
    const [isAddDefectDialogOpen, setIsAddDefectDialogOpen] = useState(false);
    const [defectFormData, setDefectFormData] = useState({
        title: '',
        defectType: '',
        description: '',
    });
    const [defectUploadedFiles, setDefectUploadedFiles] = useState<Array<{ url: string; isVideo: boolean }>>([]);
    const [isDefectUploading, setIsDefectUploading] = useState(false);

    // 创建缺陷mutation
    const createDefectWithoutTestCase = api.defect.createWithoutTestCase.useMutation({
        onSuccess: (data) => {
            setIsAddDefectDialogOpen(false);
            setDefectFormData({ title: '', defectType: '', description: '' });
            setDefectUploadedFiles([]);
            showSuccessToast(data.message);
            // 重新获取任务数据
            utils.taskPublish.getById.invalidate({ id: taskId });
            // 刷新缺陷列表（用于我的反馈组件）
            utils.defect.listByTask.invalidate({ taskId: taskId });
        },
        onError: (error) => {
            showErrorToast('提交失败: ' + error.message);
        },
    });

    // 处理添加缺陷/建议
    const handleAddDefect = () => {
        setDefectFormData({ title: '', defectType: '', description: '' });
        setDefectUploadedFiles([]);
        setIsAddDefectDialogOpen(true);
    };

    // 处理文件上传
    const handleDefectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsDefectUploading(true);

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const isVideo = file.type.startsWith('video/');
                const isImage = file.type.startsWith('image/');

                if (!isVideo && !isImage) {
                    showErrorToast(`文件 ${file.name} 格式不支持，仅支持图片和视频`);
                    return null;
                }

                const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
                if (file.size > maxSize) {
                    showErrorToast(`文件 ${file.name} 过大，${isVideo ? '视频' : '图片'}最大支持 ${isVideo ? '50MB' : '5MB'}`);
                    return null;
                }

                return new Promise<{ url: string; isVideo: boolean } | null>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        try {
                            const base64 = reader.result as string;

                            const result = await utils.client.util.uploadRichTextFile.mutate({
                                file: base64,
                                filename: file.name,
                                folder: 'defects',
                            });

                            if (result.success) {
                                resolve({ url: result.url, isVideo });
                            } else {
                                showErrorToast(`文件 ${file.name} 上传失败`);
                                resolve(null);
                            }
                        } catch (error) {
                            console.error('Upload error:', error);
                            showErrorToast(`文件 ${file.name} 上传失败`);
                            resolve(null);
                        }
                    };
                    reader.readAsDataURL(file);
                });
            });

            const results = await Promise.all(uploadPromises);
            const successfulUploads = results.filter((r): r is { url: string; isVideo: boolean } => r !== null);

            if (successfulUploads.length > 0) {
                setDefectUploadedFiles([...defectUploadedFiles, ...successfulUploads]);
                showSuccessToast(`成功上传 ${successfulUploads.length} 个文件`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            showErrorToast('文件上传失败');
        } finally {
            setIsDefectUploading(false);
            e.target.value = '';
        }
    };

    // 处理移除文件
    const handleRemoveDefectFile = (index: number) => {
        setDefectUploadedFiles(defectUploadedFiles.filter((_, i) => i !== index));
    };

    // 处理缺陷提交
    const handleSubmitDefect = () => {
        if (!defectFormData.title.trim()) {
            showErrorToast('请输入标题');
            return;
        }
        if (!defectFormData.defectType) {
            showErrorToast('请选择缺陷类型');
            return;
        }
        if (!defectFormData.description.trim()) {
            showErrorToast('请输入描述');
            return;
        }

        createDefectWithoutTestCase.mutate({
            taskId: taskId,
            title: defectFormData.title,
            description: defectFormData.description,
            type: defectFormData.defectType === '缺陷' ? 'BUG' : 'SUGGESTION',
            attachments: defectUploadedFiles.map(f => f.url),
            isDraft: false, // 始终作为正式提交
        });
    };

    const getBTnType = (type: string) => {
        switch (type) {
            case 'status1':
                return (
                    <Button
                        bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                        color="white"
                        fontSize="14px"
                        fontWeight="500"
                        borderRadius="999px"
                        h="36px"
                        px={4}
                        _hover={{
                            opacity: 0.9,
                        }}
                        onClick={handleClaimTask}
                        loading={claimTaskMutation.isPending}
                    >
                        领取任务
                    </Button>
                );
            case 'status2':
                // 只有无测试用例的任务才显示添加缺陷/建议按钮
                if (!hasTestCases) {
                    return (
                        <Button
                            bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                            color="white"
                            fontSize="14px"
                            fontWeight="500"
                            borderRadius="999px"
                            h="36px"
                            px={4}
                            _hover={{
                                opacity: 0.9,
                            }}
                            onClick={handleAddDefect}
                        >
                            添加缺陷/建议
                        </Button>
                    );
                }
                return null;
            case 'status3':
                return null;
            case 'status4':
                return null;
            case 'status5':
                return null;
            default:
                return null;
        }
    };

    const getTaskStatus = (type: string) => {
        switch (type) {
            case 'status1':
                {
                    /* 待领取 */
                }
                return (
                    <Image
                        src="/images/task-hall/task-detail/task-status-1.png"
                        alt="Task"
                        w="128px"
                        h="128px"
                        borderRadius="lg"
                    />
                );
            case 'status2':
                {
                    /* 待完成 */
                }
                return (
                    <Image
                        src="/images/task-hall/task-detail/task-status-2.png"
                        alt="Task"
                        w="128px"
                        h="128px"
                        borderRadius="lg"
                    />
                );
            case 'status3':
                {
                    /* 已完成 */
                }
                return (
                    <Image
                        src="/images/task-hall/task-detail/task-status-3.png"
                        alt="Task"
                        w="128px"
                        h="128px"
                        borderRadius="lg"
                    />
                );
            case 'status4':
                {
                    /* 已满员 */
                }
                return (
                    <Image
                        src="/images/task-hall/task-detail/task-status-4.png"
                        alt="Task"
                        w="128px"
                        h="128px"
                        borderRadius="lg"
                    />
                );
            case 'status5':
                {
                    /* 已结束 */
                }
                return (
                    <Image
                        src="/images/task-hall/task-detail/task-status-5.png"
                        alt="Task"
                        w="128px"
                        h="128px"
                        borderRadius="lg"
                    />
                );
            default:
                return (
                    <Image
                        src="/images/task-hall/task-detail/task-status-1.png"
                        alt="Task"
                        w="128px"
                        h="128px"
                        borderRadius="lg"
                    />
                );
        }
    };

    const Topdesc = (type: string) => {
        switch (type) {
            case 'status1': {
                /* 待领取 */
            }
            case 'status4':
                {
                    /* 已满员 */
                }
                return (
                    <HStack gap={6} fontSize="sm">
                        <HStack gap={1} color="gray.500">
                            <Icon as={Clock} boxSize={4} />
                            <Text>剩余时间：</Text>
                            <Text color="orange.500" fontWeight="medium">
                                {taskData?.timeRemaining || '计算中...'}
                            </Text>
                        </HStack>
                        <HStack gap={1} color="gray.500">
                            <Icon as={Users} boxSize={4} />
                            <Text>剩余名额：</Text>
                            <Text color="orange.500" fontWeight="medium">
                                {taskData?.spotsRemaining ?? 0}
                            </Text>
                        </HStack>
                    </HStack>
                );
            case 'status2':
                {
                    /* 待完成 */
                }
                return (
                    <HStack gap={6} fontSize="sm">
                        <HStack gap={1} color="gray.500">
                            <Icon as={Clock} boxSize={4} />
                            <Text>剩余时间：</Text>
                            <Text color="orange.500" fontWeight="medium">
                                {taskData?.timeRemaining || '计算中...'}
                            </Text>
                        </HStack>
                    </HStack>
                );
            case 'status3':
                {
                    /* 已完成 */
                }
                return (
                    <HStack gap={6} fontSize="sm">
                        <HStack gap={1} color="gray.500">
                            <Text>待发放积分：</Text>
                            <Text color="gray.500" fontWeight="medium">
                                {taskData?.userOrder?.earnedPoints || 0}
                            </Text>
                            <Image
                                src="/images/task-hall/task-detail/jinbi.png"
                                alt="Coin"
                                w="16px"
                                h="16px"
                            />
                        </HStack>
                    </HStack>
                );
            case 'status5':
                {
                    /* 已结束 */
                }
                return (
                    <HStack gap={6} fontSize="sm">
                        <HStack gap={1} color="gray.500">
                            <Text>已发放积分：</Text>
                            <Text color="gray.500" fontWeight="medium">
                                {taskData?.userOrder?.earnedPoints || 0}
                            </Text>
                            <Image
                                src="/images/task-hall/task-detail/jinbi.png"
                                alt="Coin"
                                w="16px"
                                h="16px"
                            />
                            <Text>
                                （执行积分：{taskData?.executionPoints || 0}
                                、缺陷/建议：
                                {(taskData?.userOrder?.earnedPoints || 0) -
                                    (taskData?.executionPoints || 0)}
                                ）
                            </Text>
                        </HStack>
                    </HStack>
                );
            default:
                return null;
        }
    };

    return (
        <Box minH="100vh" bg="gray.50">
            {/* Breadcrumb */}
            <Box bg="gray.50" borderBottomWidth="1px" borderColor="gray.200">
                <Container maxW="7xl" px={{ base: 4, md: 6, lg: 8 }} py={3}>
                    <HStack gap={2} fontSize="sm" color="gray.500">
                        <Icon as={Menu} boxSize={4} />
                        <Text>/</Text>
                        <Link
                            href="/crowdsource/task-hall"
                            _hover={{ color: 'red.500' }}
                        >
                            任务大厅
                        </Link>
                        <Text>/</Text>
                        <Text color="gray.700">任务详情</Text>
                    </HStack>
                </Container>
            </Box>

            {/* Main Content */}
            <Container
                as="main"
                maxW="7xl"
                px={{ base: 4, md: 6, lg: 8 }}
                py={6}
                mb={20}
            >
                <VStack gap={4} align="stretch">
                    {/* Task Header */}
                    <Box
                        bg="white"
                        borderRadius="lg"
                        boxShadow="sm"
                        p={6}
                        position="relative"
                    >
                        <Flex
                            justify="space-between"
                            align="center"
                            flexWrap="wrap"
                            gap={4}
                        >
                            <HStack align="flex-start" gap={4}>
                                <Box
                                    w={16}
                                    h={16}
                                    borderRadius="lg"
                                    bgGradient="linear(to-br, orange.100, orange.200)"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Image
                                        src="/images/task-hall/task-detail/task-icon.png"
                                        alt="Task"
                                        w={16}
                                        h={16}
                                        borderRadius="lg"
                                    />
                                </Box>
                                <VStack align="flex-start" gap={2}>
                                    <Heading
                                        as="h1"
                                        size="md"
                                        color="gray.900"
                                        mb={1}
                                    >
                                        {taskData?.title || '加载中...'}
                                    </Heading>
                                    {Topdesc(taskStatus)}
                                </VStack>
                            </HStack>
                            <HStack gap={4} mr="60px">
                                {getBTnType(taskStatus)}
                                <Box
                                    position="absolute"
                                    top="30px"
                                    right="0"
                                    overflow="hidden"
                                    h="80px"
                                    w="80px"
                                >
                                    {getTaskStatus(taskStatus)}
                                </Box>
                            </HStack>
                        </Flex>
                    </Box>

                    {/* Task Description */}
                    <Box
                        bg="white"
                        borderRadius="lg"
                        boxShadow="sm"
                        p={6}
                        overflow="hidden"
                    >
                        <Heading as="h2" size="sm" color="gray.900" mb={3}>
                            任务描述
                        </Heading>
                        <Text color="gray.600" fontSize="sm" lineHeight="tall">
                            {taskData?.description || '暂无描述'}
                        </Text>
                    </Box>

                    {/* Reward Rules */}
                    {(rewardRules.length > 0 || taskData?.testRules) && (
                        <Box bg="white" borderRadius="lg" boxShadow="sm" p={6}>
                            <Heading as="h2" size="sm" color="gray.900" mb={3}>
                                奖励规则
                            </Heading>
                            <VStack
                                align="stretch"
                                gap={3}
                                fontSize="sm"
                                color="gray.600"
                            >
                                {taskData?.testRules && (
                                    <Text whiteSpace="pre-wrap">
                                        {taskData.testRules}
                                    </Text>
                                )}
                            </VStack>
                        </Box>
                    )}

                    {/* Test Data */}
                    {taskData?.environment && (
                        <Box bg="white" borderRadius="lg" boxShadow="sm" p={6}>
                            <Heading as="h2" size="sm" color="gray.900" mb={3}>
                                测试数据
                            </Heading>
                            <Text
                                color="gray.600"
                                fontSize="sm"
                                lineHeight="tall"
                                whiteSpace="pre-wrap"
                            >
                                {taskData.environment}
                            </Text>
                        </Box>
                    )}

                    {!['status3', 'status5'].includes(taskStatus) && (
                        <TaskTracker
                            steps={taskTrackingSteps}
                            taskStatus={taskStatus}
                        />
                    )}

                    {/* Attachments */}
                    {attachments.length > 0 && (
                        <Box bg="white" borderRadius="lg" boxShadow="sm" p={6}>
                            <Heading as="h2" size="sm" color="gray.900" mb={3}>
                                附件
                            </Heading>
                            <Grid
                                templateColumns={{
                                    base: '1fr',
                                    sm: 'repeat(2, 1fr)',
                                }}
                                gap={3}
                            >
                                {attachments.map((file: any, index: number) => (
                                    <GridItem key={index}>
                                        <Flex
                                            align="center"
                                            justify="space-between"
                                            p={3}
                                            bg="gray.50"
                                            borderRadius="lg"
                                            borderWidth="1px"
                                            borderColor="gray.100"
                                        >
                                            <HStack gap={3}>
                                                <Box
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                >
                                                    <Image
                                                        src="/images/task-hall/task-detail/file.png"
                                                        alt="File"
                                                        w={8}
                                                        h={8}
                                                        borderRadius="lg"
                                                    />
                                                </Box>
                                                <VStack
                                                    align="flex-start"
                                                    gap={0}
                                                >
                                                    <Text
                                                        fontSize="sm"
                                                        fontWeight="medium"
                                                        color="gray.900"
                                                    >
                                                        {file.name}
                                                    </Text>
                                                    <Text
                                                        fontSize="xs"
                                                        color="gray.400"
                                                    >
                                                        {(
                                                            file.size / 1024
                                                        ).toFixed(2)}
                                                        KB
                                                    </Text>
                                                </VStack>
                                            </HStack>
                                            <HStack gap={1}>
                                                <Box
                                                    as="button"
                                                    p={1.5}
                                                    borderRadius="md"
                                                    _hover={{ bg: 'gray.200' }}
                                                    onClick={() =>
                                                        window.open(
                                                            file.url,
                                                            '_blank'
                                                        )
                                                    }
                                                >
                                                    <Icon
                                                        as={Eye}
                                                        boxSize={4}
                                                        color="gray.400"
                                                    />
                                                </Box>
                                                <Link
                                                    href={file.url}
                                                    download={file.name}
                                                    p={1.5}
                                                    borderRadius="md"
                                                    _hover={{ bg: 'gray.200' }}
                                                    display="flex"
                                                    alignItems="center"
                                                >
                                                    <Icon
                                                        as={Download}
                                                        boxSize={4}
                                                        color="gray.400"
                                                    />
                                                </Link>
                                            </HStack>
                                        </Flex>
                                    </GridItem>
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {/* Task Tracker */}
                    <TaskTracker
                        steps={taskTrackingSteps}
                        taskStatus={taskStatus}
                    />

                    {/* 条件显示：有测试用例显示测试用例模块，否则显示我的反馈模块 */}
                    {hasTestCases ? (
                        /* Test Cases */
                        <Box bg="white" borderRadius="lg" boxShadow="sm" p={6}>
                            <Heading as="h2" size="sm" color="gray.900" mb={3}>
                                测试用例
                            </Heading>
                            <Box
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="lg"
                                overflow="hidden"
                            >
                                <Table.Root size="sm">
                                    <Table.Header bg="gray.50">
                                        <Table.Row bg="#f2f3f5">
                                            <Table.ColumnHeader
                                                color="gray.600"
                                                fontWeight="medium"
                                                w="16"
                                            >
                                                序号
                                            </Table.ColumnHeader>
                                            <Table.ColumnHeader
                                                color="gray.600"
                                                fontWeight="medium"
                                            >
                                                所属系统
                                            </Table.ColumnHeader>
                                            <Table.ColumnHeader
                                                color="gray.600"
                                                fontWeight="medium"
                                            >
                                                用例名称
                                            </Table.ColumnHeader>
                                            <Table.ColumnHeader
                                                color="gray.600"
                                                fontWeight="medium"
                                            >
                                                测试重点
                                            </Table.ColumnHeader>
                                            <Table.ColumnHeader
                                                color="gray.600"
                                                fontWeight="medium"
                                                w="24"
                                            >
                                                操作
                                            </Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {taskData?.testCases?.map(
                                            (testCase, index) => (
                                                <Table.Row
                                                    key={testCase.id}
                                                    _hover={{ bg: 'gray.50' }}
                                                >
                                                    <Table.Cell color="gray.900">
                                                        {index + 1}
                                                    </Table.Cell>
                                                    <Table.Cell color="gray.600">
                                                        {testCase.system}
                                                    </Table.Cell>
                                                    <Table.Cell color="gray.600">
                                                        {testCase.name}
                                                    </Table.Cell>
                                                    <Table.Cell color="gray.600">
                                                        {testCase.testFocus}
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        <Link
                                                            href={`/crowdsource/task-hall/${taskId}/cases/${testCase.id}`}
                                                            color="#165DFF"
                                                            fontSize="sm"
                                                            _hover={{
                                                                color: 'orange.600',
                                                            }}
                                                        >
                                                            查看用例
                                                        </Link>
                                                    </Table.Cell>
                                                </Table.Row>
                                            )
                                        )}
                                    </Table.Body>
                                </Table.Root>
                            </Box>
                        </Box>
                    ) : (
                        /* My Feedback */
                        <MyFeedBack />
                    )}
                </VStack>
            </Container>

            {/* Add Defect/Suggestion Dialog */}
            <DialogRoot open={isAddDefectDialogOpen} onOpenChange={(e) => setIsAddDefectDialogOpen(e.open)} size="xl">
                <DialogBackdrop />
                <DialogContent maxW="600px" borderRadius="8px"
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)">
                    <DialogHeader
                        fontSize="18px"
                        fontWeight="600"
                        color="#1D2129"
                        borderBottom="1px solid"
                        borderColor="#E5E6EB"
                        pb={4}
                    >
                        添加缺陷/建议
                    </DialogHeader>
                    <DialogCloseTrigger />
                    <DialogBody py={6}>
                        <VStack gap={4} align="stretch">
                            {/* Title */}
                            <Box>
                                <Text fontSize="14px" fontWeight="500" color="#1D2129" mb={2}>
                                    标题 <Text as="span" color="#E31424">*</Text>
                                </Text>
                                <Input
                                    placeholder="请输入标题"
                                    value={defectFormData.title}
                                    onChange={(e) => setDefectFormData({ ...defectFormData, title: e.target.value })}
                                    fontSize="14px"
                                    borderColor="#E5E6EB"
                                    _focus={{ borderColor: '#E31424' }}
                                />
                            </Box>

                            {/* Defect Type */}
                            <Box>
                                <Text fontSize="14px" fontWeight="500" color="#1D2129" mb={2}>
                                    缺陷类型 <Text as="span" color="#E31424">*</Text>
                                </Text>
                                <NativeSelect.Root>
                                    <NativeSelect.Field
                                        value={defectFormData.defectType}
                                        onChange={(e) => setDefectFormData({ ...defectFormData, defectType: e.target.value })}
                                        fontSize="14px"
                                        borderColor="#E5E6EB"
                                        _focus={{ borderColor: '#E31424' }}
                                    >
                                        <option value="">请选择缺陷类型</option>
                                        <option value="缺陷">缺陷</option>
                                        <option value="建议">建议</option>
                                    </NativeSelect.Field>
                                </NativeSelect.Root>
                            </Box>

                            {/* Description */}
                            <Box>
                                <Text fontSize="14px" fontWeight="500" color="#1D2129" mb={2}>
                                    描述 <Text as="span" color="#E31424">*</Text>
                                </Text>
                                <Textarea
                                    placeholder="请输入详细描述"
                                    value={defectFormData.description}
                                    onChange={(e) => setDefectFormData({ ...defectFormData, description: e.target.value })}
                                    fontSize="14px"
                                    borderColor="#E5E6EB"
                                    _focus={{ borderColor: '#E31424' }}
                                    minH="120px"
                                    resize="vertical"
                                />
                            </Box>

                            {/* File Upload */}
                            <Box>
                                <Text fontSize="14px" fontWeight="500" color="#1D2129" mb={2}>
                                    上传图片/视频
                                </Text>
                                <Box
                                    border="1px dashed"
                                    borderColor="#E5E6EB"
                                    borderRadius="8px"
                                    p={4}
                                    textAlign="center"
                                    cursor={isDefectUploading ? "not-allowed" : "pointer"}
                                    _hover={{ borderColor: isDefectUploading ? "#E5E6EB" : "#E31424" }}
                                    position="relative"
                                    opacity={isDefectUploading ? 0.6 : 1}
                                >
                                    <Input
                                        type="file"
                                        accept="image/*,video/*"
                                        multiple
                                        onChange={handleDefectFileUpload}
                                        position="absolute"
                                        top="0"
                                        left="0"
                                        width="100%"
                                        height="100%"
                                        opacity="0"
                                        cursor={isDefectUploading ? "not-allowed" : "pointer"}
                                        disabled={isDefectUploading}
                                    />
                                    <VStack gap={2}>
                                        <LuUpload size={24} color="#86909C" />
                                        <Text fontSize="14px" color="#4E5969">
                                            {isDefectUploading ? '上传中...' : '点击或拖拽图片/视频到此处上传'}
                                        </Text>
                                        <Text fontSize="12px" color="#86909C">
                                            支持 JPG、PNG、MP4、MOV 等格式
                                        </Text>
                                        <Text fontSize="12px" color="#86909C">
                                            图片不超过 5MB，视频不超过 50MB
                                        </Text>
                                    </VStack>
                                </Box>

                                {/* File Preview */}
                                {defectUploadedFiles.length > 0 && (
                                    <HStack gap={3} mt={3} flexWrap="wrap">
                                        {defectUploadedFiles.map((file, index) => (
                                            <Box
                                                key={index}
                                                position="relative"
                                                width="80px"
                                                height="80px"
                                                borderRadius="8px"
                                                overflow="hidden"
                                                border="1px solid"
                                                borderColor="#E5E6EB"
                                            >
                                                {file.isVideo ? (
                                                    <Box
                                                        width="100%"
                                                        height="100%"
                                                        position="relative"
                                                    >
                                                        <video
                                                            src={file.url}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                            }}
                                                        />
                                                        <Text
                                                            position="absolute"
                                                            bottom="2px"
                                                            right="2px"
                                                            fontSize="10px"
                                                            bg="rgba(0,0,0,0.7)"
                                                            color="white"
                                                            px={1}
                                                            borderRadius="2px"
                                                        >
                                                            视频
                                                        </Text>
                                                    </Box>
                                                ) : (
                                                    <Image
                                                        src={file.url}
                                                        alt={`preview-${index}`}
                                                        width="100%"
                                                        height="100%"
                                                        objectFit="cover"
                                                    />
                                                )}
                                                <IconButton
                                                    position="absolute"
                                                    top="2px"
                                                    right="2px"
                                                    size="xs"
                                                    bg="rgba(0,0,0,0.6)"
                                                    color="white"
                                                    _hover={{ bg: "rgba(0,0,0,0.8)" }}
                                                    onClick={() => handleRemoveDefectFile(index)}
                                                    aria-label="Remove file"
                                                >
                                                    <LuX size={14} />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </HStack>
                                )}
                            </Box>

                            {/* Action Buttons */}
                            <HStack gap={3} justify="flex-end" mt={4}>
                                <Button
                                    variant="outline"
                                    fontSize="14px"
                                    px={6}
                                    borderColor="#E5E6EB"
                                    color="#4E5969"
                                    _hover={{ borderColor: "#E31424", color: "#E31424" }}
                                    onClick={() => setIsAddDefectDialogOpen(false)}
                                >
                                    取消
                                </Button>
                                <Button
                                    bg="#E31424"
                                    color="white"
                                    fontSize="14px"
                                    px={6}
                                    _hover={{ bg: '#C41020' }}
                                    onClick={handleSubmitDefect}
                                    disabled={createDefectWithoutTestCase.isPending}
                                    loading={createDefectWithoutTestCase.isPending}
                                >
                                    提交
                                </Button>
                            </HStack>
                        </VStack>
                    </DialogBody>
                </DialogContent>
            </DialogRoot>

            {/* Footer */}
            <Box
                as="footer"
                bg="gray.800"
                mt={8}
                position="fixed"
                bottom="0"
                left="0"
                right="0"
            >
                <Container maxW="7xl" px={{ base: 4, md: 6, lg: 8 }} py={6}>
                    <Text textAlign="center" color="gray.400" fontSize="sm">
                        备案信息
                    </Text>
                </Container>
            </Box>
        </Box>
    );
}
