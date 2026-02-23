'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Flex,
    Text,
    VStack,
    HStack,
    Image,
    Button,
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
    Tabs,
} from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import { LuMenu, LuX, LuUpload, LuImage, LuDownload, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { api } from '@/trpc/react';
import { DefectCard } from '../../components/defect-card';
import { DuplicateDefectsModal, type DuplicateDefectItem } from '@/app/_components/ui/duplicate-defects-modal';
import useCustomToast from '@/app/hooks/useCustomToast';

const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    bgTertiary: '#F3F7FB',
    borderColor: '#E5E6EB',
    lightBg: '#EAEDF2',
};

// Test Case Detail type
interface TestCaseDetail {
    id: string;
    title: string;
    preparation: string[];
    focus: string;
    testData: string;
    steps: Array<{
        title: string;
        description: string;
        expectedResult: string;
    }>;
}

// Mock test case detail data
const mockTestCaseDetail: TestCaseDetail = {
    id: '1',
    title: '黄金积存-个人网银用例黄金积存-个人网银用例黄金积存-个人网银用例黄金积存-个人网银用例',
    preparation: [
        '1、已下载手机银行 APP，且绑定广发借记卡；',
        '2、更改结算账户：不支持绑定2张及以上结算账号；',
        '3、执行步骤7：销户条件需满足无余额、无定投计划、无挂单。',
    ],
    focus: '对"黄金积存"功能进行全流程体验测试',
    testData: '对"黄金积存"功能进行全流程体验测试',
    steps: [
        {
            title: '步骤一',
            description: '登录手机银行 APP-点击首页-全部-投资理财-黄金积存，签约黄金积存业务。',
            expectedResult: '签约黄金账户成功。',
        },
        {
            title: '步骤二',
            description: '进入黄金积存主页-买入-发起实时/委托买入操作',
            expectedResult: '买入黄金成功/挂单买入委托成功。',
        },
        {
            title: '步骤三',
            description: '进入黄金积存主页-卖出-发起实时/委托卖出操作',
            expectedResult: '卖出黄金成功/挂单卖出委托成功。',
        },
    ],
};

export default function TestCaseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const caseId = params.caseId as string;
    const taskId = params.id as string;

    // Tab state
    const [activeTab, setActiveTab] = useState('steps');

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDefectId, setEditingDefectId] = useState<string | null>(null);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [selectedDefectForDuplicate, setSelectedDefectForDuplicate] = useState<any>(null);
    const [duplicateDefectItems, setDuplicateDefectItems] = useState<DuplicateDefectItem[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        defectType: '',
        relatedStep: [] as string[],
        description: '',
    });

    // 用例步骤附件上传状态
    const [caseUploadedFiles, setCaseUploadedFiles] = useState<Array<{ url: string; isVideo: boolean }>>([]);
    const [isCaseUploading, setIsCaseUploading] = useState(false);

    // 用例步骤预览状态
    const [isCasePreviewOpen, setIsCasePreviewOpen] = useState(false);
    const [casePreviewIndex, setCasePreviewIndex] = useState(0);

    // 缺陷弹窗附件上传状态
    const [defectUploadedFiles, setDefectUploadedFiles] = useState<Array<{ url: string; isVideo: boolean }>>([]);
    const [isDefectUploading, setIsDefectUploading] = useState(false);

    const { showErrorToast, showSuccessToast } = useCustomToast();
    const utils = api.useUtils();

    // Fetch task data to check if user has claimed the task
    const { data: taskData } = api.taskPublish.getById.useQuery(
        { id: taskId },
        { enabled: !!taskId }
    );
    const hasClaimedTask = taskData?.taskStatus === 'status2' || taskData?.taskStatus === 'status3';

    // Fetch real case data
    const { data: testCase, isLoading } = api.testCase.getById.useQuery(
        { id: caseId },
        { enabled: !!caseId }
    );

    // Fetch case attachments
    const { data: attachmentsData } = api.testCase.getAttachments.useQuery(
        { testCaseId: caseId },
        { enabled: !!caseId }
    );

    // Save attachments mutation
    const saveAttachments = api.testCase.saveAttachments.useMutation({
        onSuccess: () => {
            showSuccessToast('附件保存成功');
        },
        onError: (error) => {
            showErrorToast('附件保存失败: ' + error.message);
        },
    });

    // Load attachments when data is fetched
    React.useEffect(() => {
        if (attachmentsData?.data) {
            const loadedFiles = attachmentsData.data.map((url: string) => ({
                url,
                isVideo: url.includes('.mp4') || url.includes('.mov') || url.includes('.avi'),
            }));
            setCaseUploadedFiles(loadedFiles);
        }
    }, [attachmentsData]);

    // Fetch user's defects for this task and case
    const { data: defectsData, refetch: refetchDefects } = api.defect.listByTask.useQuery(
        { taskId: taskId, page: 1, pageSize: 100 },
        { enabled: !!taskId }
    );

    // Filter defects for current case
    const caseDefects = defectsData?.data?.filter(d => d.testCaseId === caseId) || [];

    // Get duplicate group detail when a defect is selected
    const { data: duplicateGroupData } = api.defect.getDuplicateGroupDetail.useQuery(
        { groupId: selectedDefectForDuplicate?.duplicateGroupId || '' },
        { enabled: !!selectedDefectForDuplicate?.duplicateGroupId }
    );

    // Convert duplicate group data to DuplicateDefectItem format
    React.useEffect(() => {
        if (duplicateGroupData?.duplicateDefects) {
            const items: DuplicateDefectItem[] = duplicateGroupData.duplicateDefects.map((defect: any) => ({
                id: defect.id,
                number: defect.id,
                points: defect.earnedPoints || 0,
                type: defect.type === 'BUG' ? 'defect' : 'suggestion',
                title: defect.title,
                description: defect.description,
                status: defect.status,
                severity: defect.severity,
                suggestionLevel: defect.suggestionLevel,
                attachments: defect.attachments || [],
                caseName: defect.testCase?.title || '',
                relatedSteps: defect.steps || '',
                reviewComment: defect.reviewComment || '',
                supplementaryExplanation: defect.judgmentReason || '',
                deviceModel: defect.deviceModel || '',
                system: defect.system || '',
                submitter: defect.user?.name || '',
                submitTime: new Date(defect.createdAt).toLocaleString('zh-CN'),
            }));
            setDuplicateDefectItems(items);
        }
    }, [duplicateGroupData]);

    // Create defect mutation
    const createDefect = api.defect.create.useMutation({
        onSuccess: (data) => {
            console.log('Defect created successfully:', data);
            setIsDialogOpen(false);
            setEditingDefectId(null);
            // Reset form
            setFormData({ title: '', defectType: '', relatedStep: [], description: '' });
            setDefectUploadedFiles([]);
            // Show success message
            showSuccessToast(data.message);
            // Refetch defects and switch to feedback tab
            refetchDefects();
            setActiveTab('feedback');
        },
        onError: (error) => {
            console.error('Failed to create defect:', error);
            showErrorToast('提交失败: ' + error.message);
        },
    });

    // Update defect mutation
    const updateDefect = api.defect.update.useMutation({
        onSuccess: (data) => {
            setIsDialogOpen(false);
            setEditingDefectId(null);
            setFormData({ title: '', defectType: '', relatedStep: [], description: '' });
            setDefectUploadedFiles([]);
            showSuccessToast(data.message);
            refetchDefects();
        },
        onError: (error) => {
            showErrorToast('更新失败: ' + error.message);
        },
    });

    // Delete defect mutation
    const deleteDefect = api.defect.delete.useMutation({
        onSuccess: (data) => {
            showSuccessToast(data.message);
            refetchDefects();
        },
        onError: (error) => {
            showErrorToast('删除失败: ' + error.message);
        },
    });

    const handleBack = () => {
        router.push(`/crowdsource/task-hall/${taskId}`);
    };

    // Parse test steps from JSON string
    const parseTestSteps = (stepsJson: string | null | undefined) => {
        if (!stepsJson) return [];
        try {
            const parsed = JSON.parse(stepsJson);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    // Parse preparation from precondition
    const parsePreparation = (precondition: string | null | undefined) => {
        if (!precondition) return [];
        return precondition.split('\n').filter(line => line.trim());
    };

    const caseDetail = testCase ? {
        id: testCase.id,
        title: testCase.title,
        preparation: parsePreparation(testCase.precondition),
        focus: testCase.explanation || '',
        testData: testCase.testData?.[0]?.dataValue || '',
        steps: parseTestSteps(testCase.testSteps),
    } : mockTestCaseDetail;

    // Handle case file upload (用例步骤附件上传)
    const handleCaseFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsCaseUploading(true);

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
                const newFiles = [...caseUploadedFiles, ...successfulUploads];
                setCaseUploadedFiles(newFiles);
                showSuccessToast(`成功上传 ${successfulUploads.length} 个文件`);

                // Save attachments to database
                const attachmentUrls = newFiles.map(f => f.url);
                saveAttachments.mutate({
                    testCaseId: caseId,
                    attachments: attachmentUrls,
                });
            }
        } catch (error) {
            console.error('Upload error:', error);
            showErrorToast('文件上传失败');
        } finally {
            setIsCaseUploading(false);
            e.target.value = '';
        }
    };

    // Handle case remove file
    const handleCaseRemoveFile = (index: number) => {
        const newFiles = caseUploadedFiles.filter((_, i) => i !== index);
        setCaseUploadedFiles(newFiles);

        // Save updated attachments to database
        const attachmentUrls = newFiles.map(f => f.url);
        saveAttachments.mutate({
            testCaseId: caseId,
            attachments: attachmentUrls,
        });
    };

    // Handle case preview open
    const handleCasePreviewOpen = (index: number) => {
        setCasePreviewIndex(index);
        setIsCasePreviewOpen(true);
    };

    // Handle case preview close
    const handleCasePreviewClose = () => {
        setIsCasePreviewOpen(false);
    };

    // Handle case preview navigation
    const handleCasePreviewNavigate = (direction: 'prev' | 'next') => {
        if (direction === 'prev' && casePreviewIndex > 0) {
            setCasePreviewIndex(casePreviewIndex - 1);
        } else if (direction === 'next' && casePreviewIndex < caseUploadedFiles.length - 1) {
            setCasePreviewIndex(casePreviewIndex + 1);
        }
    };

    // Handle defect file upload (缺陷弹窗附件上传)
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

    // Handle defect remove file
    const handleDefectRemoveFile = (index: number) => {
        setDefectUploadedFiles(defectUploadedFiles.filter((_, i) => i !== index));
    };

    // Handle form submit
    const handleSubmit = (isDraft: boolean) => {
        // Validate required fields
        if (!formData.title.trim()) {
            showErrorToast('请输入标题');
            return;
        }
        if (!formData.defectType) {
            showErrorToast('请选择缺陷类型');
            return;
        }
        if (!formData.relatedStep || formData.relatedStep.length === 0) {
            showErrorToast('请选择关联步骤');
            return;
        }
        if (!formData.description.trim()) {
            showErrorToast('请输入描述');
            return;
        }

        // 按步骤顺序排序
        const sortedSteps = formData.relatedStep.sort((a, b) => {
            // 提取步骤号
            const aNum = parseInt(a.match(/\d+/)?.[0] || '0')
            const bNum = parseInt(b.match(/\d+/)?.[0] || '0')
            return aNum - bNum
        })

        // Check if editing or creating
        if (editingDefectId) {
            // Update existing defect
            updateDefect.mutate({
                id: editingDefectId,
                title: formData.title,
                description: formData.description,
                type: formData.defectType === '缺陷' ? 'BUG' : 'SUGGESTION',
                relatedStep: sortedSteps.join('、'),
                attachments: defectUploadedFiles.map(f => f.url),
                isDraft: isDraft,
            });
        } else {
            // Create new defect
            createDefect.mutate({
                taskId: taskId,
                testCaseId: caseId,
                title: formData.title,
                description: formData.description,
                type: formData.defectType === '缺陷' ? 'BUG' : 'SUGGESTION',
                relatedStep: sortedSteps.join('、'),
                attachments: defectUploadedFiles.map(f => f.url),
                isDraft: isDraft,
            });
        }
    };

    // Handle edit click
    const handleEdit = (defectId: string) => {
        const defect = caseDefects.find(d => d.id === defectId);
        if (!defect) return;

        setEditingDefectId(defectId);
        setFormData({
            title: defect.title,
            defectType: defect.type === 'BUG' ? '缺陷' : '建议',
            relatedStep: defect.steps ? defect.steps.split('、') : [],
            description: defect.description,
        });

        // Parse attachments
        const attachments = (defect.attachments as string[])?.map((url) => ({
            url: url,
            isVideo: url.includes('.mp4') || url.includes('.mov'),
        })) || [];
        setDefectUploadedFiles(attachments);

        setIsDialogOpen(true);
    };

    // Handle delete click
    const handleDelete = (defectId: string) => {
        if (confirm('确定要删除这条反馈吗？')) {
            deleteDefect.mutate({ id: defectId });
        }
    };

    // Handle download all
    const handleDownloadAll = (defectId: string) => {
        const defect = caseDefects.find(d => d.id === defectId);
        if (!defect) return;

        const attachments = defect.attachments as string[];
        if (!attachments || attachments.length === 0) {
            showErrorToast('没有可下载的附件');
            return;
        }

        attachments.forEach((url, index) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = url;
                link.download = `attachment-${index + 1}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, index * 100);
        });
    };

    // Handle add new defect
    const handleAddDefect = () => {
        setEditingDefectId(null);
        setFormData({ title: '', defectType: '', relatedStep: [], description: '' });
        // Keep the uploaded files from the test steps section
        // setUploadedFiles([]);
        setIsDialogOpen(true);
    };

    return (
        <Box bg={COLORS.bgTertiary} minH="100vh" display="flex" flexDirection="column">
            {/* Main Content */}
            <Box flex="1">
                <Container maxW="1200px" px={6} py={4}>
                    {/* Breadcrumb */}
                    <Flex align="center" gap={2} mb={4} fontSize="14px" color={COLORS.textSecondary}>
                        <Box cursor="pointer" _hover={{ color: COLORS.textPrimary }} onClick={handleBack}>
                            <LuMenu size={16} />
                        </Box>
                        <Text>/</Text>
                        <Text cursor="pointer" _hover={{ color: COLORS.primary }} onClick={() => router.push('/crowdsource/task-hall')}>
                            任务大厅
                        </Text>
                        <Text>/</Text>
                        <Text cursor="pointer" _hover={{ color: COLORS.primary }} onClick={handleBack}>
                            任务详情
                        </Text>
                        <Text>/</Text>
                        <Text color={COLORS.textPrimary}>用例详情</Text>
                    </Flex>

                    {/* Case Title Card */}
                    <Box
                        bg={COLORS.lightBg}
                        borderRadius="8px"
                        p={6}
                        mb={4}
                        border="1px solid"
                        borderColor={COLORS.borderColor}
                        display="flex"
                        alignItems="center"
                        gap={3}
                    >
                        <Image src="/images/review/caseDetail-icon.png" alt="" width="14px" height="14px" />
                        <Text fontSize="18px" fontWeight="600" color={COLORS.textPrimary} flex="1">
                            {caseDetail.title}
                        </Text>
                        {hasClaimedTask && (
                            <Button
                                bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                                color="white"
                                fontSize="14px"
                                fontWeight="500"
                                px={6}
                                py={2}
                                h="auto"
                                borderRadius="24px"
                                _hover={{
                                    opacity: 0.9,
                                }}
                                onClick={handleAddDefect}
                            >
                                添加缺陷/建议
                            </Button>
                        )}
                    </Box>

                    {/* Tabs */}
                    <Box
                        bg={COLORS.bgPrimary}
                        borderRadius="8px"
                        border="1px solid"
                        borderColor={COLORS.borderColor}
                        overflow="hidden"
                    >
                        <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
                            <Tabs.List
                                bg={COLORS.bgSecondary}
                            >
                                <Tabs.Trigger
                                    value="steps"
                                    px={6}
                                    py={3}
                                    fontSize="16px"
                                    fontWeight="500"
                                    color={COLORS.textSecondary}
                                    borderBottom="2px solid transparent"
                                    _selected={{
                                        color: COLORS.primary,
                                        borderBottomColor: COLORS.primary,
                                        _before: {
                                            bg: 'transparent',
                                        }
                                    }}
                                    _before={{
                                        bg: 'transparent',
                                    }}
                                >
                                    用例步骤
                                </Tabs.Trigger>
                                <Tabs.Trigger
                                    value="feedback"
                                    px={6}
                                    py={3}
                                    fontSize="16px"
                                    fontWeight="500"
                                    color={COLORS.textSecondary}
                                    borderBottom="2px solid transparent"
                                    _selected={{
                                        color: COLORS.primary,
                                        borderBottomColor: COLORS.primary,
                                        _before: {
                                            bg: 'transparent',
                                        }
                                    }}
                                    _before={{
                                        bg: 'transparent',
                                    }}
                                >
                                    我的反馈
                                </Tabs.Trigger>
                            </Tabs.List>

                            <Tabs.Content value="steps" p={6}>
                                <VStack gap={4} align="stretch">
                                    {/* Test Preparation */}
                                    {caseDetail.preparation.length > 0 && (
                                        <Box>
                                            <Text fontSize="18px" fontWeight="600" color={COLORS.textPrimary} mb={4}>
                                                测试准备
                                            </Text>
                                            <VStack align="stretch" gap={2}>
                                                {caseDetail.preparation.map((item, index) => (
                                                    <Text
                                                        key={index}
                                                        fontSize="14px"
                                                        color={COLORS.textSecondary}
                                                        lineHeight="1.7"
                                                        textAlign="justify"
                                                    >
                                                        {item}
                                                    </Text>
                                                ))}
                                            </VStack>
                                        </Box>
                                    )}

                                    {/* Focus Points */}
                                    {caseDetail.focus && (
                                        <Box>
                                            <Text fontSize="18px" fontWeight="600" color={COLORS.textPrimary} mb={4}>
                                                重点关注
                                            </Text>
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.textSecondary}
                                                lineHeight="1.7"
                                                textAlign="justify"
                                            >
                                                {caseDetail.focus}
                                            </Text>
                                        </Box>
                                    )}

                                    {/* Test Data */}
                                    {caseDetail.testData && (
                                        <Box>
                                            <Text fontSize="18px" fontWeight="600" color={COLORS.textPrimary} mb={4}>
                                                测试数据
                                            </Text>
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.textSecondary}
                                                lineHeight="1.7"
                                                textAlign="justify"
                                            >
                                                {caseDetail.testData}
                                            </Text>
                                        </Box>
                                    )}

                                    {/* Test Steps */}
                                    {caseDetail.steps.length > 0 && (
                                        <Box>
                                            <VStack align="stretch" gap={6}>
                                                {caseDetail.steps.map((step, index) => (
                                                    <VStack key={index} align="stretch" gap={3}>
                                                        <Text fontSize="18px" fontWeight="600" color={COLORS.textPrimary}>
                                                            {step.title || `步骤${index + 1}`}
                                                        </Text>
                                                        <VStack align="stretch" gap={2}>
                                                            <HStack align="flex-start" gap={2}>
                                                                <Text
                                                                    fontSize="14px"
                                                                    color={COLORS.textSecondary}
                                                                    flexShrink={0}
                                                                    fontWeight="500"
                                                                >
                                                                    操作步骤：
                                                                </Text>
                                                                <Text
                                                                    fontSize="14px"
                                                                    color={COLORS.textSecondary}
                                                                    lineHeight="1.7"
                                                                    textAlign="justify"
                                                                >
                                                                    {step.description}
                                                                </Text>
                                                            </HStack>
                                                            <HStack align="flex-start" gap={2}>
                                                                <Text
                                                                    fontSize="14px"
                                                                    color={COLORS.textSecondary}
                                                                    flexShrink={0}
                                                                    fontWeight="500"
                                                                >
                                                                    预期结果：
                                                                </Text>
                                                                <Text
                                                                    fontSize="14px"
                                                                    color={COLORS.textSecondary}
                                                                    lineHeight="1.7"
                                                                    textAlign="justify"
                                                                >
                                                                    {step.expectedResult}
                                                                </Text>
                                                            </HStack>
                                                        </VStack>
                                                        {index < caseDetail.steps.length - 1 && (
                                                            <Box borderBottom="1px solid" borderColor={COLORS.borderColor} />
                                                        )}
                                                    </VStack>
                                                ))}
                                            </VStack>
                                        </Box>
                                    )}

                                    {/* Upload Images/Videos Section */}
                                    <Box>
                                        <Text fontSize="18px" fontWeight="600" color={COLORS.textPrimary} mb={4}>
                                            上传图片或视频
                                        </Text>
                                        <Box
                                            border="1px dashed"
                                            borderColor={COLORS.borderColor}
                                            borderRadius="8px"
                                            p={6}
                                            textAlign="center"
                                            cursor={isCaseUploading ? "not-allowed" : "pointer"}
                                            _hover={{ borderColor: isCaseUploading ? COLORS.borderColor : COLORS.primary }}
                                            position="relative"
                                            opacity={isCaseUploading ? 0.6 : 1}
                                            bg={COLORS.bgSecondary}
                                        >
                                            <Input
                                                type="file"
                                                accept="image/*,video/*"
                                                multiple
                                                onChange={handleCaseFileUpload}
                                                position="absolute"
                                                top="0"
                                                left="0"
                                                width="100%"
                                                height="100%"
                                                opacity="0"
                                                cursor={isCaseUploading ? "not-allowed" : "pointer"}
                                                disabled={isCaseUploading}
                                            />
                                            <VStack gap={3}>
                                                <Box
                                                    w="120px"
                                                    h="120px"
                                                    bg={COLORS.bgPrimary}
                                                    borderRadius="8px"
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    mx="auto"
                                                >
                                                    <LuImage size={48} color={COLORS.textTertiary} />
                                                </Box>
                                                <Text fontSize="14px" color={COLORS.textSecondary} fontWeight="500">
                                                    {isCaseUploading ? '上传中...' : '上传图片或视频'}
                                                </Text>
                                            </VStack>
                                        </Box>

                                        {/* File Preview Grid */}
                                        {caseUploadedFiles.length > 0 && (
                                            <Flex gap={4} mt={4} flexWrap="wrap">
                                                {caseUploadedFiles.map((file, index) => (
                                                    <Box
                                                        key={index}
                                                        position="relative"
                                                        width="120px"
                                                        height="120px"
                                                        borderRadius="8px"
                                                        overflow="hidden"
                                                        border="1px solid"
                                                        borderColor={COLORS.borderColor}
                                                    >
                                                        <Box
                                                            width="100%"
                                                            height="100%"
                                                            position="relative"
                                                            cursor="pointer"
                                                            onClick={() => handleCasePreviewOpen(index)}
                                                        >
                                                            {file.isVideo ? (
                                                                <>
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
                                                                        bottom="4px"
                                                                        right="4px"
                                                                        fontSize="12px"
                                                                        bg="rgba(0,0,0,0.7)"
                                                                        color="white"
                                                                        px={2}
                                                                        py={1}
                                                                        borderRadius="4px"
                                                                    >
                                                                        视频
                                                                    </Text>
                                                                </>
                                                            ) : (
                                                                <Image
                                                                    src={file.url}
                                                                    alt={`preview-${index}`}
                                                                    width="100%"
                                                                    height="100%"
                                                                    objectFit="cover"
                                                                />
                                                            )}
                                                        </Box>
                                                        <IconButton
                                                            position="absolute"
                                                            top="4px"
                                                            right="4px"
                                                            size="sm"
                                                            bg="rgba(0,0,0,0.6)"
                                                            color="white"
                                                            _hover={{ bg: "rgba(0,0,0,0.8)" }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCaseRemoveFile(index);
                                                            }}
                                                            aria-label="Remove file"
                                                        >
                                                            <LuX size={16} />
                                                        </IconButton>
                                                    </Box>
                                                ))}
                                            </Flex>
                                        )}
                                    </Box>
                                </VStack>
                            </Tabs.Content>

                            <Tabs.Content value="feedback" p={6}>
                                <VStack gap={4} align="stretch">
                                    {caseDefects.length === 0 ? (
                                        <Box textAlign="center" py={8}>
                                            <Text fontSize="14px" color={COLORS.textTertiary}>
                                                暂无反馈记录
                                            </Text>
                                        </Box>
                                    ) : (
                                        caseDefects.map((defect, index) => (
                                            <DefectCard
                                                key={defect.id}
                                                index={index + 1}
                                                defectId={defect.id}
                                                score={0}
                                                relatedCount={0}
                                                title={defect.title}
                                                description={defect.description}
                                                attachments={(defect.attachments as string[])?.map((url, idx) => ({
                                                    id: `${idx}`,
                                                    url: url,
                                                    isVideo: url.includes('.mp4') || url.includes('.mov'),
                                                })) || []}
                                                relatedSteps={defect.steps ? defect.steps.split('、') : []}
                                                reviewComment={defect.reviewComment || ''}
                                                additionalNote={defect.judgmentReason || ''}
                                                submittedAt={new Date(defect.createdAt).toLocaleString('zh-CN')}
                                                isSaved={!defect.isDraft}
                                                status={defect.status}
                                                type={defect.type}
                                                severity={defect.severity}
                                                suggestionLevel={defect.suggestionLevel}
                                                earnedPoints={defect.earnedPoints}
                                                onEdit={() => handleEdit(defect.id)}
                                                onDelete={() => handleDelete(defect.id)}
                                                onDownloadAll={() => handleDownloadAll(defect.id)}
                                                onAssociateDuplicate={() => {
                                                    setSelectedDefectForDuplicate(defect);
                                                    setIsDuplicateModalOpen(true);
                                                }}
                                                testCaseSteps={caseDetail.steps}
                                            />
                                        ))
                                    )}
                                </VStack>
                            </Tabs.Content>
                        </Tabs.Root>
                    </Box>
                </Container>
            </Box>

            {/* Footer */}
            <Box bg="#1D2129" py={4}>
                <Text textAlign="center" fontSize="14px" color={COLORS.textTertiary}>
                    备案信息
                </Text>
            </Box>

            {/* Case Attachment Preview Dialog */}
            <DialogRoot open={isCasePreviewOpen} onOpenChange={(e) => setIsCasePreviewOpen(e.open)} size="full">
                <DialogBackdrop />
                <DialogContent
                    maxW="90vw"
                    maxH="90vh"
                    borderRadius="8px"
                    bg="rgba(0, 0, 0, 0.95)"
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    p={0}
                >
                    <DialogBody p={0} position="relative" display="flex" alignItems="center" justifyContent="center" height="100%">
                        {/* Close Button */}
                        <IconButton
                            position="absolute"
                            top="20px"
                            right="20px"
                            aria-label="Close preview"
                            onClick={handleCasePreviewClose}
                            bg="rgba(255, 255, 255, 0.1)"
                            color="white"
                            _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
                            size="lg"
                            zIndex={10}
                        >
                            <LuX size={24} />
                        </IconButton>

                        {/* Download Button */}
                        <IconButton
                            position="absolute"
                            top="20px"
                            right="80px"
                            aria-label="Download"
                            onClick={(e) => {
                                e.stopPropagation();
                                const link = document.createElement('a');
                                const currentFile = caseUploadedFiles[casePreviewIndex];
                                if (currentFile) {
                                    link.href = currentFile.url;
                                    link.download = `attachment-${casePreviewIndex + 1}${currentFile.isVideo ? '.mp4' : '.jpg'}`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }
                            }}
                            bg="rgba(255, 255, 255, 0.1)"
                            color="white"
                            _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
                            size="lg"
                            zIndex={10}
                        >
                            <LuDownload size={24} />
                        </IconButton>

                        {/* Navigation Buttons */}
                        {casePreviewIndex > 0 && (
                            <IconButton
                                position="absolute"
                                left="20px"
                                top="50%"
                                transform="translateY(-50%)"
                                aria-label="Previous"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCasePreviewNavigate('prev');
                                }}
                                bg="rgba(255, 255, 255, 0.1)"
                                color="white"
                                _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
                                size="lg"
                                zIndex={10}
                            >
                                <LuChevronLeft size={24} />
                            </IconButton>
                        )}

                        {casePreviewIndex < caseUploadedFiles.length - 1 && (
                            <IconButton
                                position="absolute"
                                right="20px"
                                top="50%"
                                transform="translateY(-50%)"
                                aria-label="Next"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCasePreviewNavigate('next');
                                }}
                                bg="rgba(255, 255, 255, 0.1)"
                                color="white"
                                _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
                                size="lg"
                                zIndex={10}
                            >
                                <LuChevronRight size={24} />
                            </IconButton>
                        )}

                        {/* Current File Display */}
                        {caseUploadedFiles.length > 0 && (
                            <Box display="flex" alignItems="center" justifyContent="center" width="100%" height="100%">
                                {caseUploadedFiles[casePreviewIndex]?.isVideo ? (
                                    <video
                                        src={caseUploadedFiles[casePreviewIndex]?.url}
                                        controls
                                        autoPlay
                                        style={{
                                            maxWidth: '90vw',
                                            maxHeight: '80vh',
                                            objectFit: 'contain',
                                        }}
                                    >
                                        您的浏览器不支持视频播放
                                    </video>
                                ) : (
                                    <Image
                                        src={caseUploadedFiles[casePreviewIndex]?.url}
                                        alt={`preview-${casePreviewIndex}`}
                                        maxW="90vw"
                                        maxH="80vh"
                                        objectFit="contain"
                                    />
                                )}
                            </Box>
                        )}

                        {/* File Counter */}
                        {caseUploadedFiles.length > 1 && (
                            <Text
                                position="absolute"
                                bottom="20px"
                                left="50%"
                                transform="translateX(-50%)"
                                color="white"
                                fontSize="14px"
                                bg="rgba(0, 0, 0, 0.5)"
                                px={3}
                                py={1}
                                borderRadius="full"
                                zIndex={10}
                            >
                                {casePreviewIndex + 1} / {caseUploadedFiles.length}
                            </Text>
                        )}
                    </DialogBody>
                </DialogContent>
            </DialogRoot>

            {/* Add Defect/Suggestion Dialog */}
            <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)} size="xl">
                <DialogBackdrop />
                <DialogContent maxW="600px" borderRadius="8px"
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)">
                    <DialogHeader
                        fontSize="18px"
                        fontWeight="600"
                        color={COLORS.textPrimary}
                        borderBottom="1px solid"
                        borderColor={COLORS.borderColor}
                        pb={4}
                    >
                        {editingDefectId ? '编辑缺陷/建议' : '添加缺陷/建议'}
                    </DialogHeader>
                    <DialogCloseTrigger />
                    <DialogBody py={6}>
                        <VStack gap={4} align="stretch">
                            {/* Title */}
                            <Box>
                                <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} mb={2}>
                                    标题 <Text as="span" color={COLORS.primary}>*</Text>
                                </Text>
                                <Input
                                    placeholder="请输入标题"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    fontSize="14px"
                                    borderColor={COLORS.borderColor}
                                    _focus={{ borderColor: COLORS.primary }}
                                />
                            </Box>

                            {/* Defect Type and Related Step */}
                            <HStack gap={4}>
                                <Box flex="1">
                                    <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} mb={2}>
                                        缺陷类型 <Text as="span" color={COLORS.primary}>*</Text>
                                    </Text>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            value={formData.defectType}
                                            onChange={(e) => setFormData({ ...formData, defectType: e.target.value })}
                                            fontSize="14px"
                                            borderColor={COLORS.borderColor}
                                            _focus={{ borderColor: COLORS.primary }}
                                        >
                                            <option value="">请选择缺陷类型</option>
                                            <option value="缺陷">缺陷</option>
                                            <option value="建议">建议</option>
                                        </NativeSelect.Field>
                                    </NativeSelect.Root>
                                </Box>

                                <Box flex="1">
                                    <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} mb={2}>
                                        关联步骤 <Text as="span" color={COLORS.primary}>*</Text>
                                    </Text>
                                    <Box
                                        border="1px solid"
                                        borderColor={COLORS.borderColor}
                                        borderRadius="md"
                                        p={2}
                                        maxH="120px"
                                        overflowY="auto"
                                    >
                                        <VStack align="stretch" gap={1}>
                                            {caseDetail.steps.map((step, index) => {
                                                const stepValue = step.title || `步骤${index + 1}`;
                                                const isSelected = formData.relatedStep.includes(stepValue);
                                                return (
                                                    <Box
                                                        key={index}
                                                        as="label"
                                                        display="flex"
                                                        alignItems="center"
                                                        cursor="pointer"
                                                        p={1}
                                                        borderRadius="sm"
                                                        _hover={{ bg: "gray.50" }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setFormData({
                                                                        ...formData,
                                                                        relatedStep: [...formData.relatedStep, stepValue]
                                                                    });
                                                                } else {
                                                                    setFormData({
                                                                        ...formData,
                                                                        relatedStep: formData.relatedStep.filter(s => s !== stepValue)
                                                                    });
                                                                }
                                                            }}
                                                            style={{ marginRight: '8px' }}
                                                        />
                                                        <Text fontSize="14px" color={COLORS.textSecondary}>
                                                            {stepValue}
                                                        </Text>
                                                    </Box>
                                                );
                                            })}
                                        </VStack>
                                    </Box>
                                </Box>
                            </HStack>

                            {/* Description */}
                            <Box>
                                <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} mb={2}>
                                    描述 <Text as="span" color={COLORS.primary}>*</Text>
                                </Text>
                                <Textarea
                                    placeholder="请输入详细描述"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    fontSize="14px"
                                    borderColor={COLORS.borderColor}
                                    _focus={{ borderColor: COLORS.primary }}
                                    minH="120px"
                                    resize="vertical"
                                />
                            </Box>

                            {/* File Upload (Images and Videos) */}
                            <Box>
                                <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} mb={2}>
                                    上传图片/视频
                                </Text>
                                <Box
                                    border="1px dashed"
                                    borderColor={COLORS.borderColor}
                                    borderRadius="8px"
                                    p={4}
                                    textAlign="center"
                                    cursor={isDefectUploading ? "not-allowed" : "pointer"}
                                    _hover={{ borderColor: isDefectUploading ? COLORS.borderColor : COLORS.primary }}
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
                                        <LuUpload size={24} color={COLORS.textTertiary} />
                                        <Text fontSize="14px" color={COLORS.textSecondary}>
                                            {isDefectUploading ? '上传中...' : '点击或拖拽图片/视频到此处上传'}
                                        </Text>
                                        <Text fontSize="12px" color={COLORS.textTertiary}>
                                            支持 JPG、PNG、MP4、MOV 等格式
                                        </Text>
                                        <Text fontSize="12px" color={COLORS.textTertiary}>
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
                                                borderColor={COLORS.borderColor}
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
                                                    onClick={() => handleDefectRemoveFile(index)}
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
                                    borderColor={COLORS.borderColor}
                                    color={COLORS.textSecondary}
                                    _hover={{ borderColor: COLORS.primary, color: COLORS.primary }}
                                    onClick={() => handleSubmit(true)}
                                    disabled={createDefect.isPending || updateDefect.isPending}
                                >
                                    保存草稿
                                </Button>
                                <Button
                                    bg={COLORS.primary}
                                    color="white"
                                    fontSize="14px"
                                    px={6}
                                    _hover={{ bg: '#C41020' }}
                                    onClick={() => handleSubmit(false)}
                                    disabled={createDefect.isPending || updateDefect.isPending}
                                    loading={createDefect.isPending || updateDefect.isPending}
                                >
                                    提交
                                </Button>
                            </HStack>
                        </VStack>
                    </DialogBody>
                </DialogContent>
            </DialogRoot>

            {/* Associate Duplicate Modal */}
            <DuplicateDefectsModal
                isOpen={isDuplicateModalOpen}
                onClose={() => {
                    setIsDuplicateModalOpen(false);
                    setSelectedDefectForDuplicate(null);
                    setDuplicateDefectItems([]);
                }}
                title="关联重复缺陷"
                items={duplicateDefectItems}
                onPreview={() => { }}
                onDownloadAll={() => { }}
            />
        </Box>
    );
}
