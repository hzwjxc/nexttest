'use client';

import React, { useState } from 'react';
import {
    Box,
    Container,
    Flex,
    Text,
    VStack,
    HStack,
    Image,
    Spinner,
    IconButton,
} from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import { LuMenu, LuX, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { Checkbox } from '@/app/_components/ui/checkbox';
import { api } from '@/trpc/react';
import {
    DialogRoot,
    DialogContent,
    DialogBody,
} from '@/app/_components/ui/dialog';
import {
    DuplicateDefectsModal,
    type DuplicateDefectItem,
} from '@/app/_components/ui/duplicate-defects-modal';

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
    green: '#00B42A',
};

// Tab item type
interface TabItem {
    label: string;
    key: string;
}

const tabs: TabItem[] = [
    { label: '用例详情', key: 'case' },
    { label: '缺陷详情', key: 'defect' },
    { label: '订单跟踪', key: 'tracking' },
];

// Order Detail type
interface OrderDetail {
    id: string;
    caseName: string;
    channel: string;
    claimTime: string;
    submitter: string;
    estimatedPoints: number;
    preparation: string[];
    focus: string;
    steps: Array<{
        title: string;
        description: string;
        expectedResult: string;
    }>;
    images: string[];
}

// Order tracking step type
interface TrackingStep {
    id: string;
    title: string;
    timestamp: string | null;
    isCompleted: boolean;
    isActive: boolean;
}
// Defect item type
interface DefectItem {
    id: string;
    number: string;
    points: number;
    duplicateCount: number;
    type: 'defect' | 'suggestion';
    status: string;
    statusColor: string;
    title: string;
    description: string;
    caseTitle: string;
    relatedSteps: string;
    reviewComment: string;
    supplementaryNote?: string;
    deviceModel: string;
    system: string;
    submitter: string;
    submitTime: string;
    attachments: string[];
}

// Mock order detail data
const mockOrderDetail: OrderDetail = {
    id: '1',
    caseName: '黄金积存-个人网银用例',
    channel: '小程序',
    claimTime: '2024-09-10 12:32:19',
    submitter: '众测小助手',
    estimatedPoints: 4000,
    preparation: [
        '1、已下载手机银行 APP，且绑定广发借记卡；',
        '2、更改结算账户：不支持绑定2张及以上结算账号；',
        '3、执行步骤7：销户条件需满足无余额、无定投计划、无挂单。',
    ],
    focus: '对"黄金积存"功能进行全流程体验测试',
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
    images: ['/images/task-hall/banner1.jpg', '/images/task-hall/banner2.jpg'],
};

// Mock defect data
const mockDefects: DefectItem[] = [
    {
        id: '1',
        number: 'O1234567890',
        points: 300,
        duplicateCount: 5,
        type: 'defect',
        status: '未判断',
        statusColor: '#2067F6',
        title: '登录页输入账号显示空白',
        description: '前提：已注册账号\n执行步骤：1、登录界面，2、输入密码\n预期结果：输入的密码黑点显示',
        caseTitle: '黄金积存-个人网银用例',
        relatedSteps: '步骤一、步骤二、步骤三、步骤四',
        reviewComment: '',
        deviceModel: 'Redmi M2006C3LC',
        system: 'Android 11(720 x1600)',
        submitter: '张三',
        submitTime: '2024-09-12 24:32:00',
        attachments: ['/images/task-hall/banner1.jpg', '/images/task-hall/banner2.jpg'],
    },
    {
        id: '2',
        number: 'O1234567890',
        points: 300,
        duplicateCount: 5,
        type: 'suggestion',
        status: '优秀',
        statusColor: '#3AB385',
        title: '登录页输入账号显示空白',
        description: '前提：已注册账号\n执行步骤：1、登录界面，2、输入密码\n预期结果：输入的密码黑点显示',
        caseTitle: '黄金积存-个人网银用例',
        relatedSteps: '步骤一、步骤二、步骤三、步骤四',
        reviewComment: '',
        supplementaryNote: '',
        deviceModel: 'Redmi M2006C3LC',
        system: 'Android 11(720 x1600)',
        submitter: '张三',
        submitTime: '2024-09-12 24:32:00',
        attachments: ['/images/task-hall/banner1.jpg', '/images/task-hall/banner2.jpg'],
    },
];

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const reviewId = params.id as string;
    const orderId = params.orderId as string;
    const [activeTab, setActiveTab] = useState('case');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video'; allMedia: string[] }>({
        url: '',
        type: 'image',
        allMedia: [],
    });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [selectedDefectForDuplicate, setSelectedDefectForDuplicate] = useState<any>(null);
    const [duplicateItems, setDuplicateItems] = useState<DuplicateDefectItem[]>([]);

    // Fetch order details
    const { data: orderData, isLoading } = api.review.getOrderById.useQuery({
        orderId,
    });

    const order = orderData?.data;

    // Fetch data dictionaries
    const { data: defectSeverityDict } = api.dataDictionary.getByCode.useQuery('DEFECT_SEVERITY');
    const { data: suggestionLevelDict } = api.dataDictionary.getByCode.useQuery('SUGGESTION_LEVEL');

    // Fetch duplicate group details
    const { data: duplicateGroupData } = api.defect.getDuplicateGroupDetail.useQuery(
        { groupId: selectedDefectForDuplicate?.duplicateGroupId || '' },
        {
            enabled: isDuplicateModalOpen && !!selectedDefectForDuplicate?.duplicateGroupId,
        }
    );

    React.useEffect(() => {
        if (duplicateGroupData?.duplicateDefects) {
            const items: DuplicateDefectItem[] = duplicateGroupData.duplicateDefects
                .filter((d) => d.id !== selectedDefectForDuplicate?.id)
                .map((d) => ({
                    id: d.id,
                    number: d.id,
                    points: d.earnedPoints || 0,
                    type: d.type === 'BUG' ? 'defect' : 'suggestion',
                    title: d.title,
                    description: d.description || '',
                    status: d.status,
                    severity: d.severity,
                    suggestionLevel: d.suggestionLevel,
                    attachments: d.attachments || [],
                    caseName: d.testCase?.title || '',
                    relatedSteps: '',
                    reviewComment: d.judgmentReason || '',
                    supplementaryExplanation: '',
                    deviceModel: '',
                    system: '',
                    submitter: d.user?.name || '',
                    submitTime: d.createdAt ? new Date(d.createdAt).toLocaleString() : '',
                }));
            setDuplicateItems(items);
        }
    }, [duplicateGroupData, selectedDefectForDuplicate]);

    const handleBack = () => {
        router.push(`/crowdsource/review/${reviewId}`);
    };

    const handleMediaClick = (url: string, allMedia: string[]) => {
        const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.avi');
        const index = allMedia.indexOf(url);
        setPreviewMedia({ url, type: isVideo ? 'video' : 'image', allMedia });
        setCurrentIndex(index);
        setPreviewOpen(true);
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            const newUrl = previewMedia.allMedia[newIndex];
            const isVideo = newUrl?.includes('.mp4') || newUrl?.includes('.mov') || newUrl?.includes('.avi');
            setCurrentIndex(newIndex);
            setPreviewMedia({ ...previewMedia, url: newUrl!, type: isVideo ? 'video' : 'image' });
        }
    };

    const handleNext = () => {
        if (currentIndex < previewMedia.allMedia.length - 1) {
            const newIndex = currentIndex + 1;
            const newUrl = previewMedia.allMedia[newIndex];
            const isVideo = newUrl?.includes('.mp4') || newUrl?.includes('.mov') || newUrl?.includes('.avi');
            setCurrentIndex(newIndex);
            setPreviewMedia({ ...previewMedia, url: newUrl!, type: isVideo ? 'video' : 'image' });
        }
    };

    const handleDownloadAll = async (attachments: string[]) => {
        for (const url of attachments) {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = url.split('/').pop() || 'download';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
                // Add delay to avoid browser blocking multiple downloads
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error('Download failed:', error);
            }
        }
    };

    const handleShowDuplicateModal = (defect: any) => {
        setSelectedDefectForDuplicate(defect);
        setIsDuplicateModalOpen(true);
    };

    // Parse test steps from JSON string
    const parseTestSteps = (testStepsJson: string) => {
        try {
            return JSON.parse(testStepsJson);
        } catch (e) {
            return [];
        }
    };

    // Generate tracking steps based on order data
    const generateTrackingSteps = (order: any): TrackingStep[] => {
        if (!order) return [];

        // Find first defect submission time
        const firstDefectSubmitTime = order.defects && order.defects.length > 0
            ? order.defects[order.defects.length - 1]?.createdAt // defects are ordered by desc, so last is first
            : null;

        // Find first defect judgment time
        const firstDefectJudgedTime = order.defects?.find((d: any) => d.judgedAt)?.judgedAt || null;

        const steps: TrackingStep[] = [
            {
                id: '1',
                title: '任务领取',
                timestamp: order.createdAt ? new Date(order.createdAt).toLocaleString('zh-CN') : null,
                isCompleted: !!order.createdAt,
                isActive: false,
            },
            {
                id: '2',
                title: '缺陷提交',
                timestamp: firstDefectSubmitTime ? new Date(firstDefectSubmitTime).toLocaleString('zh-CN') : null,
                isCompleted: !!firstDefectSubmitTime,
                isActive: false,
            },
            {
                id: '3',
                title: '已判定',
                timestamp: firstDefectJudgedTime ? new Date(firstDefectJudgedTime).toLocaleString('zh-CN') : null,
                isCompleted: !!firstDefectJudgedTime,
                isActive: false,
            },
            {
                id: '4',
                title: '积分发放',
                timestamp: order.completedAt ? new Date(order.completedAt).toLocaleString('zh-CN') : null,
                isCompleted: !!order.completedAt,
                isActive: !!order.submittedAt && !order.completedAt,
            },
        ];

        return steps;
    };

    // Get all test cases for this task
    const testCases = order?.task?.testCases || [];
    const trackingSteps = generateTrackingSteps(order);

    if (isLoading) {
        return (
            <Box bg={COLORS.bgTertiary} minH="100vh" display="flex" alignItems="center" justifyContent="center">
                <Spinner size="xl" color={COLORS.primary} />
            </Box>
        );
    }

    if (!order) {
        return (
            <Box bg={COLORS.bgTertiary} minH="100vh" display="flex" alignItems="center" justifyContent="center">
                <Text>订单不存在</Text>
            </Box>
        );
    }

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
                        <Text cursor="pointer" _hover={{ color: COLORS.primary }} onClick={handleBack}>
                            众测审核
                        </Text>
                        <Text>/</Text>
                        <Text cursor="pointer" _hover={{ color: COLORS.primary }} onClick={handleBack}>
                            任务详情
                        </Text>
                        <Text>/</Text>
                        <Text color={COLORS.textPrimary}>订单详情</Text>
                    </Flex>

                    {/* Order Header Card */}
                    <Box
                        bg={COLORS.bgPrimary}
                        borderRadius="8px"
                        p={6}
                        mb={4}
                        border="1px solid"
                        borderColor={COLORS.borderColor}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                    >
                        <Flex gap={6} align="center" flex="1">
                            {/* Avatar */}
                            <Box
                                w="72px"
                                h="72px"
                                borderRadius="8px"
                                bg={COLORS.bgSecondary}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                position="relative"
                            >
                                <Image
                                    src="/images/review/xiaochengxu.png"
                                    alt=""
                                    w="32px"
                                    h="32px"
                                />
                            </Box>

                            {/* Order Info */}
                            <Flex direction="column" gap={4} flex="1">
                                {/* Row 1 */}
                                <HStack gap={12}>
                                    <HStack gap={2}>
                                        <Text fontSize="14px" color={COLORS.textTertiary}>
                                            订单领取渠道：
                                        </Text>
                                        <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary}>
                                            {order.task.testTypes.join('、')}
                                        </Text>
                                    </HStack>
                                    <HStack gap={2}>
                                        <Text fontSize="14px" color={COLORS.textTertiary}>
                                            领取时间：
                                        </Text>
                                        <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary}>
                                            {new Date(order.createdAt).toLocaleString('zh-CN')}
                                        </Text>
                                    </HStack>
                                </HStack>

                                {/* Row 2 */}
                                <HStack gap={12}>
                                    <HStack gap={2}>
                                        <Text fontSize="14px" color={COLORS.textTertiary}>
                                            提交人：
                                        </Text>
                                        <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary}>
                                            {order.user.name || order.user.phone}
                                        </Text>
                                    </HStack>
                                    <HStack gap={1}>
                                        <Text fontSize="14px" color={COLORS.textTertiary}>
                                            预计发放积分：
                                        </Text>
                                        <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary}>
                                            {order.expectedPoints || order.earnedPoints || 0}
                                        </Text>
                                        <Image
                                            src="/images/task-hall/jinbi.png"
                                            alt="积分"
                                            w="16px"
                                            h="16px"
                                        />
                                    </HStack>
                                </HStack>
                            </Flex>
                        </Flex>
                    </Box>

                    {/* Tab Navigation */}
                    <Box
                        bg={COLORS.bgPrimary}
                        borderRadius="8px"
                        borderColor={COLORS.borderColor}
                        overflow="hidden"
                        border="1px solid"
                    >
                        {/* Tabs */}
                        <Flex borderBottom="1px solid" borderColor={COLORS.borderColor} px={6}>
                            {tabs.map((tab) => (
                                <Box
                                    key={tab.key}
                                    px={4}
                                    py={4}
                                    cursor="pointer"
                                    position="relative"
                                    onClick={() => setActiveTab(tab.key)}
                                >
                                    <Text
                                        fontSize="14px"
                                        fontWeight={activeTab === tab.key ? '600' : '400'}
                                        color={activeTab === tab.key ? COLORS.textPrimary : COLORS.textSecondary}
                                    >
                                        {tab.label}
                                    </Text>
                                    {activeTab === tab.key && (
                                        <Box
                                            position="absolute"
                                            bottom="0"
                                            left="50%"
                                            transform="translateX(-50%)"
                                            w="40px"
                                            h="2px"
                                            bg={COLORS.primary}
                                        />
                                    )}
                                </Box>
                            ))}
                        </Flex>

                        {/* Tab Content - Case Details */}
                        {activeTab === 'case' && (
                            <Box p={6}>
                                {testCases.length > 0 ? (
                                    <VStack align="stretch" gap={8}>
                                        {testCases.map((testCase, caseIndex) => {
                                            const testSteps = testCase.testSteps ? parseTestSteps(testCase.testSteps) : [];

                                            return (
                                                <Box key={testCase.id}>
                                                    <VStack align="stretch" gap={6}>
                                                        {/* Case Title */}
                                                        <Box
                                                            bg={COLORS.lightBg}
                                                            borderRadius="8px"
                                                            p={4}
                                                            display="flex"
                                                            alignItems="center"
                                                            gap={3}
                                                        >
                                                            <Image src="/images/review/caseDetail-icon.png" alt="" width="14px" height="14px" />
                                                            <Text fontSize="16px" fontWeight="600" color={COLORS.textPrimary}>
                                                                {testCase.title}
                                                            </Text>
                                                        </Box>

                                                        {/* Test Preparation */}
                                                        {testCase.precondition && (
                                                            <Box>
                                                                <Text fontSize="16px" fontWeight="600" color={COLORS.textPrimary} mb={3}>
                                                                    测试准备
                                                                </Text>
                                                                <Text
                                                                    fontSize="14px"
                                                                    color={COLORS.textSecondary}
                                                                    lineHeight="1.7"
                                                                    textAlign="justify"
                                                                    whiteSpace="pre-wrap"
                                                                >
                                                                    {testCase.precondition}
                                                                </Text>
                                                            </Box>
                                                        )}

                                                        {/* Focus Points */}
                                                        {testCase.explanation && (
                                                            <Box>
                                                                <Text fontSize="16px" fontWeight="600" color={COLORS.textPrimary} mb={3}>
                                                                    重点关注
                                                                </Text>
                                                                <Text
                                                                    fontSize="14px"
                                                                    color={COLORS.textSecondary}
                                                                    lineHeight="1.7"
                                                                    textAlign="justify"
                                                                    whiteSpace="pre-wrap"
                                                                >
                                                                    {testCase.explanation}
                                                                </Text>
                                                            </Box>
                                                        )}

                                                        {/* Test Steps */}
                                                        {testSteps.length > 0 && (
                                                            <Box>
                                                                <VStack align="stretch" gap={6}>
                                                                    {testSteps.map((step: any, index: number) => (
                                                                        <VStack key={index} align="stretch" gap={3}>
                                                                            <Text fontSize="16px" fontWeight="600" color={COLORS.textPrimary}>
                                                                                步骤{index + 1}
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
                                                                                        {step.description || step.step}
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
                                                                                        {step.expectedResult || step.expected}
                                                                                    </Text>
                                                                                </HStack>
                                                                            </VStack>
                                                                            {index < testSteps.length - 1 && (
                                                                                <Box borderBottom="1px solid" borderColor={COLORS.borderColor} />
                                                                            )}
                                                                        </VStack>
                                                                    ))}
                                                                </VStack>
                                                            </Box>
                                                        )}

                                                        {/* Images/Videos - from test case attachments */}
                                                        {testCase.attachments && testCase.attachments.length > 0 && (
                                                            <Box>
                                                                <Text fontSize="16px" fontWeight="600" color={COLORS.textPrimary} mb={3}>
                                                                    图片或视频
                                                                </Text>
                                                                <Flex gap={4} wrap="wrap">
                                                                    {testCase.attachments.map((url: string, index: number) => {
                                                                        const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.avi');
                                                                        return (
                                                                            <Box
                                                                                key={index}
                                                                                w="120px"
                                                                                h="120px"
                                                                                borderRadius="4px"
                                                                                overflow="hidden"
                                                                                cursor="pointer"
                                                                                _hover={{ opacity: 0.8 }}
                                                                                position="relative"
                                                                            >
                                                                                {isVideo ? (
                                                                                    <>
                                                                                        <video
                                                                                            src={url}
                                                                                            style={{
                                                                                                width: '100%',
                                                                                                height: '100%',
                                                                                                objectFit: 'cover',
                                                                                            }}
                                                                                            onClick={() => handleMediaClick(url, testCase.attachments)}
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
                                                                                            pointerEvents="none"
                                                                                        >
                                                                                            视频
                                                                                        </Text>
                                                                                    </>
                                                                                ) : (
                                                                                    <Image
                                                                                        src={url}
                                                                                        alt={`attachment-${index}`}
                                                                                        w="100%"
                                                                                        h="100%"
                                                                                        objectFit="cover"
                                                                                        onClick={() => handleMediaClick(url, testCase.attachments)}
                                                                                    />
                                                                                )}
                                                                            </Box>
                                                                        );
                                                                    })}
                                                                </Flex>
                                                            </Box>
                                                        )}
                                                    </VStack>

                                                    {/* Divider between test cases */}
                                                    {caseIndex < testCases.length - 1 && (
                                                        <Box mt={8} borderBottom="2px solid" borderColor={COLORS.borderColor} />
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </VStack>
                                ) : (
                                    <Text fontSize="14px" color={COLORS.textSecondary}>
                                        暂无用例信息
                                    </Text>
                                )}
                            </Box>
                        )}

                        {/* Tab Content - Defect Details */}
                        {activeTab === 'defect' && (
                            <Box p={0}>
                                {order.defects && order.defects.length > 0 ? (
                                    <VStack align="stretch" gap={0}>
                                        {order.defects.map((defect, index) => {
                                            // Map defect status to display
                                            const getStatusDisplay = (status: string) => {
                                                const statusMap: Record<string, { label: string; color: string }> = {
                                                    SUBMITTED: { label: '已提交', color: '#2067F6' },
                                                    REVIEWING: { label: '审核中', color: '#FF7D00' },
                                                    APPROVED: { label: '已批准', color: '#00B42A' },
                                                    REJECTED: { label: '已驳回', color: '#F53F3F' },
                                                    DUPLICATE: { label: '重复', color: '#86909C' },
                                                    CLOSED: { label: '已关闭', color: '#86909C' },
                                                };
                                                return statusMap[status] || { label: status, color: '#2067F6' };
                                            };

                                            // Map severity/suggestion level to display
                                            const getLevelDisplay = (defect: any) => {
                                                if (defect.type === 'BUG' && defect.severity) {
                                                    const severityMap: Record<string, { label: string; color: string }> = {
                                                        CRITICAL: { label: '致命', color: '#F53F3F' },
                                                        MAJOR: { label: '严重', color: '#FF7D00' },
                                                        MINOR: { label: '一般', color: '#FAAD14' },
                                                        TRIVIAL: { label: '轻微', color: '#00B42A' },
                                                        INVALID: { label: '无效', color: '#86909C' },
                                                    };
                                                    return severityMap[defect.severity] || { label: defect.severity, color: '#2067F6' };
                                                } else if (defect.type === 'SUGGESTION' && defect.suggestionLevel) {
                                                    const suggestionMap: Record<string, { label: string; color: string }> = {
                                                        EXCELLENT_SPECIAL: { label: '特别优秀', color: '#3AB385' },
                                                        EXCELLENT: { label: '优秀', color: '#00B42A' },
                                                        VALID: { label: '有效', color: '#FAAD14' },
                                                        INVALID: { label: '无效', color: '#86909C' },
                                                    };
                                                    return suggestionMap[defect.suggestionLevel] || { label: defect.suggestionLevel, color: '#3AB385' };
                                                }
                                                // 已驳回、重复、已关闭等状态，显示无效
                                                if (defect.status === 'REJECTED' || defect.status === 'DUPLICATE' || defect.status === 'CLOSED') {
                                                    return { label: '无效', color: '#86909C' };
                                                }
                                                // 待确认状态，显示未判断（业务判定已提交，等待确认）
                                                if (defect.status === 'TO_CONFIRM') {
                                                    return { label: '未判断', color: '#2067F6', isUnjudged: true };
                                                }
                                                // 其他状态显示未判断
                                                return { label: '未判断', color: '#2067F6', isUnjudged: true };
                                            };

                                            const statusDisplay = getStatusDisplay(defect.status);
                                            const levelDisplay = getLevelDisplay(defect);

                                            return (
                                                <Box key={defect.id}>
                                                    {/* Defect Header */}
                                                    <Box
                                                        bg={COLORS.bgSecondary}
                                                        borderBottom="1px solid"
                                                        borderColor={COLORS.borderColor}
                                                        px={6}
                                                        py={4}
                                                        display="flex"
                                                        alignItems="center"
                                                        justifyContent="space-between"
                                                        gap={6}
                                                    >
                                                        {/* Left Section - Checkbox and ID */}
                                                        <HStack gap={10} flex="0 0 auto">
                                                            <Checkbox size="sm" />
                                                            <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} minW="40px">
                                                                {index + 1}
                                                            </Text>
                                                            <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary}>
                                                                {defect.id}
                                                            </Text>
                                                        </HStack>

                                                        {/* Points */}
                                                        <HStack gap={1} flex="0 0 auto">
                                                            <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary}>
                                                                缺陷/建议积分：
                                                            </Text>
                                                            <HStack gap={1}>
                                                                <Text fontSize="14px" fontWeight="600" color={COLORS.textPrimary}>
                                                                    {defect.earnedPoints}
                                                                </Text>
                                                                <Image
                                                                    src="/images/task-hall/jinbi.png"
                                                                    alt="积分"
                                                                    w="16px"
                                                                    h="16px"
                                                                />
                                                            </HStack>
                                                        </HStack>

                                                        {/* Duplicate Count - placeholder */}
                                                        <HStack gap={1} flex="0 0 auto">
                                                            <Text
                                                                fontSize="14px"
                                                                fontWeight="500"
                                                                color={COLORS.primary}
                                                                cursor="pointer"
                                                                _hover={{ textDecoration: 'underline' }}
                                                                onClick={() => handleShowDuplicateModal(defect)}
                                                            >
                                                                关联重复：{defect.duplicateGroupId ? 1 : 0}
                                                            </Text>
                                                        </HStack>

                                                        {/* Type Badge */}
                                                        <HStack gap={1} flex="0 0 auto">
                                                            <Image
                                                                src={defect.type === 'BUG' ? '/images/academy/bug-fill.png' : '/images/publish/publish-icon-1.png'}
                                                                alt={defect.type}
                                                                w="16px"
                                                                h="16px"
                                                            />
                                                            <Text fontSize="14px" fontWeight="400" color={COLORS.textPrimary}>
                                                                {defect.type === 'BUG' ? '缺陷' : '建议'}
                                                            </Text>
                                                        </HStack>

                                                        {/* Status Button */}
                                                        <Box
                                                            flex="0 0 auto"
                                                            px={4}
                                                            py={2}
                                                            borderRadius={
                                                                defect.type === 'SUGGESTION' && !levelDisplay.isUnjudged
                                                                    ? '12px'
                                                                    : '19px'
                                                            }
                                                            bg={
                                                                defect.type === 'SUGGESTION' && !levelDisplay.isUnjudged
                                                                    ? '#DEF3ED'
                                                                    : 'white'
                                                            }
                                                            border={
                                                                defect.type === 'SUGGESTION' && !levelDisplay.isUnjudged
                                                                    ? 'none'
                                                                    : '1px solid'
                                                            }
                                                            borderColor={
                                                                defect.type === 'SUGGESTION' && !levelDisplay.isUnjudged
                                                                    ? 'transparent'
                                                                    : levelDisplay.color
                                                            }
                                                        >
                                                            <Text
                                                                fontSize="14px"
                                                                fontWeight={
                                                                    defect.type === 'SUGGESTION' && !levelDisplay.isUnjudged
                                                                        ? '500'
                                                                        : '400'
                                                                }
                                                                color={levelDisplay.color}
                                                            >
                                                                {levelDisplay.label}
                                                            </Text>
                                                        </Box>
                                                    </Box>

                                                    {/* Defect Details */}
                                                    <Box bg={COLORS.bgPrimary} px={6} py={6} display="grid" gridTemplateColumns="1fr 1fr" gap={12}>
                                                        {/* Left Column */}
                                                        <VStack align="stretch" gap={4}>
                                                            {/* Title */}
                                                            <Box>
                                                                <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} mb={1}>
                                                                    标题：
                                                                </Text>
                                                                <Text fontSize="14px" color={COLORS.textTertiary} lineHeight="1.7">
                                                                    {defect.title}
                                                                </Text>
                                                            </Box>

                                                            {/* Description */}
                                                            <Box>
                                                                <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} mb={1}>
                                                                    描述：
                                                                </Text>
                                                                <Text fontSize="14px" color={COLORS.textTertiary} lineHeight="1.7" whiteSpace="pre-wrap">
                                                                    {defect.description}
                                                                </Text>
                                                            </Box>

                                                            {/* Attachments */}
                                                            {defect.attachments && defect.attachments.length > 0 && (
                                                                <Box>
                                                                    <Flex align="center" justify="space-between" mb={3}>
                                                                        <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary}>
                                                                            附件：
                                                                        </Text>
                                                                        <HStack
                                                                            gap={1}
                                                                            cursor="pointer"
                                                                            _hover={{ opacity: 0.8 }}
                                                                            onClick={() => handleDownloadAll(defect.attachments)}
                                                                        >
                                                                            <Image
                                                                                src="/images/review/import.png"
                                                                                alt="download"
                                                                                w="16px"
                                                                                h="16px"
                                                                            />
                                                                            <Text fontSize="14px" color={COLORS.textTertiary}>
                                                                                全部下载
                                                                            </Text>
                                                                        </HStack>
                                                                    </Flex>
                                                                    <Flex gap={3} wrap="wrap">
                                                                        {defect.attachments.map((attachment: string, idx: number) => {
                                                                            const isVideo = attachment.includes('.mp4') || attachment.includes('.mov') || attachment.includes('.avi');
                                                                            return (
                                                                                <Box
                                                                                    key={idx}
                                                                                    w="100px"
                                                                                    h="100px"
                                                                                    borderRadius="2px"
                                                                                    overflow="hidden"
                                                                                    position="relative"
                                                                                    cursor="pointer"
                                                                                    _hover={{ opacity: 0.8 }}
                                                                                >
                                                                                    {isVideo ? (
                                                                                        <>
                                                                                            <video
                                                                                                src={attachment}
                                                                                                style={{
                                                                                                    width: '100%',
                                                                                                    height: '100%',
                                                                                                    objectFit: 'cover',
                                                                                                }}
                                                                                                onClick={() => handleMediaClick(attachment, defect.attachments)}
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
                                                                                                pointerEvents="none"
                                                                                            >
                                                                                                视频
                                                                                            </Text>
                                                                                        </>
                                                                                    ) : (
                                                                                        <Image
                                                                                            src={attachment}
                                                                                            alt={`Attachment ${idx + 1}`}
                                                                                            w="100%"
                                                                                            h="100%"
                                                                                            objectFit="cover"
                                                                                            onClick={() => handleMediaClick(attachment, defect.attachments)}
                                                                                        />
                                                                                    )}
                                                                                </Box>
                                                                            );
                                                                        })}
                                                                    </Flex>
                                                                </Box>
                                                            )}
                                                        </VStack>

                                                        {/* Right Column */}
                                                        <VStack align="stretch" gap={4}>
                                                            {/* Case Title */}
                                                            <Box>
                                                                <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} mb={1}>
                                                                    所属用例：
                                                                </Text>
                                                                <Text fontSize="14px" color={COLORS.textSecondary} lineHeight="1.7">
                                                                    {defect.testCase?.title || '-'}
                                                                </Text>
                                                            </Box>

                                                            {/* Related Steps */}
                                                            <Box>
                                                                <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} mb={1}>
                                                                    关联步骤：
                                                                </Text>
                                                                <HStack gap={1}>
                                                                    <Text fontSize="14px" color={COLORS.textSecondary} lineHeight="1.7">
                                                                        {defect.steps || '-'}
                                                                    </Text>
                                                                </HStack>
                                                            </Box>

                                                            {/* Review Comment */}
                                                            <Box>
                                                                <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} mb={1}>
                                                                    审核意见：
                                                                </Text>
                                                                <Text fontSize="14px" color={COLORS.textTertiary} lineHeight="1.7" minH="20px">
                                                                    {defect.reviewComment || '-'}
                                                                </Text>
                                                            </Box>

                                                            {/* Supplementary Note (for suggestions) */}
                                                            {defect.type === 'SUGGESTION' && (
                                                                <Box>
                                                                    <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} mb={1}>
                                                                        补充说明：
                                                                    </Text>
                                                                    <Text fontSize="14px" color={COLORS.textTertiary} lineHeight="1.7" minH="20px">
                                                                        -
                                                                    </Text>
                                                                </Box>
                                                            )}
                                                        </VStack>
                                                    </Box>

                                                    {/* Device Info Footer */}
                                                    <Box
                                                        bg={COLORS.bgPrimary}
                                                        borderTop="1px solid"
                                                        borderColor={COLORS.borderColor}
                                                        px={6}
                                                        py={4}
                                                        display="flex"
                                                        gap={9}
                                                        flexWrap="wrap"
                                                    >
                                                        <HStack gap={2} fontSize="14px">
                                                            <Text color={COLORS.textTertiary}>提交人：</Text>
                                                            <Text color={COLORS.textPrimary} fontWeight="500">
                                                                {order.user.name || order.user.phone}
                                                            </Text>
                                                        </HStack>
                                                        <HStack gap={2} fontSize="14px">
                                                            <Text color={COLORS.textTertiary}>提交时间：</Text>
                                                            <Text color={COLORS.textPrimary} fontWeight="500">
                                                                {new Date(defect.createdAt).toLocaleString('zh-CN')}
                                                            </Text>
                                                        </HStack>
                                                    </Box>

                                                    {/* Divider between defects */}
                                                    {index < order.defects.length - 1 && (
                                                        <Box h="12px" bg={COLORS.bgTertiary} />
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </VStack>
                                ) : (
                                    <Box p={6}>
                                        <Text fontSize="14px" color={COLORS.textSecondary}>
                                            暂无缺陷信息
                                        </Text>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* Tab Content - Order Tracking */}
                        {activeTab === 'tracking' && (
                            <Box p={12} bg={COLORS.bgPrimary}>
                                <Flex gap={3} align="flex-start" justify="space-between">
                                    {trackingSteps.map((step, index) => (
                                        <Box key={step.id} flex="1" display="flex" flexDirection="column" alignItems="flex-start">
                                            {/* Step Header */}
                                            <Flex gap={3} align="center" w="full" mb={4}>
                                                {/* Step Icon */}
                                                <Box
                                                    w="28px"
                                                    h="28px"
                                                    borderRadius="50%"
                                                    bg={step.isCompleted || step.isActive ? "linear-gradient(90deg, #ff9266 0%, #fe626b 100%)" : "#FFE0E1"}
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    flexShrink={0}
                                                >
                                                    <Text
                                                        fontSize="14px"
                                                        fontWeight="600"
                                                        color={step.isCompleted || step.isActive ? 'white' : "#FF9068"}
                                                    >
                                                        ✓
                                                    </Text>
                                                </Box>

                                                {/* Step Title */}
                                                <Text
                                                    fontSize="16px"
                                                    fontWeight={step.isActive ? '500' : '400'}
                                                    color={step.isActive ? COLORS.textPrimary : COLORS.textSecondary}
                                                    whiteSpace="nowrap"
                                                >
                                                    {step.title}
                                                </Text>

                                                {/* Divider Line */}
                                                {index < trackingSteps.length - 1 && (
                                                    <Box
                                                        flex="1"
                                                        h="1px"
                                                        bg={COLORS.borderColor}
                                                        ml={2}
                                                    />
                                                )}
                                            </Flex>

                                            {/* Step Timestamp - Only render if timestamp exists */}
                                            {step.timestamp && (
                                                <Box pl={10}>
                                                    <Text fontSize="12px" color={COLORS.textTertiary} lineHeight="1.7">
                                                        {step.timestamp}
                                                    </Text>
                                                </Box>
                                            )}
                                        </Box>
                                    ))}
                                </Flex>
                            </Box>
                        )}
                    </Box>
                </Container>
            </Box>

            {/* Footer */}
            <Box bg="#1D2129" py={4}>
                <Text textAlign="center" fontSize="14px" color={COLORS.textTertiary}>
                    备案信息
                </Text>
            </Box>

            {/* Media Preview Dialog */}
            <DialogRoot open={previewOpen} onOpenChange={(e) => setPreviewOpen(e.open)} size="full">
                <DialogContent>
                    <DialogBody p={0} position="relative" bg="rgba(0, 0, 0, 0.95)" display="flex" alignItems="center" justifyContent="center">
                        {/* Close Button */}
                        <Box
                            position="absolute"
                            top={4}
                            right={4}
                            zIndex={10}
                            cursor="pointer"
                            onClick={() => setPreviewOpen(false)}
                            bg="rgba(255, 255, 255, 0.1)"
                            borderRadius="50%"
                            w="40px"
                            h="40px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
                        >
                            <LuX size={24} color="white" />
                        </Box>

                        {/* Previous Button */}
                        {currentIndex > 0 && (
                            <Box
                                position="absolute"
                                left={4}
                                top="50%"
                                transform="translateY(-50%)"
                                zIndex={10}
                                cursor="pointer"
                                onClick={handlePrevious}
                                bg="rgba(255, 255, 255, 0.1)"
                                borderRadius="50%"
                                w="48px"
                                h="48px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
                            >
                                <LuChevronLeft size={32} color="white" />
                            </Box>
                        )}

                        {/* Next Button */}
                        {currentIndex < previewMedia.allMedia.length - 1 && (
                            <Box
                                position="absolute"
                                right={4}
                                top="50%"
                                transform="translateY(-50%)"
                                zIndex={10}
                                cursor="pointer"
                                onClick={handleNext}
                                bg="rgba(255, 255, 255, 0.1)"
                                borderRadius="50%"
                                w="48px"
                                h="48px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
                            >
                                <LuChevronRight size={32} color="white" />
                            </Box>
                        )}

                        {/* Media Content */}
                        <Box maxW="90vw" maxH="90vh" display="flex" alignItems="center" justifyContent="center">
                            {previewMedia.type === 'video' ? (
                                <video
                                    src={previewMedia.url}
                                    controls
                                    autoPlay
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '90vh',
                                        objectFit: 'contain',
                                    }}
                                />
                            ) : (
                                <Image
                                    src={previewMedia.url}
                                    alt="Preview"
                                    maxW="100%"
                                    maxH="90vh"
                                    objectFit="contain"
                                />
                            )}
                        </Box>

                        {/* Counter */}
                        <Box
                            position="absolute"
                            bottom={4}
                            left="50%"
                            transform="translateX(-50%)"
                            bg="rgba(0, 0, 0, 0.6)"
                            color="white"
                            px={4}
                            py={2}
                            borderRadius="20px"
                            fontSize="14px"
                        >
                            {currentIndex + 1} / {previewMedia.allMedia.length}
                        </Box>
                    </DialogBody>
                </DialogContent>
            </DialogRoot>

            {/* Duplicate Defects Modal */}
            <DuplicateDefectsModal
                isOpen={isDuplicateModalOpen}
                onClose={() => setIsDuplicateModalOpen(false)}
                title="关联重复"
                items={duplicateItems}
                defectSeverityDict={defectSeverityDict}
                suggestionLevelDict={suggestionLevelDict}
                onPreview={() => { }}
                onDownloadAll={handleDownloadAll}
            />
        </Box>
    );
}
