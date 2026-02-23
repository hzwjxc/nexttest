'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Box, Container, Flex, Text, Image, Grid } from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';
import {
    LuMenu,
    LuChevronDown,
    LuEye,
    LuDownload,
    LuChevronLeft,
    LuChevronRight,
    LuSearch,
    LuBug,
    LuPlay,
    LuX,
    LuLink,
} from 'react-icons/lu';
import { Checkbox } from '@/app/_components/ui/checkbox';
import {
    Input,
    NativeSelectRoot,
    NativeSelectField,
    Badge,
    VStack,
    HStack,
    GridItem,
    Link,
    Center,
    Textarea,
    Select,
} from '@chakra-ui/react';
import {
    DialogRoot,
    DialogBackdrop,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogCloseTrigger,
    DialogFooter,
} from '@/app/_components/ui/dialog';
import { PointsApplicationDialog } from '../_components/PointsApplicationDialog';
import { RewardDistributionDialog } from '../_components/RewardDistributionDialog';
import {
    DuplicateDefectsModal,
    type DuplicateDefectItem,
} from '@/app/_components/ui/duplicate-defects-modal';
import { EditTaskModal } from '../_components/EditTaskModal';
import * as XLSX from 'xlsx';

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
    lightBlue: 'rgba(22, 93, 255, 0.05)',
};

// Tab item type
interface TabItem {
    label: string;
    key: string;
}

const tabs: TabItem[] = [
    { label: '基本信息', key: 'basic' },
    { label: '订单管理', key: 'order' },
    { label: '所有缺陷', key: 'defects' },
    { label: '所有用例', key: 'cases' },
];

// Attachment type
interface Attachment {
    name: string;
    size: string;
    type: 'image' | 'document' | 'video';
}

const mockAttachments: Attachment[] = [
    { name: 'Test001.jpg', size: '32KB', type: 'image' },
    { name: 'Test002.docx', size: '32KB', type: 'document' },
    { name: 'Test003.MP4', size: '32KB', type: 'video' },
];

// Defect type
interface Defect {
    id: string;
    earnedPoints: number;
    type: 'BUG' | 'SUGGESTION';
    severity?: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'TRIVIAL' | 'INVALID';
    suggestionLevel?: 'EXCELLENT_SPECIAL' | 'EXCELLENT' | 'VALID' | 'INVALID';
    status:
    | 'SUBMITTED'
    | 'REVIEWING'
    | 'APPROVED'
    | 'REJECTED'
    | 'DUPLICATE'
    | 'CLOSED'
    | 'PENDING'
    | 'TO_CONFIRM'
    | 'TO_CONFIRM_DEV'
    | 'INVALID';
    title: string;
    description: string;
    attachments: string[] | Array<{ url: string; isVideo?: boolean }>;
    steps?: string | string[];
    reviewComment?: string;
    supplementaryExplanation?: string;
    businessAuditResult?: {
        type: string;
        level: string;
        category: string;
        comment: string;
    };
    createdAt: string;
    duplicateGroupId?: string | null;
    user?: {
        id: string;
        name?: string;
        phone?: string;
    };
    testCase?: {
        id: string;
        title: string;
    };
    taskOrder?: {
        id: string;
    };
    // Legacy fields for mock data compatibility
    number?: string;
    points?: number;
    repeatedCount?: number;
    caseName?: string;
    device?: string;
    system?: string;
    submitter?: string;
    submitTime?: string;
}

const mockDefects: Defect[] = [
    {
        id: '1',
        number: '01234567890',
        points: 300,
        earnedPoints: 300,
        repeatedCount: 5,
        type: 'BUG',
        status: 'PENDING',
        title: '登录页面输入账号显示空白',
        description:
            '描述：前提：已注册账号有订正端；1、登录界面，2、输入密码后结果结果：输入的密码点击点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示。',
        attachments: [
            { url: '/images/task-hall/banner1.jpg' },
            { url: '/images/task-hall/banner2.jpg' },
            { url: '/images/task-hall/banner3.jpg' },
            { url: '/images/task-hall/banner1.jpg', isVideo: true },
            { url: '/images/task-hall/banner2.jpg' },
        ],
        caseName: '黄金积存-个人网银用例',
        steps: ['步骤一', '步骤二', '步骤三', '步骤四'],
        reviewComment: '',
        device: 'Redmi M2006C3LC',
        system: 'Android 11(720 x1600)',
        submitter: '张三',
        submitTime: '2024-09-12 24:32:00',
        createdAt: '2024-09-12T16:32:00.000Z',
    },
    {
        id: '2',
        number: '01234567890',
        points: 300,
        earnedPoints: 300,
        repeatedCount: 5,
        type: 'BUG',
        status: 'TO_CONFIRM',
        title: '登录页面输入账号显示空白',
        description:
            '描述：前提：已注册账号有订正端；1、登录界面，2、输入密码后结果结果：输入的密码点击点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示。',
        attachments: [
            { url: '/images/task-hall/banner1.jpg' },
            { url: '/images/task-hall/banner2.jpg' },
            { url: '/images/task-hall/banner3.jpg' },
            { url: '/images/task-hall/banner1.jpg', isVideo: true },
            { url: '/images/task-hall/banner2.jpg' },
        ],
        caseName: '黄金积存-个人网银用例',
        steps: ['步骤一', '步骤二', '步骤三', '步骤四'],
        reviewComment: '',
        device: 'Redmi M2006C3LC',
        system: 'Android 11(720 x1600)',
        submitter: '张三',
        submitTime: '2024-09-12 24:32:00',
        createdAt: '2024-09-12T16:32:00.000Z',
    },
    {
        id: '3',
        number: '01234567890',
        points: 300,
        earnedPoints: 300,
        repeatedCount: 5,
        type: 'BUG',
        status: 'TO_CONFIRM_DEV',
        title: '登录页面输入账号显示空白',
        description:
            '描述：前提：已注册账号有订正端；1、登录界面，2、输入密码后结果结果：输入的密码点击点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示。',
        attachments: [
            { url: '/images/task-hall/banner1.jpg' },
            { url: '/images/task-hall/banner2.jpg' },
            { url: '/images/task-hall/banner3.jpg' },
            { url: '/images/task-hall/banner1.jpg', isVideo: true },
            { url: '/images/task-hall/banner2.jpg' },
        ],
        caseName: '黄金积存-个人网银用例',
        steps: ['步骤一', '步骤二', '步骤三', '步骤四'],
        businessAuditResult: {
            type: '缺陷',
            level: '严重',
            category: '功能问题',
            comment: '需要开发确认',
        },
        device: 'Redmi M2006C3LC',
        system: 'Android 11(720 x1600)',
        submitter: '张三',
        submitTime: '2024-09-12 24:32:00',
        createdAt: '2024-09-12T16:32:00.000Z',
    },
    {
        id: '4',
        number: '01234567890',
        points: 300,
        earnedPoints: 300,
        repeatedCount: 5,
        type: 'BUG',
        severity: 'MAJOR',
        status: 'APPROVED',
        title: '登录页面输入账号显示空白',
        description:
            '描述：前提：已注册账号有订正端；1、登录界面，2、输入密码后结果结果：输入的密码点击点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示。',
        attachments: [
            { url: '/images/task-hall/banner1.jpg' },
            { url: '/images/task-hall/banner2.jpg' },
            { url: '/images/task-hall/banner3.jpg' },
            { url: '/images/task-hall/banner1.jpg', isVideo: true },
            { url: '/images/task-hall/banner2.jpg' },
        ],
        caseName: '黄金积存-个人网银用例',
        steps: ['步骤一', '步骤二', '步骤三', '步骤四'],
        reviewComment: '',
        supplementaryExplanation: '',
        device: 'Redmi M2006C3LC',
        system: 'Android 11(720 x1600)',
        submitter: '张三',
        submitTime: '2024-09-12 24:32:00',
        createdAt: '2024-09-12T16:32:00.000Z',
    },
    {
        id: '5',
        number: '01234567890',
        points: 300,
        earnedPoints: 300,
        repeatedCount: 5,
        type: 'BUG',
        severity: 'TRIVIAL',
        status: 'APPROVED',
        title: '登录页面输入账号显示空白',
        description:
            '描述：前提：已注册账号有订正端；1、登录界面，2、输入密码后结果结果：输入的密码点击点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示。',
        attachments: [
            { url: '/images/task-hall/banner1.jpg' },
            { url: '/images/task-hall/banner2.jpg' },
            { url: '/images/task-hall/banner3.jpg' },
            { url: '/images/task-hall/banner1.jpg', isVideo: true },
            { url: '/images/task-hall/banner2.jpg' },
        ],
        caseName: '黄金积存-个人网银用例',
        steps: ['步骤一', '步骤二', '步骤三', '步骤四'],
        reviewComment: '',
        supplementaryExplanation: '',
        device: 'Redmi M2006C3LC',
        system: 'Android 11(720 x1600)',
        submitter: '张三',
        submitTime: '2024-09-12 24:32:00',
        createdAt: '2024-09-12T16:32:00.000Z',
    },
    {
        id: '6',
        number: '01234567890',
        points: 300,
        earnedPoints: 300,
        repeatedCount: 5,
        type: 'SUGGESTION',
        suggestionLevel: 'EXCELLENT',
        status: 'APPROVED',
        title: '登录页面输入账号显示空白',
        description:
            '描述：前提：已注册账号有订正端；1、登录界面，2、输入密码后结果结果：输入的密码点击点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示，2、输入密码后结果显示，2、输入密码后结果显示点显示点显示。',
        attachments: [
            { url: '/images/task-hall/banner1.jpg' },
            { url: '/images/task-hall/banner2.jpg' },
            { url: '/images/task-hall/banner3.jpg' },
            { url: '/images/task-hall/banner1.jpg', isVideo: true },
            { url: '/images/task-hall/banner2.jpg' },
        ],
        caseName: '黄金积存-个人网银用例',
        steps: ['步骤一', '步骤二', '步骤三', '步骤四'],
        reviewComment: '',
        supplementaryExplanation: '',
        device: 'Redmi M2006C3LC',
        system: 'Android 11(720 x1600)',
        submitter: '张三',
        submitTime: '2024-09-12 24:32:00',
        createdAt: '2024-09-12T16:32:00.000Z',
    },
];

// Mock Test Cases
const mockTestCases: TestCase[] = [
    {
        id: '1',
        sequence: 1,
        caseNumber: 'C2406110200704',
        system: '呼叫系统',
        caseName: '黄金积存-个人网银用例',
        defectCount: '12/3',
        property: '正常用例',
        action: '查看用例',
    },
    {
        id: '2',
        sequence: 2,
        caseNumber: 'C2406110200704',
        system: '呼叫系统',
        caseName: '黄金积存-手机银行用例',
        defectCount: '30/8',
        property: '正常用例',
        action: '查看用例',
    },
    {
        id: '3',
        sequence: 3,
        caseNumber: 'C2406110200705',
        system: '呼叫系统',
        caseName: '黄金积存-PC端用例',
        defectCount: '8/2',
        property: '正常用例',
        action: '查看用例',
    },
    {
        id: '4',
        sequence: 4,
        caseNumber: 'C2406110200706',
        system: '呼叫系统',
        caseName: '黄金积存-综合测试用例',
        defectCount: '15/5',
        property: '正常用例',
        action: '查看用例',
    },
];

// Defects Tab Component
function DefectsTab({ reviewId }: { reviewId: string }) {
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const [defectTypeFilter, setDefectTypeFilter] = useState('');
    const [caseFilter, setCaseFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [confirmResultFilter, setConfirmResultFilter] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedDefects, setSelectedDefects] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Update defect status mutation
    const updateDefectStatusMutation = api.defect.updateStatus.useMutation({
        onSuccess: (data) => {
            // 根据状态显示不同的提示信息
            if (data.data?.status === 'REJECTED') {
                showSuccessToast('缺陷已标记为无效');
            } else if (data.data?.status === 'REVIEWING') {
                showSuccessToast('缺陷已转到业务判定');
            } else {
                showSuccessToast('缺陷状态已更新');
            }
            // Refetch defects to update the list
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // Confirm defect status mutation (for TO_CONFIRM status)
    const confirmDefectStatusMutation =
        api.defect.confirmDefectStatus.useMutation({
            onSuccess: () => {
                showSuccessToast('缺陷状态已确认');
                // Refetch defects to update the list
                void refetch();
            },
            onError: (error) => {
                showErrorToast(error.message);
            },
        });

    // Fetch data dictionaries for level mappings
    const { data: defectSeverityDict } =
        api.dataDictionary.getByCode.useQuery('DEFECT_SEVERITY');
    const { data: suggestionLevelDict } =
        api.dataDictionary.getByCode.useQuery('SUGGESTION_LEVEL');

    // Fetch task test cases for filter dropdown
    const { data: taskTestCasesData } = api.review.getTaskTestCases.useQuery({
        taskId: reviewId,
        page: 1,
        pageSize: 100,
    });
    const testCases = taskTestCasesData?.data || [];

    // Fetch defects from API
    // 根据筛选值判断是 severity 还是 suggestionLevel
    const isSeverityFilter = [
        'CRITICAL',
        'MAJOR',
        'MINOR',
        'TRIVIAL',
        'INVALID',
    ].includes(confirmResultFilter);
    const isSuggestionFilter = [
        'EXCELLENT_SPECIAL',
        'EXCELLENT',
        'VALID',
        'INVALID_SUGGESTION',
    ].includes(confirmResultFilter);

    const {
        data: defectsData,
        isLoading,
        refetch,
    } = api.review.getTaskDefects.useQuery({
        taskId: reviewId,
        page: currentPage,
        pageSize,
        type: (defectTypeFilter as any) || undefined,
        status: (statusFilter as any) || undefined,
        severity: isSeverityFilter ? (confirmResultFilter as any) : undefined,
        suggestionLevel: isSuggestionFilter
            ? confirmResultFilter === 'INVALID_SUGGESTION'
                ? 'INVALID'
                : (confirmResultFilter as any)
            : undefined,
        testCaseId: caseFilter || undefined,
        keyword: searchKeyword || undefined,
    });

    const defects = (defectsData?.data || []) as any[];
    const totalItems = defectsData?.pagination?.total || 0;
    const totalPages = defectsData?.pagination?.totalPages || 0;

    const [previewUrl, setPreviewUrl] = useState('');
    const [previewType, setPreviewType] = useState<'image' | 'video' | null>(
        null
    );
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [selectedDuplicateDefect, setSelectedDuplicateDefect] =
        useState<Defect | null>(null);
    const [duplicateItems, setDuplicateItems] = useState<DuplicateDefectItem[]>(
        []
    );
    const [duplicateGroupCounts, setDuplicateGroupCounts] = useState<
        Record<string, number>
    >({});

    // Fetch duplicate group details when modal is open
    const { data: duplicateGroupData } =
        api.defect.getDuplicateGroupDetail.useQuery(
            { groupId: selectedDuplicateDefect?.duplicateGroupId || '' },
            {
                enabled:
                    isDuplicateModalOpen &&
                    !!selectedDuplicateDefect?.duplicateGroupId,
            }
        );

    // Update duplicateItems when data is fetched
    React.useEffect(() => {
        if (duplicateGroupData?.duplicateDefects) {
            const items: DuplicateDefectItem[] =
                duplicateGroupData.duplicateDefects
                    .filter((d) => d.id !== selectedDuplicateDefect?.id) // 排除当前缺陷
                    .map((defect) => ({
                        id: defect.id,
                        number: defect.id.substring(0, 10),
                        points: defect.earnedPoints,
                        type: defect.type === 'BUG' ? 'defect' : 'suggestion',
                        title: defect.title,
                        description: defect.description,
                        status: defect.status,
                        severity: defect.severity || undefined,
                        suggestionLevel: defect.suggestionLevel || undefined,
                        attachments: defect.attachments || [],
                        caseName: defect.testCase?.title || '',
                        relatedSteps: defect.steps || '',
                        reviewComment: defect.reviewComment || '',
                        supplementaryExplanation:
                            defect.supplementaryExplanation || '',
                        deviceModel: '', // TODO: 需要从附加信息中获取
                        system: '', // TODO: 需要从附加信息中获取
                        submitter: defect.user?.name || '',
                        submitTime: new Date(defect.createdAt).toLocaleString(
                            'zh-CN'
                        ),
                    }));
            setDuplicateItems(items);

            // Update the count for this group
            if (selectedDuplicateDefect?.duplicateGroupId) {
                setDuplicateGroupCounts((prev) => ({
                    ...prev,
                    [selectedDuplicateDefect.duplicateGroupId!]: items.length,
                }));
            }
        } else {
            setDuplicateItems([]);
        }
    }, [duplicateGroupData, selectedDuplicateDefect]);

    // 初始化所有重复缺陷组的数量
    React.useEffect(() => {
        if (defects && defects.length > 0) {
            // 收集所有有 duplicateGroupId 的缺陷
            const groupIds = new Set<string>();
            defects.forEach((defect) => {
                if (defect.duplicateGroupId) {
                    groupIds.add(defect.duplicateGroupId);
                }
            });

            // 为每个组计算数量（总数 - 1，因为要排除当前缺陷）
            const counts: Record<string, number> = {};
            groupIds.forEach((groupId) => {
                const defectsInGroup = defects.filter(
                    (d) => d.duplicateGroupId === groupId
                );
                counts[groupId] = defectsInGroup.length - 1;
            });

            setDuplicateGroupCounts(counts);
        }
    }, [defects]);

    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferLink, setTransferLink] = useState(
        'www.spasvo.comma.com/design/YaaY8WVglqalDOzQhQ'
    );
    const [copySuccess, setCopySuccess] = useState(false);

    const [isInvalidModalOpen, setIsInvalidModalOpen] = useState(false);
    const [invalidOpinion, setInvalidOpinion] = useState('');
    const [invalidComment, setInvalidComment] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [currentInvalidDefectId, setCurrentInvalidDefectId] = useState<
        string | null
    >(null);
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
    const [isEditingTemplate, setIsEditingTemplate] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState({
        id: '',
        name: '',
        content: '',
    });

    const [isTestCaseDetailOpen, setIsTestCaseDetailOpen] = useState(false);
    const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(
        null
    );
    const [selectedRelatedSteps, setSelectedRelatedSteps] = useState<string[]>([]);

    // Fetch test case details when modal is open
    const { data: testCaseData } = api.review.getById.useQuery(
        { id: reviewId },
        { enabled: isTestCaseDetailOpen && !!selectedTestCaseId }
    );

    const selectedTestCase = testCaseData?.data?.testCases?.find(
        (tc: any) => tc.id === selectedTestCaseId
    );

    // 获取审核意见模板列表
    const { data: reasonTemplatesData, refetch: refetchTemplates } =
        api.notificationTemplate.getAll.useQuery({
            type: 'AUDIT_OPINION',
        });

    // 创建模板 mutation
    const createTemplateMutation = api.notificationTemplate.create.useMutation({
        onSuccess: () => {
            void refetchTemplates();
            setIsTemplateDialogOpen(false);
            setCurrentTemplate({ id: '', name: '', content: '' });
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 更新模板 mutation
    const updateTemplateMutation = api.notificationTemplate.update.useMutation({
        onSuccess: () => {
            void refetchTemplates();
            setIsTemplateDialogOpen(false);
            setCurrentTemplate({ id: '', name: '', content: '' });
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 删除模板 mutation
    const deleteTemplateMutation = api.notificationTemplate.delete.useMutation({
        onSuccess: () => {
            void refetchTemplates();
            setSelectedTemplateId('');
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    const handleSelectDefect = (id: string) => {
        if (selectedDefects.includes(id)) {
            setSelectedDefects(selectedDefects.filter((dId) => dId !== id));
        } else {
            setSelectedDefects([...selectedDefects, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedDefects.length === defects.length) {
            setSelectedDefects([]);
        } else {
            setSelectedDefects(defects.map((d) => d.id));
        }
    };

    const handlePreview = (url: string, isVideo?: boolean) => {
        setPreviewUrl(url);
        setPreviewType(isVideo ? 'video' : 'image');
        setIsPreviewOpen(true);
    };

    // 适配器函数，用于 DuplicateDefectsModal
    const handlePreviewFromModal = (
        attachments: string[] | Array<{ url: string; isVideo?: boolean }>,
        index: number
    ) => {
        const attachment = attachments[index];

        // 处理字符串类型的附件（URL）
        if (typeof attachment === 'string') {
            const url = attachment;
            if (url) {
                const isVideo =
                    url.includes('.mp4') ||
                    url.includes('.mov') ||
                    url.includes('.avi');
                handlePreview(url, isVideo);
            }
        }
        // 处理对象类型的附件
        else if (
            attachment &&
            typeof attachment === 'object' &&
            'url' in attachment
        ) {
            const url = attachment.url;
            const isVideo =
                attachment.isVideo ||
                url.includes('.mp4') ||
                url.includes('.mov') ||
                url.includes('.avi');
            handlePreview(url, isVideo);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1); // Reset to first page when searching
    };

    const handleReset = () => {
        setDefectTypeFilter('');
        setCaseFilter('');
        setStatusFilter('');
        setConfirmResultFilter('');
        setSearchKeyword('');
        setCurrentPage(1);
    };

    // 批量导出缺陷数据
    const handleBatchExport = () => {
        // 确定要导出的数据：如果有选中项则导出选中项，否则导出当前筛选的所有数据
        const dataToExport =
            selectedDefects.length > 0
                ? defects.filter((d) => selectedDefects.includes(d.id))
                : defects;

        if (dataToExport.length === 0) {
            showErrorToast('没有可导出的数据');
            return;
        }

        // 准备导出数据
        const exportData = dataToExport.map((defect, index) => ({
            序号: index + 1,
            缺陷编号: defect.id,
            缺陷标题: defect.title,
            缺陷类型: defect.type === 'BUG' ? '缺陷' : '建议',
            状态: getDefectStatusText(defect.status),
            '等级/结果':
                defect.type === 'BUG'
                    ? getDefectLevelText('BUG', defect.severity)
                    : getDefectLevelText('SUGGESTION', defect.suggestionLevel),
            所属用例: defect.testCase?.title || '-',
            提交人: defect.user?.name || '-',
            提交时间: new Date(defect.createdAt).toLocaleString('zh-CN'),
            获得积分: defect.earnedPoints,
            描述: defect.description || '-',
        }));

        // 创建工作表
        const ws = XLSX.utils.json_to_sheet(exportData);

        // 设置列宽
        const colWidths = [
            { wch: 6 }, // 序号
            { wch: 20 }, // 缺陷编号
            { wch: 40 }, // 缺陷标题
            { wch: 10 }, // 缺陷类型
            { wch: 12 }, // 状态
            { wch: 12 }, // 等级/结果
            { wch: 30 }, // 所属用例
            { wch: 15 }, // 提交人
            { wch: 20 }, // 提交时间
            { wch: 10 }, // 获得积分
            { wch: 60 }, // 描述
        ];
        ws['!cols'] = colWidths;

        // 创建工作簿
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '缺陷列表');

        // 生成文件名
        const taskName = '任务缺陷';
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `${taskName}_缺陷导出_${dateStr}.xlsx`;

        // 下载文件
        XLSX.writeFile(wb, fileName);

        showSuccessToast(`成功导出 ${exportData.length} 条缺陷数据`);
    };

    // 获取缺陷状态中文文本
    const getDefectStatusText = (status: string): string => {
        const statusMap: Record<string, string> = {
            SUBMITTED: '已提交',
            REVIEWING: '判定中',
            APPROVED: '已批准',
            REJECTED: '已驳回',
            DUPLICATE: '重复',
            CLOSED: '已关闭',
            PENDING: '待处理',
            TO_CONFIRM: '待确认',
            TO_CONFIRM_DEV: '待开发确认',
        };
        return statusMap[status] || status;
    };

    const handleViewTestCaseDetail = (testCaseId: string, relatedSteps?: string | string[]) => {
        setSelectedTestCaseId(testCaseId);
        // 解析关联步骤名称为字符串数组
        if (relatedSteps) {
            const stepsArray = Array.isArray(relatedSteps)
                ? relatedSteps
                : String(relatedSteps).split(/[,、，]/).map((s) => s.trim()).filter(Boolean);
            setSelectedRelatedSteps(stepsArray);
        } else {
            setSelectedRelatedSteps([]);
        }
        setIsTestCaseDetailOpen(true);
    };

    const handleTransferToBusinessJudgment = (defectId: string) => {
        if (confirm('确定要将此缺陷转到业务判定吗？')) {
            // 更新缺陷状态为判定中
            updateDefectStatusMutation.mutate({
                defectId: defectId,
                status: 'REVIEWING',
            });
        }
    };

    // 直接确认缺陷（批准）
    const handleApproveDefect = (defect: Defect) => {
        if (confirm('确定要确认此缺陷吗？确认后状态将变为已批准。')) {
            confirmDefectStatusMutation.mutate({
                defectId: defect.id,
                finalStatus: 'APPROVED',
                confirmComment: '',
            });
        }
    };

    // 退回业务判定（将缺陷退回给业务人员重新判定）
    const returnToBusinessJudgmentMutation =
        api.defect.returnToBusinessJudgment.useMutation({
            onSuccess: () => {
                void refetch();
            },
        });

    const handleReturnToBusinessJudgment = (defect: Defect) => {
        if (
            confirm(
                '确定要将此缺陷退回业务判定吗？退回后业务人员可以重新进行判定。'
            )
        ) {
            returnToBusinessJudgmentMutation.mutate({
                defectId: defect.id,
                comment: '',
            });
        }
    };

    const handleDownloadAll = async (
        attachments: string[] | Array<{ url: string; isVideo?: boolean }>
    ) => {
        for (const attachment of attachments) {
            // 处理字符串类型的附件（URL）
            const url =
                typeof attachment === 'string' ? attachment : attachment.url;
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
                await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (error) {
                console.error('Download failed:', error);
            }
        }
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1, 2, 3, 4, 5, '...', totalPages);
        }
        return pages;
    };

    const getDefectStatusBadge = (defect: any) => {
        // 如果状态是待确认或判定中，显示状态标签
        if (
            defect.status === 'TO_CONFIRM' ||
            defect.status === 'TO_CONFIRM_DEV'
        ) {
            return {
                text: '待确认',
                bg: 'rgba(255, 125, 0, 0.1)',
                color: '#FF7D00',
            };
        }
        if (defect.status === 'REVIEWING') {
            return {
                text: '判定中',
                bg: 'rgba(22, 93, 255, 0.1)',
                color: '#2067F6',
            };
        }
        // 如果状态是已驳回（无效），显示无效标签
        if (defect.status === 'REJECTED') {
            return {
                text: '无效',
                bg: 'rgba(134, 144, 156, 0.1)',
                color: '#86909C',
            };
        }
        // 如果状态是重复，显示重复标签
        if (defect.status === 'DUPLICATE') {
            return {
                text: '重复',
                bg: 'rgba(134, 144, 156, 0.1)',
                color: '#86909C',
            };
        }
        // 如果状态是已关闭，显示关闭标签
        if (defect.status === 'CLOSED') {
            return {
                text: '已关闭',
                bg: 'rgba(134, 144, 156, 0.1)',
                color: '#86909C',
            };
        }
        // 只有在已批准状态下才显示等级标签
        if (defect.status === 'APPROVED') {
            if (defect.type === 'BUG') {
                const item = defectSeverityDict?.items?.find(
                    (i: any) => i.code === defect.severity
                );
                if (item) {
                    // 根据等级调整颜色
                    const colorMap: Record<
                        string,
                        { bg: string; color: string }
                    > = {
                        CRITICAL: {
                            bg: 'rgba(227, 20, 36, 0.1)',
                            color: '#E31424',
                        },
                        MAJOR: {
                            bg: 'rgba(227, 20, 36, 0.1)',
                            color: '#D54531',
                        },
                        MINOR: {
                            bg: 'rgba(255, 125, 0, 0.1)',
                            color: '#F77234',
                        },
                        TRIVIAL: {
                            bg: 'rgba(255, 237, 232, 1)',
                            color: '#F77234',
                        },
                    };
                    const colorConfig = colorMap[defect.severity] || {
                        bg: 'rgba(255, 125, 0, 0.1)',
                        color: '#F77234',
                    };
                    return { text: item.label, ...colorConfig };
                }
            } else if (defect.type === 'SUGGESTION') {
                const item = suggestionLevelDict?.items?.find(
                    (i: any) => i.code === defect.suggestionLevel
                );
                if (item) {
                    return {
                        text: item.label,
                        bg: 'rgba(0, 180, 42, 0.1)',
                        color: '#3AB385',
                    };
                }
            }
        }
        return { text: '', bg: '', color: '' };
    };

    // 根据数据字典获取等级中文标签
    const getDefectLevelText = (
        type: string | undefined,
        level: string | undefined | null
    ) => {
        if (!level) return '-';

        if (type === 'BUG') {
            const item = defectSeverityDict?.items?.find(
                (i: any) => i.code === level
            );
            return item?.label || level;
        } else if (type === 'SUGGESTION') {
            const item = suggestionLevelDict?.items?.find(
                (i: any) => i.code === level
            );
            return item?.label || level;
        }
        return level;
    };

    // 缺陷类型中英文映射
    const getDefectCategoryText = (category: string | null | undefined) => {
        if (!category) return '-';
        const categoryMap: Record<string, string> = {
            function: '功能问题',
            functional: '功能问题',
            performance: '性能问题',
            security: '安全性问题',
            usability: '用户体验',
            ux: '用户体验',
            compatibility: '兼容性问题',
            FUNCTION: '功能问题',
            FUNCTIONAL: '功能问题',
            PERFORMANCE: '性能问题',
            SECURITY: '安全性问题',
            USABILITY: '用户体验',
            UX: '用户体验',
            COMPATIBILITY: '兼容性问题',
        };
        return categoryMap[category] || category;
    };

    return (
        <Box>
            {/* Filter Bar */}
            <Flex
                align="center"
                gap={3}
                p={4}
                borderBottom="1px solid"
                borderColor={COLORS.borderColor}
                wrap="wrap"
            >
                <Checkbox
                    checked={
                        selectedDefects.length === defects.length &&
                        defects.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                >
                    <Text fontSize="14px" color={COLORS.textSecondary}>
                        全选
                    </Text>
                </Checkbox>

                {/* 缺陷类型筛选 */}
                <NativeSelectRoot size="sm" w="120px">
                    <NativeSelectField
                        value={defectTypeFilter}
                        onChange={(e) => setDefectTypeFilter(e.target.value)}
                        bg={COLORS.bgSecondary}
                        borderRadius="24px"
                        border="none"
                        _focus={{ ring: 0 }}
                    >
                        <option value="">缺陷类型</option>
                        <option value="BUG">缺陷</option>
                        <option value="SUGGESTION">建议</option>
                    </NativeSelectField>
                </NativeSelectRoot>

                {/* 所属用例筛选 */}
                <NativeSelectRoot size="sm" w="130px">
                    <NativeSelectField
                        value={caseFilter}
                        onChange={(e) => setCaseFilter(e.target.value)}
                        bg={COLORS.bgSecondary}
                        borderRadius="24px"
                        border="none"
                        _focus={{ ring: 0 }}
                    >
                        <option value="">所属用例</option>
                        {testCases.map((tc) => (
                            <option key={tc.id} value={tc.id}>
                                {tc.caseName}
                            </option>
                        ))}
                    </NativeSelectField>
                </NativeSelectRoot>

                {/* 审核状态筛选 */}
                <NativeSelectRoot size="sm" w="120px">
                    <NativeSelectField
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        bg={COLORS.bgSecondary}
                        borderRadius="24px"
                        border="none"
                        _focus={{ ring: 0 }}
                    >
                        <option value="">审核状态</option>
                        <option value="SUBMITTED">已提交</option>
                        <option value="REVIEWING">判定中</option>
                        <option value="APPROVED">已批准</option>
                        <option value="REJECTED">已驳回</option>
                        <option value="DUPLICATE">重复</option>
                        <option value="CLOSED">已关闭</option>
                    </NativeSelectField>
                </NativeSelectRoot>

                {/* 开发/业务缺陷结论筛选 */}
                <NativeSelectRoot size="sm" w="150px">
                    <NativeSelectField
                        value={confirmResultFilter}
                        onChange={(e) => setConfirmResultFilter(e.target.value)}
                        bg={COLORS.bgSecondary}
                        borderRadius="24px"
                        border="none"
                        _focus={{ ring: 0 }}
                    >
                        <option value="">缺陷结论</option>
                        <optgroup label="缺陷等级">
                            <option value="CRITICAL">致命</option>
                            <option value="MAJOR">严重</option>
                            <option value="MINOR">一般</option>
                            <option value="TRIVIAL">轻微</option>
                            <option value="INVALID">无效</option>
                        </optgroup>
                        <optgroup label="建议等级">
                            <option value="EXCELLENT_SPECIAL">特别优秀</option>
                            <option value="EXCELLENT">优秀</option>
                            <option value="VALID">有效</option>
                            <option value="INVALID_SUGGESTION">无效</option>
                        </optgroup>
                    </NativeSelectField>
                </NativeSelectRoot>

                <Input
                    placeholder="缺陷标题、编号或描述"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    w="200px"
                    h="32px"
                    fontSize="14px"
                    bg={COLORS.bgSecondary}
                    borderColor={COLORS.bgSecondary}
                    _placeholder={{ color: COLORS.textTertiary }}
                />

                <Flex gap={2} ml="auto">
                    <Box
                        as="button"
                        px={6}
                        h="32px"
                        bg="linear-gradient(90deg, #ff9565 0%, #fe5f6b 100%)"
                        color="white"
                        borderRadius="999px"
                        fontSize="14px"
                        cursor="pointer"
                        _hover={{ opacity: 0.9 }}
                        onClick={handleSearch}
                    >
                        查询
                    </Box>
                    <Box
                        as="button"
                        px={4}
                        h="32px"
                        color={COLORS.textTertiary}
                        bg="transparent"
                        borderRadius="4px"
                        fontSize="14px"
                        cursor="pointer"
                        _hover={{ color: COLORS.textSecondary }}
                        onClick={handleReset}
                    >
                        重置
                    </Box>
                </Flex>

                <Box
                    as="button"
                    px={6}
                    h="32px"
                    bg="linear-gradient(90deg, #ff9565 0%, #fe5f6b 100%)"
                    color="white"
                    borderRadius="999px"
                    fontSize="14px"
                    cursor="pointer"
                    _hover={{ opacity: 0.9 }}
                    onClick={handleBatchExport}
                >
                    批量导出
                </Box>
            </Flex>

            {/* Defect Cards */}
            <VStack gap={0} align="stretch">
                {isLoading ? (
                    <Box p={8} textAlign="center">
                        <Text fontSize="14px" color={COLORS.textSecondary}>
                            加载中...
                        </Text>
                    </Box>
                ) : defects.length === 0 ? (
                    <Box p={8} textAlign="center">
                        <Text fontSize="14px" color={COLORS.textSecondary}>
                            暂无缺陷数据
                        </Text>
                    </Box>
                ) : (
                    defects.map((defect, index) => {
                        const defectBadge = getDefectStatusBadge(defect);
                        return (
                            <Box
                                key={defect.id}
                                borderBottom="1px solid"
                                borderColor={COLORS.borderColor}
                                bg="white"
                            >
                                <Box h="20px" bg="#f3f7fb"></Box>
                                {/* Card Header Row */}
                                <Flex
                                    align="center"
                                    px={6}
                                    py={4}
                                    bg={COLORS.bgSecondary}
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
                                        color={COLORS.textPrimary}
                                        fontWeight="500"
                                        w="30px"
                                    >
                                        {index + 1}
                                    </Text>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textPrimary}
                                        fontWeight="500"
                                        w="120px"
                                    >
                                        {defect.id}
                                    </Text>

                                    <HStack gap={1} w="auto" minW="180px">
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.textSecondary}
                                        >
                                            缺陷/建议积分：
                                        </Text>
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                            fontWeight="600"
                                        >
                                            {defect.earnedPoints}
                                        </Text>
                                        <Image
                                            src="/images/task-hall/jinbi.png"
                                            alt="积分"
                                            w="16px"
                                            h="16px"
                                        />
                                    </HStack>

                                    <HStack
                                        gap={1}
                                        w="auto"
                                        minW="100px"
                                        onClick={() => {
                                            setSelectedDuplicateDefect(defect);
                                            setIsDuplicateModalOpen(true);
                                        }}
                                    >
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.primary}
                                            fontWeight="500"
                                            cursor="pointer"
                                        >
                                            关联重复：
                                        </Text>
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.primary}
                                            fontWeight="500"
                                            cursor="pointer"
                                            _hover={{
                                                textDecoration: 'underline',
                                            }}
                                        >
                                            {defect.duplicateGroupId
                                                ? duplicateGroupCounts[
                                                defect.duplicateGroupId
                                                ] || 0
                                                : 0}
                                        </Text>
                                    </HStack>

                                    <HStack gap={1} w="auto" minW="60px">
                                        <LuBug
                                            size={16}
                                            color={
                                                defect.type === 'BUG'
                                                    ? '#165DFF'
                                                    : '#00B42A'
                                            }
                                        />
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                        >
                                            {defect.type === 'BUG'
                                                ? '缺陷'
                                                : '建议'}
                                        </Text>
                                    </HStack>

                                    {defectBadge.text && (
                                        <Flex align="center" gap={3} ml="400px">
                                            <Box
                                                px={3}
                                                py={1}
                                                borderRadius="12px"
                                                bg={defectBadge.bg}
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                minW="80px"
                                            >
                                                <Text
                                                    fontSize="14px"
                                                    color={defectBadge.color}
                                                    fontWeight="500"
                                                >
                                                    {defectBadge.text}
                                                </Text>
                                            </Box>
                                        </Flex>
                                    )}

                                    <Flex align="center" gap={3} ml="auto">
                                        {(defect.status === 'PENDING' ||
                                            defect.status === 'SUBMITTED') && (
                                                <>
                                                    <Box
                                                        as="button"
                                                        px={4}
                                                        h="32px"
                                                        border="1px solid"
                                                        borderColor={COLORS.blue}
                                                        borderRadius="999px"
                                                        fontSize="14px"
                                                        color={COLORS.blue}
                                                        bg="white"
                                                        cursor="pointer"
                                                        _hover={{
                                                            bg: 'rgba(22, 93, 255, 0.05)',
                                                        }}
                                                        onClick={() => {
                                                            setCurrentInvalidDefectId(
                                                                defect.id
                                                            );
                                                            setIsInvalidModalOpen(
                                                                true
                                                            );
                                                        }}
                                                    >
                                                        判为无效
                                                    </Box>
                                                    <Box
                                                        as="button"
                                                        px={4}
                                                        h="32px"
                                                        border="1px solid"
                                                        borderColor={COLORS.blue}
                                                        borderRadius="999px"
                                                        fontSize="14px"
                                                        color={COLORS.blue}
                                                        bg="white"
                                                        cursor="pointer"
                                                        _hover={{
                                                            bg: 'rgba(22, 93, 255, 0.05)',
                                                        }}
                                                        onClick={() =>
                                                            handleTransferToBusinessJudgment(
                                                                defect.id
                                                            )
                                                        }
                                                    >
                                                        转业务和开发
                                                    </Box>
                                                </>
                                            )}
                                    </Flex>
                                </Flex>

                                {/* Card Content Row */}
                                <Grid
                                    templateColumns="1fr 1px 1fr"
                                    gap={0}
                                    p={6}
                                    minH="200px"
                                >
                                    {/* Left Column */}
                                    <GridItem pr={6}>
                                        <VStack align="stretch" gap={4}>
                                            <HStack align="flex-start" gap={2}>
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textSecondary}
                                                    flexShrink={0}
                                                >
                                                    标题：
                                                </Text>
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textSecondary}
                                                >
                                                    {defect.title}
                                                </Text>
                                            </HStack>
                                            <HStack align="flex-start" gap={2}>
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textSecondary}
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
                                            </HStack>
                                            <VStack align="stretch" gap={2}>
                                                <Flex
                                                    justify="space-between"
                                                    align="center"
                                                >
                                                    <Text
                                                        fontSize="14px"
                                                        color={
                                                            COLORS.textSecondary
                                                        }
                                                    >
                                                        附件：
                                                    </Text>
                                                    <HStack
                                                        gap={1}
                                                        cursor="pointer"
                                                        color={
                                                            COLORS.textTertiary
                                                        }
                                                        _hover={{
                                                            color: COLORS.textPrimary,
                                                        }}
                                                        onClick={() =>
                                                            handleDownloadAll(
                                                                defect.attachments
                                                            )
                                                        }
                                                    >
                                                        <LuDownload size={14} />
                                                        <Text fontSize="12px">
                                                            全部下载
                                                        </Text>
                                                    </HStack>
                                                </Flex>
                                                <Flex gap="12px" wrap="wrap">
                                                    {(
                                                        defect.attachments as Array<
                                                            | string
                                                            | {
                                                                url: string;
                                                                isVideo?: boolean;
                                                            }
                                                        >
                                                    )
                                                        .map(
                                                            (attachment, i) => {
                                                                // 处理字符串类型的附件
                                                                if (
                                                                    typeof attachment ===
                                                                    'string'
                                                                ) {
                                                                    const url =
                                                                        attachment;
                                                                    const isVideo =
                                                                        url.includes(
                                                                            '.mp4'
                                                                        ) ||
                                                                        url.includes(
                                                                            '.mov'
                                                                        ) ||
                                                                        url.includes(
                                                                            '.avi'
                                                                        );
                                                                    return (
                                                                        <Box
                                                                            key={`url-${i}`}
                                                                            w="95px"
                                                                            h="95px"
                                                                            borderRadius="4px"
                                                                            overflow="hidden"
                                                                            position="relative"
                                                                            cursor="pointer"
                                                                            onClick={() =>
                                                                                handlePreview(
                                                                                    url,
                                                                                    isVideo
                                                                                )
                                                                            }
                                                                        >
                                                                            {isVideo ? (
                                                                                <>
                                                                                    <video
                                                                                        src={
                                                                                            url
                                                                                        }
                                                                                        style={{
                                                                                            width: '100%',
                                                                                            height: '100%',
                                                                                            objectFit:
                                                                                                'cover',
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
                                                                                        <LuPlay
                                                                                            size={
                                                                                                20
                                                                                            }
                                                                                            color="white"
                                                                                        />
                                                                                    </Center>
                                                                                </>
                                                                            ) : (
                                                                                <Image
                                                                                    src={
                                                                                        url
                                                                                    }
                                                                                    alt="附件"
                                                                                    w="100%"
                                                                                    h="100%"
                                                                                    objectFit="cover"
                                                                                />
                                                                            )}
                                                                        </Box>
                                                                    );
                                                                }
                                                                // 处理对象类型的附件
                                                                else if (
                                                                    attachment &&
                                                                    typeof attachment ===
                                                                    'object' &&
                                                                    'url' in
                                                                    attachment
                                                                ) {
                                                                    const url =
                                                                        attachment.url;
                                                                    const isVideo =
                                                                        attachment.isVideo ||
                                                                        url.includes(
                                                                            '.mp4'
                                                                        ) ||
                                                                        url.includes(
                                                                            '.mov'
                                                                        ) ||
                                                                        url.includes(
                                                                            '.avi'
                                                                        );
                                                                    return (
                                                                        <Box
                                                                            key={`obj-${i}`}
                                                                            w="95px"
                                                                            h="95px"
                                                                            borderRadius="4px"
                                                                            overflow="hidden"
                                                                            position="relative"
                                                                            cursor="pointer"
                                                                            onClick={() =>
                                                                                handlePreview(
                                                                                    url,
                                                                                    isVideo
                                                                                )
                                                                            }
                                                                        >
                                                                            {isVideo ? (
                                                                                <>
                                                                                    <video
                                                                                        src={
                                                                                            url
                                                                                        }
                                                                                        style={{
                                                                                            width: '100%',
                                                                                            height: '100%',
                                                                                            objectFit:
                                                                                                'cover',
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
                                                                                        <LuPlay
                                                                                            size={
                                                                                                20
                                                                                            }
                                                                                            color="white"
                                                                                        />
                                                                                    </Center>
                                                                                </>
                                                                            ) : (
                                                                                <Image
                                                                                    src={
                                                                                        url
                                                                                    }
                                                                                    alt="附件"
                                                                                    w="100%"
                                                                                    h="100%"
                                                                                    objectFit="cover"
                                                                                />
                                                                            )}
                                                                        </Box>
                                                                    );
                                                                }
                                                                // 其他情况返回空
                                                                return null;
                                                            }
                                                        )
                                                        .filter(Boolean)}
                                                </Flex>
                                            </VStack>
                                        </VStack>
                                    </GridItem>

                                    {/* Divider */}
                                    <Box bg={COLORS.borderColor} />

                                    {/* Right Column */}
                                    <GridItem pl={6}>
                                        <VStack align="stretch" gap={4}>
                                            <HStack align="flex-start" gap={2}>
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textSecondary}
                                                    flexShrink={0}
                                                >
                                                    所属用例：
                                                </Text>
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textPrimary}
                                                >
                                                    {defect.testCase?.title ||
                                                        '-'}
                                                </Text>
                                            </HStack>
                                            <HStack align="flex-start" gap={2}>
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textSecondary}
                                                    flexShrink={0}
                                                >
                                                    关联步骤：
                                                </Text>
                                                <HStack gap={1} wrap="wrap">
                                                    <Text
                                                        fontSize="14px"
                                                        color={
                                                            COLORS.textPrimary
                                                        }
                                                    >
                                                        {defect.steps
                                                            ? Array.isArray(
                                                                defect.steps
                                                            )
                                                                ? defect.steps.join(
                                                                    ', '
                                                                )
                                                                : defect.steps
                                                            : '-'}
                                                    </Text>
                                                    {defect.testCase?.id && (
                                                        <Link
                                                            color={COLORS.blue}
                                                            fontSize="14px"
                                                            ml={2}
                                                            cursor="pointer"
                                                            onClick={() =>
                                                                handleViewTestCaseDetail(
                                                                    defect
                                                                        .testCase
                                                                        .id,
                                                                    defect.steps
                                                                )
                                                            }
                                                        >
                                                            查看详细
                                                        </Link>
                                                    )}
                                                </HStack>
                                            </HStack>
                                            <HStack align="flex-start" gap={2}>
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textSecondary}
                                                    flexShrink={0}
                                                >
                                                    审核意见：
                                                </Text>
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textPrimary}
                                                >
                                                    {defect.reviewComment ||
                                                        '-'}
                                                </Text>
                                            </HStack>

                                            {!defect.businessAuditResult &&
                                                defect.status ===
                                                'APPROVED' && (
                                                    <HStack
                                                        align="flex-start"
                                                        gap={2}
                                                    >
                                                        <Text
                                                            fontSize="14px"
                                                            color={
                                                                COLORS.textSecondary
                                                            }
                                                            flexShrink={0}
                                                        >
                                                            补充说明：
                                                        </Text>
                                                        <Text
                                                            fontSize="14px"
                                                            color={
                                                                COLORS.textPrimary
                                                            }
                                                        >
                                                            {defect.supplementaryExplanation ||
                                                                '-'}
                                                        </Text>
                                                    </HStack>
                                                )}
                                        </VStack>
                                    </GridItem>
                                </Grid>

                                {/* Business Audit Result Section */}
                                {(defect.status === 'TO_CONFIRM' ||
                                    defect.status === 'TO_CONFIRM_DEV' ||
                                    defect.judgmentReason) && (
                                        <Box
                                            px={6}
                                            py={4}
                                            bg="#F9FAFB"
                                            borderTop="1px solid"
                                            borderBottom="1px solid"
                                            borderColor={COLORS.borderColor}
                                        >
                                            <VStack align="stretch" gap={4}>
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                >
                                                    业务审核结果：
                                                </Text>
                                                <HStack gap={9} wrap="wrap">
                                                    <HStack gap={2}>
                                                        <Text
                                                            fontSize="14px"
                                                            color={
                                                                COLORS.textTertiary
                                                            }
                                                        >
                                                            结论：
                                                        </Text>
                                                        <Text
                                                            fontSize="14px"
                                                            color={
                                                                COLORS.textPrimary
                                                            }
                                                            fontWeight="500"
                                                        >
                                                            {defect.type === 'BUG'
                                                                ? '缺陷'
                                                                : defect.type ===
                                                                    'SUGGESTION'
                                                                    ? '建议'
                                                                    : '-'}
                                                        </Text>
                                                    </HStack>
                                                    <HStack gap={2}>
                                                        <Text
                                                            fontSize="14px"
                                                            color={
                                                                COLORS.textTertiary
                                                            }
                                                        >
                                                            等级：
                                                        </Text>
                                                        <Text
                                                            fontSize="14px"
                                                            color={
                                                                COLORS.textPrimary
                                                            }
                                                            fontWeight="500"
                                                        >
                                                            {defect.type === 'BUG'
                                                                ? getDefectLevelText(
                                                                    'BUG',
                                                                    defect.severity
                                                                )
                                                                : defect.type ===
                                                                    'SUGGESTION'
                                                                    ? getDefectLevelText(
                                                                        'SUGGESTION',
                                                                        defect.suggestionLevel
                                                                    )
                                                                    : '-'}
                                                        </Text>
                                                    </HStack>
                                                    <HStack gap={2}>
                                                        <Text
                                                            fontSize="14px"
                                                            color={
                                                                COLORS.textTertiary
                                                            }
                                                        >
                                                            类型：
                                                        </Text>
                                                        <Text
                                                            fontSize="14px"
                                                            color={
                                                                COLORS.textPrimary
                                                            }
                                                            fontWeight="500"
                                                        >
                                                            {getDefectCategoryText(
                                                                defect.category
                                                            )}
                                                        </Text>
                                                    </HStack>
                                                </HStack>
                                                <Flex gap={2} align="flex-start">
                                                    <HStack
                                                        gap={2}
                                                        align="flex-start"
                                                        flex={1}
                                                    >
                                                        <Text
                                                            fontSize="14px"
                                                            color={
                                                                COLORS.textTertiary
                                                            }
                                                            flexShrink={0}
                                                        >
                                                            审核意见：
                                                        </Text>
                                                        <Text
                                                            fontSize="14px"
                                                            color={
                                                                COLORS.textPrimary
                                                            }
                                                        >
                                                            {defect.judgmentReason ||
                                                                '-'}
                                                        </Text>
                                                    </HStack>
                                                    {(defect.status ===
                                                        'TO_CONFIRM' ||
                                                        defect.status ===
                                                        'TO_CONFIRM_DEV') && (
                                                            <Flex
                                                                gap={3}
                                                                flexShrink={0}
                                                            >
                                                                <Box
                                                                    as="button"
                                                                    px={6}
                                                                    h="36px"
                                                                    border="1px solid"
                                                                    borderColor="#F34724"
                                                                    borderRadius="999px"
                                                                    fontSize="14px"
                                                                    color="#FE606B"
                                                                    bg="white"
                                                                    cursor="pointer"
                                                                    _hover={{
                                                                        bg: 'rgba(243, 71, 36, 0.05)',
                                                                    }}
                                                                    onClick={() =>
                                                                        handleReturnToBusinessJudgment(
                                                                            defect
                                                                        )
                                                                    }
                                                                >
                                                                    退回
                                                                </Box>
                                                                <Box
                                                                    as="button"
                                                                    px={6}
                                                                    h="36px"
                                                                    bg="linear-gradient(90deg, #ff9565 0%, #fe5f6b 100%)"
                                                                    borderRadius="999px"
                                                                    fontSize="14px"
                                                                    color="white"
                                                                    cursor="pointer"
                                                                    _hover={{
                                                                        opacity: 0.9,
                                                                    }}
                                                                    onClick={() =>
                                                                        handleApproveDefect(
                                                                            defect
                                                                        )
                                                                    }
                                                                >
                                                                    确认
                                                                </Box>
                                                            </Flex>
                                                        )}
                                                </Flex>
                                            </VStack>
                                        </Box>
                                    )}

                                {/* Card Footer Row */}
                                <Flex
                                    px={6}
                                    py={3}
                                    borderTop="1px dashed"
                                    borderColor={COLORS.borderColor}
                                    gap={10}
                                >
                                    <HStack gap={1}>
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textTertiary}
                                        >
                                            机型：
                                        </Text>
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textSecondary}
                                        >
                                            -
                                        </Text>
                                    </HStack>
                                    <HStack gap={1}>
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textTertiary}
                                        >
                                            系统：
                                        </Text>
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textSecondary}
                                        >
                                            -
                                        </Text>
                                    </HStack>
                                    <HStack gap={1}>
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textTertiary}
                                        >
                                            提交人：
                                        </Text>
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textSecondary}
                                        >
                                            {defect.user?.name ||
                                                defect.user?.phone ||
                                                '-'}
                                        </Text>
                                    </HStack>
                                    <HStack gap={1}>
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textTertiary}
                                        >
                                            提交时间：
                                        </Text>
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textSecondary}
                                        >
                                            {new Date(
                                                defect.createdAt
                                            ).toLocaleString('zh-CN')}
                                        </Text>
                                    </HStack>
                                </Flex>
                            </Box>
                        );
                    })
                )}
            </VStack>

            {/* Pagination */}
            <Flex
                align="center"
                justify="center"
                gap={3}
                py={4}
                borderTop="1px solid"
                borderColor={COLORS.borderColor}
            >
                <Text fontSize="14px" color={COLORS.textSecondary}>
                    共{totalItems}条
                </Text>

                <Box
                    as="button"
                    p={2}
                    color={
                        currentPage === 1
                            ? COLORS.textTertiary
                            : COLORS.textSecondary
                    }
                    cursor={currentPage === 1 ? 'not-allowed' : 'pointer'}
                    onClick={() =>
                        currentPage > 1 && setCurrentPage(currentPage - 1)
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
                            border={currentPage === page ? '1px solid' : 'none'}
                            borderColor={COLORS.primary}
                            bg={
                                currentPage === page
                                    ? 'rgba(227, 20, 36, 0.05)'
                                    : 'transparent'
                            }
                            color={
                                currentPage === page
                                    ? COLORS.primary
                                    : COLORS.textSecondary
                            }
                            cursor="pointer"
                            _hover={{
                                bg:
                                    currentPage === page
                                        ? 'rgba(227, 20, 36, 0.05)'
                                        : COLORS.bgSecondary,
                            }}
                            onClick={() => setCurrentPage(page)}
                        >
                            {page}
                        </Box>
                    ) : (
                        <Text key={index} px={1} color={COLORS.textTertiary}>
                            {page}
                        </Text>
                    )
                )}

                <Box
                    as="button"
                    p={2}
                    color={
                        currentPage === totalPages
                            ? COLORS.textTertiary
                            : COLORS.textSecondary
                    }
                    cursor={
                        currentPage === totalPages ? 'not-allowed' : 'pointer'
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
                        fontSize="14px"
                        borderColor={COLORS.borderColor}
                    >
                        <option value="10">10条/页</option>
                        <option value="20">20条/页</option>
                        <option value="50">50条/页</option>
                    </NativeSelectField>
                </NativeSelectRoot>

                <Flex align="center" gap={2}>
                    <Text fontSize="14px" color={COLORS.textSecondary}>
                        前往
                    </Text>
                    <Input
                        w="50px"
                        h="32px"
                        fontSize="14px"
                        textAlign="center"
                        borderColor={COLORS.borderColor}
                    />
                </Flex>
            </Flex>

            {/* Preview Modal */}
            <DialogRoot
                open={isPreviewOpen}
                onOpenChange={(details) =>
                    !details.open && setIsPreviewOpen(false)
                }
                closeOnInteractOutside={true}
            >
                <DialogBackdrop />
                <DialogContent
                    maxW={{ base: '90%', md: '80%', lg: '60%' }}
                    borderRadius="8px"
                    bg="white"
                    boxShadow="0px 0px 18px rgba(0, 65, 215, 0.06)"
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    maxH="85vh"
                    m={4}
                    zIndex={2000}
                >
                    {/* Header */}
                    <DialogHeader
                        borderBottom="1px solid"
                        borderColor="#e5e6eb"
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        px={4}
                        py={3}
                    >
                        <Text fontSize="16px" fontWeight="500" color="#1d2129">
                            {previewType === 'image' ? '图片预览' : '视频预览'}
                        </Text>
                        <DialogCloseTrigger
                            position="static"
                            onClick={() => setIsPreviewOpen(false)}
                            _hover={{ bg: 'transparent' }}
                        >
                            <LuX size={16} color="#4e5969" />
                        </DialogCloseTrigger>
                    </DialogHeader>

                    {/* Body */}
                    <DialogBody py={6} px={4}>
                        <Center>
                            {previewType === 'image' ? (
                                <Image
                                    src={previewUrl}
                                    alt="Attachment preview"
                                    maxH="70vh"
                                    objectFit="contain"
                                    borderRadius="md"
                                />
                            ) : previewType === 'video' ? (
                                <video
                                    src={previewUrl}
                                    controls
                                    style={{
                                        width: '100%',
                                        maxHeight: '70vh',
                                        objectFit: 'contain',
                                    }}
                                >
                                    您的浏览器不支持视频播放
                                </video>
                            ) : null}
                        </Center>
                    </DialogBody>
                </DialogContent>
            </DialogRoot>

            {/* Duplicate Association Modal */}
            <DuplicateDefectsModal
                isOpen={isDuplicateModalOpen}
                onClose={() => setIsDuplicateModalOpen(false)}
                title={selectedDuplicateDefect?.title || ''}
                items={duplicateItems}
                defectSeverityDict={defectSeverityDict}
                suggestionLevelDict={suggestionLevelDict}
                onPreview={handlePreviewFromModal}
                onDownloadAll={handleDownloadAll}
            />

            {/* Transfer to Business and Development Modal */}
            <DialogRoot
                open={isTransferModalOpen}
                onOpenChange={(details) =>
                    !details.open && setIsTransferModalOpen(false)
                }
                closeOnInteractOutside={true}
            >
                <DialogBackdrop />
                <DialogContent
                    maxW="600px"
                    borderRadius="8px"
                    bg="white"
                    boxShadow="0px 0px 18px rgba(0, 65, 215, 0.06)"
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    m={4}
                    zIndex={2000}
                    display="flex"
                    flexDirection="column"
                >
                    {/* Header */}
                    <DialogHeader
                        borderBottom="1px solid"
                        borderColor={COLORS.borderColor}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        px={4}
                        py={3}
                    >
                        <Text
                            fontSize="16px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                        >
                            转业务和开发
                        </Text>
                        <DialogCloseTrigger
                            position="static"
                            onClick={() => setIsTransferModalOpen(false)}
                            _hover={{ bg: 'transparent' }}
                            asChild
                        >
                            <LuX
                                size={16}
                                color={COLORS.textTertiary}
                                style={{ cursor: 'pointer' }}
                            />
                        </DialogCloseTrigger>
                    </DialogHeader>

                    {/* Body */}
                    <DialogBody px={7} py={10}>
                        <VStack align="stretch" gap={4}>
                            <Text fontSize="14px" color={COLORS.textPrimary}>
                                {transferLink}
                            </Text>
                            <Text
                                fontSize="14px"
                                color={COLORS.blue}
                                cursor="pointer"
                                _hover={{ textDecoration: 'underline' }}
                                onClick={() => {
                                    navigator.clipboard.writeText(transferLink);
                                    setCopySuccess(true);
                                    setTimeout(
                                        () => setCopySuccess(false),
                                        2000
                                    );
                                }}
                            >
                                {copySuccess ? '已复制' : '复制链接'}
                            </Text>
                        </VStack>
                    </DialogBody>

                    {/* Footer */}
                    <Box
                        borderTop="1px solid"
                        borderColor={COLORS.borderColor}
                        px={4}
                        py={4}
                        display="flex"
                        justifyContent="flex-end"
                        gap={2}
                    >
                        <Box
                            as="button"
                            px={6}
                            h="36px"
                            bg={COLORS.bgSecondary}
                            borderRadius="999px"
                            fontSize="14px"
                            fontWeight="500"
                            color={COLORS.textSecondary}
                            cursor="pointer"
                            _hover={{ bg: 'rgba(242, 243, 245, 0.8)' }}
                            onClick={() => setIsTransferModalOpen(false)}
                        >
                            取消
                        </Box>
                        <Box
                            as="button"
                            px={6}
                            h="36px"
                            bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                            borderRadius="999px"
                            fontSize="14px"
                            fontWeight="500"
                            color="white"
                            cursor="pointer"
                            _hover={{ opacity: 0.9 }}
                            onClick={() => setIsTransferModalOpen(false)}
                        >
                            确认
                        </Box>
                    </Box>
                </DialogContent>
            </DialogRoot>

            {/* Invalid Defect Modal */}
            <DialogRoot
                open={isInvalidModalOpen}
                onOpenChange={(details) =>
                    !details.open && setIsInvalidModalOpen(false)
                }
                closeOnInteractOutside={true}
            >
                <DialogBackdrop />
                <DialogContent
                    maxW="600px"
                    borderRadius="8px"
                    bg="white"
                    boxShadow="0px 0px 18px rgba(0, 65, 215, 0.06)"
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    m={4}
                    zIndex={2000}
                    display="flex"
                    flexDirection="column"
                >
                    {/* Header */}
                    <DialogHeader
                        borderBottom="1px solid"
                        borderColor={COLORS.borderColor}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        px={4}
                        py={3}
                    >
                        <Text
                            fontSize="16px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                        >
                            审核不通过
                        </Text>
                        <DialogCloseTrigger
                            position="static"
                            onClick={() => setIsInvalidModalOpen(false)}
                            _hover={{ bg: 'transparent' }}
                            asChild
                        >
                            <LuX
                                size={16}
                                color={COLORS.textTertiary}
                                style={{ cursor: 'pointer' }}
                            />
                        </DialogCloseTrigger>
                    </DialogHeader>

                    {/* Body */}
                    <DialogBody px={6} py={6}>
                        <VStack align="stretch" gap={4}>
                            {/* Review Opinion Section */}
                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    mb={2}
                                >
                                    审核意见
                                </Text>
                                <HStack gap={2} align="flex-start">
                                    <NativeSelectRoot flex="1" size="sm">
                                        <NativeSelectField
                                            value={selectedTemplateId}
                                            onChange={(e) => {
                                                const templateId = (
                                                    e.target as HTMLSelectElement
                                                ).value;
                                                setSelectedTemplateId(
                                                    templateId
                                                );
                                                const template =
                                                    reasonTemplatesData?.find(
                                                        (t) =>
                                                            t.id === templateId
                                                    );
                                                if (template) {
                                                    setInvalidComment(
                                                        template.content || ''
                                                    );
                                                }
                                            }}
                                            fontSize="14px"
                                            borderColor={COLORS.borderColor}
                                            bg={COLORS.bgSecondary}
                                            color={
                                                selectedTemplateId
                                                    ? COLORS.textPrimary
                                                    : COLORS.textTertiary
                                            }
                                            h="32px"
                                        >
                                            <option value="">
                                                请选择内容模板
                                            </option>
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
                                        </NativeSelectField>
                                    </NativeSelectRoot>
                                    <Box
                                        as="button"
                                        px={3}
                                        h="32px"
                                        border="1px solid"
                                        borderColor={COLORS.borderColor}
                                        borderRadius="2px"
                                        fontSize="14px"
                                        color={COLORS.textPrimary}
                                        bg="white"
                                        cursor="pointer"
                                        _hover={{ bg: COLORS.bgSecondary }}
                                        onClick={() => {
                                            setIsEditingTemplate(false);
                                            setCurrentTemplate({
                                                id: '',
                                                name: '',
                                                content: '',
                                            });
                                            setIsTemplateDialogOpen(true);
                                        }}
                                    >
                                        添加
                                    </Box>
                                    <Box
                                        as="button"
                                        px={3}
                                        h="32px"
                                        border="1px solid"
                                        borderColor={COLORS.borderColor}
                                        borderRadius="2px"
                                        fontSize="14px"
                                        color={
                                            selectedTemplateId
                                                ? COLORS.textPrimary
                                                : COLORS.textTertiary
                                        }
                                        bg="white"
                                        cursor={
                                            selectedTemplateId
                                                ? 'pointer'
                                                : 'not-allowed'
                                        }
                                        _hover={
                                            selectedTemplateId
                                                ? { bg: COLORS.bgSecondary }
                                                : {}
                                        }
                                        onClick={() => {
                                            if (!selectedTemplateId) {
                                                showErrorToast(
                                                    '请先选择一个模板'
                                                );
                                                return;
                                            }
                                            const template =
                                                reasonTemplatesData?.find(
                                                    (t) =>
                                                        t.id ===
                                                        selectedTemplateId
                                                );
                                            if (template) {
                                                setIsEditingTemplate(true);
                                                setCurrentTemplate({
                                                    id: template.id || '',
                                                    name: template.name || '',
                                                    content:
                                                        template.content || '',
                                                });
                                                setIsTemplateDialogOpen(true);
                                            }
                                        }}
                                    >
                                        编辑
                                    </Box>
                                    <Box
                                        as="button"
                                        px={3}
                                        h="32px"
                                        border="1px solid"
                                        borderColor={COLORS.borderColor}
                                        borderRadius="2px"
                                        fontSize="14px"
                                        color={
                                            selectedTemplateId
                                                ? COLORS.primary
                                                : COLORS.textTertiary
                                        }
                                        bg="white"
                                        cursor={
                                            selectedTemplateId
                                                ? 'pointer'
                                                : 'not-allowed'
                                        }
                                        _hover={
                                            selectedTemplateId
                                                ? {
                                                    bg: 'rgba(227, 20, 36, 0.05)',
                                                }
                                                : {}
                                        }
                                        onClick={() => {
                                            if (!selectedTemplateId) {
                                                showErrorToast(
                                                    '请先选择一个模板'
                                                );
                                                return;
                                            }
                                            if (
                                                confirm('确定要删除该模板吗？')
                                            ) {
                                                deleteTemplateMutation.mutate({
                                                    id: selectedTemplateId,
                                                });
                                            }
                                        }}
                                    >
                                        删除
                                    </Box>
                                </HStack>
                            </Box>

                            {/* Comment Textarea */}
                            <Box>
                                <textarea
                                    style={{
                                        width: '100%',
                                        minHeight: '180px',
                                        padding: '12px',
                                        borderRadius: '4px',
                                        backgroundColor: COLORS.bgSecondary,
                                        border: `1px solid ${COLORS.borderColor}`,
                                        fontSize: '14px',
                                        color: invalidComment
                                            ? COLORS.textPrimary
                                            : COLORS.textTertiary,
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        outline: 'none',
                                    }}
                                    value={invalidComment}
                                    onChange={(e) =>
                                        setInvalidComment(e.target.value)
                                    }
                                    placeholder="请输入审核意见"
                                />
                            </Box>
                        </VStack>
                    </DialogBody>

                    {/* Footer */}
                    <Box
                        borderTop="1px solid"
                        borderColor={COLORS.borderColor}
                        px={4}
                        py={4}
                        display="flex"
                        justifyContent="flex-end"
                        gap={3}
                    >
                        <Box
                            as="button"
                            px={6}
                            h="36px"
                            bg={COLORS.bgSecondary}
                            borderRadius="999px"
                            fontSize="14px"
                            fontWeight="500"
                            color={COLORS.textSecondary}
                            cursor="pointer"
                            _hover={{ bg: 'rgba(242, 243, 245, 0.8)' }}
                            onClick={() => setIsInvalidModalOpen(false)}
                        >
                            取消
                        </Box>
                        <Box
                            as="button"
                            px={6}
                            h="36px"
                            bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                            borderRadius="999px"
                            fontSize="14px"
                            fontWeight="500"
                            color="white"
                            cursor="pointer"
                            _hover={{ opacity: 0.9 }}
                            onClick={() => {
                                // Handle submit - 将缺陷标记为无效
                                if (!invalidComment.trim()) {
                                    showErrorToast('请输入审核意见');
                                    return;
                                }
                                if (!currentInvalidDefectId) {
                                    showErrorToast('未找到缺陷信息');
                                    return;
                                }
                                // 调用 API 将缺陷标记为无效（REJECTED），并保存审核意见
                                updateDefectStatusMutation.mutate({
                                    defectId: currentInvalidDefectId,
                                    status: 'REJECTED',
                                    reviewComment: invalidComment.trim(),
                                });
                                setIsInvalidModalOpen(false);
                                setSelectedTemplateId('');
                                setInvalidComment('');
                                setCurrentInvalidDefectId(null);
                            }}
                        >
                            提交
                        </Box>
                    </Box>
                </DialogContent>
            </DialogRoot>

            {/* Template Management Dialog */}
            <DialogRoot
                open={isTemplateDialogOpen}
                onOpenChange={(details) =>
                    !details.open && setIsTemplateDialogOpen(false)
                }
                closeOnInteractOutside={true}
            >
                <DialogBackdrop />
                <DialogContent
                    maxW="500px"
                    borderRadius="8px"
                    bg="white"
                    boxShadow="0px 0px 18px rgba(0, 65, 215, 0.06)"
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    m={4}
                    zIndex={2000}
                    display="flex"
                    flexDirection="column"
                >
                    {/* Header */}
                    <DialogHeader
                        borderBottom="1px solid"
                        borderColor={COLORS.borderColor}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        px={4}
                        py={3}
                    >
                        <Text
                            fontSize="16px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                        >
                            {isEditingTemplate ? '编辑模板' : '添加模板'}
                        </Text>
                        <DialogCloseTrigger
                            position="static"
                            onClick={() => setIsTemplateDialogOpen(false)}
                            _hover={{ bg: 'transparent' }}
                            asChild
                        >
                            <LuX
                                size={16}
                                color={COLORS.textTertiary}
                                style={{ cursor: 'pointer' }}
                            />
                        </DialogCloseTrigger>
                    </DialogHeader>

                    {/* Body */}
                    <DialogBody px={6} py={6}>
                        <VStack align="stretch" gap={4}>
                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    mb={2}
                                >
                                    模板名称
                                </Text>
                                <Input
                                    value={currentTemplate.name}
                                    onChange={(e) =>
                                        setCurrentTemplate({
                                            ...currentTemplate,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="请输入模板名称"
                                    fontSize="14px"
                                    borderColor={COLORS.borderColor}
                                    h="40px"
                                />
                            </Box>
                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    mb={2}
                                >
                                    模板内容
                                </Text>
                                <textarea
                                    style={{
                                        width: '100%',
                                        minHeight: '120px',
                                        padding: '12px',
                                        borderRadius: '4px',
                                        backgroundColor: 'white',
                                        border: `1px solid ${COLORS.borderColor}`,
                                        fontSize: '14px',
                                        color: COLORS.textPrimary,
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        outline: 'none',
                                    }}
                                    value={currentTemplate.content}
                                    onChange={(e) =>
                                        setCurrentTemplate({
                                            ...currentTemplate,
                                            content: e.target.value,
                                        })
                                    }
                                    placeholder="请输入模板内容"
                                />
                            </Box>
                        </VStack>
                    </DialogBody>

                    {/* Footer */}
                    <Box
                        borderTop="1px solid"
                        borderColor={COLORS.borderColor}
                        px={4}
                        py={4}
                        display="flex"
                        justifyContent="flex-end"
                        gap={3}
                    >
                        <Box
                            as="button"
                            px={6}
                            h="36px"
                            bg={COLORS.bgSecondary}
                            borderRadius="999px"
                            fontSize="14px"
                            fontWeight="500"
                            color={COLORS.textSecondary}
                            cursor="pointer"
                            _hover={{ bg: 'rgba(242, 243, 245, 0.8)' }}
                            onClick={() => setIsTemplateDialogOpen(false)}
                        >
                            取消
                        </Box>
                        <Box
                            as="button"
                            px={6}
                            h="36px"
                            bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                            borderRadius="999px"
                            fontSize="14px"
                            fontWeight="500"
                            color="white"
                            cursor="pointer"
                            _hover={{ opacity: 0.9 }}
                            onClick={() => {
                                if (!currentTemplate.name.trim()) {
                                    showErrorToast('请输入模板名称');
                                    return;
                                }
                                if (!currentTemplate.content.trim()) {
                                    showErrorToast('请输入模板内容');
                                    return;
                                }
                                if (isEditingTemplate) {
                                    updateTemplateMutation.mutate({
                                        id: currentTemplate.id,
                                        name: currentTemplate.name,
                                        content: currentTemplate.content,
                                    });
                                } else {
                                    createTemplateMutation.mutate({
                                        name: currentTemplate.name,
                                        type: 'AUDIT_OPINION',
                                        content: currentTemplate.content,
                                    });
                                }
                            }}
                        >
                            保存
                        </Box>
                    </Box>
                </DialogContent>
            </DialogRoot>

            {/* Test Case Detail Modal */}
            <DialogRoot
                open={isTestCaseDetailOpen}
                onOpenChange={(details) =>
                    !details.open && setIsTestCaseDetailOpen(false)
                }
                closeOnInteractOutside={true}
            >
                <DialogBackdrop />
                <DialogContent
                    maxW="800px"
                    borderRadius="8px"
                    bg="white"
                    boxShadow="0px 0px 18px rgba(0, 65, 215, 0.06)"
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    m={4}
                    zIndex={2000}
                    display="flex"
                    flexDirection="column"
                    maxH="90vh"
                >
                    {/* Header */}
                    <DialogHeader
                        borderBottom="1px solid"
                        borderColor={COLORS.borderColor}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        px={4}
                        py={3}
                    >
                        <Text
                            fontSize="16px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                        >
                            用例详细步骤
                        </Text>
                        <DialogCloseTrigger
                            position="static"
                            onClick={() => setIsTestCaseDetailOpen(false)}
                            _hover={{ bg: 'transparent' }}
                            asChild
                        >
                            <LuX
                                size={16}
                                color={COLORS.textTertiary}
                                style={{ cursor: 'pointer' }}
                            />
                        </DialogCloseTrigger>
                    </DialogHeader>

                    {/* Body */}
                    <DialogBody px={6} py={4} overflowY="auto">
                        {selectedTestCase ? (
                            <VStack align="stretch" gap={6}>
                                {/* Test Case Title */}
                                <Box>
                                    <Text
                                        fontSize="16px"
                                        fontWeight="600"
                                        color={COLORS.textPrimary}
                                        mb={3}
                                    >
                                        {selectedTestCase.title}
                                    </Text>
                                </Box>

                                {/* Test Preparation */}
                                {selectedTestCase.precondition && (
                                    <Box>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="600"
                                            color={COLORS.textPrimary}
                                            mb={2}
                                        >
                                            测试准备
                                        </Text>
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.textSecondary}
                                            lineHeight="1.7"
                                            whiteSpace="pre-wrap"
                                        >
                                            {selectedTestCase.precondition}
                                        </Text>
                                    </Box>
                                )}

                                {/* Focus Points */}
                                {selectedTestCase.explanation && (
                                    <Box>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="600"
                                            color={COLORS.textPrimary}
                                            mb={2}
                                        >
                                            重点关注
                                        </Text>
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.textSecondary}
                                            lineHeight="1.7"
                                            whiteSpace="pre-wrap"
                                        >
                                            {selectedTestCase.explanation}
                                        </Text>
                                    </Box>
                                )}

                                {/* Test Steps */}
                                {selectedTestCase.testSteps &&
                                    (() => {
                                        try {
                                            const steps = JSON.parse(
                                                selectedTestCase.testSteps
                                            );
                                            return steps.length > 0 ? (
                                                <Box>
                                                    <Text
                                                        fontSize="14px"
                                                        fontWeight="600"
                                                        color={
                                                            COLORS.textPrimary
                                                        }
                                                        mb={3}
                                                    >
                                                        测试步骤
                                                    </Text>
                                                    <VStack
                                                        align="stretch"
                                                        gap={4}
                                                    >
                                                        {steps
                                                            .map((step: any, originalIndex: number) => ({ step, originalIndex }))
                                                            .filter(({ step, originalIndex }: { step: any; originalIndex: number }) => {
                                                                if (selectedRelatedSteps.length === 0) return true;
                                                                const stepTitle = step.title || `步骤${originalIndex + 1}`;
                                                                return selectedRelatedSteps.some((name) => {
                                                                    if (name === stepTitle) return true;
                                                                    if (name === `步骤${originalIndex + 1}`) return true;
                                                                    if (name.includes(stepTitle) || stepTitle.includes(name)) return true;
                                                                    return false;
                                                                });
                                                            })
                                                            .map(
                                                                (
                                                                    { step, originalIndex }: { step: any; originalIndex: number }
                                                                ) => (
                                                                    <Box
                                                                        key={originalIndex}
                                                                        p={4}
                                                                        bg={
                                                                            COLORS.bgSecondary
                                                                        }
                                                                        borderRadius="4px"
                                                                    >
                                                                        <Text
                                                                            fontSize="14px"
                                                                            fontWeight="600"
                                                                            color={
                                                                                COLORS.textPrimary
                                                                            }
                                                                            mb={2}
                                                                        >
                                                                            步骤
                                                                            {originalIndex +
                                                                                1}
                                                                        </Text>
                                                                        <VStack
                                                                            align="stretch"
                                                                            gap={2}
                                                                        >
                                                                            <HStack
                                                                                align="flex-start"
                                                                                gap={
                                                                                    2
                                                                                }
                                                                            >
                                                                                <Text
                                                                                    fontSize="14px"
                                                                                    color={
                                                                                        COLORS.textSecondary
                                                                                    }
                                                                                    flexShrink={
                                                                                        0
                                                                                    }
                                                                                    fontWeight="500"
                                                                                >
                                                                                    操作步骤：
                                                                                </Text>
                                                                                <Text
                                                                                    fontSize="14px"
                                                                                    color={
                                                                                        COLORS.textSecondary
                                                                                    }
                                                                                    lineHeight="1.7"
                                                                                >
                                                                                    {step.description ||
                                                                                        step.step}
                                                                                </Text>
                                                                            </HStack>
                                                                            <HStack
                                                                                align="flex-start"
                                                                                gap={
                                                                                    2
                                                                                }
                                                                            >
                                                                                <Text
                                                                                    fontSize="14px"
                                                                                    color={
                                                                                        COLORS.textSecondary
                                                                                    }
                                                                                    flexShrink={
                                                                                        0
                                                                                    }
                                                                                    fontWeight="500"
                                                                                >
                                                                                    预期结果：
                                                                                </Text>
                                                                                <Text
                                                                                    fontSize="14px"
                                                                                    color={
                                                                                        COLORS.textSecondary
                                                                                    }
                                                                                    lineHeight="1.7"
                                                                                >
                                                                                    {step.expectedResult ||
                                                                                        step.expected}
                                                                                </Text>
                                                                            </HStack>
                                                                        </VStack>
                                                                    </Box>
                                                                )
                                                            )}
                                                    </VStack>
                                                </Box>
                                            ) : null;
                                        } catch (e) {
                                            return null;
                                        }
                                    })()}
                            </VStack>
                        ) : (
                            <Box p={8} textAlign="center">
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                >
                                    加载中...
                                </Text>
                            </Box>
                        )}
                    </DialogBody>

                    {/* Footer */}
                    <Box
                        borderTop="1px solid"
                        borderColor={COLORS.borderColor}
                        px={4}
                        py={4}
                        display="flex"
                        justifyContent="flex-end"
                    >
                        <Box
                            as="button"
                            px={6}
                            h="36px"
                            bg="linear-gradient(90deg, #ff9565 0%, #fe5f6b 100%)"
                            borderRadius="999px"
                            fontSize="14px"
                            fontWeight="500"
                            color="white"
                            cursor="pointer"
                            _hover={{ opacity: 0.9 }}
                            onClick={() => setIsTestCaseDetailOpen(false)}
                        >
                            关闭
                        </Box>
                    </Box>
                </DialogContent>
            </DialogRoot>
        </Box>
    );
}

// Order item type
interface OrderItem {
    id: string;
    orderNo: string;
    userName: string;
    claimTime: string;
    validDefects: number;
    invalidDefects: number;
    estimatedPoints: number;
    defectPoints: number;
    repeatDefectPoints: number;
    orderExecutionPoints: number;
    orderExecutionChecked: boolean;
    pendingReviewDefects: number;
    status: 'pending' | 'paid' | 'unpaid';
}

// Test Case type
interface TestCase {
    id: string;
    sequence: number;
    caseNumber: string;
    system: string;
    caseName: string;
    defectCount: string; // 格式为 "缺陷数/建议数" 如 "12/5"
    property: string;
    action: string;
}

const mockOrders: OrderItem[] = [
    {
        id: '1',
        orderNo: 'N1234567890',
        userName: '张三',
        claimTime: '2024-09-12 24:32:00',
        validDefects: 40,
        invalidDefects: 9,
        estimatedPoints: 0,
        defectPoints: 0,
        repeatDefectPoints: 0,
        orderExecutionPoints: 0,
        orderExecutionChecked: false,
        pendingReviewDefects: 24,
        status: 'pending',
    },
    {
        id: '2',
        orderNo: 'N1234567890',
        userName: '张三',
        claimTime: '2024-09-12 24:32:00',
        validDefects: 40,
        invalidDefects: 9,
        estimatedPoints: 0,
        defectPoints: 0,
        repeatDefectPoints: 0,
        orderExecutionPoints: 10,
        orderExecutionChecked: true,
        pendingReviewDefects: 24,
        status: 'paid',
    },
    {
        id: '3',
        orderNo: 'N1234567890',
        userName: '张三',
        claimTime: '2024-09-12 24:32:00',
        validDefects: 40,
        invalidDefects: 9,
        estimatedPoints: 0,
        defectPoints: 0,
        repeatDefectPoints: 0,
        orderExecutionPoints: 0,
        orderExecutionChecked: false,
        pendingReviewDefects: 24,
        status: 'unpaid',
    },
    {
        id: '4',
        orderNo: 'N1234567890',
        userName: '张三',
        claimTime: '2024-09-12 24:32:00',
        validDefects: 40,
        invalidDefects: 9,
        estimatedPoints: 0,
        defectPoints: 0,
        repeatDefectPoints: 0,
        orderExecutionPoints: 0,
        orderExecutionChecked: false,
        pendingReviewDefects: 24,
        status: 'pending',
    },
];

const getOrderStatusConfig = (status: OrderItem['status']) => {
    switch (status) {
        case 'pending':
            return { text: '待判定', color: '#165DFF' };
        case 'paid':
            return { text: '已支付', color: '#00B42A' };
        case 'unpaid':
            return { text: '待支付', color: '#F34724' };
        default:
            return { text: '待判定', color: '#165DFF' };
    }
};

// Order Management Tab Component
function OrderManagementTab({ reviewId }: { reviewId: string }) {
    const router = useRouter();
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const [statusFilter, setStatusFilter] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // 获取订单列表
    const {
        data: ordersData,
        isLoading,
        refetch,
    } = api.review.getTaskOrders.useQuery({
        taskId: reviewId,
        page: currentPage,
        pageSize,
        status: statusFilter as any,
        keyword: searchKeyword,
    });

    const orders = ordersData?.data || [];
    const totalItems = ordersData?.pagination?.total || 0;
    const totalPages = ordersData?.pagination?.totalPages || 0;

    // 更新订单执行积分
    const updateOrderPointsMutation =
        api.review.updateOrderExecutionPoints.useMutation({
            onSuccess: () => {
                showSuccessToast('订单执行积分已更新');
                void refetch();
            },
            onError: (error) => {
                showErrorToast(error.message);
            },
        });

    const handleSelectOrder = (id: string) => {
        if (selectedOrders.includes(id)) {
            setSelectedOrders(
                selectedOrders.filter((orderId) => orderId !== id)
            );
        } else {
            setSelectedOrders([...selectedOrders, id]);
        }
    };

    const handleSelectAll = () => {
        const allIds = orders.map((o) => o.id);
        const allSelected = allIds.every((id) => selectedOrders.includes(id));
        if (allSelected) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(allIds);
        }
    };

    const handleToggleOrderExecution = (
        orderId: string,
        currentPoints: number
    ) => {
        const isChecked = currentPoints === 0; // If currentPoints is 0, it means unchecked, so we should check it
        updateOrderPointsMutation.mutate({
            orderId,
            isChecked,
        });
    };

    const isAllSelected =
        orders.length > 0 && orders.every((o) => selectedOrders.includes(o.id));

    const handleSearch = () => {
        setCurrentPage(1);
        void refetch();
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1, 2, 3, 4, 5, '...', totalPages);
        }
        return pages;
    };

    const getOrderStatusConfig = (status: string) => {
        switch (status) {
            case 'PENDING':
                return { text: '待领取', color: '#86909C' };
            case 'IN_PROGRESS':
                return { text: '进行中', color: '#165DFF' };
            case 'SUBMITTED':
                return { text: '已提交', color: '#00B42A' };
            case 'COMPLETED':
                return { text: '已完成', color: '#00B42A' };
            case 'CANCELLED':
                return { text: '已取消', color: '#F34724' };
            default:
                return { text: '待判定', color: '#165DFF' };
        }
    };

    if (isLoading) {
        return (
            <Box p={6} textAlign="center">
                <Text color={COLORS.textSecondary}>加载中...</Text>
            </Box>
        );
    }

    return (
        <Box>
            {/* Filter Bar */}
            <Flex
                align="center"
                gap={3}
                p={4}
                borderBottom="1px solid"
                borderColor={COLORS.borderColor}
            >
                <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                >
                    <Text fontSize="14px" color={COLORS.textSecondary}>
                        全选
                    </Text>
                </Checkbox>

                <NativeSelectRoot w="120px" size="sm">
                    <NativeSelectField
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        fontSize="14px"
                        borderColor={COLORS.borderColor}
                        color={COLORS.textSecondary}
                    >
                        <option value="">订单状态</option>
                        <option value="PENDING">待领取</option>
                        <option value="IN_PROGRESS">进行中</option>
                        <option value="SUBMITTED">已提交</option>
                        <option value="COMPLETED">已完成</option>
                        <option value="CANCELLED">已取消</option>
                    </NativeSelectField>
                </NativeSelectRoot>

                <Input
                    placeholder="订单编号、用例名称"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    w="200px"
                    fontSize="14px"
                    borderColor={COLORS.borderColor}
                    _placeholder={{ color: COLORS.textTertiary }}
                />

                <Box
                    as="button"
                    px={6}
                    py={2}
                    bg={COLORS.primary}
                    color="white"
                    borderRadius="4px"
                    fontSize="14px"
                    cursor="pointer"
                    _hover={{ opacity: 0.9 }}
                    onClick={handleSearch}
                >
                    查询
                </Box>
            </Flex>

            {/* Order Cards */}
            <Box>
                {orders.map((order, index) => {
                    const statusConfig = getOrderStatusConfig(order.status);
                    return (
                        <Box
                            key={order.id}
                            borderBottom="1px solid"
                            borderColor={COLORS.borderColor}
                        >
                            {/* Order Header Row */}
                            <Flex
                                align="center"
                                px={4}
                                py={3}
                                bg={COLORS.bgSecondary}
                            >
                                <Flex align="center" gap={20} flex="1">
                                    <Checkbox
                                        checked={selectedOrders.includes(
                                            order.id
                                        )}
                                        onCheckedChange={() =>
                                            handleSelectOrder(order.id)
                                        }
                                    />
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textSecondary}
                                        w="40px"
                                        textAlign="center"
                                    >
                                        {(currentPage - 1) * pageSize +
                                            index +
                                            1}
                                    </Text>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textPrimary}
                                        fontWeight="500"
                                    >
                                        {order.id}
                                    </Text>
                                </Flex>

                                <Flex align="center" gap={80} w="500px">
                                    <Flex gap={2}>
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.textSecondary}
                                        >
                                            待审核缺陷：
                                        </Text>
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.primary}
                                            fontWeight="500"
                                        >
                                            {order.pendingDefects}
                                        </Text>
                                    </Flex>
                                    <Text
                                        fontSize="14px"
                                        color={statusConfig.color}
                                        fontWeight="500"
                                    >
                                        {statusConfig.text}
                                    </Text>
                                </Flex>
                            </Flex>

                            {/* Order Detail Row */}
                            <Flex px={4} py={4} align="flex-start">
                                {/* Left Column */}
                                <Box flex="1">
                                    <Grid
                                        templateColumns="1fr 1fr 1fr 1fr"
                                        gap={4}
                                        fontSize="14px"
                                    >
                                        {/* Row 1 */}
                                        <Flex gap={2}>
                                            <Text color={COLORS.textTertiary}>
                                                用户名：
                                            </Text>
                                            <Text
                                                color={COLORS.textPrimary}
                                                fontWeight="500"
                                            >
                                                {order.user.name || '未知'}
                                            </Text>
                                        </Flex>
                                        <Flex gap={2}>
                                            <Text color={COLORS.textTertiary}>
                                                有效缺陷/建议：
                                            </Text>
                                            <Text color={COLORS.textPrimary}>
                                                {order.validDefects}
                                            </Text>
                                        </Flex>
                                        <Flex gap={2}>
                                            <Text color={COLORS.textTertiary}>
                                                预计发放积分：
                                            </Text>
                                            <Text color={COLORS.textPrimary}>
                                                {order.expectedPoints || 0}
                                            </Text>
                                        </Flex>
                                        <Box />

                                        {/* Row 2 */}
                                        <Flex gap={2}>
                                            <Text color={COLORS.textTertiary}>
                                                领取时间：
                                            </Text>
                                            <Text
                                                color={COLORS.textPrimary}
                                                fontWeight="500"
                                            >
                                                {order.startedAt
                                                    ? new Date(
                                                        order.startedAt
                                                    ).toLocaleString('zh-CN')
                                                    : '-'}
                                            </Text>
                                        </Flex>
                                        <Flex gap={2}>
                                            <Text color={COLORS.textTertiary}>
                                                无效缺陷/建议：
                                            </Text>
                                            <Text color={COLORS.textPrimary}>
                                                {order.invalidDefects}
                                            </Text>
                                        </Flex>
                                        <Flex gap={2}>
                                            <Text color={COLORS.textTertiary}>
                                                缺陷/建议积分：
                                            </Text>
                                            <Text color={COLORS.textPrimary}>
                                                {order.defectPoints || 0}
                                            </Text>
                                        </Flex>
                                        <Box />

                                        {/* Row 3 */}
                                        <Box />
                                        <Box />
                                        <Flex gap={2}>
                                            <Text color={COLORS.textTertiary}>
                                                重复缺陷执行积分：
                                            </Text>
                                            <Text color={COLORS.textPrimary}>
                                                {order.duplicateExecutionPoints || 0}
                                            </Text>
                                        </Flex>
                                        <Flex align="center" gap={2}>
                                            <Checkbox
                                                checked={order.earnedPoints > 0}
                                                onCheckedChange={() =>
                                                    handleToggleOrderExecution(
                                                        order.id,
                                                        order.earnedPoints
                                                    )
                                                }
                                                size="sm"
                                            />
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.textSecondary}
                                            >
                                                订单执行积分：
                                                <Text
                                                    as="span"
                                                    color={COLORS.textPrimary}
                                                >
                                                    {order.orderExecutionPoints || 0}
                                                </Text>
                                            </Text>
                                        </Flex>
                                    </Grid>
                                </Box>

                                {/* Right Column - Checkbox and Button */}
                                <Flex
                                    direction="column"
                                    align="flex-end"
                                    gap={3}
                                    ml={4}
                                >
                                    <Box
                                        as="button"
                                        px={4}
                                        py={2}
                                        border="1px solid"
                                        borderColor={COLORS.primary}
                                        borderRadius="40px"
                                        color={COLORS.primary}
                                        bg="transparent"
                                        cursor="pointer"
                                        fontSize="14px"
                                        _hover={{
                                            bg: 'rgba(227, 20, 36, 0.05)',
                                        }}
                                        onClick={() =>
                                            router.push(
                                                `/crowdsource/review/${reviewId}/orders/${order.id}`
                                            )
                                        }
                                    >
                                        查看订单
                                    </Box>
                                </Flex>
                            </Flex>
                        </Box>
                    );
                })}
            </Box>

            {/* Pagination */}
            <Flex
                align="center"
                justify="center"
                gap={3}
                py={4}
                borderTop="1px solid"
                borderColor={COLORS.borderColor}
            >
                <Text fontSize="14px" color={COLORS.textSecondary}>
                    共{totalItems}条
                </Text>

                <Box
                    as="button"
                    p={2}
                    color={
                        currentPage === 1
                            ? COLORS.textTertiary
                            : COLORS.textSecondary
                    }
                    cursor={currentPage === 1 ? 'not-allowed' : 'pointer'}
                    onClick={() =>
                        currentPage > 1 && setCurrentPage(currentPage - 1)
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
                            border={currentPage === page ? '1px solid' : 'none'}
                            borderColor={COLORS.primary}
                            bg={
                                currentPage === page
                                    ? 'rgba(227, 20, 36, 0.05)'
                                    : 'transparent'
                            }
                            color={
                                currentPage === page
                                    ? COLORS.primary
                                    : COLORS.textSecondary
                            }
                            cursor="pointer"
                            _hover={{
                                bg:
                                    currentPage === page
                                        ? 'rgba(227, 20, 36, 0.05)'
                                        : COLORS.bgSecondary,
                            }}
                            onClick={() => setCurrentPage(page)}
                        >
                            {page}
                        </Box>
                    ) : (
                        <Text key={index} px={1} color={COLORS.textTertiary}>
                            {page}
                        </Text>
                    )
                )}

                <Box
                    as="button"
                    p={2}
                    color={
                        currentPage === totalPages
                            ? COLORS.textTertiary
                            : COLORS.textSecondary
                    }
                    cursor={
                        currentPage === totalPages ? 'not-allowed' : 'pointer'
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
                        fontSize="14px"
                        borderColor={COLORS.borderColor}
                    >
                        <option value="10">10条/页</option>
                        <option value="20">20条/页</option>
                        <option value="50">50条/页</option>
                    </NativeSelectField>
                </NativeSelectRoot>

                <Flex align="center" gap={2}>
                    <Text fontSize="14px" color={COLORS.textSecondary}>
                        前往
                    </Text>
                    <Input
                        w="50px"
                        h="32px"
                        fontSize="14px"
                        textAlign="center"
                        borderColor={COLORS.borderColor}
                    />
                </Flex>
            </Flex>
        </Box>
    );
}

// Test Cases Tab Component
function TestCasesTab({ reviewId }: { reviewId: string }) {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // 获取用例列表
    const { data: testCasesData, isLoading } =
        api.review.getTaskTestCases.useQuery({
            taskId: reviewId,
            page: currentPage,
            pageSize: pageSize,
        });

    const testCases = testCasesData?.data || [];
    const pagination = testCasesData?.pagination;
    const totalItems = pagination?.total || 0;
    const totalPages = pagination?.totalPages || 0;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1, 2, 3, 4, 5, '...', totalPages);
        }
        return pages;
    };

    return (
        <Box>
            {/* Table Header */}
            <Box overflowX="auto">
                <Flex
                    minW="1000px"
                    borderBottom="1px solid"
                    borderColor={COLORS.borderColor}
                    bg={COLORS.bgSecondary}
                >
                    {/* 序号 */}
                    <Box
                        w="80px"
                        px={4}
                        py={3}
                        borderRight="1px solid"
                        borderColor={COLORS.borderColor}
                    >
                        <Text
                            fontSize="14px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                        >
                            序号
                        </Text>
                    </Box>

                    {/* 用例编号 */}
                    <Box
                        w="160px"
                        px={4}
                        py={3}
                        borderRight="1px solid"
                        borderColor={COLORS.borderColor}
                    >
                        <Text
                            fontSize="14px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                        >
                            用例编号
                        </Text>
                    </Box>

                    {/* 所属系统 */}
                    <Box
                        w="160px"
                        px={4}
                        py={3}
                        borderRight="1px solid"
                        borderColor={COLORS.borderColor}
                    >
                        <Text
                            fontSize="14px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                        >
                            所属系统
                        </Text>
                    </Box>

                    {/* 用例名称 */}
                    <Box
                        flex="1"
                        minW="250px"
                        px={4}
                        py={3}
                        borderRight="1px solid"
                        borderColor={COLORS.borderColor}
                    >
                        <Text
                            fontSize="14px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                        >
                            用例名称
                        </Text>
                    </Box>

                    {/* 缺陷/建议 */}
                    <Box
                        w="140px"
                        px={4}
                        py={3}
                        borderRight="1px solid"
                        borderColor={COLORS.borderColor}
                    >
                        <Text
                            fontSize="14px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                        >
                            缺陷/建议
                        </Text>
                    </Box>

                    {/* 属性 */}
                    <Box
                        w="178px"
                        px={4}
                        py={3}
                        borderRight="1px solid"
                        borderColor={COLORS.borderColor}
                    >
                        <Text
                            fontSize="14px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                        >
                            属性
                        </Text>
                    </Box>

                    {/* 操作 */}
                    <Box w="184px" px={4} py={3}>
                        <Text
                            fontSize="14px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                        >
                            操作
                        </Text>
                    </Box>
                </Flex>

                {/* Loading State */}
                {isLoading && (
                    <Flex justify="center" align="center" py={8}>
                        <Text fontSize="14px" color={COLORS.textSecondary}>
                            加载中...
                        </Text>
                    </Flex>
                )}

                {/* Empty State */}
                {!isLoading && testCases.length === 0 && (
                    <Flex justify="center" align="center" py={8}>
                        <Text fontSize="14px" color={COLORS.textSecondary}>
                            暂无用例数据
                        </Text>
                    </Flex>
                )}

                {/* Table Rows */}
                {!isLoading &&
                    testCases.map((testCase) => (
                        <Flex
                            key={testCase.id}
                            minW="1000px"
                            borderBottom="1px solid"
                            borderColor={COLORS.borderColor}
                            bg="white"
                            _hover={{ bg: COLORS.bgTertiary }}
                        >
                            {/* 序号 */}
                            <Box
                                w="80px"
                                px={4}
                                py={3}
                                borderRight="1px solid"
                                borderColor={COLORS.borderColor}
                                display="flex"
                                alignItems="center"
                            >
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                >
                                    {testCase.sequence}
                                </Text>
                            </Box>

                            {/* 用例编号 */}
                            <Box
                                w="160px"
                                px={4}
                                py={3}
                                borderRight="1px solid"
                                borderColor={COLORS.borderColor}
                                display="flex"
                                alignItems="center"
                            >
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                >
                                    {testCase.caseNumber}
                                </Text>
                            </Box>

                            {/* 所属系统 */}
                            <Box
                                w="160px"
                                px={4}
                                py={3}
                                borderRight="1px solid"
                                borderColor={COLORS.borderColor}
                                display="flex"
                                alignItems="center"
                            >
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                >
                                    {testCase.system}
                                </Text>
                            </Box>

                            {/* 用例名称 */}
                            <Box
                                flex="1"
                                minW="250px"
                                px={4}
                                py={3}
                                borderRight="1px solid"
                                borderColor={COLORS.borderColor}
                                display="flex"
                                alignItems="center"
                            >
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                >
                                    {testCase.caseName}
                                </Text>
                            </Box>

                            {/* 缺陷/建议 */}
                            <Box
                                w="140px"
                                px={4}
                                py={3}
                                borderRight="1px solid"
                                borderColor={COLORS.borderColor}
                                display="flex"
                                alignItems="center"
                            >
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                >
                                    {testCase.defectCount}
                                </Text>
                            </Box>

                            {/* 属性 */}
                            <Box
                                w="178px"
                                px={4}
                                py={3}
                                borderRight="1px solid"
                                borderColor={COLORS.borderColor}
                                display="flex"
                                alignItems="center"
                            >
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textPrimary}
                                >
                                    {testCase.property}
                                </Text>
                            </Box>

                            {/* 操作 */}
                            <Box
                                w="184px"
                                px={4}
                                py={3}
                                display="flex"
                                alignItems="center"
                            >
                                <Link
                                    fontSize="14px"
                                    color={COLORS.blue}
                                    cursor="pointer"
                                    _hover={{ textDecoration: 'underline' }}
                                    onClick={() => {
                                        router.push(
                                            `/crowdsource/review/${reviewId}/cases/${testCase.id}`
                                        );
                                    }}
                                >
                                    {testCase.action}
                                </Link>
                            </Box>
                        </Flex>
                    ))}
            </Box>

            {/* Pagination */}
            {!isLoading && totalItems > 0 && (
                <Flex
                    align="center"
                    justify="center"
                    gap={3}
                    py={4}
                    borderTop="1px solid"
                    borderColor={COLORS.borderColor}
                >
                    <Text fontSize="14px" color={COLORS.textSecondary}>
                        共{totalItems}条
                    </Text>

                    <Box
                        as="button"
                        p={2}
                        color={
                            currentPage === 1
                                ? COLORS.textTertiary
                                : COLORS.textSecondary
                        }
                        cursor={currentPage === 1 ? 'not-allowed' : 'pointer'}
                        onClick={() =>
                            currentPage > 1 && setCurrentPage(currentPage - 1)
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
                                    currentPage === page ? '1px solid' : 'none'
                                }
                                borderColor={COLORS.primary}
                                bg={
                                    currentPage === page
                                        ? 'rgba(227, 20, 36, 0.05)'
                                        : 'transparent'
                                }
                                color={
                                    currentPage === page
                                        ? COLORS.primary
                                        : COLORS.textSecondary
                                }
                                cursor="pointer"
                                _hover={{
                                    bg:
                                        currentPage === page
                                            ? 'rgba(227, 20, 36, 0.05)'
                                            : COLORS.bgSecondary,
                                }}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </Box>
                        ) : (
                            <Text
                                key={index}
                                px={1}
                                color={COLORS.textTertiary}
                            >
                                {page}
                            </Text>
                        )
                    )}

                    <Box
                        as="button"
                        p={2}
                        color={
                            currentPage === totalPages
                                ? COLORS.textTertiary
                                : COLORS.textSecondary
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
                            borderColor={COLORS.borderColor}
                        >
                            <option value="10">10条/页</option>
                            <option value="20">20条/页</option>
                            <option value="50">50条/页</option>
                        </NativeSelectField>
                    </NativeSelectRoot>

                    <Flex align="center" gap={2}>
                        <Text fontSize="14px" color={COLORS.textSecondary}>
                            前往
                        </Text>
                        <Input
                            w="50px"
                            h="32px"
                            fontSize="14px"
                            textAlign="center"
                            borderColor={COLORS.borderColor}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const value = parseInt(
                                        (e.target as HTMLInputElement).value
                                    );
                                    if (value >= 1 && value <= totalPages) {
                                        setCurrentPage(value);
                                    }
                                }
                            }}
                        />
                    </Flex>
                </Flex>
            )}
        </Box>
    );
}

export default function ReviewDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const reviewId = params.id as string;
    const [activeTab, setActiveTab] = useState('basic');
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false);
    const [isRewardDistributionDialogOpen, setIsRewardDistributionDialogOpen] = useState(false);
    const [isShareLinkDialogOpen, setIsShareLinkDialogOpen] = useState(false);
    const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [linkExpiresAt, setLinkExpiresAt] = useState<Date | null>(null);
    const [defectsTabKey, setDefectsTabKey] = useState(0); // 用于强制刷新所有缺陷标签页
    const accountMenuRef = useRef<HTMLDivElement>(null);

    // Mutations for edit and publish actions
    const deleteMutation = api.review.delete.useMutation({
        onSuccess: () => {
            showSuccessToast('删除成功');
            router.push('/crowdsource/review');
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    const publishMutation = api.review.publish.useMutation({
        onSuccess: () => {
            showSuccessToast('任务已发布');
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // Handler functions
    const handleEdit = () => {
        router.push(`/crowdsource/publish/basicInformation?id=${reviewId}`);
    };

    const handleDelete = () => {
        if (confirm('确定要删除这个任务吗？')) {
            deleteMutation.mutate({ id: reviewId });
        }
    };

    const handlePublish = () => {
        if (confirm('确定要发布这个任务吗？')) {
            publishMutation.mutate({ id: reviewId });
        }
    };

    // 获取审核详情
    const {
        data: reviewData,
        isLoading,
        refetch,
    } = api.review.getById.useQuery({
        id: reviewId,
    });

    const review = reviewData?.data;

    // 获取任务缺陷数据用于统计
    const { data: allDefectsData } = api.review.getTaskDefects.useQuery({
        taskId: reviewId,
        page: 1,
        pageSize: 100, // 获取最多100个缺陷用于统计（API限制）
    });

    // 获取订单数据用于计算订单执行积分
    const { data: ordersData } = api.review.getTaskOrders.useQuery({
        taskId: reviewId,
        page: 1,
        pageSize: 100,
    });

    const allDefects = (allDefectsData?.data || []) as any[];
    const allOrders = (ordersData?.data || []) as any[];

    // 计算统计值
    const [approvedDefectsCount, setApprovedDefectsCount] = useState(0);
    const [rejectedDefectsCount, setRejectedDefectsCount] = useState(0);
    const [pendingReviewCount, setPendingReviewCount] = useState(0);
    const [totalApprovedPoints, setTotalApprovedPoints] = useState(0);

    // 当缺陷/订单数据变化时重新计算统计值
    useEffect(() => {
        let approvedCount = 0;
        let rejectedCount = 0;
        let pendingCount = 0;
        let defectPoints = 0;

        if (allDefects && allDefects.length > 0) {
            allDefects.forEach(defect => {
                // 统计已批准的缺陷/建议
                if (defect.status === 'APPROVED') {
                    approvedCount++;
                    defectPoints += defect.earnedPoints || 0;
                }
                // 统计已驳回的缺陷/建议
                else if (defect.status === 'REJECTED' || defect.status === 'DUPLICATE' || defect.status === 'CLOSED') {
                    rejectedCount++;
                }
                // 统计待审核的缺陷/建议
                else if (['SUBMITTED', 'REVIEWING', 'TO_CONFIRM', 'TO_CONFIRM_DEV'].includes(defect.status)) {
                    pendingCount++;
                }
            });
        }

        // 计算订单执行积分（已完成状态的订单）
        let orderPoints = 0;
        if (allOrders && allOrders.length > 0) {
            allOrders.forEach(order => {
                if (order.status === 'COMPLETED') {
                    orderPoints += order.earnedPoints || 0;
                }
            });
        }

        // 待发放积分 = 缺陷积分 + 订单执行积分
        const totalPoints = defectPoints + orderPoints;

        setApprovedDefectsCount(approvedCount);
        setRejectedDefectsCount(rejectedCount);
        setPendingReviewCount(pendingCount);
        setTotalApprovedPoints(totalPoints);
    }, [allDefects, allOrders]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                accountMenuRef.current &&
                !accountMenuRef.current.contains(event.target as Node)
            ) {
                setShowAccountMenu(false);
            }
        };

        if (showAccountMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAccountMenu]);

    // Mutations
    const approveMutation = api.review.approveDept.useMutation({
        onSuccess: () => {
            showSuccessToast('审核通过');
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    const rejectMutation = api.review.rejectDept.useMutation({
        onSuccess: () => {
            showSuccessToast('已驳回');
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // Generate business judgment token mutation
    const generateTokenMutation =
        api.review.generateBusinessJudgmentToken.useMutation({
            onSuccess: (data) => {
                if (data.success && data.data) {
                    setGeneratedLink(data.data.accessUrl);
                    setLinkExpiresAt(new Date(data.data.expiresAt));
                    setIsShareLinkDialogOpen(true);
                    showSuccessToast('访问链接生成成功');
                }
            },
            onError: (error) => {
                showErrorToast(error.message);
            },
        });

    // 核算完成 mutation
    const completeAccountingMutation =
        api.review.completeAccounting.useMutation({
            onSuccess: (data) => {
                showSuccessToast(data.message || '核算完成');
                // 刷新任务数据
                void refetch();
            },
            onError: (error) => {
                showErrorToast(error.message);
            },
        });

    // 批量更新缺陷积分 mutation
    const batchUpdatePointsMutation = api.defect.batchUpdatePoints.useMutation({
        onSuccess: (data) => {
            // 显示成功或部分成功的消息
            if (data.data?.failed && data.data.failed > 0) {
                // 部分失败，显示警告
                showSuccessToast(data.message);
                console.warn('导入部分失败:', data.data.errors);
            } else {
                // 全部成功
                showSuccessToast(data.message);
            }
            // 刷新缺陷数据
            refetch();
            // 刷新导出用的缺陷数据
            exportDefectsRefetch();
            // 触发所有缺陷标签页刷新
            setDefectsTabKey((prev) => prev + 1);
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 处理附件下载
    const handleDownloadAttachment = async (url: string, filename: string) => {
        try {
            // 尝试使用 fetch 下载
            const response = await fetch(url, {
                mode: 'cors',
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error('下载失败');
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            showSuccessToast('下载成功');
        } catch (error) {
            console.error('Download error:', error);
            // 如果 fetch 失败，尝试直接打开链接（浏览器会处理下载）
            try {
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showSuccessToast('已开始下载');
            } catch (fallbackError) {
                console.error('Fallback download error:', fallbackError);
                showErrorToast('下载失败，请稍后重试');
            }
        }
    };

    const handleApprove = () => {
        if (confirm('确定要通过审核吗？')) {
            approveMutation.mutate({
                id: reviewId,
                comment: undefined,
            });
        }
    };

    const handleReject = () => {
        const comment = prompt('请输入驳回原因：');
        if (comment) {
            rejectMutation.mutate({
                id: reviewId,
                comment,
            });
        }
    };

    const handleBack = () => {
        router.push('/crowdsource/review');
    };

    const handleApplyPoints = () => {
        setIsPointsDialogOpen(true);
    };

    const handleApplyDistribution = () => {
        setIsRewardDistributionDialogOpen(true);
    };

    const handleGenerateShareLink = () => {
        if (confirm('确定要生成业务判定访问链接吗？链接默认7天有效。')) {
            generateTokenMutation.mutate({
                taskId: reviewId,
                expiryDays: 7,
            });
        }
    };

    const handleCopyLink = async () => {
        if (generatedLink) {
            try {
                await navigator.clipboard.writeText(generatedLink);
                showSuccessToast('链接已复制到剪贴板');
            } catch (error) {
                showErrorToast('复制失败，请手动复制');
            }
        }
    };

    // 获取缺陷数据（用于导出）
    const { data: exportDefectsData, refetch: exportDefectsRefetch } =
        api.review.getTaskDefects.useQuery({
            taskId: reviewId,
            page: 1,
            pageSize: 100, // 获取所有缺陷（API限制最大100）
        });

    // 获取数据字典用于等级映射
    const { data: defectSeverityDict } =
        api.dataDictionary.getByCode.useQuery('DEFECT_SEVERITY');
    const { data: suggestionLevelDict } =
        api.dataDictionary.getByCode.useQuery('SUGGESTION_LEVEL');

    // 导出核算结果
    const handleExportResults = () => {
        const defects = exportDefectsData?.data || [];

        if (!defects || defects.length === 0) {
            showErrorToast('暂无缺陷数据可导出');
            return;
        }

        try {
            // 准备导出数据
            const exportData = defects.map((defect: any) => ({
                缺陷编号: defect.id,
                标题: defect.title,
                描述: defect.description,
                类型: defect.type === 'BUG' ? '缺陷' : '建议',
                状态: getDefectStatusText(defect.status),
                等级:
                    defect.type === 'BUG'
                        ? defectSeverityDict?.items?.find(
                            (i: any) => i.code === defect.severity
                        )?.label ||
                        defect.severity ||
                        '-'
                        : suggestionLevelDict?.items?.find(
                            (i: any) => i.code === defect.suggestionLevel
                        )?.label ||
                        defect.suggestionLevel ||
                        '-',
                等级积分: defect.basePoints || 0,
                实际积分: defect.earnedPoints || 0,
                用例: defect.testCase?.title || '-',
                关联步骤: defect.steps || '-',
                审核意见: defect.reviewComment || '-',
                判定原因: defect.judgmentReason || '-',
                提交人: defect.user?.name || '-',
                提交时间: new Date(defect.createdAt).toLocaleString('zh-CN'),
            }));

            // 创建工作簿
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(exportData);

            // 设置列宽
            const colWidths = [
                { wch: 15 }, // 缺陷编号
                { wch: 30 }, // 标题
                { wch: 50 }, // 描述
                { wch: 10 }, // 类型
                { wch: 12 }, // 状态
                { wch: 12 }, // 等级
                { wch: 10 }, // 等级积分
                { wch: 10 }, // 实际积分
                { wch: 25 }, // 用例
                { wch: 20 }, // 关联步骤
                { wch: 30 }, // 审核意见
                { wch: 30 }, // 判定原因
                { wch: 15 }, // 提交人
                { wch: 20 }, // 提交时间
            ];
            worksheet['!cols'] = colWidths;

            // 添加工作表到工作簿
            XLSX.utils.book_append_sheet(workbook, worksheet, '核算结果');

            // 生成文件名
            const fileName = `核算结果_${review?.title || '任务'}_${new Date().toLocaleDateString()}.xlsx`;

            // 下载文件
            XLSX.writeFile(workbook, fileName);
            showSuccessToast('导出成功');
        } catch (error) {
            console.error('Export error:', error);
            showErrorToast('导出失败，请稍后重试');
        }
    };

    // 获取缺陷状态中文文本
    const getDefectStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            SUBMITTED: '已提交',
            REVIEWING: '审核中',
            TO_CONFIRM: '待确认',
            TO_CONFIRM_DEV: '待开发确认',
            APPROVED: '已通过',
            REJECTED: '已驳回',
            DUPLICATE: '重复',
            CLOSED: '已关闭',
        };
        return statusMap[status] || status;
    };

    // 导入核算结果
    const handleImportResults = () => {
        // 创建文件输入元素
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls,.csv';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = event.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(
                        worksheet
                    ) as any[];

                    if (jsonData.length === 0) {
                        showErrorToast('导入文件为空');
                        return;
                    }

                    console.log('导入的数据:', jsonData);

                    // 解析导入的数据
                    // 支持两种列名：'等级积分'（新格式）或 '积分'（旧格式兼容）
                    const defectsToUpdate = jsonData
                        .map((row: any) => ({
                            defectNo: row['缺陷编号'] || row['缺陷ID'] || '',
                            points: Number(row['等级积分'] ?? row['积分']) || 0,
                            status: row['状态'] || undefined,
                            type: row['类型'] || undefined,
                            level: row['等级'] || undefined,
                        }))
                        .filter((item: { defectNo: string }) => item.defectNo); // 过滤掉没有缺陷编号的记录

                    if (defectsToUpdate.length === 0) {
                        showErrorToast(
                            '未能从文件中解析出有效的缺陷数据，请检查文件格式'
                        );
                        return;
                    }

                    // 调用 API 批量更新缺陷积分
                    batchUpdatePointsMutation.mutate(
                        {
                            taskId: reviewId,
                            defects: defectsToUpdate,
                        },
                        {
                            onSuccess: () => {
                                // 如果当前任务是执行结束状态，则完成核算
                                if (review?.status === 'EXECUTION_ENDED') {
                                    completeAccountingMutation.mutate({
                                        id: reviewId,
                                    });
                                }
                            },
                        }
                    );
                } catch (error) {
                    console.error('Import error:', error);
                    showErrorToast('导入失败，请检查文件格式');
                }
            };
            reader.readAsBinaryString(file);
        };
        input.click();
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'SAVED':
                return {
                    text: '已保存',
                    color: COLORS.textTertiary,
                    bg: 'rgba(134, 144, 156, 0.1)',
                };
            case 'PREPARING':
                return {
                    text: '准备中',
                    color: COLORS.orange,
                    bg: 'rgba(243, 71, 36, 0.1)',
                };
            case 'DEPT_REWARD_REVIEW':
                return {
                    text: '部门经理积分审核中',
                    color: COLORS.orange,
                    bg: 'rgba(243, 71, 36, 0.1)',
                };
            case 'GENERAL_REWARD_REVIEW':
                return {
                    text: '总经理积分审核中',
                    color: COLORS.yellow,
                    bg: 'rgba(255, 125, 0, 0.1)',
                };
            case 'PENDING_PUBLISH':
                return {
                    text: '待发布',
                    color: COLORS.blue,
                    bg: 'rgba(22, 93, 255, 0.1)',
                };
            case 'EXECUTING':
                return {
                    text: '执行中',
                    color: COLORS.blue,
                    bg: 'rgba(22, 93, 255, 0.1)',
                };
            case 'EXECUTION_ENDED':
                return {
                    text: '执行结束',
                    color: COLORS.textSecondary,
                    bg: 'rgba(78, 89, 105, 0.1)',
                };
            case 'ACCOUNTING_COMPLETED':
                return {
                    text: '核算完成',
                    color: COLORS.green,
                    bg: 'rgba(0, 180, 42, 0.1)',
                };
            case 'REWARD_DISTRIBUTION_REVIEW':
                return {
                    text: '积分发放审核中',
                    color: COLORS.yellow,
                    bg: 'rgba(255, 125, 0, 0.1)',
                };
            case 'PENDING_REWARD_DISTRIBUTION':
                return {
                    text: '待发放积分',
                    color: COLORS.orange,
                    bg: 'rgba(243, 71, 36, 0.1)',
                };
            case 'COMPLETED':
                return {
                    text: '已完成',
                    color: COLORS.green,
                    bg: 'rgba(0, 180, 42, 0.1)',
                };
            default:
                return {
                    text: '执行结束',
                    color: COLORS.textSecondary,
                    bg: 'rgba(78, 89, 105, 0.1)',
                };
        }
    };

    // Mock data based on design
    const mockData = {
        title: '广发众测任务：手机银行&个人网银测试任务',
        icon: '/images/task-hall/task-icon.png',
        status: 'EXECUTION_ENDED',
        caseCount: 4,
        pendingDefects: 4,
        estimatedPoints: 4000,
        testers: 200,
        validDefects: 8,
        distributedPoints: 4000,
        submitTime: '2024-09-12 24:32:00',
        invalidDefects: 8,
        description:
            '对"黄金积存"功能进行全流程体验测试，并在众测APP提交发现的缺陷/建议。',
        rewardRules: [
            '1、本次活动按缺陷/建议价值派发积分，总积分最高可达8000',
            '致命缺陷:300',
            '严重缺陷:150',
            '一般缺陷:50',
            '轻微缺陷:20',
            '特别建议:150',
            '优秀建议:50',
            '有效建议:20',
            '2、如出现同一个有效缺陷或建议多人提交的情况，则积分平均分配；',
            '3、总行信息科技部、研发中心同事可参与，但不能获得众测积分。',
        ],
        testData: {
            account: '12345678',
            password: '88888888',
        },
        attachments: mockAttachments,
    };

    const statusConfig = getStatusConfig(review?.status ?? mockData.status);

    if (isLoading) {
        return (
            <Box bg={COLORS.bgTertiary} minH="100vh">
                <Container maxW="1200px" px={6} py={6}>
                    <Text textAlign="center" color={COLORS.textTertiary}>
                        加载中...
                    </Text>
                </Container>
            </Box>
        );
    }

    return (
        <Box
            bg={COLORS.bgTertiary}
            minH="100vh"
            display="flex"
            flexDirection="column"
        >
            {/* Main Content */}
            <Box flex="1">
                <Container maxW="1200px" px={6} py={4}>
                    {/* Breadcrumb */}
                    <Flex
                        align="center"
                        gap={2}
                        mb={4}
                        fontSize="14px"
                        color={COLORS.textSecondary}
                    >
                        <Box
                            cursor="pointer"
                            _hover={{ color: COLORS.textPrimary }}
                        >
                            <LuMenu size={16} />
                        </Box>
                        <Text>/</Text>
                        <Text
                            cursor="pointer"
                            _hover={{ color: COLORS.primary }}
                            onClick={handleBack}
                        >
                            众测审核
                        </Text>
                        <Text>/</Text>
                        <Text color={COLORS.textPrimary}>任务详情</Text>
                    </Flex>

                    {/* Task Summary Card */}
                    <Box
                        bg={COLORS.bgPrimary}
                        borderRadius="8px"
                        p={6}
                        mb={4}
                        border="1px solid"
                        borderColor={COLORS.borderColor}
                    >
                        <Flex gap={6} position="relative">
                            {/* Task Icon */}
                            <Box flexShrink={0}>
                                <Image
                                    src={
                                        review?.thumbnailImage ??
                                        '/images/task-hall/task-icon.png'
                                    }
                                    alt="任务图标"
                                    w="80px"
                                    h="80px"
                                    borderRadius="12px"
                                    objectFit="cover"
                                />
                            </Box>

                            {/* Task Info */}
                            <Flex
                                flex="1"
                                direction="column"
                                justify="space-between"
                            >
                                {/* Title and Status */}
                                <Flex align="center" gap={3} mb={4}>
                                    <Text
                                        fontSize="18px"
                                        fontWeight="600"
                                        color={COLORS.textPrimary}
                                    >
                                        {review?.title || '任务详情'} {'>'}
                                    </Text>
                                    <Box
                                        px={3}
                                        py={1}
                                        borderRadius="4px"
                                        border="1px solid"
                                        borderColor={COLORS.lightBorder}
                                        bg={COLORS.bgPrimary}
                                    >
                                        <Text
                                            fontSize="12px"
                                            color={COLORS.textSecondary}
                                        >
                                            {statusConfig.text}
                                        </Text>
                                    </Box>
                                </Flex>

                                {/* Statistics Grid */}
                                <Grid
                                    templateColumns="repeat(3, 1fr)"
                                    gap={4}
                                    fontSize="14px"
                                    w="700px"
                                >
                                    <Flex gap={2}>
                                        <Text color={COLORS.textTertiary}>
                                            用例数量：
                                        </Text>
                                        <Text
                                            color={COLORS.textPrimary}
                                            fontWeight="500"
                                        >
                                            {review?.testCases?.length || 0}
                                        </Text>
                                    </Flex>
                                    <Flex gap={2}>
                                        <Text color={COLORS.textTertiary}>
                                            待审核缺陷/建议：
                                        </Text>
                                        <Text
                                            color={COLORS.textPrimary}
                                            fontWeight="500"
                                        >
                                            {pendingReviewCount}
                                        </Text>
                                    </Flex>
                                    <Flex gap={2}>
                                        <Text color={COLORS.textTertiary}>
                                            预计发放积分：
                                        </Text>
                                        <Text
                                            color={COLORS.textPrimary}
                                            fontWeight="500"
                                        >
                                            {/* 统一取值逻辑：优先使用积分申请值，其次使用预算或实际积分 */}
                                            {(review as any)?.pointsApplications?.[0]?.appliedPoints
                                                || (review as any)?.expectedPoints
                                                || review?.rewardConfig?.totalBudget
                                                || 0}
                                        </Text>
                                    </Flex>
                                    <Flex gap={2}>
                                        <Text color={COLORS.textTertiary}>
                                            测试人数：
                                        </Text>
                                        <Text
                                            color={COLORS.textPrimary}
                                            fontWeight="500"
                                        >
                                            {review?.currentParticipants || 0}
                                        </Text>
                                    </Flex>
                                    <Flex gap={2}>
                                        <Text color={COLORS.textTertiary}>
                                            有效缺陷/建议：
                                        </Text>
                                        <Text
                                            color={COLORS.textPrimary}
                                            fontWeight="500"
                                        >
                                            {approvedDefectsCount}
                                        </Text>
                                    </Flex>
                                    <Flex gap={2}>
                                        <Text color={COLORS.textTertiary}>
                                            待发放积分：
                                        </Text>
                                        <Text
                                            color={COLORS.textPrimary}
                                            fontWeight="500"
                                        >
                                            {totalApprovedPoints}
                                        </Text>
                                    </Flex>
                                    <Flex gap={2}>
                                        <Text color={COLORS.textTertiary}>
                                            提交时间：
                                        </Text>
                                        <Text
                                            color={COLORS.textPrimary}
                                            fontWeight="500"
                                        >
                                            {review?.createdAt
                                                ? new Date(
                                                    review.createdAt
                                                ).toLocaleString('zh-CN')
                                                : '-'}
                                        </Text>
                                    </Flex>
                                    <Flex gap={2}>
                                        <Text color={COLORS.textTertiary}>
                                            无效缺陷/建议：
                                        </Text>
                                        <Text
                                            color={COLORS.textPrimary}
                                            fontWeight="500"
                                        >
                                            {rejectedDefectsCount}
                                        </Text>
                                    </Flex>
                                </Grid>
                            </Flex>

                            {/* Action Buttons */}
                            <Flex
                                gap={3}
                                flexShrink={0}
                                position="absolute"
                                bottom="0"
                                right="0"
                            >
                                {/* Delete Button - 在已保存和准备中状态显示 */}
                                {(review?.status === 'SAVED' ||
                                    review?.status === 'PREPARING') && (
                                        <Box
                                            as="button"
                                            px={6}
                                            py={0}
                                            h="32px"
                                            border="1px solid"
                                            borderColor="#F34724"
                                            borderRadius="16px"
                                            color="#FE606B"
                                            bg="white"
                                            cursor="pointer"
                                            fontSize="14px"
                                            fontWeight="500"
                                            _hover={{
                                                borderColor: COLORS.primary,
                                                color: COLORS.primary,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete();
                                            }}
                                        >
                                            删除
                                        </Box>
                                    )}

                                {/* Edit Button - 在已保存、准备中、待发布状态显示 */}
                                {(review?.status === 'SAVED' ||
                                    review?.status === 'PREPARING' ||
                                    review?.status === 'PENDING_PUBLISH') && (
                                        <Box
                                            as="button"
                                            px={6}
                                            py={0}
                                            h="32px"
                                            border="1px solid"
                                            borderColor="#F34724"
                                            borderRadius="16px"
                                            color="#FE606B"
                                            bg="white"
                                            cursor="pointer"
                                            fontSize="14px"
                                            fontWeight="500"
                                            _hover={{
                                                borderColor: COLORS.primary,
                                                color: COLORS.primary,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit();
                                            }}
                                        >
                                            编辑
                                        </Box>
                                    )}

                                {/* Publish Button - 在待发布状态显示 */}
                                {review?.status === 'PENDING_PUBLISH' && (
                                    <Box
                                        as="button"
                                        px={6}
                                        py={0}
                                        h="32px"
                                        bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                                        borderRadius="16px"
                                        color="white"
                                        cursor="pointer"
                                        fontSize="14px"
                                        fontWeight="500"
                                        _hover={{ opacity: 0.9 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePublish();
                                        }}
                                    >
                                        发布
                                    </Box>
                                )}

                                {/* 积分申请 Button - 准备中状态显示 */}
                                {review?.status === 'PREPARING' && (
                                    <Box
                                        as="button"
                                        px={4}
                                        py={0}
                                        h="32px"
                                        bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                                        borderRadius="16px"
                                        color="white"
                                        cursor="pointer"
                                        fontSize="14px"
                                        fontWeight="500"
                                        _hover={{ opacity: 0.9 }}
                                        onClick={handleApplyPoints}
                                    >
                                        积分申请
                                    </Box>
                                )}

                                {/* 修改 Button - 执行中状态显示 */}
                                {review?.status === 'EXECUTING' && (
                                    <Box
                                        as="button"
                                        px={6}
                                        py={0}
                                        h="32px"
                                        border="1px solid"
                                        borderColor="#F34724"
                                        borderRadius="16px"
                                        color="#FE606B"
                                        bg="white"
                                        cursor="pointer"
                                        fontSize="14px"
                                        fontWeight="500"
                                        _hover={{
                                            borderColor: COLORS.primary,
                                            color: COLORS.primary,
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsEditTaskModalOpen(true);
                                        }}
                                    >
                                        修改
                                    </Box>
                                )}

                                {/* 复制链接 Button - 执行中执和行结束状态显示 */}
                                {[
                                    'EXECUTING',
                                    'EXECUTION_ENDED',
                                ].includes(review?.status ?? '') && (
                                        <Box
                                            as="button"
                                            px={4}
                                            py={0}
                                            h="32px"
                                            border="1px solid"
                                            borderColor="#FE606B"
                                            borderRadius="16px"
                                            color="#FE606B"
                                            bg="white"
                                            cursor={
                                                generateTokenMutation.isPending
                                                    ? 'not-allowed'
                                                    : 'pointer'
                                            }
                                            fontSize="14px"
                                            fontWeight="500"
                                            display="flex"
                                            alignItems="center"
                                            gap={1}
                                            _hover={{
                                                bg: generateTokenMutation.isPending
                                                    ? 'white'
                                                    : 'rgba(22, 93, 255, 0.05)',
                                            }}
                                            _disabled={{ opacity: 0.6 }}
                                            onClick={handleGenerateShareLink}
                                            aria-disabled={
                                                generateTokenMutation.isPending
                                            }
                                        >
                                            <LuLink size={16} />
                                            <Text>
                                                {generateTokenMutation.isPending
                                                    ? '生成中...'
                                                    : '复制链接'}
                                            </Text>
                                        </Box>
                                    )}

                                {/* 核算 Button with Dropdown - 执行结束和核算完成状态显示 */}
                                {[
                                    'EXECUTION_ENDED',
                                    'ACCOUNTING_COMPLETED',
                                ].includes(review?.status ?? '') && (
                                        <Box
                                            position="relative"
                                            ref={accountMenuRef}
                                        >
                                            <Flex
                                                as="button"
                                                align="center"
                                                gap={1}
                                                px={4}
                                                py={0}
                                                h="32px"
                                                border="1px solid"
                                                borderColor="#FE606B"
                                                borderRadius="16px"
                                                color="#FE606B"
                                                bg="transparent"
                                                cursor="pointer"
                                                fontSize="14px"
                                                fontWeight="500"
                                                _hover={{
                                                    bg: 'rgba(227, 20, 36, 0.05)',
                                                }}
                                                onClick={() =>
                                                    setShowAccountMenu(
                                                        !showAccountMenu
                                                    )
                                                }
                                            >
                                                <Text>核算</Text>
                                                <LuChevronDown size={16} />
                                            </Flex>

                                            {/* Dropdown Menu */}
                                            {showAccountMenu && (
                                                <Box
                                                    position="absolute"
                                                    top="calc(100% + 4px)"
                                                    right={0}
                                                    bg="white"
                                                    borderRadius="2px"
                                                    boxShadow="0 2px 8px rgba(0,0,0,0.15)"
                                                    border="1px solid"
                                                    borderColor={COLORS.borderColor}
                                                    zIndex={10}
                                                    minW="120px"
                                                    py={1}
                                                >
                                                    <Box
                                                        px={4}
                                                        py={2}
                                                        cursor="pointer"
                                                        _hover={{
                                                            bg: COLORS.bgSecondary,
                                                        }}
                                                        fontSize="14px"
                                                        color={COLORS.textPrimary}
                                                        onClick={() => {
                                                            handleExportResults();
                                                            setShowAccountMenu(
                                                                false
                                                            );
                                                        }}
                                                    >
                                                        导出结果
                                                    </Box>
                                                    <Box
                                                        px={4}
                                                        py={2}
                                                        cursor="pointer"
                                                        _hover={{
                                                            bg: COLORS.bgSecondary,
                                                        }}
                                                        fontSize="14px"
                                                        color={COLORS.textPrimary}
                                                        onClick={() => {
                                                            handleImportResults();
                                                            setShowAccountMenu(
                                                                false
                                                            );
                                                        }}
                                                    >
                                                        导入结果
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    )}

                                {/* 积分发放申请 Button - 仅在核算完成状态显示 */}
                                {review?.status === 'ACCOUNTING_COMPLETED' && (
                                    <Box
                                        as="button"
                                        px={4}
                                        py={0}
                                        h="32px"
                                        bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                                        borderRadius="16px"
                                        color="white"
                                        cursor="pointer"
                                        fontSize="14px"
                                        fontWeight="500"
                                        _hover={{ opacity: 0.9 }}
                                        onClick={() => setIsRewardDistributionDialogOpen(true)}
                                    >
                                        积分发放申请
                                    </Box>
                                )}
                            </Flex>
                        </Flex>
                    </Box>

                    {/* Tab Navigation and Content */}
                    <Box
                        bg={COLORS.bgPrimary}
                        borderRadius="8px"
                        borderColor={COLORS.borderColor}
                        overflow="hidden"
                    >
                        {/* Tabs */}
                        <Flex
                            borderBottom="1px solid"
                            borderColor={COLORS.borderColor}
                            px={6}
                        >
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
                                        fontWeight={
                                            activeTab === tab.key
                                                ? '600'
                                                : '400'
                                        }
                                        color={
                                            activeTab === tab.key
                                                ? COLORS.textPrimary
                                                : COLORS.textSecondary
                                        }
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

                        {/* Tab Content - Basic Info */}
                        {activeTab === 'basic' && (
                            <Box>
                                {/* 任务描述 */}
                                <Box
                                    p={6}
                                    borderBottom="1px solid"
                                    borderColor={COLORS.borderColor}
                                >
                                    <Text
                                        fontSize="16px"
                                        fontWeight="600"
                                        color={COLORS.textPrimary}
                                        mb={4}
                                    >
                                        任务描述
                                    </Text>
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textSecondary}
                                        lineHeight="1.8"
                                    >
                                        {review?.description || '暂无描述'}
                                    </Text>
                                </Box>

                                {/* ���励规则 */}
                                <Box
                                    p={6}
                                    borderBottom="1px solid"
                                    borderColor={COLORS.borderColor}
                                >
                                    <Text
                                        fontSize="16px"
                                        fontWeight="600"
                                        color={COLORS.textPrimary}
                                        mb={4}
                                    >
                                        奖励规则
                                    </Text>
                                    <Box
                                        fontSize="14px"
                                        color={COLORS.textSecondary}
                                        lineHeight="2"
                                    >
                                        {review?.testRules ? (
                                            <Text whiteSpace="pre-wrap">
                                                {review.testRules}
                                            </Text>
                                        ) : (
                                            <Text>暂无奖励规则</Text>
                                        )}
                                    </Box>
                                </Box>

                                {/* 测试数据 */}
                                {review?.environment && (
                                    <Box
                                        p={6}
                                        borderBottom="1px solid"
                                        borderColor={COLORS.borderColor}
                                    >
                                        <Text
                                            fontSize="16px"
                                            fontWeight="600"
                                            color={COLORS.textPrimary}
                                            mb={4}
                                        >
                                            测试数据
                                        </Text>
                                        <Text
                                            fontSize="14px"
                                            color={COLORS.textSecondary}
                                            lineHeight="1.8"
                                            whiteSpace="pre-wrap"
                                        >
                                            {review.environment}
                                        </Text>
                                    </Box>
                                )}

                                {/* 附件 */}
                                {review?.attachments &&
                                    (() => {
                                        try {
                                            const attachments =
                                                typeof review.attachments ===
                                                    'string'
                                                    ? JSON.parse(
                                                        review.attachments
                                                    )
                                                    : review.attachments;
                                            return Array.isArray(attachments) &&
                                                attachments.length > 0 ? (
                                                <Box p={6}>
                                                    <Text
                                                        fontSize="16px"
                                                        fontWeight="600"
                                                        color={
                                                            COLORS.textPrimary
                                                        }
                                                        mb={4}
                                                    >
                                                        附件
                                                    </Text>
                                                    <Grid
                                                        templateColumns="repeat(2, 1fr)"
                                                        gap={4}
                                                    >
                                                        {attachments.map(
                                                            (
                                                                attachment: any,
                                                                index: number
                                                            ) => (
                                                                <Flex
                                                                    key={index}
                                                                    align="center"
                                                                    gap={3}
                                                                    p={4}
                                                                    bg={
                                                                        COLORS.bgTertiary
                                                                    }
                                                                    borderRadius="8px"
                                                                    border="1px solid"
                                                                    borderColor={
                                                                        COLORS.borderColor
                                                                    }
                                                                >
                                                                    {/* File Icon */}
                                                                    <Box
                                                                        w="40px"
                                                                        h="40px"
                                                                        borderRadius="8px"
                                                                        display="flex"
                                                                        alignItems="center"
                                                                        justifyContent="center"
                                                                    >
                                                                        <Image
                                                                            src="/images/task-hall/task-detail/file.png"
                                                                            alt="File"
                                                                            w={
                                                                                8
                                                                            }
                                                                            h={
                                                                                8
                                                                            }
                                                                        />
                                                                    </Box>

                                                                    {/* File Info */}
                                                                    <Flex
                                                                        direction="column"
                                                                        flex="1"
                                                                    >
                                                                        <Text
                                                                            fontSize="14px"
                                                                            color={
                                                                                COLORS.textPrimary
                                                                            }
                                                                        >
                                                                            {attachment.name ||
                                                                                '附件'}
                                                                        </Text>
                                                                        <Text
                                                                            fontSize="12px"
                                                                            color={
                                                                                COLORS.textTertiary
                                                                            }
                                                                        >
                                                                            {attachment.size
                                                                                ? `${(attachment.size / 1024).toFixed(2)}KB`
                                                                                : ''}
                                                                        </Text>
                                                                    </Flex>

                                                                    {/* Actions */}
                                                                    <Flex
                                                                        gap={2}
                                                                    >
                                                                        <Box
                                                                            as="button"
                                                                            p={
                                                                                2
                                                                            }
                                                                            cursor="pointer"
                                                                            color={
                                                                                COLORS.textTertiary
                                                                            }
                                                                            _hover={{
                                                                                color: COLORS.textPrimary,
                                                                            }}
                                                                            onClick={() => {
                                                                                try {
                                                                                    window.open(
                                                                                        attachment.url,
                                                                                        '_blank',
                                                                                        'noopener,noreferrer'
                                                                                    );
                                                                                } catch (error) {
                                                                                    console.error(
                                                                                        'View error:',
                                                                                        error
                                                                                    );
                                                                                    showErrorToast(
                                                                                        '无法查看文件'
                                                                                    );
                                                                                }
                                                                            }}
                                                                        >
                                                                            <LuEye
                                                                                size={
                                                                                    18
                                                                                }
                                                                            />
                                                                        </Box>
                                                                        <Box
                                                                            as="button"
                                                                            p={
                                                                                2
                                                                            }
                                                                            cursor="pointer"
                                                                            color={
                                                                                COLORS.textTertiary
                                                                            }
                                                                            _hover={{
                                                                                color: COLORS.textPrimary,
                                                                            }}
                                                                            onClick={() =>
                                                                                handleDownloadAttachment(
                                                                                    attachment.url,
                                                                                    attachment.name ||
                                                                                    '附件'
                                                                                )
                                                                            }
                                                                        >
                                                                            <LuDownload
                                                                                size={
                                                                                    18
                                                                                }
                                                                            />
                                                                        </Box>
                                                                    </Flex>
                                                                </Flex>
                                                            )
                                                        )}
                                                    </Grid>
                                                </Box>
                                            ) : null;
                                        } catch (e) {
                                            console.error(
                                                'Failed to parse attachments:',
                                                e
                                            );
                                            return null;
                                        }
                                    })()}
                            </Box>
                        )}

                        {/* Order Management Tab */}
                        {activeTab === 'order' && (
                            <OrderManagementTab reviewId={reviewId} />
                        )}

                        {/* Defects Tab */}
                        {activeTab === 'defects' && (
                            <DefectsTab
                                key={defectsTabKey}
                                reviewId={reviewId}
                            />
                        )}

                        {/* Test Cases Tab */}
                        {activeTab === 'cases' && (
                            <TestCasesTab reviewId={reviewId} />
                        )}
                    </Box>
                </Container>
            </Box>

            {/* Footer */}
            <Box bg="#1D2129" py={4}>
                <Text
                    textAlign="center"
                    fontSize="14px"
                    color={COLORS.textTertiary}
                >
                    备案信息
                </Text>
            </Box>

            {/* Points Application Dialog */}
            <PointsApplicationDialog
                isOpen={isPointsDialogOpen}
                onClose={() => setIsPointsDialogOpen(false)}
                taskId={reviewId}
                defaultPoints={mockData.estimatedPoints}
                onSuccess={() => void refetch()}
            />

            {/* Reward Distribution Dialog - 积分发放申请 */}
            <RewardDistributionDialog
                isOpen={isRewardDistributionDialogOpen}
                onClose={() => setIsRewardDistributionDialogOpen(false)}
                taskId={reviewId}
                onSuccess={() => void refetch()}
            />

            {/* Share Link Dialog */}
            <DialogRoot
                open={isShareLinkDialogOpen}
                onOpenChange={(e) => !e.open && setIsShareLinkDialogOpen(false)}
                size="lg"
            >
                <DialogBackdrop />
                <DialogContent maxW="600px">
                    <DialogHeader>
                        <Text
                            fontSize="18px"
                            fontWeight="600"
                            color={COLORS.textPrimary}
                        >
                            业务判定访问链接
                        </Text>
                        <DialogCloseTrigger />
                    </DialogHeader>
                    <DialogBody>
                        <VStack align="stretch" gap={4}>
                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    mb={2}
                                >
                                    访问链接已生成，请复制并分享给业务/开发人员：
                                </Text>
                                <Box
                                    p={3}
                                    bg={COLORS.bgSecondary}
                                    borderRadius="4px"
                                    border="1px solid"
                                    borderColor={COLORS.borderColor}
                                    fontSize="13px"
                                    color={COLORS.textPrimary}
                                    wordBreak="break-all"
                                    fontFamily="monospace"
                                >
                                    {generatedLink}
                                </Box>
                            </Box>

                            <Box>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textTertiary}
                                >
                                    有效期至：
                                    {linkExpiresAt
                                        ? new Date(
                                            linkExpiresAt
                                        ).toLocaleString('zh-CN')
                                        : '-'}
                                </Text>
                            </Box>

                            <Box
                                p={3}
                                bg={COLORS.lightBlue}
                                borderRadius="4px"
                                fontSize="13px"
                                color={COLORS.textSecondary}
                            >
                                <Text>💡 提示：</Text>
                                <Text mt={1}>• 此链接默认7天内有效</Text>
                                <Text>• 业务/开发人员无需登录即可访问</Text>
                                <Text>• 可以查看所有缺陷并进行判定</Text>
                            </Box>

                            <Flex gap={3} justify="flex-end">
                                <Box
                                    as="button"
                                    px={4}
                                    py={2}
                                    border="1px solid"
                                    borderColor={COLORS.borderColor}
                                    borderRadius="4px"
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                    bg="white"
                                    cursor="pointer"
                                    _hover={{ bg: COLORS.bgSecondary }}
                                    onClick={() =>
                                        setIsShareLinkDialogOpen(false)
                                    }
                                >
                                    关闭
                                </Box>
                                <Box
                                    as="button"
                                    px={4}
                                    py={2}
                                    bg={COLORS.primary}
                                    borderRadius="4px"
                                    fontSize="14px"
                                    color="white"
                                    cursor="pointer"
                                    _hover={{ opacity: 0.9 }}
                                    onClick={handleCopyLink}
                                >
                                    复制链接
                                </Box>
                            </Flex>
                        </VStack>
                    </DialogBody>
                </DialogContent>
            </DialogRoot>

            {/* Edit Task Modal */}
            <EditTaskModal
                isOpen={isEditTaskModalOpen}
                onClose={() => setIsEditTaskModalOpen(false)}
                taskId={reviewId}
                taskData={{
                    title: review?.title,
                    personTags: review?.personTags || [],
                    selectedTagIds: [],
                    isPaused: (review as any)?.isPaused || false,
                    endDate: review?.endTime,
                    participantCount: review?.maxParticipants || 0,
                }}
                onSuccess={() => {
                    void refetch();
                }}
            />
        </Box>
    );
}
