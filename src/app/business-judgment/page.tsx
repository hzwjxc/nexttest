'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Flex,
    Text,
    Image,
    Textarea,
    Button,
    Input,
    VStack,
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogBackdrop,
    DialogTitle,
    DialogCloseTrigger,
    IconButton,
    Spinner,
    Center,
} from '@chakra-ui/react';
import { Field } from '@chakra-ui/react';
import {
    LuChevronRight,
    LuChevronLeft,
    LuUser,
    LuX,
    LuDownload,
} from 'react-icons/lu';
import { Checkbox } from '@/app/_components/ui/checkbox';
import { DuplicateDefectsModal as DuplicateViewModal } from '@/app/_components/ui/duplicate-defects-modal';
import type { DuplicateDefectItem } from '@/app/_components/ui/duplicate-defects-modal';
import { NativeSelect } from '@chakra-ui/react';
import { api } from '@/trpc/react';
import { useSearchParams } from 'next/navigation';

const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    bgTertiary: '#F3F7FB',
    borderColor: '#E5E6EB',
    orange: '#F34724',
    green: '#00B42A',
    blue: '#165DFF',
    yellow: '#FF7D00',
    lightBorder: '#D4D6D9',
    lightRed: '#FDF5F5',
    lightBlue: '#EAF3FC',
};

// Defect group type
interface DefectGroup {
    id: string;
    title: string;
    defectCount: number;
    pendingCount: number;
}

const mockDefectGroups: DefectGroup[] = [
    {
        id: '1',
        title: '登录页输入账号显示空白登录页输入账号显示空白',
        defectCount: 12,
        pendingCount: 6,
    },
    {
        id: '2',
        title: '登录页输入账号显示空白登录页输入账号显示空白',
        defectCount: 12,
        pendingCount: 2,
    },
    {
        id: '3',
        title: '登录页输入账号显示空白登录页输入账号显示空白',
        defectCount: 12,
        pendingCount: 1,
    },
    {
        id: '4',
        title: '登录页输入账号显示空白登录页输入账号显示空白',
        defectCount: 12,
        pendingCount: 0,
    },
    {
        id: '5',
        title: '登录页输入账号显示空白登录页输入账号显示空白',
        defectCount: 12,
        pendingCount: 0,
    },
    {
        id: '6',
        title: '登录页输入账号显示空白登录页输入账号显示空白',
        defectCount: 12,
        pendingCount: 0,
    },
    {
        id: '7',
        title: '登录页输入账号显示空白登录页输入账号显示空白',
        defectCount: 12,
        pendingCount: 0,
    },
    {
        id: '8',
        title: '登录页输入账号显示空白登录页输入账号显示空白',
        defectCount: 12,
        pendingCount: 0,
    },
    {
        id: '9',
        title: '登录页输入账号显示空白登录页输入账号显示空白',
        defectCount: 12,
        pendingCount: 0,
    },
];

// Defect item type for judgment
interface JudgmentDefect {
    id: string;
    taskId: string;
    testCaseId: string;
    defectNo: string;
    title: string;
    description: string;
    points: number;
    relatedRepeats: number;
    type: 'defect' | 'suggestion';
    caseName: string;
    relatedSteps: string[];
    reviewComment: string;
    deviceModel: string;
    system: string;
    submitter: string;
    submitTime: string;
    attachments: string[];
    duplicateGroupId?: string;
}

// Modal defect item - same fields as main defect list
interface ModalDefectItem {
    id: string;
    defectNo: string;
    testCaseId?: string;
    title: string;
    description: string;
    points: number;
    type: 'defect' | 'suggestion';
    status: string;
    caseName: string;
    relatedSteps: string[];
    reviewComment: string;
    deviceModel: string;
    system: string;
    submitter: string;
    submitTime: string;
    attachments: string[];
    // 判定结果数据
    judgmentReason?: string;
    severity?: string;
    suggestionLevel?: string;
    category?: string;
    judgedAt?: string;
}

const mockModalDefects: ModalDefectItem[] = [
    {
        id: 'm1',
        defectNo: 'O1234567890',
        title: '登录页输入账号显示空白',
        description:
            '前提：已注册账号执行步骤：1、登录界面。2、输入密码预期结果：输入的密码黑点显示1。登录界面。2、输入密码预期结果：输入的密码黑点显示。 已注册账号执行步骤：1、登录界面。2、输入密码预期结果：输入的密码黑点显示。登录界面。2、输入密码预期结果：输入的密码黑点显示。',
        points: 300,
        type: 'defect',
        status: '判定中',
        caseName: '黄金积存-个人网银使用例',
        relatedSteps: ['步骤一', '步骤二', '步骤三', '步骤四'],
        reviewComment: '',
        deviceModel: 'Redmi M2006C3LC',
        system: 'Android 11(720 x1600)',
        submitter: '张三',
        submitTime: '2024-09-12 24:32:00',
        attachments: [
            '/placeholder.svg?height=80&width=80&query=screenshot1',
            '/placeholder.svg?height=80&width=80&query=screenshot2',
            '/placeholder.svg?height=80&width=80&query=screenshot3',
            '/placeholder.svg?height=80&width=80&query=screenshot4',
            '/placeholder.svg?height=80&width=80&query=screenshot5',
            '/placeholder.svg?height=80&width=80&query=screenshot6',
        ],
    },
    {
        id: 'm2',
        defectNo: 'O1234567890',
        title: '登录页输入账号显示空白',
        description:
            '前提：已注册账号执行步骤：1、登录界面。2、输入密码预期结果：输入的密码黑点显示1。登录界面。2、输入密码预期结果：输入的密码黑点显示。 已注册账号执行步骤：1、登录界面。2、输入密码预期结果：输入的密码黑点显示。登录界面。2、输入密码预期结果：输入的密码黑点显示。',
        points: 300,
        type: 'defect',
        status: '判定中',
        caseName: '黄金积存-个人网银使用例',
        relatedSteps: ['步骤一', '步骤二', '步骤三', '步骤四'],
        reviewComment: '',
        deviceModel: 'Redmi M2006C3LC',
        system: 'Android 11(720 x1600)',
        submitter: '张三',
        submitTime: '2024-09-12 24:32:00',
        attachments: [
            '/placeholder.svg?height=80&width=80&query=screenshot1',
            '/placeholder.svg?height=80&width=80&query=screenshot2',
            '/placeholder.svg?height=80&width=80&query=screenshot3',
            '/placeholder.svg?height=80&width=80&query=screenshot4',
            '/placeholder.svg?height=80&width=80&query=screenshot5',
            '/placeholder.svg?height=80&width=80&query=screenshot6',
        ],
    },
];

const mockJudgmentDefects: JudgmentDefect[] = [
    {
        id: '1',
        taskId: 'task-001',
        testCaseId: 'case-001',
        defectNo: 'O1234567890',
        title: '登录页面输入账号显示空白',
        description:
            '前提：已注册账号执行步骤：1、登录界面。2、输入密码预期结果：输入的密码黑点显示。登录界面。2、输入密码预期结果：输入的密码黑点显示。 已注册账号执行步骤：1、登录界面。2、输入密码预期结果：输入的密码黑点显示、登录界面。2、输入密码预期结果：输入的密码黑点显示。',
        points: 300,
        relatedRepeats: 5,
        type: 'defect',
        caseName: '黄金积存-个人网银使用例',
        relatedSteps: ['步骤一', '步骤二', '步骤三', '步骤四'],
        reviewComment: '',
        deviceModel: 'Redmi M2006C3LC',
        system: 'Android 11(720 x1600)',
        submitter: '张三',
        submitTime: '2024-09-12 24:32:00',
        attachments: [
            '/placeholder.svg?height=80&width=80&query=screenshot1',
            '/placeholder.svg?height=80&width=80&query=screenshot2',
            '/placeholder.svg?height=80&width=80&query=screenshot3',
            '/placeholder.svg?height=80&width=80&query=screenshot4',
            '/placeholder.svg?height=80&width=80&query=screenshot5',
            '/placeholder.svg?height=80&width=80&query=screenshot6',
        ],
    },
    {
        id: '2',
        taskId: 'task-001',
        testCaseId: 'case-002',
        defectNo: 'O1234567890',
        title: '登录页面输入账号显示空白',
        description:
            '前提：已注册账号执行步骤：1、登录界面。2、输入密码预期结果：输入的密码黑点显示。登录界面。2、输入密码预期结果：输入的密码黑点显示。 已注册账号执行步骤：1、登录界面。2、输入密码预期结果：输入的密码黑点显示、登录界面。2、输入密码预期结果：输入的密码黑点显示。',
        points: 300,
        relatedRepeats: 5,
        type: 'defect',
        caseName: '黄金积存-个人网银使用例',
        relatedSteps: ['步骤一', '步骤二', '步骤三', '步骤四'],
        reviewComment: '',
        deviceModel: 'Redmi M2006C3LC',
        system: 'Android 11(720 x1600)',
        submitter: '张三',
        submitTime: '2024-09-12 24:32:00',
        attachments: [
            '/placeholder.svg?height=80&width=80&query=screenshot1',
            '/placeholder.svg?height=80&width=80&query=screenshot2',
            '/placeholder.svg?height=80&width=80&query=screenshot3',
            '/placeholder.svg?height=80&width=80&query=screenshot4',
            '/placeholder.svg?height=80&width=80&query=screenshot5',
            '/placeholder.svg?height=80&width=80&query=screenshot6',
        ],
    },
];

// Step Details Modal Component
function StepDetailsModal({
    isOpen,
    onClose,
    caseName,
    steps,
    testCaseId,
}: {
    isOpen: boolean;
    onClose: () => void;
    caseName: string;
    steps: string[];
    testCaseId?: string;
}) {
    const { data: testCaseData, isLoading } = api.testCase.getById.useQuery(
        { id: testCaseId! },
        { enabled: isOpen && !!testCaseId }
    );

    const testCaseSteps: { description?: string; step?: string; expectedResult?: string; expected?: string; title?: string }[] = (() => {
        try {
            return testCaseData?.testSteps ? JSON.parse(testCaseData.testSteps) : [];
        } catch {
            return [];
        }
    })();

    if (!isOpen) return null;

    return (
        <DialogRoot
            open={isOpen}
            onOpenChange={(e) => !e.open && onClose()}
            size="lg"
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
                    <DialogTitle
                        fontSize="18px"
                        fontWeight="600"
                        color={COLORS.textPrimary}
                    >
                        用例详情
                    </DialogTitle>
                    <DialogCloseTrigger />
                </DialogHeader>
                <DialogBody maxH="70vh" overflowY="auto">
                    <VStack gap={4} align="stretch">
                        <Box>
                            <Text
                                fontSize="14px"
                                color={COLORS.textTertiary}
                                mb={2}
                            >
                                用例名称：
                            </Text>
                            <Text
                                fontSize="14px"
                                color={COLORS.textPrimary}
                                fontWeight="500"
                            >
                                {caseName}
                            </Text>
                        </Box>
                        <Box>
                            <Text
                                fontSize="14px"
                                color={COLORS.textTertiary}
                                mb={2}
                            >
                                测试步骤：
                            </Text>
                            {isLoading ? (
                                <Center py={4}><Spinner size="sm" /></Center>
                            ) : testCaseSteps.length > 0 ? (
                                <VStack gap={3} align="stretch">
                                    {steps.map((stepName, idx) => {
                                        const stepDetail = testCaseSteps.find((s, sIdx) => {
                                            const title = s.title || `步骤${sIdx + 1}`;
                                            if (title === stepName) return true;
                                            if (stepName === `步骤${sIdx + 1}`) return true;
                                            if (stepName.includes(title) || title.includes(stepName)) return true;
                                            return false;
                                        });
                                        return (
                                            <Box
                                                key={idx}
                                                p={4}
                                                bg={COLORS.bgSecondary}
                                                borderRadius="4px"
                                            >
                                                <Text
                                                    fontSize="14px"
                                                    fontWeight="600"
                                                    color={COLORS.textPrimary}
                                                    mb={2}
                                                >
                                                    {stepName}
                                                </Text>
                                                <VStack align="stretch" gap={2}>
                                                    <Flex gap={2} align="flex-start">
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
                                                        >
                                                            {stepDetail?.description || stepDetail?.step || '-'}
                                                        </Text>
                                                    </Flex>
                                                    <Flex gap={2} align="flex-start">
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
                                                        >
                                                            {stepDetail?.expectedResult || stepDetail?.expected || '-'}
                                                        </Text>
                                                    </Flex>
                                                </VStack>
                                            </Box>
                                        );
                                    })}
                                </VStack>
                            ) : (
                                <VStack gap={2} align="stretch">
                                    {steps.map((step, index) => (
                                        <Flex
                                            key={index}
                                            gap={2}
                                            align="flex-start"
                                        >
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.textSecondary}
                                                flexShrink={0}
                                            >
                                                {index + 1}.
                                            </Text>
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.textSecondary}
                                                lineHeight="1.6"
                                            >
                                                {step}
                                            </Text>
                                        </Flex>
                                    ))}
                                </VStack>
                            )}
                        </Box>
                    </VStack>
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="outline"
                        borderColor={COLORS.borderColor}
                        color={COLORS.textSecondary}
                        onClick={onClose}
                    >
                        关闭
                    </Button>
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    );
}

// Preview Modal Component
function AttachmentPreviewModal({
    isOpen,
    onClose,
    attachments,
    currentIndex,
    onNavigate,
}: {
    isOpen: boolean;
    onClose: () => void;
    attachments: string[];
    currentIndex: number;
    onNavigate: (direction: 'prev' | 'next') => void;
}) {
    if (!isOpen || attachments.length === 0) return null;

    const currentAttachment = attachments[currentIndex];
    const isVideo =
        currentAttachment?.includes('.mp4') ||
        currentAttachment?.includes('.mov') ||
        currentAttachment?.includes('.avi') ||
        currentAttachment?.includes('.webm');

    return (
        <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="rgba(0, 0, 0, 0.9)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex="2000"
            onClick={onClose}
        >
            {/* Close Button */}
            <IconButton
                position="absolute"
                top="20px"
                right="20px"
                aria-label="Close"
                onClick={onClose}
                bg="rgba(255, 255, 255, 0.1)"
                color="white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
                size="lg"
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
                    link.href = currentAttachment || '';
                    link.download = `attachment-${currentIndex + 1}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }}
                bg="rgba(255, 255, 255, 0.1)"
                color="white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
                size="lg"
            >
                <LuDownload size={24} />
            </IconButton>

            {/* Previous Button */}
            {currentIndex > 0 && (
                <IconButton
                    position="absolute"
                    left="20px"
                    top="50%"
                    transform="translateY(-50%)"
                    aria-label="Previous"
                    onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('prev');
                    }}
                    bg="rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
                    size="lg"
                >
                    <LuChevronLeft size={24} />
                </IconButton>
            )}

            {/* Next Button */}
            {currentIndex < attachments.length - 1 && (
                <IconButton
                    position="absolute"
                    right="20px"
                    top="50%"
                    transform="translateY(-50%)"
                    aria-label="Next"
                    onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('next');
                    }}
                    bg="rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
                    size="lg"
                >
                    <LuChevronRight size={24} />
                </IconButton>
            )}

            {/* Content */}
            <Box
                maxW="90vw"
                maxH="90vh"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                {isVideo ? (
                    <video
                        src={currentAttachment}
                        controls
                        autoPlay
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            width: 'auto',
                            height: 'auto',
                        }}
                    />
                ) : (
                    <Image
                        src={currentAttachment}
                        alt={`Attachment ${currentIndex + 1}`}
                        maxW="90vw"
                        maxH="90vh"
                        objectFit="contain"
                    />
                )}
            </Box>

            {/* Counter */}
            <Box
                position="absolute"
                bottom="20px"
                left="50%"
                transform="translateX(-50%)"
                bg="rgba(0, 0, 0, 0.7)"
                color="white"
                px={4}
                py={2}
                borderRadius="20px"
                fontSize="14px"
            >
                {currentIndex + 1} / {attachments.length}
            </Box>
        </Box>
    );
}

// Radio Button Component
function RadioOption({
    label,
    checked,
    onChange,
    color = COLORS.primary,
}: {
    label: string;
    checked: boolean;
    onChange: () => void;
    color?: string;
}) {
    return (
        <Flex
            as="label"
            align="center"
            gap={2}
            cursor="pointer"
            onClick={onChange}
        >
            <Box
                w="16px"
                h="16px"
                borderRadius="50%"
                border="2px solid"
                borderColor={checked ? color : COLORS.borderColor}
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                {checked && (
                    <Box w="8px" h="8px" borderRadius="50%" bg={color} />
                )}
            </Box>
            <Text fontSize="14px" color={COLORS.textSecondary}>
                {label}
            </Text>
        </Flex>
    );
}

// Defect Card Component
function DefectJudgmentCard({
    defect,
    index,
    reasonTemplatesData,
    onOpenAddReasonDialog,
    onOpenEditReasonDialog,
    onDeleteReasonTemplate,
    defectSeverityItems,
    suggestionLevelItems,
    onOpenPreview,
    onDownloadAll,
    onOpenStepDetails,
    selectedGroup,
    onMoveToGroup,
    exportSelected,
    onExportSelect,
    onSubmitJudgment,
    isSubmitting,
    onOpenDuplicate,
}: {
    defect: JudgmentDefect;
    index: number;
    reasonTemplatesData?: Array<{
        id?: string;
        name?: string;
        content?: string;
        createdAt?: string;
        updatedAt?: string;
        isActive?: boolean;
        createdBy?: string | null;
    }>;
    onOpenAddReasonDialog: () => void;
    onOpenEditReasonDialog: (templateId: string) => void;
    onDeleteReasonTemplate: (templateId: string) => void;
    defectSeverityItems?: Array<{
        id?: string;
        code?: string | null;
        label?: string;
        value?: string | null;
    }>;
    suggestionLevelItems?: Array<{
        id?: string;
        code?: string | null;
        label?: string;
        value?: string | null;
    }>;
    onOpenPreview: (attachments: string[], index: number) => void;
    onDownloadAll: (attachments: string[]) => void;
    onOpenStepDetails: (caseName: string, steps: string[], testCaseId?: string) => void;
    selectedGroup?: string;
    onMoveToGroup?: (defectId: string, groupId: string) => void;
    exportSelected?: boolean;
    onExportSelect?: () => void;
    onSubmitJudgment?: (data: {
        conclusion: 'defect' | 'suggestion';
        level: string;
        reasonText: string;
        defectType: string;
    }) => void;
    isSubmitting?: boolean;
    onOpenDuplicate?: (defect: JudgmentDefect) => void;
}) {
    const [conclusion, setConclusion] = useState<'defect' | 'suggestion'>(
        defect.type
    );
    const [level, setLevel] = useState<string>('');
    const [defectType, setDefectType] = useState<string>('function');
    const [reasonText, setReasonText] = useState('');
    const [selectedReasonTemplate, setSelectedReasonTemplate] = useState('');
    const [localIsSubmitting, setLocalIsSubmitting] = useState(false);

    // 当选择模版时，自动填充内容
    const handleTemplateSelect = (templateId: string) => {
        setSelectedReasonTemplate(templateId);
        const template = reasonTemplatesData?.find((t) => t.id === templateId);
        if (template) {
            setReasonText(template.content || '');
        }
    };

    // 根据结论类型获取对应的等级选项
    const levelOptions =
        conclusion === 'defect' ? defectSeverityItems : suggestionLevelItems;

    // 根据 defect.type 初始化结论
    React.useEffect(() => {
        setConclusion(defect.type);
    }, [defect.type]);

    // 设置默认等级
    React.useEffect(() => {
        if (levelOptions && levelOptions.length > 0 && !level) {
            setLevel(levelOptions[0]?.code || '');
        }
    }, [conclusion, levelOptions, level]);

    const handleMoveToGroup = () => {
        if (!selectedGroup) {
            alert('请先选择一个重复缺陷组');
            return;
        }
        onMoveToGroup?.(defect.id, selectedGroup);
    };

    return (
        <Box
            bg={COLORS.bgPrimary}
            borderBottom="1px solid"
            borderColor={COLORS.borderColor}
            position="relative"
        >
            {/* Push In Button */}
            <Box
                position="absolute"
                left="-60px"
                top="50%"
                transform="translateY(-50%)"
                display="flex"
                alignItems="center"
                gap={1}
                color={selectedGroup ? COLORS.primary : COLORS.textTertiary}
                cursor={selectedGroup ? 'pointer' : 'not-allowed'}
                _hover={selectedGroup ? { color: COLORS.textSecondary } : {}}
                onClick={handleMoveToGroup}
                title={
                    selectedGroup
                        ? '点击将此缺陷移入选中的重复缺陷组'
                        : '请先选择一个重复缺陷组'
                }
            >
                <LuChevronLeft size={16} />
                <Text fontSize="14px">移入</Text>
            </Box>

            {/* Header Row */}
            <Flex
                align="center"
                px={6}
                py={3}
                borderBottom="1px solid"
                borderColor={COLORS.borderColor}
            >
                <Flex align="center" gap={4} flex="1">
                    <Checkbox
                        checked={exportSelected}
                        onCheckedChange={onExportSelect}
                        title="选择用于导出"
                    />
                    <Text
                        fontSize="14px"
                        color={COLORS.textSecondary}
                        w="40px"
                        textAlign="center"
                    >
                        {index + 1}
                    </Text>
                    <Text
                        fontSize="14px"
                        color={COLORS.textPrimary}
                        fontWeight="500"
                    >
                        {defect.defectNo}
                    </Text>
                    <Flex align="center" gap={2}>
                        <Text fontSize="14px" color={COLORS.textSecondary}>
                            缺陷/建议积分：
                        </Text>
                        <Text
                            fontSize="14px"
                            color={COLORS.textPrimary}
                            fontWeight="500"
                        >
                            {defect.points}
                        </Text>
                        <Box
                            w="18px"
                            h="18px"
                            borderRadius="50%"
                            bg={COLORS.yellow}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Text
                                fontSize="10px"
                                color="white"
                                fontWeight="700"
                            >
                                金
                            </Text>
                        </Box>
                    </Flex>
                </Flex>

                <Flex align="center" gap={6}>
                    <Text
                        fontSize="14px"
                        color={COLORS.primary}
                        cursor="pointer"
                        _hover={{ textDecoration: 'underline' }}
                        onClick={() => onOpenDuplicate?.(defect)}
                    >
                        关联重复：{defect.relatedRepeats}
                    </Text>
                    <Flex align="center" gap={2}>
                        <Box
                            w="6px"
                            h="6px"
                            borderRadius="50%"
                            bg={
                                defect.type === 'defect'
                                    ? COLORS.orange
                                    : COLORS.green
                            }
                        />
                        <Text fontSize="14px" color={COLORS.textSecondary}>
                            {defect.type === 'defect' ? '缺陷' : '建议'}
                        </Text>
                    </Flex>
                    <Box
                        px={3}
                        py={1}
                        borderRadius="4px"
                        border="1px solid"
                        borderColor={COLORS.blue}
                        bg="transparent"
                    >
                        <Text
                            fontSize="12px"
                            color={COLORS.blue}
                            fontWeight="500"
                        >
                            判定中
                        </Text>
                    </Box>
                </Flex>
            </Flex>

            {/* Content Row */}
            <Flex flexDirection="column">
                <Flex
                    borderBottom={'1px solid'}
                    borderColor={COLORS.borderColor}
                >
                    {/* Left Column - Defect Info */}
                    <Box
                        flex="1"
                        p={6}
                        borderRight="1px solid"
                        borderColor={COLORS.borderColor}
                    >
                        {/* Title and Description */}
                        <Box mb={4}>
                            <Flex gap={2} mb={2}>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textTertiary}
                                    flexShrink={0}
                                >
                                    标题：
                                </Text>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                    fontWeight="500"
                                >
                                    {defect.title}
                                </Text>
                            </Flex>
                            <Flex gap={2}>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textTertiary}
                                    flexShrink={0}
                                >
                                    描述：
                                </Text>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    lineHeight="1.6"
                                >
                                    {defect.description}
                                </Text>
                            </Flex>
                        </Box>
                        {/* Attachments */}
                        <Box mb={4}>
                            <Flex align="center" gap={4} mb={2}>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textTertiary}
                                >
                                    附件：
                                </Text>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.blue}
                                    cursor="pointer"
                                    _hover={{ textDecoration: 'underline' }}
                                    onClick={() =>
                                        onDownloadAll(defect.attachments)
                                    }
                                >
                                    全部下载
                                </Text>
                            </Flex>
                            <Flex gap={2} flexWrap="wrap">
                                {defect.attachments.map((attachment, idx) => {
                                    const isVideo =
                                        attachment.includes('.mp4') ||
                                        attachment.includes('.mov') ||
                                        attachment.includes('.avi') ||
                                        attachment.includes('.webm');
                                    return (
                                        <Box
                                            key={idx}
                                            w="80px"
                                            h="80px"
                                            borderRadius="4px"
                                            overflow="hidden"
                                            border="1px solid"
                                            borderColor={COLORS.borderColor}
                                            position="relative"
                                            cursor="pointer"
                                            onClick={() =>
                                                onOpenPreview(
                                                    defect.attachments,
                                                    idx
                                                )
                                            }
                                            _hover={{ opacity: 0.8 }}
                                        >
                                            {isVideo ? (
                                                <Box
                                                    w="100%"
                                                    h="100%"
                                                    position="relative"
                                                >
                                                    <video
                                                        src={attachment}
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
                                                    src={attachment}
                                                    alt={`附件${idx + 1}`}
                                                    w="100%"
                                                    h="100%"
                                                    objectFit="cover"
                                                />
                                            )}
                                        </Box>
                                    );
                                })}
                            </Flex>
                        </Box>
                    </Box>

                    {/* Right Column - Case Info */}
                    <Box w="300px" p={6}>
                        <Flex gap={2} mb={3}>
                            <Text
                                fontSize="14px"
                                color={COLORS.textTertiary}
                                flexShrink={0}
                            >
                                所属用例：
                            </Text>
                            <Text fontSize="14px" color={COLORS.textPrimary}>
                                {defect.caseName}
                            </Text>
                        </Flex>
                        <Flex gap={2} mb={3}>
                            <Text
                                fontSize="14px"
                                color={COLORS.textTertiary}
                                flexShrink={0}
                            >
                                关联步骤：
                            </Text>
                            <Flex gap={1} flexWrap="wrap" align="center">
                                {defect.relatedSteps.map((step, idx) => (
                                    <Text
                                        key={idx}
                                        fontSize="14px"
                                        color={COLORS.textSecondary}
                                    >
                                        {step}
                                        {idx < defect.relatedSteps.length - 1
                                            ? '、'
                                            : ''}
                                    </Text>
                                ))}
                                <Text
                                    fontSize="14px"
                                    color={COLORS.primary}
                                    cursor="pointer"
                                    ml={1}
                                    _hover={{ textDecoration: 'underline' }}
                                    onClick={() =>
                                        onOpenStepDetails(
                                            defect.caseName,
                                            defect.relatedSteps,
                                            defect.testCaseId
                                        )
                                    }
                                >
                                    查看详情
                                </Text>
                            </Flex>
                        </Flex>
                        <Flex gap={2}>
                            <Text fontSize="14px" color={COLORS.textTertiary}>
                                审核意见：
                            </Text>
                            <Text fontSize="14px" color={COLORS.textSecondary}>
                                {defect.reviewComment || ''}
                            </Text>
                        </Flex>
                    </Box>
                </Flex>

                {/* Judgment Form */}
                <Box p={6}>
                    <Flex align="center" gap={6} mb={3}>
                        <Text
                            fontSize="14px"
                            color={COLORS.textTertiary}
                            w="60px"
                        >
                            结论：
                        </Text>
                        <Flex gap={6}>
                            <RadioOption
                                label="缺陷"
                                checked={conclusion === 'defect'}
                                onChange={() => setConclusion('defect')}
                            />
                            <RadioOption
                                label="建议"
                                checked={conclusion === 'suggestion'}
                                onChange={() => setConclusion('suggestion')}
                            />
                        </Flex>
                    </Flex>

                    <Flex align="center" gap={6} mb={3}>
                        <Text
                            fontSize="14px"
                            color={COLORS.textTertiary}
                            w="60px"
                        >
                            等级：
                        </Text>
                        <Flex gap={4} flexWrap="wrap">
                            {levelOptions?.map((option) => (
                                <RadioOption
                                    key={option.id}
                                    label={option.label}
                                    checked={level === option.code}
                                    onChange={() => setLevel(option.code || '')}
                                />
                            ))}
                        </Flex>
                    </Flex>

                    <Flex align="center" gap={6} mb={3}>
                        <Text
                            fontSize="14px"
                            color={COLORS.textTertiary}
                            w="60px"
                        >
                            类型：
                        </Text>
                        <Flex gap={4} flexWrap="wrap">
                            <RadioOption
                                label="功能问题"
                                checked={defectType === 'function'}
                                onChange={() => setDefectType('function')}
                            />
                            <RadioOption
                                label="性能问题"
                                checked={defectType === 'performance'}
                                onChange={() => setDefectType('performance')}
                            />
                            <RadioOption
                                label="安全性问题"
                                checked={defectType === 'security'}
                                onChange={() => setDefectType('security')}
                            />
                            <RadioOption
                                label="用户体验"
                                checked={defectType === 'ux'}
                                onChange={() => setDefectType('ux')}
                            />
                            <RadioOption
                                label="兼容性问题"
                                checked={defectType === 'compatibility'}
                                onChange={() => setDefectType('compatibility')}
                            />
                        </Flex>
                    </Flex>

                    <Flex align="flex-start" gap={6} mb={3}>
                        <Text
                            fontSize="14px"
                            color={COLORS.textTertiary}
                            w="60px"
                            pt={2}
                        >
                            原因说明：
                        </Text>
                        <Box flex="1">
                            <Flex align="center" gap={2} mb={2}>
                                <NativeSelect.Root flex="1">
                                    <NativeSelect.Field
                                        value={selectedReasonTemplate}
                                        onChange={(e) =>
                                            handleTemplateSelect(e.target.value)
                                        }
                                        fontSize="14px"
                                        borderColor={COLORS.borderColor}
                                        color={COLORS.textSecondary}
                                    >
                                        <option value="">请选择内容模板</option>
                                        {reasonTemplatesData?.map(
                                            (template) => (
                                                <option
                                                    key={template.id}
                                                    value={template.id}
                                                >
                                                    {template.name}
                                                </option>
                                            )
                                        )}
                                    </NativeSelect.Field>
                                </NativeSelect.Root>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.blue}
                                    cursor="pointer"
                                    _hover={{ textDecoration: 'underline' }}
                                    onClick={onOpenAddReasonDialog}
                                >
                                    添加
                                </Text>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.blue}
                                    cursor="pointer"
                                    _hover={{ textDecoration: 'underline' }}
                                    onClick={() =>
                                        onOpenEditReasonDialog(
                                            selectedReasonTemplate
                                        )
                                    }
                                >
                                    编辑
                                </Text>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.primary}
                                    cursor="pointer"
                                    _hover={{ textDecoration: 'underline' }}
                                    onClick={() =>
                                        onDeleteReasonTemplate(
                                            selectedReasonTemplate
                                        )
                                    }
                                >
                                    删除
                                </Text>
                            </Flex>
                            <Textarea
                                value={reasonText}
                                onChange={(e) => setReasonText(e.target.value)}
                                placeholder="必填项，限制500字符，请点击进行情况说明"
                                fontSize="14px"
                                borderColor={COLORS.borderColor}
                                minH="100px"
                                _placeholder={{ color: COLORS.textTertiary }}
                            />
                            <Flex mt={2} justify="space-between">
                                <Box
                                    as="button"
                                    px={4}
                                    py={2}
                                    bg="linear-gradient(to right, #C43BF4, #FFA37C)"
                                    color="white"
                                    borderRadius="24px"
                                    fontSize="14px"
                                    cursor="pointer"
                                    display="flex"
                                    alignItems="center"
                                    gap={2}
                                    _hover={{ opacity: 0.9 }}
                                >
                                    <LuUser size={14} />
                                    AI帮写
                                </Box>
                                <Box
                                    as="button"
                                    px={6}
                                    py={2}
                                    bg="linear-gradient(to right, #ff9565, #fe5f6b)"
                                    color="white"
                                    borderRadius="24px"
                                    fontSize="14px"
                                    cursor={
                                        localIsSubmitting
                                            ? 'not-allowed'
                                            : 'pointer'
                                    }
                                    opacity={localIsSubmitting ? 0.6 : 1}
                                    _hover={{
                                        opacity: localIsSubmitting ? 0.6 : 0.9,
                                    }}
                                    onClick={() => {
                                        if (localIsSubmitting) return;
                                        if (!reasonText.trim()) {
                                            alert('请填写原因说明');
                                            return;
                                        }
                                        if (!level) {
                                            alert('请选择等级');
                                            return;
                                        }
                                        setLocalIsSubmitting(true);
                                        onSubmitJudgment?.({
                                            conclusion,
                                            level,
                                            reasonText,
                                            defectType,
                                        });
                                        // 提交后延迟一段时间重置状态
                                        setTimeout(() => {
                                            setLocalIsSubmitting(false);
                                        }, 2000);
                                    }}
                                >
                                    {localIsSubmitting ? '提交中...' : '提交'}
                                </Box>
                            </Flex>
                        </Box>
                    </Flex>
                </Box>

                {/* Device Info Footer */}
                <Flex
                    p={6}
                    align="center"
                    justify="space-between"
                    borderTop="1px solid"
                    borderColor={COLORS.borderColor}
                >
                    <Flex gap={6} fontSize="14px" color={COLORS.textTertiary}>
                        <Flex gap={1}>
                            <Text>机型：</Text>
                            <Text color={COLORS.textSecondary}>
                                {defect.deviceModel}
                            </Text>
                        </Flex>
                        <Flex gap={1}>
                            <Text>系统：</Text>
                            <Text color={COLORS.textSecondary}>
                                {defect.system}
                            </Text>
                        </Flex>
                        <Flex gap={1}>
                            <Text>提交人：</Text>
                            <Text color={COLORS.textSecondary}>
                                {defect.submitter}
                            </Text>
                        </Flex>
                        <Flex gap={1}>
                            <Text>提交时间：</Text>
                            <Text color={COLORS.textSecondary}>
                                {defect.submitTime}
                            </Text>
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
        </Box>
    );
}

// Duplicate Defects Modal Component
function DuplicateDefectsModal({
    isOpen,
    onClose,
    groupTitle,
    reasonTemplatesData,
    onOpenAddReasonDialog,
    onOpenEditReasonDialog,
    onDeleteReasonTemplate,
    modalDefects,
    defectSeverityItems,
    suggestionLevelItems,
    onOpenPreview,
    onDownloadAll,
    onOpenStepDetails,
    onRemoveDefect,
    onDeleteGroup,
    onSubmitBatchJudgment,
    isSubmitting,
}: {
    isOpen: boolean;
    onClose: () => void;
    groupTitle: string;
    reasonTemplatesData?: Array<{
        id?: string;
        name?: string;
        content?: string;
        createdAt?: string;
        updatedAt?: string;
        isActive?: boolean;
        createdBy?: string | null;
    }>;
    onOpenAddReasonDialog: () => void;
    onOpenEditReasonDialog: (templateId: string) => void;
    onDeleteReasonTemplate: (templateId: string) => void;
    modalDefects: ModalDefectItem[];
    defectSeverityItems?: Array<{
        id?: string;
        code?: string | null;
        label?: string;
        value?: string | null;
    }>;
    suggestionLevelItems?: Array<{
        id?: string;
        code?: string | null;
        label?: string;
        value?: string | null;
    }>;
    onOpenPreview: (attachments: string[], index: number) => void;
    onDownloadAll: (attachments: string[]) => void;
    onOpenStepDetails: (caseName: string, steps: string[], testCaseId?: string) => void;
    onRemoveDefect?: (defectId: string) => void;
    onDeleteGroup?: () => void;
    onSubmitBatchJudgment?: (data: {
        defectIds: string[];
        conclusion: 'defect' | 'suggestion';
        level: string;
        defectType: string;
        reasonText: string;
    }) => void;
    isSubmitting?: boolean;
}) {
    const [conclusion, setConclusion] = useState<'defect' | 'suggestion'>(
        'defect'
    );
    const [level, setLevel] = useState<string>('');
    const [defectType, setDefectType] = useState<string>('function');
    const [reasonText, setReasonText] = useState('');
    const [selectedReasonTemplate, setSelectedReasonTemplate] = useState('');

    // 当选择模版时，自动填充内容
    const handleTemplateSelect = (templateId: string) => {
        setSelectedReasonTemplate(templateId);
        const template = reasonTemplatesData?.find((t) => t.id === templateId);
        if (template) {
            setReasonText(template.content || '');
        }
    };

    // 根据结论类型获取对应的等级选项
    const levelOptions =
        conclusion === 'defect' ? defectSeverityItems : suggestionLevelItems;

    // 检查是否所有缺陷都已判定（包括待确认和已确认的最终状态）
    const isAlreadyJudged =
        modalDefects.length > 0 &&
        modalDefects.every(
            (d) =>
                (d.status === '待确认' ||
                    d.status === '已通过' ||
                    d.status === '已驳回' ||
                    d.status === '重复' ||
                    d.status === '已关闭') &&
                d.judgmentReason
        );

    // 检查是否有已判定的缺陷（不仅是判定中的）
    const hasJudgedDefects = modalDefects.some(
        (d) =>
            d.status !== '判定中'
    );

    // 如果已判定，从第一个缺陷获取判定结果
    React.useEffect(() => {
        if (isAlreadyJudged && modalDefects.length > 0) {
            const firstDefect = modalDefects[0];
            if (firstDefect) {
                setConclusion(firstDefect.type);
                setLevel(
                    firstDefect.type === 'defect'
                        ? firstDefect.severity || ''
                        : firstDefect.suggestionLevel || ''
                );
                setDefectType(firstDefect.category || 'function');
                setReasonText(firstDefect.judgmentReason || '');
            }
        }
    }, [isAlreadyJudged, modalDefects]);

    // 设置默认等级
    React.useEffect(() => {
        if (
            levelOptions &&
            levelOptions.length > 0 &&
            !level &&
            !isAlreadyJudged
        ) {
            setLevel(levelOptions[0]?.code || '');
        }
    }, [conclusion, levelOptions, level, isAlreadyJudged]);

    // 处理批量判定提交
    const handleSubmit = () => {
        if (!reasonText.trim()) {
            alert('请填写原因说明');
            return;
        }

        if (!level) {
            alert('请选择等级');
            return;
        }

        if (modalDefects.length === 0) {
            alert('没有可判定的缺陷');
            return;
        }

        const defectIds = modalDefects.map((d) => d.id);

        onSubmitBatchJudgment?.({
            defectIds,
            conclusion,
            level,
            defectType,
            reasonText,
        });
    };

    if (!isOpen) return null;

    return (
        <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="rgba(0, 0, 0, 0.5)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex="1000"
            onClick={onClose}
        >
            <Box
                bg={COLORS.bgPrimary}
                borderRadius="8px"
                w="900px"
                maxH="90vh"
                overflow="hidden"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <Flex
                    align="center"
                    justify="space-between"
                    px={6}
                    py={4}
                    borderBottom="1px solid"
                    borderColor={COLORS.borderColor}
                >
                    <Text
                        fontSize="16px"
                        fontWeight="500"
                        color={COLORS.textPrimary}
                    >
                        {groupTitle}
                    </Text>
                    <Box
                        as="button"
                        cursor="pointer"
                        onClick={onClose}
                        color={COLORS.textTertiary}
                        _hover={{ color: COLORS.textSecondary }}
                    >
                        <LuX size={20} />
                    </Box>
                </Flex>

                {/* Modal Body */}
                <Box maxH="calc(90vh - 140px)" overflowY="auto">
                    {/* Judgment Form or Result Area */}
                    <Box
                        p={6}
                        borderBottom="1px solid"
                        borderColor={COLORS.borderColor}
                    >
                        {isAlreadyJudged ? (
                            // 业务审核结果区域
                            <Box>
                                <Text
                                    fontSize="16px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                    mb={4}
                                >
                                    业务审核结果
                                </Text>

                                <Flex gap={2} mb={3}>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                        w="80px"
                                    >
                                        结论：
                                    </Text>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textPrimary}
                                    >
                                        {conclusion === 'defect'
                                            ? '缺陷'
                                            : '建议'}
                                    </Text>
                                </Flex>

                                <Flex gap={2} mb={3}>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                        w="80px"
                                    >
                                        等级：
                                    </Text>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textPrimary}
                                    >
                                        {levelOptions?.find(
                                            (opt) => opt.code === level
                                        )?.label || level}
                                    </Text>
                                </Flex>

                                <Flex gap={2} mb={3}>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                        w="80px"
                                    >
                                        类型：
                                    </Text>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textPrimary}
                                    >
                                        {defectType === 'function'
                                            ? '功能问题'
                                            : defectType === 'performance'
                                                ? '性能问题'
                                                : defectType === 'security'
                                                    ? '安全性问题'
                                                    : defectType === 'ux'
                                                        ? '用户体验'
                                                        : defectType ===
                                                            'compatibility'
                                                            ? '兼容性问题'
                                                            : defectType}
                                    </Text>
                                </Flex>

                                <Flex gap={2} align="flex-start">
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                        w="80px"
                                    >
                                        原因说明：
                                    </Text>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textPrimary}
                                        flex="1"
                                        lineHeight="1.6"
                                    >
                                        {reasonText}
                                    </Text>
                                </Flex>
                            </Box>
                        ) : (
                            // 判定表单
                            <>
                                <Flex align="center" gap={6} mb={3}>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                        w="60px"
                                    >
                                        结论：
                                    </Text>
                                    <Flex gap={6}>
                                        <RadioOption
                                            label="缺陷"
                                            checked={conclusion === 'defect'}
                                            onChange={() =>
                                                setConclusion('defect')
                                            }
                                        />
                                        <RadioOption
                                            label="建议"
                                            checked={
                                                conclusion === 'suggestion'
                                            }
                                            onChange={() =>
                                                setConclusion('suggestion')
                                            }
                                        />
                                    </Flex>
                                </Flex>

                                <Flex align="center" gap={6} mb={3}>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                        w="60px"
                                    >
                                        等级：
                                    </Text>
                                    <Flex gap={4} flexWrap="wrap">
                                        {levelOptions?.map((option) => (
                                            <RadioOption
                                                key={option.id || option.code}
                                                label={option.label || ''}
                                                checked={level === option.code}
                                                onChange={() =>
                                                    setLevel(option.code || '')
                                                }
                                            />
                                        ))}
                                    </Flex>
                                </Flex>

                                <Flex align="center" gap={6} mb={3}>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                        w="60px"
                                    >
                                        类型：
                                    </Text>
                                    <Flex gap={4} flexWrap="wrap">
                                        <RadioOption
                                            label="功能问题"
                                            checked={defectType === 'function'}
                                            onChange={() =>
                                                setDefectType('function')
                                            }
                                        />
                                        <RadioOption
                                            label="性能问题"
                                            checked={
                                                defectType === 'performance'
                                            }
                                            onChange={() =>
                                                setDefectType('performance')
                                            }
                                        />
                                        <RadioOption
                                            label="安全性问题"
                                            checked={defectType === 'security'}
                                            onChange={() =>
                                                setDefectType('security')
                                            }
                                        />
                                        <RadioOption
                                            label="用户体验"
                                            checked={defectType === 'ux'}
                                            onChange={() => setDefectType('ux')}
                                        />
                                        <RadioOption
                                            label="兼容性问题"
                                            checked={
                                                defectType === 'compatibility'
                                            }
                                            onChange={() =>
                                                setDefectType('compatibility')
                                            }
                                        />
                                    </Flex>
                                </Flex>

                                <Flex align="flex-start" gap={6}>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                        w="60px"
                                        pt={2}
                                    >
                                        原因说明：
                                    </Text>
                                    <Box flex="1">
                                        <Flex align="center" gap={2} mb={2}>
                                            <NativeSelect.Root flex="1">
                                                <NativeSelect.Field
                                                    value={
                                                        selectedReasonTemplate
                                                    }
                                                    onChange={(e) =>
                                                        handleTemplateSelect(
                                                            e.target.value
                                                        )
                                                    }
                                                    fontSize="14px"
                                                    borderColor={
                                                        COLORS.borderColor
                                                    }
                                                    color={COLORS.textSecondary}
                                                >
                                                    <option value="">
                                                        请选择内容模板
                                                    </option>
                                                    {reasonTemplatesData?.map(
                                                        (template) => (
                                                            <option
                                                                key={
                                                                    template.id
                                                                }
                                                                value={
                                                                    template.id
                                                                }
                                                            >
                                                                {template.name}
                                                            </option>
                                                        )
                                                    )}
                                                </NativeSelect.Field>
                                            </NativeSelect.Root>
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.blue}
                                                cursor="pointer"
                                                _hover={{
                                                    textDecoration: 'underline',
                                                }}
                                                onClick={onOpenAddReasonDialog}
                                            >
                                                添加
                                            </Text>
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.blue}
                                                cursor="pointer"
                                                _hover={{
                                                    textDecoration: 'underline',
                                                }}
                                                onClick={() =>
                                                    onOpenEditReasonDialog(
                                                        selectedReasonTemplate
                                                    )
                                                }
                                            >
                                                编辑
                                            </Text>
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.primary}
                                                cursor="pointer"
                                                _hover={{
                                                    textDecoration: 'underline',
                                                }}
                                                onClick={() =>
                                                    onDeleteReasonTemplate(
                                                        selectedReasonTemplate
                                                    )
                                                }
                                            >
                                                删除
                                            </Text>
                                        </Flex>
                                        <Textarea
                                            value={reasonText}
                                            onChange={(e) =>
                                                setReasonText(e.target.value)
                                            }
                                            placeholder="必填项，限制500字符，请点击进行情况说明"
                                            fontSize="14px"
                                            borderColor={COLORS.borderColor}
                                            minH="100px"
                                            _placeholder={{
                                                color: COLORS.textTertiary,
                                            }}
                                        />
                                        <Box mt={2}>
                                            <Box
                                                as="button"
                                                px={4}
                                                py={2}
                                                bg="linear-gradient(to right, #C43BF4, #FFA37C)"
                                                color="white"
                                                borderRadius="24px"
                                                fontSize="14px"
                                                cursor="pointer"
                                                display="flex"
                                                alignItems="center"
                                                gap={2}
                                                _hover={{ opacity: 0.9 }}
                                            >
                                                <LuUser size={14} />
                                                AI帮写
                                            </Box>
                                        </Box>
                                    </Box>
                                </Flex>
                            </>
                        )}
                    </Box>

                    {/* Defect Count */}
                    <Flex
                        justify="flex-end"
                        px={6}
                        py={3}
                        borderBottom="1px solid"
                        borderColor={COLORS.borderColor}
                    >
                        <Flex gap={1} fontSize="14px">
                            <Text color={COLORS.textTertiary}>缺陷数量：</Text>
                            <Text color={COLORS.textPrimary} fontWeight="500">
                                {modalDefects.length}
                            </Text>
                        </Flex>
                    </Flex>

                    {/* Defect List */}
                    <Box>
                        {modalDefects.map((defect, index) => (
                            <Box
                                key={defect.id}
                                borderBottom="1px solid"
                                borderColor={COLORS.borderColor}
                            >
                                {/* Defect Header */}
                                <Flex
                                    align="center"
                                    px={6}
                                    py={3}
                                    bg={COLORS.bgSecondary}
                                >
                                    <Flex align="center" gap={4} flex="1">
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.textSecondary}
                                            w="30px"
                                            textAlign="center"
                                        >
                                            {index + 1}
                                        </Text>
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                            fontWeight="500"
                                        >
                                            {defect.defectNo}
                                        </Text>
                                        <Flex align="center" gap={2}>
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.textSecondary}
                                            >
                                                缺陷/建议积分：
                                            </Text>
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.textPrimary}
                                                fontWeight="500"
                                            >
                                                {defect.points}
                                            </Text>
                                            <Box
                                                w="18px"
                                                h="18px"
                                                borderRadius="50%"
                                                bg={COLORS.yellow}
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                            >
                                                <Text
                                                    fontSize="10px"
                                                    color="white"
                                                    fontWeight="700"
                                                >
                                                    金
                                                </Text>
                                            </Box>
                                        </Flex>
                                    </Flex>

                                    <Flex align="center" gap={6}>
                                        <Flex align="center" gap={2}>
                                            <Box
                                                w="6px"
                                                h="6px"
                                                borderRadius="50%"
                                                bg={
                                                    defect.type === 'defect'
                                                        ? COLORS.orange
                                                        : COLORS.green
                                                }
                                            />
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.textSecondary}
                                            >
                                                {defect.type === 'defect'
                                                    ? '缺陷'
                                                    : '建议'}
                                            </Text>
                                        </Flex>
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.orange}
                                        >
                                            {defect.status}
                                        </Text>
                                        {/* 只有"判定中"状态的缺陷才能移出，已判定的缺陷移出按钮禁用 */}
                                        <Box
                                            as="button"
                                            px={4}
                                            py={1}
                                            border="1px solid"
                                            borderColor={defect.status === '判定中' ? COLORS.primary : COLORS.borderColor}
                                            borderRadius="4px"
                                            fontSize="14px"
                                            color={defect.status === '判定中' ? COLORS.primary : COLORS.textTertiary}
                                            cursor={defect.status === '判定中' ? 'pointer' : 'not-allowed'}
                                            bg={defect.status === '判定中' ? 'transparent' : 'rgba(0, 0, 0, 0.02)'}
                                            opacity={defect.status === '判定中' ? 1 : 0.5}
                                            _hover={defect.status === '判定中' ? {
                                                bg: 'rgba(227, 20, 36, 0.05)',
                                            } : {}}
                                            onClick={() => {
                                                if (defect.status === '判定中') {
                                                    onRemoveDefect?.(defect.id);
                                                }
                                            }}
                                        >
                                            移出
                                        </Box>
                                    </Flex>
                                </Flex>

                                {/* Defect Content - Two Column Layout */}
                                <Flex flexDirection="column">
                                    <Flex>
                                        {/* Left Column - Defect Info */}
                                        <Box
                                            flex="1"
                                            p={6}
                                            borderRight="1px solid"
                                            borderColor={COLORS.borderColor}
                                        >
                                            {/* Title and Description */}
                                            <Box mb={4}>
                                                <Flex gap={2} mb={2}>
                                                    <Text
                                                        fontSize="14px"
                                                        color={
                                                            COLORS.textTertiary
                                                        }
                                                        flexShrink={0}
                                                    >
                                                        标题：
                                                    </Text>
                                                    <Text
                                                        fontSize="14px"
                                                        color={
                                                            COLORS.textPrimary
                                                        }
                                                        fontWeight="500"
                                                    >
                                                        {defect.title}
                                                    </Text>
                                                </Flex>
                                                <Flex gap={2}>
                                                    <Text
                                                        fontSize="14px"
                                                        color={
                                                            COLORS.textTertiary
                                                        }
                                                        flexShrink={0}
                                                    >
                                                        描述：
                                                    </Text>
                                                    <Text
                                                        fontSize="14px"
                                                        color={
                                                            COLORS.textSecondary
                                                        }
                                                        lineHeight="1.6"
                                                    >
                                                        {defect.description}
                                                    </Text>
                                                </Flex>
                                            </Box>

                                            {/* Attachments */}
                                            <Box mb={4}>
                                                <Flex
                                                    align="center"
                                                    gap={4}
                                                    mb={2}
                                                >
                                                    <Text
                                                        fontSize="14px"
                                                        color={
                                                            COLORS.textTertiary
                                                        }
                                                    >
                                                        附件：
                                                    </Text>
                                                    <Text
                                                        fontSize="14px"
                                                        color={COLORS.blue}
                                                        cursor="pointer"
                                                        _hover={{
                                                            textDecoration:
                                                                'underline',
                                                        }}
                                                        onClick={() =>
                                                            onDownloadAll(
                                                                defect.attachments
                                                            )
                                                        }
                                                    >
                                                        全部下载
                                                    </Text>
                                                </Flex>
                                                <Flex gap={2} flexWrap="wrap">
                                                    {defect.attachments.map(
                                                        (attachment, idx) => {
                                                            const isVideo =
                                                                attachment.includes(
                                                                    '.mp4'
                                                                ) ||
                                                                attachment.includes(
                                                                    '.mov'
                                                                ) ||
                                                                attachment.includes(
                                                                    '.avi'
                                                                ) ||
                                                                attachment.includes(
                                                                    '.webm'
                                                                );
                                                            return (
                                                                <Box
                                                                    key={idx}
                                                                    w="60px"
                                                                    h="60px"
                                                                    borderRadius="4px"
                                                                    overflow="hidden"
                                                                    border="1px solid"
                                                                    borderColor={
                                                                        COLORS.borderColor
                                                                    }
                                                                    cursor="pointer"
                                                                    onClick={() =>
                                                                        onOpenPreview(
                                                                            defect.attachments,
                                                                            idx
                                                                        )
                                                                    }
                                                                    _hover={{
                                                                        opacity: 0.8,
                                                                    }}
                                                                    position="relative"
                                                                >
                                                                    {isVideo ? (
                                                                        <Box
                                                                            w="100%"
                                                                            h="100%"
                                                                            position="relative"
                                                                        >
                                                                            <video
                                                                                src={
                                                                                    attachment
                                                                                }
                                                                                style={{
                                                                                    width: '100%',
                                                                                    height: '100%',
                                                                                    objectFit:
                                                                                        'cover',
                                                                                }}
                                                                            />
                                                                            <Text
                                                                                position="absolute"
                                                                                bottom="2px"
                                                                                right="2px"
                                                                                fontSize="10px"
                                                                                bg="rgba(0,0,0,0.7)"
                                                                                color="white"
                                                                                px={
                                                                                    1
                                                                                }
                                                                                borderRadius="2px"
                                                                            >
                                                                                视频
                                                                            </Text>
                                                                        </Box>
                                                                    ) : (
                                                                        <Image
                                                                            src={
                                                                                attachment
                                                                            }
                                                                            alt={`附件${idx + 1}`}
                                                                            w="100%"
                                                                            h="100%"
                                                                            objectFit="cover"
                                                                        />
                                                                    )}
                                                                </Box>
                                                            );
                                                        }
                                                    )}
                                                </Flex>
                                            </Box>
                                        </Box>

                                        {/* Right Column - Case Info */}
                                        <Box w="280px" p={6}>
                                            <Flex gap={2} mb={3}>
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    flexShrink={0}
                                                >
                                                    所属用例：
                                                </Text>
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textPrimary}
                                                >
                                                    {defect.caseName}
                                                </Text>
                                            </Flex>
                                            <Flex gap={2} mb={3}>
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    flexShrink={0}
                                                >
                                                    关联步骤：
                                                </Text>
                                                <Flex
                                                    gap={1}
                                                    flexWrap="wrap"
                                                    align="center"
                                                >
                                                    {defect.relatedSteps.map(
                                                        (step, idx) => (
                                                            <Text
                                                                key={idx}
                                                                fontSize="14px"
                                                                color={
                                                                    COLORS.textSecondary
                                                                }
                                                            >
                                                                {step}
                                                                {idx <
                                                                    defect
                                                                        .relatedSteps
                                                                        .length -
                                                                    1
                                                                    ? '、'
                                                                    : ''}
                                                            </Text>
                                                        )
                                                    )}
                                                    <Text
                                                        fontSize="14px"
                                                        color={COLORS.primary}
                                                        cursor="pointer"
                                                        ml={1}
                                                        _hover={{
                                                            textDecoration:
                                                                'underline',
                                                        }}
                                                        onClick={() =>
                                                            onOpenStepDetails(
                                                                defect.caseName,
                                                                defect.relatedSteps,
                                                                defect.testCaseId
                                                            )
                                                        }
                                                    >
                                                        查看详情
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                            <Flex gap={2}>
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                >
                                                    审核意见：
                                                </Text>
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textSecondary}
                                                >
                                                    {defect.reviewComment || ''}
                                                </Text>
                                            </Flex>
                                        </Box>
                                    </Flex>

                                    {/* Device Info Footer */}
                                    <Flex
                                        px={6}
                                        py={4}
                                        gap={6}
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                        borderTop="1px solid"
                                        borderColor={COLORS.borderColor}
                                    >
                                        <Flex gap={1}>
                                            <Text>机型：</Text>
                                            <Text color={COLORS.textSecondary}>
                                                {defect.deviceModel}
                                            </Text>
                                        </Flex>
                                        <Flex gap={1}>
                                            <Text>系统：</Text>
                                            <Text color={COLORS.textSecondary}>
                                                {defect.system}
                                            </Text>
                                        </Flex>
                                        <Flex gap={1}>
                                            <Text>提交人：</Text>
                                            <Text color={COLORS.textSecondary}>
                                                {defect.submitter}
                                            </Text>
                                        </Flex>
                                        <Flex gap={1}>
                                            <Text>提交时间：</Text>
                                            <Text color={COLORS.textSecondary}>
                                                {defect.submitTime}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                </Flex>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Modal Footer */}
                <Flex
                    align="center"
                    justify="space-between"
                    px={6}
                    py={4}
                    borderTop="1px solid"
                    borderColor={COLORS.borderColor}
                >
                    <Box
                        as="button"
                        px={4}
                        py={2}
                        border="1px solid"
                        borderColor={hasJudgedDefects ? COLORS.borderColor : COLORS.borderColor}
                        borderRadius="4px"
                        fontSize="14px"
                        color={hasJudgedDefects ? COLORS.textTertiary : COLORS.textSecondary}
                        cursor={hasJudgedDefects ? 'not-allowed' : 'pointer'}
                        bg={hasJudgedDefects ? 'rgba(0, 0, 0, 0.02)' : 'transparent'}
                        opacity={hasJudgedDefects ? 0.5 : 1}
                        _hover={hasJudgedDefects ? {} : { bg: COLORS.bgSecondary }}
                        onClick={() => {
                            if (!hasJudgedDefects) {
                                onDeleteGroup?.();
                            }
                        }}
                    >
                        解散组
                    </Box>
                    <Flex gap={3}>
                        <Box
                            as="button"
                            px={6}
                            py={2}
                            border="1px solid"
                            borderColor={COLORS.borderColor}
                            borderRadius="4px"
                            fontSize="14px"
                            color={COLORS.textSecondary}
                            cursor="pointer"
                            _hover={{ bg: COLORS.bgSecondary }}
                            onClick={onClose}
                        >
                            取消
                        </Box>
                        <Box
                            as="button"
                            px={6}
                            py={2}
                            bg={
                                isAlreadyJudged
                                    ? COLORS.bgSecondary
                                    : 'linear-gradient(to right, #ff9565, #fe5f6b)'
                            }
                            borderRadius="4px"
                            fontSize="14px"
                            color={
                                isAlreadyJudged ? COLORS.textTertiary : 'white'
                            }
                            cursor={
                                isSubmitting || isAlreadyJudged
                                    ? 'not-allowed'
                                    : 'pointer'
                            }
                            _hover={{ opacity: isAlreadyJudged ? 1 : 0.9 }}
                            onClick={isAlreadyJudged ? undefined : handleSubmit}
                            opacity={isSubmitting ? 0.6 : 1}
                            pointerEvents={
                                isSubmitting || isAlreadyJudged
                                    ? 'none'
                                    : 'auto'
                            }
                        >
                            {isAlreadyJudged
                                ? '已判定'
                                : isSubmitting
                                    ? '提交中...'
                                    : '判定'}
                        </Box>
                    </Flex>
                </Flex>
            </Box>
        </Box>
    );
}

// Add Group Dialog Component
function AddGroupDialog({
    isOpen,
    onClose,
    selectedDefects,
    allDefects,
    onCreateGroup,
}: {
    isOpen: boolean;
    onClose: () => void;
    selectedDefects: string[];
    allDefects: JudgmentDefect[];
    onCreateGroup: (groupName: string, defectIds: string[]) => void;
}) {
    const [groupName, setGroupName] = useState('');
    const [localSelectedDefects, setLocalSelectedDefects] = useState<string[]>(
        []
    );

    React.useEffect(() => {
        if (isOpen) {
            setGroupName('');
            setLocalSelectedDefects([]);
        }
    }, [isOpen]);

    const handleCreate = () => {
        if (!groupName.trim()) {
            alert('请输入组名');
            return;
        }

        onCreateGroup(groupName, localSelectedDefects);
    };

    const handleDefectToggle = (defectId: string) => {
        setLocalSelectedDefects((prev) =>
            prev.includes(defectId)
                ? prev.filter((id) => id !== defectId)
                : [...prev, defectId]
        );
    };

    if (!isOpen) return null;

    return (
        <DialogRoot
            open={isOpen}
            onOpenChange={(e) => !e.open && onClose()}
            size="lg"
        >
            <DialogBackdrop />
            <DialogContent
                maxW="700px"
                position="fixed"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                maxH="80vh"
                overflowY="auto"
            >
                <DialogHeader>
                    <DialogTitle
                        fontSize="18px"
                        fontWeight="600"
                        color={COLORS.textPrimary}
                    >
                        创建重复缺陷组
                    </DialogTitle>
                    <DialogCloseTrigger />
                </DialogHeader>
                <DialogBody>
                    <VStack gap={4} align="stretch">
                        <Field.Root required>
                            <Field.Label
                                fontSize="14px"
                                color={COLORS.textPrimary}
                                mb={2}
                            >
                                组名
                            </Field.Label>
                            <Input
                                placeholder="请输入组名"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                fontSize="14px"
                                borderColor={COLORS.borderColor}
                                color={COLORS.textSecondary}
                                _hover={{ borderColor: COLORS.textTertiary }}
                                _focus={{
                                    borderColor: COLORS.primary,
                                    boxShadow: `0 0 0 1px ${COLORS.primary}`,
                                }}
                            />
                        </Field.Root>

                        <Field.Root>
                            <Field.Label
                                fontSize="14px"
                                color={COLORS.textPrimary}
                                mb={2}
                            >
                                选择缺陷（可选）
                            </Field.Label>
                            <Box
                                border="1px solid"
                                borderColor={COLORS.borderColor}
                                borderRadius="4px"
                                maxH="300px"
                                overflowY="auto"
                            >
                                {allDefects.length === 0 ? (
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                        p={4}
                                    >
                                        暂无缺陷
                                    </Text>
                                ) : (
                                    allDefects.map((defect) => (
                                        <Flex
                                            key={defect.id}
                                            align="center"
                                            gap={3}
                                            p={3}
                                            borderBottom="1px solid"
                                            borderColor={COLORS.borderColor}
                                            _last={{ borderBottom: 'none' }}
                                            cursor="pointer"
                                            _hover={{ bg: COLORS.bgSecondary }}
                                            onClick={() =>
                                                handleDefectToggle(defect.id)
                                            }
                                        >
                                            <Checkbox
                                                checked={localSelectedDefects.includes(
                                                    defect.id
                                                )}
                                                onCheckedChange={() =>
                                                    handleDefectToggle(
                                                        defect.id
                                                    )
                                                }
                                            />
                                            <Box flex="1">
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textPrimary}
                                                    fontWeight="500"
                                                >
                                                    {defect.defectNo}
                                                </Text>
                                                <Text
                                                    fontSize="12px"
                                                    color={COLORS.textTertiary}
                                                    overflow="hidden"
                                                    textOverflow="ellipsis"
                                                    whiteSpace="nowrap"
                                                >
                                                    {defect.title}
                                                </Text>
                                            </Box>
                                            <Text
                                                fontSize="12px"
                                                color={COLORS.textSecondary}
                                            >
                                                {defect.points}分
                                            </Text>
                                        </Flex>
                                    ))
                                )}
                            </Box>
                            <Text
                                fontSize="12px"
                                color={COLORS.textTertiary}
                                mt={2}
                            >
                                已选择 {localSelectedDefects.length} 个缺陷
                            </Text>
                        </Field.Root>
                    </VStack>
                </DialogBody>
                <DialogFooter>
                    <Flex gap={3} justify="flex-end" w="100%">
                        <Button
                            variant="outline"
                            borderColor={COLORS.borderColor}
                            color={COLORS.textSecondary}
                            onClick={onClose}
                        >
                            取消
                        </Button>
                        <Button
                            bg="linear-gradient(to right, #ff9565, #fe5f6b)"
                            color="white"
                            onClick={handleCreate}
                        >
                            创建
                        </Button>
                    </Flex>
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    );
}

export default function BusinessJudgmentPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    // Token validation state
    const [isValidatingToken, setIsValidatingToken] = useState(true);
    const [tokenError, setTokenError] = useState<string | null>(null);
    const [validatedTaskId, setValidatedTaskId] = useState<string | null>(null);

    // All other state hooks must be declared before any conditional returns
    const [selectedGroup, setSelectedGroup] = useState('3');
    const [selectedDefects, setSelectedDefects] = useState<string[]>([]);
    const [exportSelectedDefects, setExportSelectedDefects] = useState<
        string[]
    >([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalGroupTitle, setModalGroupTitle] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [groupsPage, setGroupsPage] = useState(1);
    const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = useState(false);

    // 预览相关状态
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewAttachments, setPreviewAttachments] = useState<string[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);

    // 步骤详情相关状态
    const [isStepDetailsOpen, setIsStepDetailsOpen] = useState(false);
    const [stepDetailsCaseName, setStepDetailsCaseName] = useState('');
    const [stepDetailsSteps, setStepDetailsSteps] = useState<string[]>([]);
    const [stepDetailsTestCaseId, setStepDetailsTestCaseId] = useState<string | undefined>(undefined);

    // 审核意见模版相关状态
    const [selectedReasonTemplate, setSelectedReasonTemplate] = useState('');
    const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
    const [isEditingReason, setIsEditingReason] = useState(false);
    const [currentReasonTemplate, setCurrentReasonTemplate] = useState({
        id: '',
        name: '',
        content: '',
    });

    // 导入缺陷相关状态
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    // 关联重复弹窗相关状态
    const [isDuplicateViewModalOpen, setIsDuplicateViewModalOpen] = useState(false);
    const [selectedDefectForDuplicate, setSelectedDefectForDuplicate] = useState<JudgmentDefect | null>(null);
    const [duplicateViewItems, setDuplicateViewItems] = useState<DuplicateDefectItem[]>([]);

    // Validate token on mount
    const { data: tokenValidation, isLoading: isTokenLoading } =
        api.review.verifyBusinessJudgmentToken.useQuery(
            { token: token || '' },
            {
                enabled: !!token,
                retry: false,
            }
        );

    // API Queries - 获取审核意见模版数据
    const { data: reasonTemplatesData, refetch: refetchReason } =
        api.notificationTemplate.getAll.useQuery({
            type: 'AUDIT_OPINION',
        });

    // API Queries - 获取缺陷等级数据字典
    const { data: defectSeverityDict } =
        api.dataDictionary.getByCode.useQuery('DEFECT_SEVERITY');

    // API Queries - 获取建议等级数据字典
    const { data: suggestionLevelDict } =
        api.dataDictionary.getByCode.useQuery('SUGGESTION_LEVEL');

    // API Queries - 获取待判定缺陷列表 (filtered by validatedTaskId and status REVIEWING)
    const { data: defectsData, refetch: refetchDefects } =
        api.defect.listForJudgment.useQuery(
            {
                page: currentPage,
                pageSize: 10,
                taskId: validatedTaskId, // Filter by the validated task
                status: 'REVIEWING', // Only show defects with REVIEWING status
            },
            {
                enabled: !!validatedTaskId,
            }
        );

    // API Queries - 获取重复缺陷组列表 (filtered by validatedTaskId and status REVIEWING)
    const { data: groupsData, refetch: refetchGroups } =
        api.defect.listDuplicateGroups.useQuery(
            {
                page: groupsPage,
                pageSize: 20,
                taskId: validatedTaskId, // Filter by the validated task
                status: 'REVIEWING', // Only show groups with REVIEWING status defects
            },
            {
                enabled: !!validatedTaskId,
            }
        );

    // API Queries - 获取重复缺陷组详情
    const { data: groupDetailData, refetch: refetchGroupDetail } =
        api.defect.getDuplicateGroupDetail.useQuery(
            { groupId: selectedGroup },
            { enabled: !!selectedGroup && isModalOpen }
        );

    // API Queries - 获取关联重复缺陷组详情（用于弹窗展示）
    const { data: duplicateViewGroupData, refetch: refetchDuplicateViewGroup } =
        api.defect.getDuplicateGroupDetail.useQuery(
            { groupId: selectedDefectForDuplicate?.duplicateGroupId || '' },
            { enabled: isDuplicateViewModalOpen && !!selectedDefectForDuplicate?.duplicateGroupId }
        );

    // API Mutations - 创建和更新审核意见模版
    const createReasonMutation = api.notificationTemplate.create.useMutation({
        onSuccess: () => {
            void refetchReason();
        },
    });
    const updateReasonMutation = api.notificationTemplate.update.useMutation({
        onSuccess: () => {
            void refetchReason();
        },
    });

    // API Mutations - 删除审核意见模版
    const deleteReasonMutation = api.notificationTemplate.delete.useMutation({
        onSuccess: () => {
            void refetchReason();
        },
    });

    // API Mutations - 创建重复缺陷组
    const createGroupMutation = api.defect.createDuplicateGroup.useMutation({
        onSuccess: () => {
            void refetchGroups();
            void refetchDefects();
            setIsAddGroupDialogOpen(false);
            setSelectedDefects([]);
            alert('创建重复缺陷组成功');
        },
        onError: (error) => {
            alert(`创建失败: ${error.message}`);
        },
    });

    // API Mutations - 添加缺陷到重复缺陷组
    const addDefectToGroupMutation = api.defect.addDefectToGroup.useMutation({
        onSuccess: () => {
            void refetchDefects();
            void refetchGroups();
            void refetchGroupDetail();
        },
        onError: (error) => {
            alert(`添加失败: ${error.message}`);
        },
    });

    // API Mutations - 从重复缺陷组移出缺陷
    const removeDefectFromGroupMutation =
        api.defect.removeDefectFromGroup.useMutation({
            onSuccess: () => {
                void refetchDefects();
                void refetchGroups();
                void refetchGroupDetail();
            },
            onError: (error) => {
                alert(`移出失败: ${error.message}`);
            },
        });

    // API Mutations - 删除重复缺陷组
    const deleteDuplicateGroupMutation =
        api.defect.deleteDuplicateGroup.useMutation({
            onSuccess: () => {
                void refetchGroups();
                void refetchDefects();
                setIsModalOpen(false);
                setSelectedGroup('');
            },
            onError: (error) => {
                alert(`删除失败: ${error.message}`);
            },
        });

    // API Mutations - 批量导入缺陷
    const batchImportMutation = api.defect.batchImport.useMutation({
        onSuccess: (result) => {
            void refetchDefects();
            setIsImportDialogOpen(false);
            setImportFile(null);
            alert(result.message);
        },
        onError: (error) => {
            alert(`导入失败: ${error.message}`);
        },
    });

    // API Mutations - 提交业务判定
    const submitJudgmentMutation =
        api.defect.submitBusinessJudgment.useMutation({
            onSuccess: () => {
                void refetchDefects();
                alert('业务判定提交成功');
            },
            onError: (error) => {
                alert(`提交失败: ${error.message}`);
            },
        });

    // API Mutations - 批量提交业务判定（用于重复缺陷组）
    const submitBatchJudgmentMutation =
        api.defect.submitBatchBusinessJudgment.useMutation({
            onSuccess: () => {
                void refetchDefects();
                void refetchGroups();
                void refetchGroupDetail(); // 刷新重复缺陷组弹窗数据
                // 仅当弹窗打开且有效时才刷新关联重复缺陷组数据
                if (isDuplicateViewModalOpen && selectedDefectForDuplicate?.duplicateGroupId) {
                    void refetchDuplicateViewGroup();
                }
                setIsModalOpen(false);
                alert('批量业务判定提交成功');
            },
            onError: (error) => {
                alert(`批量提交失败: ${error.message}`);
            },
        });

    useEffect(() => {
        if (!token) {
            setTokenError('缺少访问令牌，请使用有效的访问链接');
            setIsValidatingToken(false);
            return;
        }

        if (!isTokenLoading && tokenValidation) {
            if ((tokenValidation as any).success) {
                setValidatedTaskId((tokenValidation as any).data?.taskId || null);
                setIsValidatingToken(false);
            } else {
                setTokenError((tokenValidation as any).message || '访问令牌验证失败');
                setIsValidatingToken(false);
            }
        }
    }, [token, tokenValidation, isTokenLoading]);

    // 监听 duplicateViewGroupData 变化，更新 duplicateViewItems
    useEffect(() => {
        if (duplicateViewGroupData?.duplicateDefects) {
            const items: DuplicateDefectItem[] = duplicateViewGroupData.duplicateDefects
                .filter((d) => d.id !== selectedDefectForDuplicate?.id) // 排除当前缺陷
                .map((defect) => ({
                    id: defect.id,
                    number: defect.id.substring(0, 10),
                    points: defect.earnedPoints,
                    type: (defect.type === 'BUG' ? 'defect' : 'suggestion') as 'defect' | 'suggestion',
                    title: defect.title,
                    description: defect.description,
                    status: defect.status,
                    severity: defect.severity || undefined,
                    suggestionLevel: defect.suggestionLevel || undefined,
                    attachments: defect.attachments || [],
                    caseName: defect.testCase?.title || '',
                    relatedSteps: defect.steps ? defect.steps.split(/[,、，]/).map((s) => s.trim()).filter(Boolean).join('、') : '',
                    reviewComment: defect.reviewComment || '',
                    supplementaryExplanation: defect.supplementaryExplanation || '',
                    deviceModel: '',
                    system: '',
                    submitter: defect.user?.name || '',
                    submitTime: new Date(defect.createdAt).toLocaleString('zh-CN'),
                }));
            setDuplicateViewItems(items);
        } else if (isDuplicateViewModalOpen && selectedDefectForDuplicate && !duplicateViewGroupData) {
            // 如果无关联重复，打开空弹窗
            setDuplicateViewItems([]);
        }
    }, [duplicateViewGroupData, isDuplicateViewModalOpen, selectedDefectForDuplicate]);

    // 打开关联重复弹窗
    const handleOpenDuplicateView = (defect: JudgmentDefect) => {
        setSelectedDefectForDuplicate(defect);
        setIsDuplicateViewModalOpen(true);
    };

    // Show loading state while validating token
    if (isValidatingToken || isTokenLoading) {
        return (
            <Center h="100vh" bg={COLORS.bgSecondary}>
                <VStack gap={4}>
                    <Spinner size="xl" color={COLORS.primary} />
                    <Text fontSize="16px" color={COLORS.textSecondary}>
                        验证访问权限...
                    </Text>
                </VStack>
            </Center>
        );
    }

    // Show error state if token is invalid
    if (tokenError || !validatedTaskId) {
        return (
            <Center h="100vh" bg={COLORS.bgSecondary}>
                <VStack
                    gap={4}
                    maxW="500px"
                    p={8}
                    bg={COLORS.bgPrimary}
                    borderRadius="8px"
                    boxShadow="sm"
                >
                    <Text fontSize="48px">🔒</Text>
                    <Text
                        fontSize="20px"
                        fontWeight="600"
                        color={COLORS.textPrimary}
                    >
                        访问受限
                    </Text>
                    <Text
                        fontSize="14px"
                        color={COLORS.textSecondary}
                        textAlign="center"
                    >
                        {tokenError || '无效的访问令牌'}
                    </Text>
                    <Text
                        fontSize="12px"
                        color={COLORS.textTertiary}
                        textAlign="center"
                    >
                        请联系众测管理员获取有效的访问链接
                    </Text>
                </VStack>
            </Center>
        );
    }

    // 打开添加审核意见模版对话框
    const handleOpenAddReasonDialog = () => {
        setIsEditingReason(false);
        setCurrentReasonTemplate({
            id: Date.now().toString(),
            name: '',
            content: '',
        });
        setIsReasonDialogOpen(true);
    };

    // 打开编辑审核意见模版对话框
    const handleOpenEditReasonDialog = (templateId: string) => {
        if (!templateId) {
            alert('请先选择一个审核意见模版');
            return;
        }
        const template = reasonTemplatesData?.find((t) => t.id === templateId);
        if (template) {
            setIsEditingReason(true);
            setCurrentReasonTemplate({
                id: template.id,
                name: template.name || '',
                content: template.content || '',
            });
            setIsReasonDialogOpen(true);
        }
    };

    // 保存审核意见模版
    const handleSaveReasonTemplate = async () => {
        if (!currentReasonTemplate.name.trim()) {
            alert('请输入模版名称');
            return;
        }
        if (!currentReasonTemplate.content.trim()) {
            alert('请输入模版内容');
            return;
        }

        try {
            if (isEditingReason) {
                // 编辑模式：更新现有模板
                await updateReasonMutation.mutateAsync({
                    id: currentReasonTemplate.id,
                    name: currentReasonTemplate.name,
                    content: currentReasonTemplate.content,
                });
            } else {
                // 添加模式：新增模板
                await createReasonMutation.mutateAsync({
                    name: currentReasonTemplate.name,
                    type: 'AUDIT_OPINION',
                    content: currentReasonTemplate.content,
                });
            }

            setIsReasonDialogOpen(false);
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败，请重试');
        }
    };

    // 选择审核意见模版
    const handleSelectReasonTemplate = (templateId: string) => {
        setSelectedReasonTemplate(templateId);
    };

    // 删除审核意见模版
    const handleDeleteReasonTemplate = async (templateId: string) => {
        if (!templateId) {
            alert('请先选择一个审核意见模版');
            return;
        }
        if (!confirm('确定要删除该模版吗?')) {
            return;
        }
        try {
            await deleteReasonMutation.mutateAsync({ id: templateId });
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败，请重试');
        }
    };

    const handleGroupClick = (group: DefectGroup) => {
        setSelectedGroup(group.id);
        setModalGroupTitle(group.title);
        setIsModalOpen(true);
    };

    // 打开预览
    const handleOpenPreview = (attachments: string[], index: number) => {
        setPreviewAttachments(attachments);
        setPreviewIndex(index);
        setIsPreviewOpen(true);
    };

    // 关闭预览
    const handleClosePreview = () => {
        setIsPreviewOpen(false);
    };

    // 预览导航
    const handlePreviewNavigate = (direction: 'prev' | 'next') => {
        if (direction === 'prev' && previewIndex > 0) {
            setPreviewIndex(previewIndex - 1);
        } else if (
            direction === 'next' &&
            previewIndex < previewAttachments.length - 1
        ) {
            setPreviewIndex(previewIndex + 1);
        }
    };

    // 下载所有附件
    const handleDownloadAll = (attachments: string[]) => {
        attachments.forEach((attachment, index) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = attachment;
                link.download = `attachment-${index + 1}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, index * 200); // 延迟下载，避免浏览器阻止
        });
    };

    // 打开步骤详情
    const handleOpenStepDetails = (caseName: string, steps: string[], testCaseId?: string) => {
        setStepDetailsCaseName(caseName);
        setStepDetailsSteps(steps);
        setStepDetailsTestCaseId(testCaseId);
        setIsStepDetailsOpen(true);
    };

    // 关闭步骤详情
    const handleCloseStepDetails = () => {
        setIsStepDetailsOpen(false);
    };

    // 打开添加组对话框
    const handleOpenAddGroupDialog = () => {
        setIsAddGroupDialogOpen(true);
    };

    // 创建重复缺陷组
    const handleCreateGroup = async (
        groupName: string,
        defectIds: string[]
    ) => {
        await createGroupMutation.mutateAsync({
            name: groupName,
            defectIds: defectIds,
        });
    };

    // 处理导出选中的缺陷
    const handleExportSelectedDefects = async () => {
        if (exportSelectedDefects.length === 0) {
            alert('请先选择要导出的缺陷');
            return;
        }

        try {
            // 动态导入 ExcelJS
            const ExcelJS = (await import('exceljs')).default;

            // 获取选中的缺陷数据
            const selectedData = judgmentDefects.filter((d) =>
                exportSelectedDefects.includes(d.id)
            );

            // 创建工作簿
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('缺陷导出');

            // 设置列
            worksheet.columns = [
                { header: '缺陷编号', key: 'defectNo', width: 15 },
                { header: '标题', key: 'title', width: 30 },
                { header: '描述', key: 'description', width: 50 },
                { header: '积分', key: 'points', width: 10 },
                { header: '类型', key: 'type', width: 12 },
                { header: '用例', key: 'caseName', width: 25 },
                { header: '关联步骤', key: 'relatedSteps', width: 20 },
                { header: '附件', key: 'attachments', width: 30 },
                { header: '审核意见', key: 'reviewComment', width: 30 },
                { header: '机型', key: 'deviceModel', width: 20 },
                { header: '系统', key: 'system', width: 20 },
                { header: '提交人', key: 'submitter', width: 15 },
                { header: '提交时间', key: 'submitTime', width: 20 },
                { header: '任务ID', key: 'taskId', width: 20 },
                { header: '用例ID', key: 'testCaseId', width: 20 },
            ];

            // 添加数据行
            selectedData.forEach((defect) => {
                worksheet.addRow({
                    defectNo: defect.defectNo,
                    title: defect.title,
                    description: defect.description,
                    points: defect.points,
                    type: defect.type === 'defect' ? '缺陷' : '建议',
                    caseName: defect.caseName,
                    relatedSteps: defect.relatedSteps.join('; '),
                    attachments: defect.attachments.join('; '),
                    reviewComment: defect.reviewComment,
                    deviceModel: defect.deviceModel,
                    system: defect.system,
                    submitter: defect.submitter,
                    submitTime: defect.submitTime,
                    taskId: defect.taskId,
                    testCaseId: defect.testCaseId,
                });
            });

            // 设置标题行样式
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' },
            };

            // 生成 Excel 文件并下载
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `缺陷导出_${new Date().getTime()}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // 清空选中状态
            setExportSelectedDefects([]);
        } catch (error) {
            alert(
                '导出失败：' +
                (error instanceof Error ? error.message : '未知错误')
            );
        }
    };

    // 添加缺陷到重复缺陷组
    const handleMoveToGroup = async (defectId: string, groupId: string) => {
        await addDefectToGroupMutation.mutateAsync({
            groupId: groupId,
            defectId: defectId,
        });
    };

    // 从重复缺陷组移出缺陷
    const handleRemoveDefectFromGroup = async (defectId: string) => {
        await removeDefectFromGroupMutation.mutateAsync({
            defectId: defectId,
        });
    };

    // 删除重复缺陷组
    const handleDeleteDuplicateGroup = async () => {
        if (!selectedGroup) {
            alert('请先选择一个重复缺陷组');
            return;
        }

        await deleteDuplicateGroupMutation.mutateAsync({
            groupId: selectedGroup,
        });
    };

    // 打开导入对话框
    const handleOpenImportDialog = () => {
        setIsImportDialogOpen(true);
        setImportFile(null);
    };

    // 处理文件选择
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImportFile(file);
        }
    };

    // 下载导入模板
    const handleDownloadTemplate = async () => {
        const { downloadDefectTemplate } = await import(
            './utils/defectExcelUtils'
        );
        await downloadDefectTemplate();
    };

    // 处理导入
    const handleImport = async () => {
        if (!importFile) {
            alert('请先选择要导入的文件');
            return;
        }

        setIsImporting(true);
        try {
            const { importDefectsFromExcel } = await import(
                './utils/defectExcelUtils'
            );
            const defects = await importDefectsFromExcel(importFile);

            await batchImportMutation.mutateAsync({ defects });
        } catch (error) {
            alert(error instanceof Error ? error.message : '导入失败');
        } finally {
            setIsImporting(false);
        }
    };

    // 获取缺陷列表数据
    const judgmentDefects: JudgmentDefect[] = (defectsData?.data || []).map(
        (defect) => ({
            id: defect.id,
            taskId: defect.taskId,
            testCaseId: defect.testCaseId,
            defectNo: defect.id.substring(0, 10),
            title: defect.title,
            description: defect.description,
            points: defect.earnedPoints,
            relatedRepeats: 0, // TODO: 需要计算关联重复数
            type: defect.type === 'BUG' ? 'defect' : 'suggestion',
            caseName: defect.testCase?.title || '',
            relatedSteps: defect.steps ? defect.steps.split(/[,、，]/).map((s) => s.trim()).filter(Boolean) : [],
            reviewComment: defect.reviewComment || '',
            deviceModel: '', // TODO: 需要从附加信息中获取
            system: '', // TODO: 需要从附加信息中获取
            submitter: defect.user?.name || '',
            submitTime: new Date(defect.createdAt).toLocaleString('zh-CN'),
            attachments: defect.attachments || [],
            duplicateGroupId: defect.duplicateGroupId,
        })
    );
    const defectGroups = groupsData?.data || [];

    // 获取数据字典项
    const defectSeverityItems = defectSeverityDict?.items || [];
    const suggestionLevelItems = suggestionLevelDict?.items || [];

    return (
        <Box minH="100vh" bg={COLORS.bgTertiary}>
            {/* Header */}
            <Flex
                h="56px"
                bg={COLORS.bgPrimary}
                borderBottom="1px solid"
                borderColor={COLORS.borderColor}
                align="center"
                px={6}
                justify="space-between"
                position="fixed"
                top="0"
                left="0"
                right="0"
                zIndex="10"
            >
                <Flex align="center" gap={4}>
                    {/* Logo */}
                    <Flex align="center" gap={2}>
                        <Box w="32px" h="32px">
                            <svg viewBox="0 0 40 40" fill="none">
                                <path
                                    d="M20 5L35 15V25L20 35L5 25V15L20 5Z"
                                    fill="#E31424"
                                />
                                <path
                                    d="M20 5L35 15L20 25L5 15L20 5Z"
                                    fill="#E31424"
                                />
                                <path
                                    d="M12 18L20 23L28 18"
                                    stroke="white"
                                    strokeWidth="2"
                                />
                            </svg>
                        </Box>
                        <Text
                            fontSize="18px"
                            fontWeight="600"
                            color={COLORS.primary}
                        >
                            广发众测
                        </Text>
                    </Flex>
                    <Text
                        fontSize="16px"
                        color={COLORS.textPrimary}
                        fontWeight="500"
                    >
                        缺陷判定
                    </Text>
                </Flex>

                <Flex align="center" gap={3}>
                    <Box
                        as="button"
                        px={4}
                        py={2}
                        bg="linear-gradient(to right, #ff9565, #fe5f6b)"
                        color="white"
                        borderRadius="4px"
                        fontSize="14px"
                        cursor="pointer"
                        _hover={{ opacity: 0.9 }}
                        onClick={handleExportSelectedDefects}
                    >
                        批量导出
                    </Box>
                    <Box
                        as="button"
                        px={4}
                        py={2}
                        border="1px solid"
                        borderColor={COLORS.primary}
                        borderRadius="4px"
                        fontSize="14px"
                        color={COLORS.primary}
                        cursor="pointer"
                        _hover={{ bg: 'rgba(227, 20, 36, 0.05)' }}
                        onClick={handleOpenImportDialog}
                    >
                        导入缺陷
                    </Box>
                </Flex>
            </Flex>

            {/* Main Content */}
            <Flex>
                {/* Left Sidebar */}
                <Box
                    position="fixed"
                    top="76px"
                    w="420px"
                    bg={COLORS.bgPrimary}
                    borderRight="1px solid"
                    borderColor={COLORS.borderColor}
                    minH="calc(100vh - 56px)"
                >
                    <Flex
                        align="center"
                        justify="space-between"
                        p={4}
                        borderBottom="1px solid"
                        borderColor={COLORS.borderColor}
                    >
                        <Text
                            fontSize="16px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                        >
                            重复缺陷组
                        </Text>
                        <Box
                            as="button"
                            px={3}
                            py={1}
                            border="1px solid"
                            borderColor={COLORS.primary}
                            borderRadius="4px"
                            fontSize="14px"
                            color={COLORS.primary}
                            cursor="pointer"
                            _hover={{ bg: 'rgba(227, 20, 36, 0.05)' }}
                            onClick={handleOpenAddGroupDialog}
                        >
                            添加组
                        </Box>
                    </Flex>

                    <Box overflow="auto" h="calc(100vh - 162px)">
                        {defectGroups.map((group) => {
                            const isActive = selectedGroup === group.id;
                            return (
                                <Flex
                                    key={group.id}
                                    align="center"
                                    justify="space-between"
                                    p={4}
                                    cursor="pointer"
                                    bg={
                                        isActive
                                            ? COLORS.lightRed
                                            : 'transparent'
                                    }
                                    borderBottom="1px solid"
                                    borderColor={COLORS.borderColor}
                                    _hover={{
                                        bg: isActive
                                            ? COLORS.lightRed
                                            : COLORS.bgSecondary,
                                    }}
                                    onClick={() => setSelectedGroup(group.id)}
                                >
                                    <Box flex="1" pr={2}>
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                            mb={1}
                                            overflow="hidden"
                                            textOverflow="ellipsis"
                                            whiteSpace="nowrap"
                                        >
                                            {group.title}
                                        </Text>
                                        <Flex gap={4} fontSize="14px">
                                            <Flex gap={1}>
                                                <Text
                                                    color={COLORS.textTertiary}
                                                >
                                                    缺陷数量：
                                                </Text>
                                                <Text
                                                    color={COLORS.textSecondary}
                                                >
                                                    {group.defectCount}
                                                </Text>
                                            </Flex>
                                            <Flex gap={1}>
                                                <Text
                                                    color={COLORS.textTertiary}
                                                >
                                                    待判定：
                                                </Text>
                                                <Text
                                                    color={
                                                        group.pendingCount > 0
                                                            ? COLORS.primary
                                                            : COLORS.textSecondary
                                                    }
                                                >
                                                    {group.pendingCount}
                                                </Text>
                                            </Flex>
                                        </Flex>
                                    </Box>
                                    <LuChevronRight
                                        size={24}
                                        color={COLORS.textTertiary}
                                        onClick={() => handleGroupClick(group)}
                                    />
                                </Flex>
                            );
                        })}
                    </Box>
                </Box>

                {/* Main Content Area */}
                <Box flex="1" p={6} pl={20} ml="420px" pt="72px">
                    {judgmentDefects.map((defect, index) => (
                        <DefectJudgmentCard
                            key={defect.id}
                            defect={defect}
                            index={index}
                            reasonTemplatesData={reasonTemplatesData}
                            onOpenAddReasonDialog={handleOpenAddReasonDialog}
                            onOpenEditReasonDialog={handleOpenEditReasonDialog}
                            onDeleteReasonTemplate={handleDeleteReasonTemplate}
                            defectSeverityItems={defectSeverityItems}
                            suggestionLevelItems={suggestionLevelItems}
                            onOpenPreview={handleOpenPreview}
                            onDownloadAll={handleDownloadAll}
                            onOpenStepDetails={handleOpenStepDetails}
                            selectedGroup={selectedGroup}
                            onMoveToGroup={handleMoveToGroup}
                            exportSelected={exportSelectedDefects.includes(
                                defect.id
                            )}
                            onExportSelect={() => {
                                if (exportSelectedDefects.includes(defect.id)) {
                                    setExportSelectedDefects(
                                        exportSelectedDefects.filter(
                                            (id) => id !== defect.id
                                        )
                                    );
                                } else {
                                    setExportSelectedDefects([
                                        ...exportSelectedDefects,
                                        defect.id,
                                    ]);
                                }
                            }}
                            onSubmitJudgment={(data) => {
                                submitJudgmentMutation.mutate({
                                    defectId: defect.id,
                                    conclusion:
                                        data.conclusion === 'defect'
                                            ? 'BUG'
                                            : 'SUGGESTION',
                                    severity:
                                        data.conclusion === 'defect'
                                            ? (data.level as any)
                                            : undefined,
                                    suggestionLevel:
                                        data.conclusion === 'suggestion'
                                            ? (data.level as any)
                                            : undefined,
                                    judgmentReason: data.reasonText,
                                    defectType: data.defectType,
                                });
                            }}
                            isSubmitting={submitJudgmentMutation.isPending}
                            onOpenDuplicate={handleOpenDuplicateView}
                        />
                    ))}
                </Box>
            </Flex>

            {/* Step Details Modal */}
            <StepDetailsModal
                isOpen={isStepDetailsOpen}
                onClose={handleCloseStepDetails}
                caseName={stepDetailsCaseName}
                steps={stepDetailsSteps}
                testCaseId={stepDetailsTestCaseId}
            />

            {/* Attachment Preview Modal */}
            <AttachmentPreviewModal
                isOpen={isPreviewOpen}
                onClose={handleClosePreview}
                attachments={previewAttachments}
                currentIndex={previewIndex}
                onNavigate={handlePreviewNavigate}
            />

            {/* Duplicate Defects Modal */}
            <DuplicateDefectsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                groupTitle={modalGroupTitle}
                reasonTemplatesData={reasonTemplatesData}
                onOpenAddReasonDialog={handleOpenAddReasonDialog}
                onOpenEditReasonDialog={handleOpenEditReasonDialog}
                onDeleteReasonTemplate={handleDeleteReasonTemplate}
                defectSeverityItems={defectSeverityItems}
                suggestionLevelItems={suggestionLevelItems}
                onOpenPreview={handleOpenPreview}
                onDownloadAll={handleDownloadAll}
                onOpenStepDetails={handleOpenStepDetails}
                onRemoveDefect={handleRemoveDefectFromGroup}
                onDeleteGroup={handleDeleteDuplicateGroup}
                onSubmitBatchJudgment={(data) => {
                    submitBatchJudgmentMutation.mutate({
                        defectIds: data.defectIds,
                        conclusion:
                            data.conclusion === 'defect' ? 'BUG' : 'SUGGESTION',
                        severity:
                            data.conclusion === 'defect'
                                ? (data.level as any)
                                : undefined,
                        suggestionLevel:
                            data.conclusion === 'suggestion'
                                ? (data.level as any)
                                : undefined,
                        judgmentReason: data.reasonText,
                        defectType: data.defectType,
                    });
                }}
                isSubmitting={submitBatchJudgmentMutation.isPending}
                modalDefects={
                    groupDetailData?.duplicateDefects.map((defect) => ({
                        id: defect.id,
                        defectNo: defect.id.substring(0, 10),
                        testCaseId: defect.testCaseId,
                        title: defect.title,
                        description: defect.description,
                        points: defect.earnedPoints,
                        type: defect.type === 'BUG' ? 'defect' : 'suggestion',
                        status:
                            defect.status === 'REVIEWING'
                                ? '判定中'
                                : defect.status === 'TO_CONFIRM'
                                    ? '待确认'
                                    : defect.status === 'APPROVED'
                                        ? '已通过'
                                        : defect.status === 'REJECTED'
                                            ? '已驳回'
                                            : defect.status === 'DUPLICATE'
                                                ? '重复'
                                                : defect.status === 'CLOSED'
                                                    ? '已关闭'
                                                    : '已提交',
                        caseName: defect.testCase?.title || '',
                        relatedSteps: defect.steps ? defect.steps.split(/[,、，]/).map((s) => s.trim()).filter(Boolean) : [],
                        reviewComment: defect.reviewComment || '',
                        deviceModel: '', // TODO: 需要从附加信息中获取
                        system: '', // TODO: 需要从附加信息中获取
                        submitter: defect.user?.name || '',
                        submitTime: new Date(defect.createdAt).toLocaleString(
                            'zh-CN'
                        ),
                        attachments: defect.attachments || [],
                        // 判定结果数据
                        judgmentReason: defect.judgmentReason || '',
                        severity: defect.severity || '',
                        suggestionLevel: defect.suggestionLevel || '',
                        category: defect.category || '',
                        judgedAt: defect.judgedAt
                            ? new Date(defect.judgedAt).toLocaleString('zh-CN')
                            : '',
                    })) || []
                }
            />

            {/* Duplicate View Modal - 弹窗显示关联重复 */}
            <DuplicateViewModal
                isOpen={isDuplicateViewModalOpen}
                onClose={() => setIsDuplicateViewModalOpen(false)}
                title={selectedDefectForDuplicate?.title || ''}
                items={duplicateViewItems}
                defectSeverityDict={defectSeverityDict}
                suggestionLevelDict={suggestionLevelDict}
                onPreview={handleOpenPreview}
                onDownloadAll={handleDownloadAll}
            />
            <DialogRoot
                open={isReasonDialogOpen}
                onOpenChange={(e) => setIsReasonDialogOpen(e.open)}
                size="lg"
                placement="center"
                motionPreset="slide-in-bottom"
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
                        <DialogTitle
                            fontSize="18px"
                            fontWeight="600"
                            color="#1d2129"
                        >
                            {isEditingReason
                                ? '编辑审核意见模版'
                                : '添加审核意见模版'}
                        </DialogTitle>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody>
                        <VStack gap={4} align="stretch">
                            <Field.Root required>
                                <Field.Label
                                    fontSize="14px"
                                    color="#1d2129"
                                    mb={2}
                                >
                                    模版名称
                                </Field.Label>
                                <Input
                                    placeholder="请输入模版名称"
                                    value={currentReasonTemplate.name}
                                    onChange={(e) =>
                                        setCurrentReasonTemplate({
                                            ...currentReasonTemplate,
                                            name: e.target.value,
                                        })
                                    }
                                    bg="#F7F8FA"
                                    borderColor="#E5E6EB"
                                    _hover={{ borderColor: '#C9CDD4' }}
                                    _focus={{
                                        borderColor: '#E31424',
                                        boxShadow: '0 0 0 1px #E31424',
                                    }}
                                />
                            </Field.Root>
                            <Field.Root required>
                                <Field.Label
                                    fontSize="14px"
                                    color="#1d2129"
                                    mb={2}
                                >
                                    模版内容
                                </Field.Label>
                                <Textarea
                                    placeholder="请输入模版内容"
                                    value={currentReasonTemplate.content}
                                    onChange={(e) =>
                                        setCurrentReasonTemplate({
                                            ...currentReasonTemplate,
                                            content: e.target.value,
                                        })
                                    }
                                    bg="#F7F8FA"
                                    borderColor="#E5E6EB"
                                    rows={8}
                                    _hover={{ borderColor: '#C9CDD4' }}
                                    _focus={{
                                        borderColor: '#E31424',
                                        boxShadow: '0 0 0 1px #E31424',
                                    }}
                                />
                            </Field.Root>
                        </VStack>
                    </DialogBody>
                    <DialogFooter>
                        <Flex gap={3} justify="flex-end" w="100%">
                            <Button
                                variant="outline"
                                borderColor="#E5E6EB"
                                color="#4E5969"
                                onClick={() => setIsReasonDialogOpen(false)}
                            >
                                取消
                            </Button>
                            <Button
                                bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                                color="white"
                                onClick={handleSaveReasonTemplate}
                            >
                                保存
                            </Button>
                        </Flex>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>

            {/* 添加组对话框 */}
            <AddGroupDialog
                isOpen={isAddGroupDialogOpen}
                onClose={() => setIsAddGroupDialogOpen(false)}
                selectedDefects={selectedDefects}
                allDefects={judgmentDefects}
                onCreateGroup={handleCreateGroup}
            />

            {/* 导入缺陷对话框 */}
            <DialogRoot
                open={isImportDialogOpen}
                onOpenChange={(e) => setIsImportDialogOpen(e.open)}
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
                        <DialogTitle
                            fontSize="18px"
                            fontWeight="600"
                            color={COLORS.textPrimary}
                        >
                            导入缺陷
                        </DialogTitle>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody>
                        <VStack gap={4} align="stretch">
                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    mb={2}
                                >
                                    请先下载模板，按照模板格式填写缺陷信息后上传
                                </Text>
                                <Button
                                    variant="outline"
                                    borderColor={COLORS.borderColor}
                                    color={COLORS.primary}
                                    onClick={handleDownloadTemplate}
                                    size="sm"
                                >
                                    下载导入模板
                                </Button>
                            </Box>
                            <Field.Root>
                                <Field.Label
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                    mb={2}
                                >
                                    选择文件
                                </Field.Label>
                                <Input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    bg={COLORS.bgSecondary}
                                    borderColor={COLORS.borderColor}
                                    _hover={{ borderColor: COLORS.lightBorder }}
                                    _focus={{
                                        borderColor: COLORS.primary,
                                        boxShadow: `0 0 0 1px ${COLORS.primary}`,
                                    }}
                                />
                                {importFile && (
                                    <Text
                                        fontSize="12px"
                                        color={COLORS.textTertiary}
                                        mt={1}
                                    >
                                        已选择: {importFile.name}
                                    </Text>
                                )}
                            </Field.Root>
                            <Box>
                                <Text
                                    fontSize="12px"
                                    color={COLORS.textTertiary}
                                >
                                    注意事项：
                                </Text>
                                <Text
                                    fontSize="12px"
                                    color={COLORS.textTertiary}
                                    mt={1}
                                >
                                    1. 文件格式必须为 .xlsx 或 .xls
                                </Text>
                                <Text
                                    fontSize="12px"
                                    color={COLORS.textTertiary}
                                >
                                    2. 必填项：标题、描述、类型、任务ID、用例ID
                                </Text>
                                <Text
                                    fontSize="12px"
                                    color={COLORS.textTertiary}
                                >
                                    3. 类型只能填写 缺陷 或 建议
                                </Text>
                                <Text
                                    fontSize="12px"
                                    color={COLORS.textTertiary}
                                >
                                    4. 导出的缺陷可以直接导入，无需修改格式
                                </Text>
                            </Box>
                        </VStack>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            borderColor={COLORS.borderColor}
                            color={COLORS.textSecondary}
                            onClick={() => setIsImportDialogOpen(false)}
                            mr={2}
                        >
                            取消
                        </Button>
                        <Button
                            bg={COLORS.primary}
                            color="white"
                            onClick={handleImport}
                            disabled={!importFile || isImporting}
                            _hover={{ opacity: 0.9 }}
                        >
                            {isImporting ? '导入中...' : '确认导入'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogRoot>
        </Box>
    );
}
