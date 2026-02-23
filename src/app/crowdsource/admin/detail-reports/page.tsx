'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Flex,
    Text,
    Button,
    VStack,
    Input,
    HStack,
    Image,
    Icon,
    Spinner,
    Center,
    Grid,
} from '@chakra-ui/react';
import { ChevronDown, ChevronLeft, ChevronRight, Bug, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FiAlignJustify } from 'react-icons/fi';
import { api } from '@/trpc/react';
import { toaster } from '@/app/_components/ui/toaster';
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
};

interface UserDetail {
    id: number;
    name: string;
    registrationTime: string;
    lastLoginTime: string;
    profileComplete: string;
    projectCount: number;
    defectSuggestionCount: number;
    totalPoints: number;
    availablePoints: number;
}

interface TaskDetail {
    id: number;
    taskNumber: string;
    taskName: string;
    publishTime: string;
    caseCount: number;
    participantCount: number;
    defectSuggestionCount: number;
    points: number;
}

interface OrderDetail {
    id: number;
    name: string;
    organization: string;
    phone: string;
    receiveTime: string;
    defectSuggestionCount: number;
    critical: number;
    severe: number;
    general1: number;
    general2: number;
}

interface Attachment {
    id: string;
    url: string;
    isVideo?: boolean;
}

interface DefectDetail {
    id: number;
    defectNumber: string;
    taskName: string;
    submitter: string;
    submitTime: string;
    statusCode?: string; // 添加原始状态码
    status: string;
    type?: string; // 缺陷类型 BUG 或 SUGGESTION
    severity?: string; // BUG 等级
    suggestionLevel?: string; // 建议等级
    title: string;
    description: string;
    points: number;
    duplicateCount: number;
    testCase: string;
    relatedSteps: string;
    reviewComment: string;
    supplement: string;
    deviceModel: string;
    osVersion: string;
    attachments: string[]; // 添加附件字段
}

interface PointsDetail {
    id: number;
    userName: string;
    organization: string;
    phone: string;
    taskNumber: string;
    taskName: string;
    pointsAmount: number;
    pointsType: string;
    earnTime: string;
}

interface PointsExchangeDetail {
    id: number;
    userName: string;
    organization: string;
    phone: string;
    pointsUsed: number;
    exchangeTime: string;
    exchangeStatus: string;
}

interface InvitationRewardDetail {
    id: number;
    inviterName: string;
    inviterOrganization: string;
    inviterPhone: string;
    inviteeName: string;
    inviteeOrganization: string;
    inviteePhone: string;
    activityName: string;
    inviteeAcceptedTask: string;
    inviteeSubmittedDefects: string;
}

export default function DetailReportsPage() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [activeTab, setActiveTab] = useState(0);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [taskType, setTaskType] = useState('');
    const [taskNumber, setTaskNumber] = useState('');
    const [orderStartDate, setOrderStartDate] = useState('');
    const [orderEndDate, setOrderEndDate] = useState('');
    const [defectType, setDefectType] = useState<string>('');
    const [defectStartDate, setDefectStartDate] = useState('');
    const [defectEndDate, setDefectEndDate] = useState('');
    const [pointsExchangeStartDate, setPointsExchangeStartDate] = useState('');
    const [pointsExchangeEndDate, setPointsExchangeEndDate] = useState('');
    const [invitationActivity, setInvitationActivity] = useState('');
    const [invitationInviter, setInvitationInviter] = useState('');
    const [invitationStartDate, setInvitationStartDate] = useState('');
    const [invitationEndDate, setInvitationEndDate] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isStepsOpen, setIsStepsOpen] = useState(false);
    const [currentSteps, setCurrentSteps] = useState<string[]>([]);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [duplicateItems, setDuplicateItems] = useState<any[]>([]);
    const [selectedDefectForDuplicate, setSelectedDefectForDuplicate] = useState<any>(null);

    // 获取数据字典
    const { data: defectSeverityDict } =
        api.dataDictionary.getByCode.useQuery('DEFECT_SEVERITY');
    const { data: suggestionLevelDict } =
        api.dataDictionary.getByCode.useQuery('SUGGESTION_LEVEL');

    // 获取关联重复缺陷详情
    const { data: duplicateGroupData, isLoading, error } = 
        api.defect.getDuplicateGroupDetail.useQuery(
            { groupId: selectedDefectForDuplicate?.duplicateGroupId || '' },
            {
                enabled: isDuplicateModalOpen && !!selectedDefectForDuplicate?.duplicateGroupId,
            }
        );

    console.log('当前状态:', {
        isDuplicateModalOpen,
        selectedDefectForDuplicate,
        duplicateGroupId: selectedDefectForDuplicate?.duplicateGroupId,
        duplicateGroupData,
        isLoading,
        error
    });

    // 处理附件预览
    const handlePreviewAttachment = (attachment: Attachment) => {
        setPreviewUrl(attachment.url);
        setPreviewType(attachment.isVideo ? 'video' : 'image');
        setIsPreviewOpen(true);
    };

    // 处理查看步骤详情
    const handleViewSteps = (steps: string[]) => {
        setCurrentSteps(steps);
        setIsStepsOpen(true);
    };

    // 关闭步骤详情弹窗
    const handleCloseSteps = () => {
        setIsStepsOpen(false);
        setCurrentSteps([]);
    };

    // 处理查看关联重复
    const handleViewDuplicate = async (defect: any) => {
        setSelectedDefectForDuplicate(defect);
        // 如果没有关联重复，直接打开空弹窗
        if (!defect.duplicateGroupId || defect.duplicateCount === 0) {
            setDuplicateItems([]);
            setIsDuplicateModalOpen(true);
        }
        // 有关联重复的话，数据将通过duplicateGroupData自动获取
    };

    // 监听duplicateGroupData变化，更新duplicateItems
    useEffect(() => {
        if (duplicateGroupData?.duplicateDefects && duplicateGroupData.duplicateDefects.length > 0) {
            const items = duplicateGroupData.duplicateDefects.map((defect: any) => ({
                id: defect.id,
                number: defect.id.substring(0, 10),
                points: defect.earnedPoints || 0,
                type: defect.type === 'BUG' ? 'defect' : 'suggestion',
                title: defect.title || '未设置',
                description: defect.description || '',
                status: defect.status,
                severity: defect.severity,
                suggestionLevel: defect.suggestionLevel,
                attachments: defect.attachments || [],
                caseName: defect.testCase?.title || '未设置',
                relatedSteps: defect.steps || '',
                reviewComment: defect.reviewComment || '',
                supplementaryExplanation: defect.supplementaryExplanation || '',
                deviceModel: defect.deviceModel || '未设置',
                system: defect.osVersion || '未设置',
                submitter: defect.submitter?.name || '未设置',
                submitTime: defect.createdAt ? new Date(defect.createdAt).toLocaleString() : '未设置'
            }));
            setDuplicateItems(items);
            setIsDuplicateModalOpen(true);
        }
    }, [duplicateGroupData]);

    // 关闭关联重复弹窗
    const handleCloseDuplicateModal = () => {
        setIsDuplicateModalOpen(false);
        setDuplicateItems([]);
        setSelectedDefectForDuplicate(null);
    };

    // 处理全部下载
    const handleDownloadAllAttachments = async (attachments: string[]) => {
        for (const url of attachments) {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = url.split('/').pop() || 'attachment';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
                // 添加延迟避免浏览器阻止多个下载
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error('Download failed:', error);
            }
        }
    };

    // API integration for user details tab
    const {
        data: userDetailsData,
        isLoading: isLoadingUserDetails,
        refetch: refetchUserDetails,
    } = api.reports.getUserDetails.useQuery(
        {
            page: currentPage,
            pageSize,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        },
        {
            enabled: activeTab === 0,
        }
    );

    const { refetch: exportUserDetails } =
        api.reports.exportUserDetails.useQuery(
            {
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            },
            {
                enabled: false,
            }
        );

    // API integration for task details tab
    const {
        data: taskDetailsData,
        isLoading: isLoadingTaskDetails,
        refetch: refetchTaskDetails,
    } = api.reports.getTaskDetails.useQuery(
        {
            page: currentPage,
            pageSize,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        },
        {
            enabled: activeTab === 1,
        }
    );

    const { refetch: exportTaskDetails } =
        api.reports.exportTaskDetails.useQuery(
            {
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            },
            {
                enabled: false,
            }
        );

    // API integration for order details tab
    const {
        data: orderDetailsData,
        isLoading: isLoadingOrderDetails,
        refetch: refetchOrderDetails,
    } = api.reports.getOrderDetails.useQuery(
        {
            page: currentPage,
            pageSize,
            startDate: orderStartDate || undefined,
            endDate: orderEndDate || undefined,
        },
        {
            enabled: activeTab === 2,
        }
    );

    const { refetch: exportOrderDetails } =
        api.reports.exportOrderDetails.useQuery(
            {
                startDate: orderStartDate || undefined,
                endDate: orderEndDate || undefined,
            },
            {
                enabled: false,
            }
        );

    // API integration for defect details tab
    const {
        data: defectDetailsData,
        isLoading: isLoadingDefectDetails,
        refetch: refetchDefectDetails,
    } = api.reports.getDefectDetails.useQuery(
        {
            page: currentPage,
            pageSize,
            startDate: defectStartDate || undefined,
            endDate: defectEndDate || undefined,
            defectType: defectType
                ? (defectType as 'BUG' | 'SUGGESTION')
                : undefined,
        },
        {
            enabled: activeTab === 3,
        }
    );

    const { refetch: exportDefectDetails } =
        api.reports.exportDefectDetails.useQuery(
            {
                startDate: defectStartDate || undefined,
                endDate: defectEndDate || undefined,
                defectType: defectType as 'BUG' | 'SUGGESTION' | undefined,
            },
            {
                enabled: false,
            }
        );

    // API integration for points details tab
    const {
        data: pointsDetailsData,
        isLoading: isLoadingPointsDetails,
        refetch: refetchPointsDetails,
    } = api.reports.getPointsDetails.useQuery(
        {
            page: currentPage,
            pageSize,
            startDate: pointsExchangeStartDate || undefined,
            endDate: pointsExchangeEndDate || undefined,
        },
        {
            enabled: activeTab === 4,
        }
    );

    const { refetch: exportPointsDetails } =
        api.reports.exportPointsDetails.useQuery(
            {
                startDate: pointsExchangeStartDate || undefined,
                endDate: pointsExchangeEndDate || undefined,
            },
            {
                enabled: false,
            }
        );

    // API integration for points exchange details tab
    const {
        data: pointsExchangeDetailsData,
        isLoading: isLoadingPointsExchangeDetails,
        refetch: refetchPointsExchangeDetails,
    } = api.reports.getPointsExchangeDetails.useQuery(
        {
            page: currentPage,
            pageSize,
            startDate: pointsExchangeStartDate || undefined,
            endDate: pointsExchangeEndDate || undefined,
        },
        {
            enabled: activeTab === 5,
        }
    );

    const { refetch: exportPointsExchangeDetails } =
        api.reports.exportPointsExchangeDetails.useQuery(
            {
                startDate: pointsExchangeStartDate || undefined,
                endDate: pointsExchangeEndDate || undefined,
            },
            {
                enabled: false,
            }
        );

    // API integration for invitation reward details tab
    const {
        data: invitationDetailsData,
        isLoading: isLoadingInvitationDetails,
        refetch: refetchInvitationDetails,
    } = api.reports.getInvitationRewardDetails.useQuery(
        {
            page: currentPage,
            pageSize,
            activityId: invitationActivity || undefined,
            inviterKeyword: invitationInviter || undefined,
            startDate: invitationStartDate || undefined,
            endDate: invitationEndDate || undefined,
        },
        {
            enabled: activeTab === 6,
        }
    );

    // 获取邀请活动列表
    const { data: invitationActivities } = api.reports.getInvitationActivities.useQuery();

    const { refetch: exportInvitationDetails } =
        api.reports.exportInvitationRewardDetails.useQuery(
            {
                activityId: invitationActivity || undefined,
                inviterKeyword: invitationInviter || undefined,
                startDate: invitationStartDate || undefined,
                endDate: invitationEndDate || undefined,
            },
            {
                enabled: false,
            }
        );

    // Mock data for all tabs
    const userMockData: UserDetail[] = [
        {
            id: 1,
            name: '张三',
            registrationTime: '2024-09-19 12:23:00',
            lastLoginTime: '2024-09-19 12:23:00',
            profileComplete: '是',
            projectCount: 30,
            defectSuggestionCount: 20,
            totalPoints: 30,
            availablePoints: 30,
        },
        {
            id: 2,
            name: '李四',
            registrationTime: '2024-09-19 12:23:00',
            lastLoginTime: '2024-09-19 12:23:00',
            profileComplete: '是',
            projectCount: 30,
            defectSuggestionCount: 30,
            totalPoints: 30,
            availablePoints: 30,
        },
    ];

    const taskMockData: TaskDetail[] = [
        {
            id: 1,
            taskNumber: '1234567890',
            taskName: '广发众测某任务',
            publishTime: '2024-09-16 12:32:00',
            caseCount: 5,
            participantCount: 200,
            defectSuggestionCount: 300,
            points: 300,
        },
        {
            id: 2,
            taskNumber: '1234567890',
            taskName: '广发众测某任务',
            publishTime: '2024-09-16 12:32:00',
            caseCount: 5,
            participantCount: 200,
            defectSuggestionCount: 300,
            points: 300,
        },
    ];

    const orderMockData: OrderDetail[] = [
        {
            id: 1,
            name: '张三',
            organization: '某某机构',
            phone: '14028019209',
            receiveTime: '2024-09-15 12:32:00',
            defectSuggestionCount: 300,
            critical: 20,
            severe: 20,
            general1: 20,
            general2: 20,
        },
        {
            id: 2,
            name: '张三',
            organization: '某某机构',
            phone: '14028019209',
            receiveTime: '2024-09-15 12:32:00',
            defectSuggestionCount: 300,
            critical: 30,
            severe: 20,
            general1: 20,
            general2: 20,
        },
    ];

    const defectMockData: DefectDetail[] = [
        {
            id: 1,
            defectNumber: 'O1234567890',
            taskName: '广发众测某任务',
            title: '登录页输入账号显示空白',
            description:
                '前提：已注册账号\n执行步骤：1、登录界面，2、输入密码\n预期结果：输入的密码黑点显示',
            points: 300,
            duplicateCount: 5,
            severity: '轻微',
            status: '已提交',
            testCase: '黄金积存-个人网银用例',
            relatedSteps: '步骤一、步骤二、步骤三、步骤四',
            reviewComment: '',
            supplement: '',
            deviceModel: 'Redmi M2006C3LC',
            osVersion: 'Android 11(720 x1600)',
            submitter: '张三',
            submitTime: '2024-09-12 24:32:00',
            attachments: [
                '/api/uploads/defects/2d9fc44e-5e4f-425e-9e04-b7a1a9422148.jpg',
                '/api/uploads/defects/26598fa9-ef9b-4f42-b64d-102bf7829b07.mp4'
            ],
        },
        {
            id: 2,
            defectNumber: 'O1234567891',
            taskName: '广发众测某任务',
            title: '登录页输入账号显示空白',
            description:
                '前提：已注册账号\n执行步骤：1、登录界面，2、输入密码\n预期结果：输入的密码黑点显示',
            points: 300,
            duplicateCount: 5,
            severity: '轻微',
            status: '已提交',
            testCase: '黄金积存-个人网银用例',
            relatedSteps: '步骤一、步骤二、步骤三、步骤四',
            reviewComment: '',
            supplement: '',
            deviceModel: 'Redmi M2006C3LC',
            osVersion: 'Android 11(720 x1600)',
            submitter: '张三',
            submitTime: '2024-09-12 24:32:00',
            attachments: [
                '/api/uploads/defects/3378010a-0ea6-41df-84c8-1c848f5ceffd.mp4'
            ],
        },
    ];

    const pointsMockData: PointsDetail[] = [
        {
            id: 1,
            userName: '张三',
            organization: '某某机构',
            phone: '14028019209',
            taskNumber: '1234567890',
            taskName: '广发众测某任务',
            pointsAmount: 20,
            pointsType: '推荐有奖',
            earnTime: '2024-09-15 12:30:20',
        },
        {
            id: 2,
            userName: '张三',
            organization: '某某机构',
            phone: '14028019209',
            taskNumber: '1234567890',
            taskName: '广发众测某任务',
            pointsAmount: 30,
            pointsType: '推荐有奖',
            earnTime: '2024-09-15 12:30:20',
        },
    ];

    const pointsExchangeMockData: PointsExchangeDetail[] = [
        {
            id: 1,
            userName: '张三',
            organization: '某某机构',
            phone: '14028019209',
            pointsUsed: 500,
            exchangeTime: '2024-09-16 12:32:00',
            exchangeStatus: '已完成',
        },
        {
            id: 2,
            userName: '李四',
            organization: '某某机构',
            phone: '14028019209',
            pointsUsed: 300,
            exchangeTime: '2024-09-16 12:32:00',
            exchangeStatus: '处理中',
        },
    ];

    const invitationMockData: InvitationRewardDetail[] = [
        {
            id: 1,
            inviterName: '张三',
            inviterOrganization: '某某机构',
            inviterPhone: '15028190290',
            inviteeName: '李四',
            inviteeOrganization: '某某机构',
            inviteePhone: '15028190290',
            activityName: '2024第一期',
            inviteeAcceptedTask: '是',
            inviteeSubmittedDefects: '是',
        },
        {
            id: 2,
            inviterName: '张三',
            inviterOrganization: '某某机构',
            inviterPhone: '15028190290',
            inviteeName: '李四',
            inviteeOrganization: '某某机构',
            inviteePhone: '15028190290',
            activityName: '2024第一期',
            inviteeAcceptedTask: '否',
            inviteeSubmittedDefects: '否',
        },
    ];

    // Get current data based on active tab
    const getCurrentData = () => {
        switch (activeTab) {
            case 0:
                return userDetailsData?.data || [];
            case 1:
                return taskDetailsData?.data || [];
            case 2:
                return orderDetailsData?.data || [];
            case 3:
                return defectDetailsData?.data || [];
            case 4:
                return pointsDetailsData?.data || [];
            case 5:
                return pointsExchangeDetailsData?.data || [];
            case 6:
                return invitationDetailsData?.data || [];
            default:
                return userDetailsData?.data || [];
        }
    };

    const currentData = getCurrentData();
    const totalPages =
        activeTab === 0
            ? userDetailsData?.totalPages || 0
            : activeTab === 1
              ? taskDetailsData?.totalPages || 0
              : activeTab === 2
                ? orderDetailsData?.totalPages || 0
                : activeTab === 3
                  ? defectDetailsData?.totalPages || 0
                  : activeTab === 4
                    ? pointsDetailsData?.totalPages || 0
                    : activeTab === 5
                      ? pointsExchangeDetailsData?.totalPages || 0
                      : activeTab === 6
                        ? invitationDetailsData?.totalPages || 0
                        : Math.ceil(currentData.length / pageSize);
    const paginatedData =
        activeTab === 0 ||
        activeTab === 1 ||
        activeTab === 2 ||
        activeTab === 3 ||
        activeTab === 4 ||
        activeTab === 5 ||
        activeTab === 6
            ? currentData
            : currentData.slice(
                  (currentPage - 1) * pageSize,
                  currentPage * pageSize
              );

    const handleExport = async () => {
        if (activeTab === 0) {
            try {
                const result = await exportUserDetails();

                if (result.data) {
                    const ws = XLSX.utils.json_to_sheet(result.data);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, '用户明细');
                    XLSX.writeFile(
                        wb,
                        `用户明细_${new Date().toLocaleDateString()}.xlsx`
                    );

                    toaster.create({
                        title: '导出成功',
                        type: 'success',
                        duration: 3000,
                    });
                }
            } catch (error) {
                toaster.create({
                    title: '导出失败',
                    description:
                        error instanceof Error ? error.message : '未知错误',
                    type: 'error',
                    duration: 3000,
                });
            }
        } else if (activeTab === 1) {
            try {
                const result = await exportTaskDetails();

                if (result.data) {
                    const ws = XLSX.utils.json_to_sheet(result.data);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, '任务明细');
                    XLSX.writeFile(
                        wb,
                        `任务明细_${new Date().toLocaleDateString()}.xlsx`
                    );

                    toaster.create({
                        title: '导出成功',
                        type: 'success',
                        duration: 3000,
                    });
                }
            } catch (error) {
                toaster.create({
                    title: '导出失败',
                    description:
                        error instanceof Error ? error.message : '未知错误',
                    type: 'error',
                    duration: 3000,
                });
            }
        } else if (activeTab === 2) {
            try {
                const result = await exportOrderDetails();

                if (result.data) {
                    const ws = XLSX.utils.json_to_sheet(result.data);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, '订单明细');
                    XLSX.writeFile(
                        wb,
                        `订单明细_${new Date().toLocaleDateString()}.xlsx`
                    );

                    toaster.create({
                        title: '导出成功',
                        type: 'success',
                        duration: 3000,
                    });
                }
            } catch (error) {
                toaster.create({
                    title: '导出失败',
                    description:
                        error instanceof Error ? error.message : '未知错误',
                    type: 'error',
                    duration: 3000,
                });
            }
        } else if (activeTab === 3) {
            try {
                const result = await exportDefectDetails();

                if (result.data) {
                    const ws = XLSX.utils.json_to_sheet(result.data);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, '缺陷明细');
                    XLSX.writeFile(
                        wb,
                        `缺陷明细_${new Date().toLocaleDateString()}.xlsx`
                    );

                    toaster.create({
                        title: '导出成功',
                        type: 'success',
                        duration: 3000,
                    });
                }
            } catch (error) {
                toaster.create({
                    title: '导出失败',
                    description:
                        error instanceof Error ? error.message : '未知错误',
                    type: 'error',
                    duration: 3000,
                });
            }
        } else if (activeTab === 4) {
            try {
                const result = await exportPointsDetails();

                if (result.data) {
                    const ws = XLSX.utils.json_to_sheet(result.data);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, '积分明细');
                    XLSX.writeFile(
                        wb,
                        `积分明细_${new Date().toLocaleDateString()}.xlsx`
                    );

                    toaster.create({
                        title: '导出成功',
                        type: 'success',
                        duration: 3000,
                    });
                }
            } catch (error) {
                toaster.create({
                    title: '导出失败',
                    description:
                        error instanceof Error ? error.message : '未知错误',
                    type: 'error',
                    duration: 3000,
                });
            }
        } else if (activeTab === 5) {
            try {
                const result = await exportPointsExchangeDetails();

                if (result.data) {
                    const ws = XLSX.utils.json_to_sheet(result.data);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, '积分兑换明细');
                    XLSX.writeFile(
                        wb,
                        `积分兑换明细_${new Date().toLocaleDateString()}.xlsx`
                    );

                    toaster.create({
                        title: '导出成功',
                        type: 'success',
                        duration: 3000,
                    });
                }
            } catch (error) {
                toaster.create({
                    title: '导出失败',
                    description:
                        error instanceof Error ? error.message : '未知错误',
                    type: 'error',
                    duration: 3000,
                });
            }
        } else if (activeTab === 6) {
            try {
                const result = await exportInvitationDetails();

                if (result.data) {
                    const ws = XLSX.utils.json_to_sheet(result.data);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, '邀请有奖明细');
                    XLSX.writeFile(
                        wb,
                        `邀请有奖明细_${new Date().toLocaleDateString()}.xlsx`
                    );

                    toaster.create({
                        title: '导出成功',
                        type: 'success',
                        duration: 3000,
                    });
                }
            } catch (error) {
                toaster.create({
                    title: '导出失败',
                    description:
                        error instanceof Error ? error.message : '未知错误',
                    type: 'error',
                    duration: 3000,
                });
            }
        } else {
            console.log('Exporting report...');
        }
    };

    const handleQuery = () => {
        setCurrentPage(1);
        if (activeTab === 0) {
            void refetchUserDetails();
        } else if (activeTab === 1) {
            void refetchTaskDetails();
        } else if (activeTab === 2) {
            void refetchOrderDetails();
        } else if (activeTab === 3) {
            void refetchDefectDetails();
        } else if (activeTab === 4) {
            void refetchPointsDetails();
        } else if (activeTab === 5) {
            void refetchPointsExchangeDetails();
        } else if (activeTab === 6) {
            void refetchInvitationDetails();
        }
    };

    const handleReset = () => {
        setStartDate('');
        setEndDate('');
        setTaskType('');
        setTaskNumber('');
        setOrderStartDate('');
        setOrderEndDate('');
        setDefectType('');
        setDefectStartDate('');
        setDefectEndDate('');
        setPointsExchangeStartDate('');
        setPointsExchangeEndDate('');
        setInvitationActivity('');
        setInvitationInviter('');
        setInvitationStartDate('');
        setInvitationEndDate('');
        setCurrentPage(1);
    };

    const tabs = [
        '用户明细',
        '任务明细',
        '订单明细',
        '缺陷明细',
        '积分明细',
        '积分兑换明细',
        '邀请有奖明细',
    ];

    // 获取缺陷状态 Badge 样式和文本（参考审核页面）
    const getStatusBadgeStyle = (row: any) => {
        const statusCode = row.statusCode;
        
        // 如果状态是待确认或判定中，显示状态标签
        if (statusCode === 'TO_CONFIRM' || statusCode === 'TO_CONFIRM_DEV') {
            return {
                text: '待确认',
                bg: 'rgba(255, 125, 0, 0.1)',
                color: '#FF7D00',
            };
        }
        if (statusCode === 'REVIEWING') {
            return {
                text: '判定中',
                bg: 'rgba(22, 93, 255, 0.1)',
                color: '#2067F6',
            };
        }
        // 如果状态是已驳回（无效），显示无效标签
        if (statusCode === 'REJECTED') {
            return {
                text: '无效',
                bg: 'rgba(134, 144, 156, 0.1)',
                color: '#86909C',
            };
        }
        // 如果状态是重复，显示重复标签
        if (statusCode === 'DUPLICATE') {
            return {
                text: '重复',
                bg: 'rgba(134, 144, 156, 0.1)',
                color: '#86909C',
            };
        }
        // 如果状态是已关闭，显示关闭标签
        if (statusCode === 'CLOSED') {
            return {
                text: '已关闭',
                bg: 'rgba(134, 144, 156, 0.1)',
                color: '#86909C',
            };
        }
        // 只有在已批准状态下才显示等级标签
        if (statusCode === 'APPROVED') {
            if (row.type === 'BUG' && row.severity) {
                // 通过数据字典获取等级标签
                const severityItem = defectSeverityDict?.items?.find(
                    (i: any) => i.code === row.severity
                );
                const levelLabel = severityItem?.label || row.severity;
                
                // 根据等级调整颜色
                const colorMap: Record<string, { bg: string; color: string }> = {
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
                const colorConfig = colorMap[row.severity] || {
                    bg: 'rgba(255, 125, 0, 0.1)',
                    color: '#F77234',
                };
                return { text: levelLabel, ...colorConfig };
            } else if (row.type === 'SUGGESTION' && row.suggestionLevel) {
                // 通过数据字典获取建议等级标签
                const suggestionItem = suggestionLevelDict?.items?.find(
                    (i: any) => i.code === row.suggestionLevel
                );
                const levelLabel = suggestionItem?.label || row.suggestionLevel;
                
                return {
                    text: levelLabel,
                    bg: 'rgba(0, 180, 42, 0.1)',
                    color: '#3AB385',
                };
            }
        }
        return { text: '', bg: '', color: '' };
    };

    // Render table headers based on active tab
    const renderTableHeaders = () => {
        const headerStyle = {
            textAlign: 'left' as const,
            padding: '12px 16px',
            borderBottom: `1px solid ${COLORS.borderColor}`,
            fontWeight: 500,
            color: COLORS.textPrimary,
        };

        switch (activeTab) {
            case 0: // 用户明细
                return (
                    <>
                        <th style={{ ...headerStyle, width: '50px' }}>序号</th>
                        <th style={{ ...headerStyle, width: '100px' }}>姓名</th>
                        <th style={{ ...headerStyle, width: '150px' }}>
                            注册时间
                        </th>
                        <th style={{ ...headerStyle, width: '150px' }}>
                            最后一次登录
                        </th>
                        <th style={{ ...headerStyle, width: '80px' }}>
                            资料是否完善
                        </th>
                        <th style={{ ...headerStyle, width: '80px' }}>
                            参与项目
                        </th>
                        <th style={{ ...headerStyle, width: '120px' }}>
                            提交缺陷/建议
                        </th>
                        <th style={{ ...headerStyle, width: '80px' }}>
                            总积分
                        </th>
                        <th style={{ ...headerStyle, width: '80px' }}>
                            可用积分
                        </th>
                    </>
                );
            case 1: // 任务明细
                return (
                    <>
                        <th style={{ ...headerStyle, width: '50px' }}>序号</th>
                        <th style={{ ...headerStyle, width: '120px' }}>
                            任务编号
                        </th>
                        <th style={{ ...headerStyle, width: '150px' }}>
                            任务名称
                        </th>
                        <th style={{ ...headerStyle, width: '150px' }}>
                            发布时间
                        </th>
                        <th style={{ ...headerStyle, width: '80px' }}>
                            用例数量
                        </th>
                        <th style={{ ...headerStyle, width: '80px' }}>
                            参测人数
                        </th>
                        <th style={{ ...headerStyle, width: '120px' }}>
                            缺陷/建议
                        </th>
                        <th style={{ ...headerStyle, width: '80px' }}>积分</th>
                    </>
                );
            case 2: // 订单明细
                return (
                    <>
                        <th style={{ ...headerStyle, width: '50px' }}>序号</th>
                        <th style={{ ...headerStyle, width: '100px' }}>姓名</th>
                        <th style={{ ...headerStyle, width: '120px' }}>
                            所属机构
                        </th>
                        <th style={{ ...headerStyle, width: '140px' }}>
                            手机号
                        </th>
                        <th style={{ ...headerStyle, width: '170px' }}>
                            领取时间
                        </th>
                        <th style={{ ...headerStyle, width: '160px' }}>
                            提交问题/建议数
                        </th>
                        <th style={{ ...headerStyle, width: '80px' }}>致命</th>
                        <th style={{ ...headerStyle, width: '80px' }}>严重</th>
                        <th style={{ ...headerStyle, width: '80px' }}>一般</th>
                        <th style={{ ...headerStyle, width: '80px' }}>一般</th>
                    </>
                );
            case 3: // 缺陷明细
                return (
                    <>
                        <th style={{ ...headerStyle, width: '50px' }}>序号</th>
                        <th style={{ ...headerStyle, width: '120px' }}>
                            缺陷编号
                        </th>
                        <th style={{ ...headerStyle, width: '150px' }}>
                            任务名称
                        </th>
                        <th style={{ ...headerStyle, width: '100px' }}>
                            提交人
                        </th>
                        <th style={{ ...headerStyle, width: '150px' }}>
                            提交时间
                        </th>
                        <th style={{ ...headerStyle, width: '80px' }}>
                            缺陷状态
                        </th>
                        <th style={{ ...headerStyle, width: '80px' }}>
                            严重程度
                        </th>
                    </>
                );
            case 4: // 积分明细
                return (
                    <>
                        <th style={{ ...headerStyle, width: '50px' }}>序号</th>
                        <th style={{ ...headerStyle, width: '60px' }}>姓名</th>
                        <th style={{ ...headerStyle, width: '120px' }}>
                            所属机构
                        </th>
                        <th style={{ ...headerStyle, width: '140px' }}>
                            手机号
                        </th>
                        <th style={{ ...headerStyle, width: '110px' }}>
                            任务编号
                        </th>
                        <th style={{ ...headerStyle, width: '160px' }}>
                            任务名称
                        </th>
                        <th style={{ ...headerStyle, width: '70px' }}>积分</th>
                        <th style={{ ...headerStyle, width: '140px' }}>
                            积分奖励类型
                        </th>
                        <th style={{ ...headerStyle, width: '140px' }}>
                            发放时间
                        </th>
                    </>
                );
            case 5: // 积分兑换明细
                return (
                    <>
                        <th style={{ ...headerStyle, width: '50px' }}>序号</th>
                        <th style={{ ...headerStyle, width: '60px' }}>姓名</th>
                        <th style={{ ...headerStyle, width: '120px' }}>
                            所属机构
                        </th>
                        <th style={{ ...headerStyle, width: '140px' }}>
                            手机号
                        </th>
                        <th style={{ ...headerStyle, width: '110px' }}>
                            积分数
                        </th>
                        <th style={{ ...headerStyle, width: '180px' }}>
                            兑换时间
                        </th>
                        <th style={{ ...headerStyle, width: '110px' }}>
                            兑换状态
                        </th>
                    </>
                );
            case 6: // 邀请有奖明细
                return (
                    <>
                        <th style={{ ...headerStyle, width: '50px' }}>序号</th>
                        <th style={{ ...headerStyle, width: '80px' }}>
                            推荐人姓名
                        </th>
                        <th style={{ ...headerStyle, width: '110px' }}>
                            推荐人所属机构
                        </th>
                        <th style={{ ...headerStyle, width: '120px' }}>
                            推荐人手机号
                        </th>
                        <th style={{ ...headerStyle, width: '110px' }}>
                            被推荐人姓名
                        </th>
                        <th style={{ ...headerStyle, width: '80px' }}>
                            被推荐人所属机构
                        </th>
                        <th style={{ ...headerStyle, width: '120px' }}>
                            被推荐人手机号
                        </th>
                        <th style={{ ...headerStyle, width: '100px' }}>
                            活动名称
                        </th>
                        <th style={{ ...headerStyle, width: '130px' }}>
                            被推荐人是否领取了任务
                        </th>
                        <th style={{ ...headerStyle, width: '130px' }}>
                            被推荐人是否提报了有效缺陷
                        </th>
                    </>
                );
            default:
                return null;
        }
    };

    // Render defect detail cards
    const renderDefectCards = () => {
        return paginatedData.map((row: any, index: number) => (
            <Box
                key={row.id}
                bg="white"
                borderRadius="lg"
                overflow="hidden"
                borderBottom="1px solid"
                borderColor="#E5E6EB"
                mb={4}
            >
                {/* Header */}
                <Flex
                    align="center"
                    px={6}
                    py={4}
                    bg="#f2f3f5"
                    gap={6}
                >
                    <Text
                        fontSize="14px"
                        color="#1D2129"
                        fontWeight="500"
                        w="30px"
                    >
                        {(currentPage - 1) * pageSize + index + 1}
                    </Text>
                    <Text
                        fontSize="14px"
                        color="#1D2129"
                        fontWeight="500"
                        w="120px"
                    >
                        {row.defectNumber}
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
                            {row.points}
                        </Text>
                        <Image
                            src="/images/task-hall/jinbi.png"
                            alt="积分"
                            w="16px"
                            h="16px"
                        />
                    </HStack>

                    {row.duplicateCount >= 0 && (
                        <HStack gap={2} w="auto" minW="160px">
                            <Text
                                fontSize="14px"
                                fontWeight="500"
                                color="#E31424"
                                cursor="pointer"
                                _hover={{ textDecoration: "underline" }}
                                onClick={() => {
                                    handleViewDuplicate(row);
                                }}
                            >
                                关联重复：{row.duplicateCount}
                            </Text>
                        </HStack>
                    )}

                    <HStack gap={2} w="auto">
                        <Icon
                            color="#165DFF"
                            ml={4}
                        >
                            <Bug size={16} />
                        </Icon>
                        <Text
                            fontSize="14px"
                            color="#1D2129"
                        >
                            缺陷
                        </Text>
                    </HStack>

                    <Box
                        ml="auto"
                        px={3}
                        py={1}
                        borderRadius="12px"
                        bg={getStatusBadgeStyle(row).bg}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        minW="80px"
                    >
                        <Text
                            fontSize="14px"
                            color={getStatusBadgeStyle(row).color}
                            fontWeight="500"
                        >
                            {getStatusBadgeStyle(row).text}
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
                                    {row.title}
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
                                    {row.description}
                                </Text>
                            </HStack>
                            {row.attachments && row.attachments.length > 0 && (
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
                                            onClick={() => handleDownloadAllAttachments(row.attachments || [])}
                                        >
                                            <Icon as={ChevronDown} boxSize={4} />
                                            <Text fontSize="12px">
                                                全部下载
                                            </Text>
                                        </HStack>
                                    </Flex>
                                    <Flex
                                        gap="12px"
                                        wrap="wrap"
                                    >
                                        {row.attachments.map((attachmentUrl: string, index: number) => {
                                            const isVideo = attachmentUrl.includes('.mp4') || 
                                                           attachmentUrl.includes('.mov') || 
                                                           attachmentUrl.includes('.avi');
                                            const attachment: Attachment = {
                                                id: `${row.id}-${index}`,
                                                url: attachmentUrl,
                                                isVideo
                                            };
                                            return (
                                                <Box
                                                    key={attachment.id}
                                                    w="95px"
                                                    h="95px"
                                                    borderRadius="4px"
                                                    overflow="hidden"
                                                    position="relative"
                                                    cursor="pointer"
                                                    onClick={() => handlePreviewAttachment(attachment)}
                                                >
                                                    {attachment.isVideo ? (
                                                        <>
                                                            <video
                                                                src={attachment.url}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                    pointerEvents: 'none',
                                                                }}
                                                            />
                                                            <Center
                                                                position="absolute"
                                                                top={0}
                                                                left={0}
                                                                right={0}
                                                                bottom={0}
                                                                bg="blackAlpha.400"
                                                            >
                                                                <Icon color="white">
                                                                    <Play
                                                                        size={20}
                                                                        fill="white"
                                                                    />
                                                                </Icon>
                                                            </Center>
                                                        </>
                                                    ) : (
                                                        <Image
                                                            src={attachment.url}
                                                            alt="附件"
                                                            width="100%"
                                                            height="100%"
                                                            objectFit="cover"
                                                        />
                                                    )}
                                                </Box>
                                            );
                                        })}
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
                                    {row.testCase}
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
                                        {row.relatedSteps || '-'}
                                    </Text>
                                    {row.relatedSteps && row.relatedSteps.trim() !== '' && (
                                        <Text
                                            color="#165DFF"
                                            fontSize="14px"
                                            ml={2}
                                            cursor="pointer"
                                            onClick={() => {
                                                const stepsArray = row.relatedSteps.split(',').map((s: string) => s.trim()).filter((s: string) => s);
                                                handleViewSteps(stepsArray);
                                            }}
                                        >
                                            查看详细
                                        </Text>
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
                                    {row.reviewComment || '-'}
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
                                    {row.supplement || '-'}
                                </Text>
                            </HStack>
                        </VStack>
                    </Box>
                </Grid>

                {/* Device info footer */}
                <Flex
                    gap={8}
                    px={6}
                    py={4}
                    borderTop="1px solid"
                    borderColor="#E5E6EB"
                    bg="#f8f9fa"
                >
                    <HStack gap={2}>
                        <Text fontSize="14px" color="#86909C">
                            机型：
                        </Text>
                        <Text
                            fontSize="14px"
                            fontWeight="500"
                            color="#1D2129"
                        >
                            {row.deviceModel}
                        </Text>
                    </HStack>
                    <HStack gap={2}>
                        <Text fontSize="14px" color="#86909C">
                            系统：
                        </Text>
                        <Text
                            fontSize="14px"
                            fontWeight="500"
                            color="#1D2129"
                        >
                            {row.osVersion}
                        </Text>
                    </HStack>
                    <HStack gap={2}>
                        <Text fontSize="14px" color="#86909C">
                            提交人：
                        </Text>
                        <Text
                            fontSize="14px"
                            fontWeight="500"
                            color="#1D2129"
                        >
                            {row.submitter}
                        </Text>
                    </HStack>
                    <HStack gap={2}>
                        <Text fontSize="14px" color="#86909C">
                            提交时间：
                        </Text>
                        <Text
                            fontSize="14px"
                            fontWeight="500"
                            color="#1D2129"
                        >
                            {row.submitTime}
                        </Text>
                    </HStack>
                </Flex>
            </Box>
        ));
    };

    // Render table rows based on active tab
    const renderTableRows = () => {
        const cellStyle = {
            padding: '8px 16px',
            borderBottom: `1px solid ${COLORS.borderColor}`,
            color: COLORS.textPrimary,
        };

        return paginatedData.map((row: any, index: number) => {
            const rowNum = (currentPage - 1) * pageSize + index + 1;

            switch (activeTab) {
                case 0: // 用户明细
                    return (
                        <tr key={row.id}>
                            <td style={cellStyle}>{rowNum}</td>
                            <td style={cellStyle}>{row.name}</td>
                            <td style={cellStyle}>{row.registrationTime}</td>
                            <td style={cellStyle}>{row.lastLoginTime}</td>
                            <td style={cellStyle}>{row.profileComplete}</td>
                            <td style={cellStyle}>{row.projectCount}</td>
                            <td style={cellStyle}>
                                {row.defectSuggestionCount}
                            </td>
                            <td style={cellStyle}>{row.totalPoints}</td>
                            <td style={cellStyle}>{row.availablePoints}</td>
                        </tr>
                    );
                case 1: // 任务明细
                    return (
                        <tr key={row.id}>
                            <td style={cellStyle}>{rowNum}</td>
                            <td style={cellStyle}>{row.taskNumber}</td>
                            <td style={cellStyle}>{row.taskName}</td>
                            <td style={cellStyle}>{row.publishTime}</td>
                            <td style={cellStyle}>{row.caseCount}</td>
                            <td style={cellStyle}>{row.participantCount}</td>
                            <td style={cellStyle}>
                                {row.defectSuggestionCount}
                            </td>
                            <td style={cellStyle}>{row.points}</td>
                        </tr>
                    );
                case 2: // 订单明细
                    return (
                        <tr key={row.id}>
                            <td style={cellStyle}>{rowNum}</td>
                            <td style={cellStyle}>{row.name}</td>
                            <td style={cellStyle}>{row.organization}</td>
                            <td style={cellStyle}>{row.phone}</td>
                            <td style={cellStyle}>{row.receiveTime}</td>
                            <td style={cellStyle}>
                                {row.defectSuggestionCount}
                            </td>
                            <td style={cellStyle}>{row.critical}</td>
                            <td style={cellStyle}>{row.severe}</td>
                            <td style={cellStyle}>{row.general1}</td>
                            <td style={cellStyle}>{row.general2}</td>
                        </tr>
                    );
                case 3: // 缺陷明细
                    return (
                        <tr key={row.id}>
                            <td style={cellStyle}>{rowNum}</td>
                            <td style={cellStyle}>{row.defectNumber}</td>
                            <td style={cellStyle}>{row.taskName}</td>
                            <td style={cellStyle}>{row.submitter}</td>
                            <td style={cellStyle}>{row.submitTime}</td>
                            <td style={cellStyle}>{row.status}</td>
                            <td style={cellStyle}>{row.severity}</td>
                        </tr>
                    );
                case 4: // 积分明细
                    return (
                        <tr key={row.id}>
                            <td style={cellStyle}>{rowNum}</td>
                            <td style={cellStyle}>{row.userName}</td>
                            <td style={cellStyle}>{row.organization}</td>
                            <td style={cellStyle}>{row.phone}</td>
                            <td style={cellStyle}>{row.taskNumber}</td>
                            <td style={cellStyle}>{row.taskName}</td>
                            <td style={cellStyle}>{row.pointsAmount}</td>
                            <td style={cellStyle}>{row.pointsType}</td>
                            <td style={cellStyle}>{row.earnTime}</td>
                        </tr>
                    );
                case 5: // 积分兑换明细
                    return (
                        <tr key={row.id}>
                            <td style={cellStyle}>{rowNum}</td>
                            <td style={cellStyle}>{row.userName}</td>
                            <td style={cellStyle}>{row.organization}</td>
                            <td style={cellStyle}>{row.phone}</td>
                            <td style={cellStyle}>{row.pointsUsed}</td>
                            <td style={cellStyle}>{row.exchangeTime}</td>
                            <td style={cellStyle}>{row.exchangeStatus}</td>
                        </tr>
                    );
                case 6: // 邀请有奖明细
                    return (
                        <tr key={row.id}>
                            <td style={cellStyle}>{rowNum}</td>
                            <td style={cellStyle}>{row.inviterName}</td>
                            <td style={cellStyle}>{row.inviterOrganization}</td>
                            <td style={cellStyle}>{row.inviterPhone}</td>
                            <td style={cellStyle}>{row.inviteeName}</td>
                            <td style={cellStyle}>{row.inviteeOrganization}</td>
                            <td style={cellStyle}>{row.inviteePhone}</td>
                            <td style={cellStyle}>{row.activityName}</td>
                            <td style={cellStyle}>{row.inviteeAcceptedTask}</td>
                            <td style={cellStyle}>
                                {row.inviteeSubmittedDefects}
                            </td>
                        </tr>
                    );
                default:
                    return null;
            }
        });
    };

    return (
        <Box minH="100vh">
            <Container maxW="1400px" px={0} py={0}>
                <VStack gap={4} align="stretch">
                    {/* Breadcrumb */}
                    <Flex
                        align="center"
                        gap={2}
                        fontSize="14px"
                        color={COLORS.textSecondary}
                    >
                        <FiAlignJustify />
                        <Text>/</Text>
                        <Text
                            onClick={() => router.push('/crowdsource/admin')}
                            cursor="pointer"
                        >
                            后台管理
                        </Text>
                        <Text>/</Text>
                        <Text
                            onClick={() =>
                                router.push('/crowdsource/admin/detail-reports')
                            }
                            cursor="pointer"
                        >
                            报表管理
                        </Text>
                        <Text>/</Text>
                        <Text color={COLORS.textPrimary} fontWeight="500">
                            明细报表
                        </Text>
                    </Flex>

                    {/* Header */}
                    <Box
                        bg={COLORS.bgPrimary}
                        borderRadius="8px"
                        p={6}
                        boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                    >
                        <Flex justify="space-between" align="center">
                            <Text
                                fontSize="14px"
                                fontWeight="500"
                                color={COLORS.textPrimary}
                            >
                                明细报表
                            </Text>

                            <HStack gap={8}>
                                <HStack gap={8}>
                                    {activeTab === 0 && (
                                        <>
                                            <Box position="relative" w="140px">
                                                <Input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) =>
                                                        setStartDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    bg={COLORS.bgSecondary}
                                                    border="none"
                                                    borderRadius="24px"
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    _focus={{
                                                        boxShadow: 'none',
                                                    }}
                                                    placeholder="开始时间"
                                                    pl={3}
                                                    pr={8}
                                                    py={1}
                                                />
                                            </Box>

                                            <Box position="relative" w="140px">
                                                <Input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) =>
                                                        setEndDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    bg={COLORS.bgSecondary}
                                                    border="none"
                                                    borderRadius="24px"
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    _focus={{
                                                        boxShadow: 'none',
                                                    }}
                                                    placeholder="结束时间"
                                                    pl={3}
                                                    pr={8}
                                                    py={1}
                                                />
                                            </Box>
                                        </>
                                    )}

                                    {activeTab === 1 && (
                                        <>
                                            <Box position="relative" w="140px">
                                                <select
                                                    value={taskType}
                                                    onChange={(e) =>
                                                        setTaskType(
                                                            e.target.value
                                                        )
                                                    }
                                                    style={{
                                                        background:
                                                            COLORS.bgSecondary,
                                                        border: 'none',
                                                        borderRadius: '24px',
                                                        fontSize: '14px',
                                                        color: COLORS.textTertiary,
                                                        padding: '7px 12px',
                                                        paddingRight: '32px',
                                                        width: '100%',
                                                        appearance: 'none',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <option value="">
                                                        类型
                                                    </option>
                                                    <option value="1">
                                                        类型1
                                                    </option>
                                                    <option value="2">
                                                        类型2
                                                    </option>
                                                </select>
                                            </Box>

                                            <Box position="relative" w="140px">
                                                <Input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) =>
                                                        setStartDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    bg={COLORS.bgSecondary}
                                                    border="none"
                                                    borderRadius="24px"
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    _focus={{
                                                        boxShadow: 'none',
                                                    }}
                                                    placeholder="开始时间"
                                                    pl={3}
                                                    pr={8}
                                                    py={1}
                                                />
                                            </Box>

                                            <Box position="relative" w="140px">
                                                <Input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) =>
                                                        setEndDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    bg={COLORS.bgSecondary}
                                                    border="none"
                                                    borderRadius="24px"
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    _focus={{
                                                        boxShadow: 'none',
                                                    }}
                                                    placeholder="结束时间"
                                                    pl={3}
                                                    pr={8}
                                                    py={1}
                                                />
                                            </Box>

                                            <Box position="relative" w="140px">
                                                <Input
                                                    type="text"
                                                    value={taskNumber}
                                                    onChange={(e) =>
                                                        setTaskNumber(
                                                            e.target.value
                                                        )
                                                    }
                                                    bg={COLORS.bgSecondary}
                                                    border="none"
                                                    borderRadius="24px"
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    _focus={{
                                                        boxShadow: 'none',
                                                    }}
                                                    placeholder="任务编号"
                                                    pl={3}
                                                    pr={8}
                                                    py={1}
                                                />
                                            </Box>
                                        </>
                                    )}

                                    {activeTab === 2 && (
                                        <>
                                            <Box position="relative" w="140px">
                                                <Input
                                                    type="date"
                                                    value={orderStartDate}
                                                    onChange={(e) =>
                                                        setOrderStartDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    bg={COLORS.bgSecondary}
                                                    border="none"
                                                    borderRadius="24px"
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    _focus={{
                                                        boxShadow: 'none',
                                                    }}
                                                    placeholder="开始时间"
                                                    pl={3}
                                                    pr={8}
                                                    py={1}
                                                />
                                            </Box>

                                            <Box position="relative" w="140px">
                                                <Input
                                                    type="date"
                                                    value={orderEndDate}
                                                    onChange={(e) =>
                                                        setOrderEndDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    bg={COLORS.bgSecondary}
                                                    border="none"
                                                    borderRadius="24px"
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    _focus={{
                                                        boxShadow: 'none',
                                                    }}
                                                    placeholder="结束时间"
                                                    pl={3}
                                                    pr={8}
                                                    py={1}
                                                />
                                            </Box>
                                        </>
                                    )}

                                    {activeTab === 3 && (
                                        <>
                                            <Box position="relative" w="140px">
                                                <select
                                                    value={defectType}
                                                    onChange={(e) =>
                                                        setDefectType(
                                                            e.target.value as
                                                                | 'BUG'
                                                                | 'SUGGESTION'
                                                                | ''
                                                        )
                                                    }
                                                    style={{
                                                        background:
                                                            COLORS.bgSecondary,
                                                        border: 'none',
                                                        borderRadius: '24px',
                                                        fontSize: '14px',
                                                        color: COLORS.textTertiary,
                                                        padding: '7px 12px',
                                                        paddingRight: '32px',
                                                        width: '100%',
                                                        appearance: 'none',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <option value="">
                                                        缺陷类型
                                                    </option>
                                                    <option value="bug">
                                                        缺陷
                                                    </option>
                                                    <option value="suggestion">
                                                        建议
                                                    </option>
                                                </select>
                                            </Box>

                                            <Box position="relative" w="140px">
                                                <Input
                                                    type="date"
                                                    value={defectStartDate}
                                                    onChange={(e) =>
                                                        setDefectStartDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    bg={COLORS.bgSecondary}
                                                    border="none"
                                                    borderRadius="24px"
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    _focus={{
                                                        boxShadow: 'none',
                                                    }}
                                                    placeholder="开始时间"
                                                    pl={3}
                                                    pr={8}
                                                    py={1}
                                                />
                                            </Box>

                                            <Box position="relative" w="140px">
                                                <Input
                                                    type="date"
                                                    value={defectEndDate}
                                                    onChange={(e) =>
                                                        setDefectEndDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    bg={COLORS.bgSecondary}
                                                    border="none"
                                                    borderRadius="24px"
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    _focus={{
                                                        boxShadow: 'none',
                                                    }}
                                                    placeholder="结束时间"
                                                    pl={3}
                                                    pr={8}
                                                    py={1}
                                                />
                                            </Box>
                                        </>
                                    )}

                                    {activeTab === 4 && (
                                        <>
                                            <Box position="relative" w="140px">
                                                <Input
                                                    type="date"
                                                    value={pointsExchangeStartDate}
                                                    onChange={(e) =>
                                                        setPointsExchangeStartDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    bg={COLORS.bgSecondary}
                                                    border="none"
                                                    borderRadius="24px"
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    _focus={{
                                                        boxShadow: 'none',
                                                    }}
                                                    placeholder="开始时间"
                                                    pl={3}
                                                    pr={8}
                                                    py={1}
                                                />
                                            </Box>

                                            <Box position="relative" w="140px">
                                                <Input
                                                    type="date"
                                                    value={pointsExchangeEndDate}
                                                    onChange={(e) =>
                                                        setPointsExchangeEndDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    bg={COLORS.bgSecondary}
                                                    border="none"
                                                    borderRadius="24px"
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    _focus={{
                                                        boxShadow: 'none',
                                                    }}
                                                    placeholder="结束时间"
                                                    pl={3}
                                                    pr={8}
                                                    py={1}
                                                />
                                            </Box>
                                        </>
                                    )}

                                    {activeTab === 5 && (
                                        <>
                                            <Box position="relative" w="140px">
                                                <Input
                                                    type="date"
                                                    value={
                                                        pointsExchangeStartDate
                                                    }
                                                    onChange={(e) =>
                                                        setPointsExchangeStartDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    bg={COLORS.bgSecondary}
                                                    border="none"
                                                    borderRadius="24px"
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    _focus={{
                                                        boxShadow: 'none',
                                                    }}
                                                    placeholder="开始时间"
                                                    pl={3}
                                                    pr={8}
                                                    py={1}
                                                />
                                            </Box>

                                            <Box position="relative" w="140px">
                                                <Input
                                                    type="date"
                                                    value={
                                                        pointsExchangeEndDate
                                                    }
                                                    onChange={(e) =>
                                                        setPointsExchangeEndDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    bg={COLORS.bgSecondary}
                                                    border="none"
                                                    borderRadius="24px"
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    _focus={{
                                                        boxShadow: 'none',
                                                    }}
                                                    placeholder="结束时间"
                                                    pl={3}
                                                    pr={8}
                                                    py={1}
                                                />
                                            </Box>
                                        </>
                                    )}

                                    {activeTab === 6 && (
                                        <>
                                            <Box position="relative" w="140px">
                                                <select
                                                    value={invitationActivity}
                                                    onChange={(e) =>
                                                        setInvitationActivity(
                                                            e.target.value
                                                        )
                                                    }
                                                    style={{
                                                        background:
                                                            COLORS.bgSecondary,
                                                        border: 'none',
                                                        borderRadius: '24px',
                                                        fontSize: '14px',
                                                        color: COLORS.textTertiary,
                                                        padding: '7px 12px',
                                                        paddingRight: '32px',
                                                        width: '100%',
                                                        appearance: 'none',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <option value="">
                                                        所属活动
                                                    </option>
                                                    {invitationActivities?.map((activity: any) => (
                                                        <option key={activity.id} value={activity.id}>
                                                            {activity.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </Box>

                                            <Box position="relative" w="140px">
                                                <Input
                                                    type="text"
                                                    value={invitationInviter}
                                                    onChange={(e) =>
                                                        setInvitationInviter(
                                                            e.target.value
                                                        )
                                                    }
                                                    bg={COLORS.bgSecondary}
                                                    border="none"
                                                    borderRadius="24px"
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    _focus={{
                                                        boxShadow: 'none',
                                                    }}
                                                    placeholder="推荐人"
                                                    pl={3}
                                                    pr={8}
                                                    py={1}
                                                />
                                            </Box>

                                            <Box position="relative" w="140px">
                                                <Input
                                                    type="date"
                                                    value={invitationStartDate}
                                                    onChange={(e) =>
                                                        setInvitationStartDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    bg={COLORS.bgSecondary}
                                                    border="none"
                                                    borderRadius="24px"
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    _focus={{
                                                        boxShadow: 'none',
                                                    }}
                                                    placeholder="开始时间"
                                                    pl={3}
                                                    pr={8}
                                                    py={1}
                                                />
                                            </Box>

                                            <Box position="relative" w="140px">
                                                <Input
                                                    type="date"
                                                    value={invitationEndDate}
                                                    onChange={(e) =>
                                                        setInvitationEndDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    bg={COLORS.bgSecondary}
                                                    border="none"
                                                    borderRadius="24px"
                                                    fontSize="14px"
                                                    color={COLORS.textTertiary}
                                                    _focus={{
                                                        boxShadow: 'none',
                                                    }}
                                                    placeholder="结束时间"
                                                    pl={3}
                                                    pr={8}
                                                    py={1}
                                                />
                                            </Box>
                                        </>
                                    )}
                                </HStack>

                                <HStack gap={4}>
                                    <Button
                                        bg="linear-gradient(to right, #FF9565, #FE5F6B)"
                                        color="white"
                                        fontSize="14px"
                                        fontWeight="500"
                                        borderRadius="999px"
                                        px={6}
                                        py={2}
                                        h="36px"
                                        _hover={{ opacity: 0.9 }}
                                        onClick={handleQuery}
                                    >
                                        查询
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                        _hover={{ bg: 'transparent' }}
                                        onClick={handleReset}
                                    >
                                        重置
                                    </Button>
                                </HStack>

                                <Button
                                    bg="linear-gradient(to right, #FF9565, #FE5F6B)"
                                    color="white"
                                    fontSize="14px"
                                    fontWeight="500"
                                    borderRadius="999px"
                                    px={6}
                                    py={2}
                                    h="36px"
                                    _hover={{ opacity: 0.9 }}
                                    onClick={handleExport}
                                >
                                    导出报表
                                </Button>
                            </HStack>
                        </Flex>
                    </Box>

                    {/* Tabs and Table */}
                    <Box
                        bg={COLORS.bgPrimary}
                        borderRadius="8px"
                        boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                        overflow="hidden"
                    >
                        {/* Tab List */}
                        <Flex
                            borderBottom={`1px solid ${COLORS.borderColor}`}
                            px={6}
                            gap={0}
                        >
                            {tabs.map((tab, index) => (
                                <Box
                                    key={index}
                                    px={4}
                                    py={3}
                                    cursor="pointer"
                                    borderBottom={
                                        activeTab === index
                                            ? `3px solid ${COLORS.primary}`
                                            : 'none'
                                    }
                                    color={
                                        activeTab === index
                                            ? COLORS.primary
                                            : COLORS.textSecondary
                                    }
                                    fontSize="14px"
                                    fontWeight={
                                        activeTab === index ? '500' : '400'
                                    }
                                    onClick={() => {
                                        setActiveTab(index);
                                        setCurrentPage(1);
                                    }}
                                    mb={-1}
                                >
                                    {tab}
                                </Box>
                            ))}
                        </Flex>

                        {/* Tab Content */}
                        <Box p={6} overflowX="auto">
                            {activeTab === 0 && isLoadingUserDetails ? (
                                <Flex
                                    justify="center"
                                    align="center"
                                    minH="200px"
                                >
                                    <Spinner size="lg" color={COLORS.primary} />
                                </Flex>
                            ) : activeTab === 0 &&
                              paginatedData.length === 0 ? (
                                <Flex
                                    justify="center"
                                    align="center"
                                    minH="200px"
                                >
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                    >
                                        暂无数据
                                    </Text>
                                </Flex>
                            ) : activeTab === 1 && isLoadingTaskDetails ? (
                                <Flex
                                    justify="center"
                                    align="center"
                                    minH="200px"
                                >
                                    <Spinner size="lg" color={COLORS.primary} />
                                </Flex>
                            ) : activeTab === 1 &&
                              paginatedData.length === 0 ? (
                                <Flex
                                    justify="center"
                                    align="center"
                                    minH="200px"
                                >
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                    >
                                        暂无数据
                                    </Text>
                                </Flex>
                            ) : activeTab === 2 && isLoadingOrderDetails ? (
                                <Flex
                                    justify="center"
                                    align="center"
                                    minH="200px"
                                >
                                    <Spinner size="lg" color={COLORS.primary} />
                                </Flex>
                            ) : activeTab === 2 &&
                              paginatedData.length === 0 ? (
                                <Flex
                                    justify="center"
                                    align="center"
                                    minH="200px"
                                >
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                    >
                                        暂无数据
                                    </Text>
                                </Flex>
                            ) : activeTab === 3 ? (
                                // Render defect cards for 缺陷明细 tab
                                <Box>{renderDefectCards()}</Box>
                            ) : (
                                // Render table for other tabs
                                <table
                                    style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        fontSize: '14px',
                                    }}
                                >
                                    <thead>
                                        <tr
                                            style={{
                                                backgroundColor:
                                                    COLORS.bgSecondary,
                                            }}
                                        >
                                            {renderTableHeaders()}
                                        </tr>
                                    </thead>
                                    <tbody>{renderTableRows()}</tbody>
                                </table>
                            )}
                        </Box>

                        {/* Pagination */}
                        <Box
                            bg={COLORS.bgPrimary}
                            p={4}
                            borderTop={`1px solid ${COLORS.borderColor}`}
                        >
                            <Flex justify="flex-end" align="center" gap={4}>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                >
                                    共{currentData.length}条
                                </Text>

                                <HStack gap={2}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={currentPage === 1}
                                        onClick={() =>
                                            setCurrentPage(currentPage - 1)
                                        }
                                        p={2}
                                    >
                                        <ChevronLeft size={16} />
                                    </Button>

                                    {Array.from(
                                        { length: totalPages },
                                        (_, i) => (
                                            <Button
                                                key={i + 1}
                                                size="sm"
                                                variant={
                                                    currentPage === i + 1
                                                        ? 'solid'
                                                        : 'ghost'
                                                }
                                                bg={
                                                    currentPage === i + 1
                                                        ? '#FEDFE1'
                                                        : 'transparent'
                                                }
                                                color={
                                                    currentPage === i + 1
                                                        ? '#FE606B'
                                                        : COLORS.textSecondary
                                                }
                                                onClick={() =>
                                                    setCurrentPage(i + 1)
                                                }
                                                minW="24px"
                                                h="24px"
                                                fontSize="14px"
                                            >
                                                {i + 1}
                                            </Button>
                                        )
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={currentPage === totalPages}
                                        onClick={() =>
                                            setCurrentPage(currentPage + 1)
                                        }
                                        p={2}
                                    >
                                        <ChevronRight size={16} />
                                    </Button>
                                </HStack>

                                <Box position="relative" w="100px">
                                    <select
                                        value={pageSize}
                                        onChange={(e) =>
                                            setPageSize(Number(e.target.value))
                                        }
                                        style={{
                                            background: COLORS.bgSecondary,
                                            border: 'none',
                                            borderRadius: '2px',
                                            fontSize: '14px',
                                            color: COLORS.textPrimary,
                                            padding: '4px 12px',
                                            paddingRight: '24px',
                                            width: '100%',
                                            appearance: 'none',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <option value={10}>10条/页</option>
                                        <option value={20}>20条/页</option>
                                        <option value={50}>50条/页</option>
                                    </select>
                                    <ChevronDown
                                        size={14}
                                        color={COLORS.textTertiary}
                                        style={{
                                            position: 'absolute',
                                            right: '8px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            pointerEvents: 'none',
                                        }}
                                    />
                                </Box>
                            </Flex>
                        </Box>
                    </Box>
                </VStack>
            </Container>

            {/* Preview Modal */}
            {isPreviewOpen && (
                <Box
                    position="fixed"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="rgba(0, 0, 0, 0.5)"
                    zIndex={1000}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    onClick={() => setIsPreviewOpen(false)}
                >
                    <Box
                        bg="white"
                        borderRadius="8px"
                        maxW={{ base: '90%', md: '80%', lg: '60%' }}
                        maxH="85vh"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Flex
                            justify="space-between"
                            align="center"
                            p={4}
                            borderBottom={`1px solid ${COLORS.borderColor}`}
                        >
                            <Text fontSize="16px" fontWeight="500" color={COLORS.textPrimary}>
                                {previewType === 'image' ? '图片预览' : '视频预览'}
                            </Text>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsPreviewOpen(false)}
                            >
                                <Icon as={ChevronDown} boxSize={5} />
                            </Button>
                        </Flex>
                        <Box p={4}>
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
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Steps Modal */}
            {isStepsOpen && (
                <Box
                    position="fixed"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="rgba(0, 0, 0, 0.5)"
                    zIndex={1000}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    onClick={handleCloseSteps}
                >
                    <Box
                        bg="white"
                        borderRadius="8px"
                        maxW="500px"
                        maxH="85vh"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Flex
                            justify="space-between"
                            align="center"
                            p={4}
                            borderBottom={`1px solid ${COLORS.borderColor}`}
                        >
                            <Text fontSize="16px" fontWeight="500" color={COLORS.textPrimary}>
                                关联步骤详情
                            </Text>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCloseSteps}
                            >
                                <Icon as={ChevronDown} boxSize={5} />
                            </Button>
                        </Flex>
                        <Box p={4} maxH="60vh" overflowY="auto">
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
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Duplicate Defects Modal */}
            {isDuplicateModalOpen && (
                <Box
                    position="fixed"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="rgba(0, 0, 0, 0.5)"
                    zIndex={1000}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    onClick={handleCloseDuplicateModal}
                >
                    <Box
                        bg="white"
                        borderRadius="8px"
                        maxW="1080px"
                        maxH="90vh"
                        w="90%"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Flex
                            justify="space-between"
                            align="center"
                            p={4}
                            borderBottom={`1px solid ${COLORS.borderColor}`}
                        >
                            <Text fontSize="16px" fontWeight="500" color={COLORS.textPrimary}>
                                {selectedDefectForDuplicate?.title || '关联重复缺陷'}
                            </Text>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCloseDuplicateModal}
                            >
                                <Icon as={ChevronDown} boxSize={5} />
                            </Button>
                        </Flex>
                        <Box p={6} overflowY="auto" maxH="70vh">
                            {/* Duplicate Count Label */}
                            <Flex justify="flex-end" pr={6} pb={6}>
                                <Text fontSize="14px" color={COLORS.textSecondary}>
                                    缺陷数量：{duplicateItems.length}
                                </Text>
                            </Flex>
                            <VStack gap={6} align="stretch">
                                {duplicateItems.map((item, index) => (
                                    <Box key={item.id}>
                                        {/* Item Header */}
                                        <Flex
                                            align="center"
                                            justify="space-between"
                                            bg={COLORS.bgSecondary}
                                            px={6}
                                            py={4}
                                            borderRadius="8px 8px 0 0"
                                            border="1px solid"
                                            borderColor={COLORS.borderColor}
                                            borderBottom="none"
                                            gap={6}
                                        >
                                            <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} w="30px">
                                                {index + 1}
                                            </Text>
                                            <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} w="120px">
                                                {item.number}
                                            </Text>

                                            <HStack gap={1} w="auto" minW="180px">
                                                <Text fontSize="14px" color={COLORS.textSecondary}>缺陷/建议积分：</Text>
                                                <Text fontSize="14px" fontWeight="600" color={COLORS.textPrimary}>
                                                    {item.points}
                                                </Text>
                                                <Image
                                                    src="/images/task-hall/jinbi.png"
                                                    alt="积分"
                                                    w="16px"
                                                    h="16px"
                                                />
                                            </HStack>

                                            <HStack gap={1} w="auto" minW="60px">
                                                <Icon color={item.type === 'defect' ? '#165DFF' : '#00B42A'}>
                                                    <Bug size={16} />
                                                </Icon>
                                                <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary}>
                                                    {item.type === 'defect' ? '缺陷' : '建议'}
                                                </Text>
                                            </HStack>

                                            <Box
                                                px={3}
                                                py={1}
                                                borderRadius="12px"
                                                bg="rgba(227, 20, 36, 0.1)"
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                minW="70px"
                                                ml="auto"
                                            >
                                                <Text fontSize="14px" color="#E31424" fontWeight="500">
                                                    {item.severity === 'MAJOR' ? '严重' : '一般'}
                                                </Text>
                                            </Box>
                                        </Flex>

                                        {/* Item Content */}
                                        <Box
                                            bg={COLORS.bgPrimary}
                                            border="1px solid"
                                            borderColor={COLORS.borderColor}
                                            borderTop="none"
                                            borderRadius="0 0 8px 8px"
                                        >
                                            <Grid templateColumns="1fr 1px 1fr" gap={0} p={6} minH="200px">
                                                {/* Left Column */}
                                                <Box pr={6}>
                                                    <VStack align="stretch" gap={4}>
                                                        <HStack align="flex-start" gap={2}>
                                                            <Text fontSize="14px" color={COLORS.textSecondary} flexShrink={0}>标题：</Text>
                                                            <Text fontSize="14px" color={COLORS.textSecondary}>{item.title}</Text>
                                                        </HStack>
                                                        <HStack align="flex-start" gap={2}>
                                                            <Text fontSize="14px" color={COLORS.textSecondary} flexShrink={0}>描述：</Text>
                                                            <Text fontSize="14px" color={COLORS.textSecondary} lineHeight="1.6">
                                                                {item.description}
                                                            </Text>
                                                        </HStack>
                                                        <VStack align="stretch" gap={2}>
                                                            <Flex justify="space-between" align="center">
                                                                <Text fontSize="14px" color={COLORS.textSecondary}>附件：</Text>
                                                                {item.attachments.length > 0 && (
                                                                    <HStack
                                                                        gap={1}
                                                                        cursor="pointer"
                                                                        color={COLORS.textTertiary}
                                                                        _hover={{ color: COLORS.textPrimary }}
                                                                        onClick={() => handleDownloadAllAttachments(item.attachments)}
                                                                    >
                                                                        <Icon as={ChevronDown} boxSize={4} />
                                                                        <Text fontSize="12px">全部下载</Text>
                                                                    </HStack>
                                                                )}
                                                            </Flex>
                                                            {item.attachments.length > 0 ? (
                                                                <Flex gap="12px" wrap="wrap">
                                                                    {item.attachments.map((url: string, i: number) => {
                                                                        const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.avi');
                                                                        const attachment: Attachment = {
                                                                            id: `${item.id}-${i}`,
                                                                            url,
                                                                            isVideo
                                                                        };
                                                                        return (
                                                                            <Box
                                                                                key={attachment.id}
                                                                                w="80px"
                                                                                h="80px"
                                                                                borderRadius="4px"
                                                                                overflow="hidden"
                                                                                border="1px solid"
                                                                                borderColor={COLORS.borderColor}
                                                                                cursor="pointer"
                                                                                position="relative"
                                                                                onClick={() => handlePreviewAttachment(attachment)}
                                                                                _hover={{ opacity: 0.8 }}
                                                                            >
                                                                                {attachment.isVideo ? (
                                                                                    <>
                                                                                        <video
                                                                                            src={attachment.url}
                                                                                            style={{
                                                                                                width: '100%',
                                                                                                height: '100%',
                                                                                                objectFit: 'cover',
                                                                                            }}
                                                                                        />
                                                                                        <Flex
                                                                                            position="absolute"
                                                                                            top="50%"
                                                                                            left="50%"
                                                                                            transform="translate(-50%, -50%)"
                                                                                            bg="rgba(0, 0, 0, 0.5)"
                                                                                            borderRadius="50%"
                                                                                            w="24px"
                                                                                            h="24px"
                                                                                            align="center"
                                                                                            justify="center"
                                                                                        >
                                                                                            <Icon color="white">
                                                                                                <Play size={12} />
                                                                                            </Icon>
                                                                                        </Flex>
                                                                                    </>
                                                                                ) : (
                                                                                    <Image
                                                                                        src={attachment.url}
                                                                                        alt={`附件 ${i + 1}`}
                                                                                        width="100%"
                                                                                        height="100%"
                                                                                        objectFit="cover"
                                                                                    />
                                                                                )}
                                                                            </Box>
                                                                        );
                                                                    })}
                                                                </Flex>
                                                            ) : (
                                                                <Text fontSize="14px" color={COLORS.textTertiary}>-</Text>
                                                            )}
                                                        </VStack>
                                                    </VStack>
                                                </Box>

                                                {/* Divider */}
                                                <Box w="1px" bg={COLORS.borderColor} />

                                                {/* Right Column */}
                                                <Box pl={6}>
                                                    <VStack align="stretch" gap={4}>
                                                        <HStack align="flex-start" gap={2}>
                                                            <Text fontSize="14px" color={COLORS.textSecondary} flexShrink={0}>所属用例：</Text>
                                                            <Text fontSize="14px" color={COLORS.textPrimary}>{item.caseName || '-'}</Text>
                                                        </HStack>
                                                        <HStack align="flex-start" gap={2}>
                                                            <Text fontSize="14px" color={COLORS.textSecondary} flexShrink={0}>关联步骤：</Text>
                                                            <Text fontSize="14px" color={COLORS.textPrimary}>{item.relatedSteps || '-'}</Text>
                                                        </HStack>
                                                        <HStack align="flex-start" gap={2}>
                                                            <Text fontSize="14px" color={COLORS.textSecondary} flexShrink={0}>审核意见：</Text>
                                                            <Text fontSize="14px" color={COLORS.textPrimary}>{item.reviewComment || '-'}</Text>
                                                        </HStack>
                                                        <HStack align="flex-start" gap={2}>
                                                            <Text fontSize="14px" color={COLORS.textSecondary} flexShrink={0}>补充说明：</Text>
                                                            <Text fontSize="14px" color={COLORS.textPrimary}>{item.supplementaryExplanation || '-'}</Text>
                                                        </HStack>
                                                    </VStack>
                                                </Box>
                                            </Grid>

                                            {/* Card Footer Row */}
                                            <Flex
                                                px={6}
                                                py={3}
                                                borderTop="1px dashed"
                                                borderColor={COLORS.borderColor}
                                                gap={10}
                                            >
                                                <HStack gap={1}>
                                                    <Text fontSize="12px" color={COLORS.textTertiary}>机型：</Text>
                                                    <Text fontSize="12px" color={COLORS.textSecondary}>{item.deviceModel || '-'}</Text>
                                                </HStack>
                                                <HStack gap={1}>
                                                    <Text fontSize="12px" color={COLORS.textTertiary}>系统：</Text>
                                                    <Text fontSize="12px" color={COLORS.textSecondary}>{item.system || '-'}</Text>
                                                </HStack>
                                                <HStack gap={1}>
                                                    <Text fontSize="12px" color={COLORS.textTertiary}>提交人：</Text>
                                                    <Text fontSize="12px" color={COLORS.textSecondary}>{item.submitter || '-'}</Text>
                                                </HStack>
                                                <HStack gap={1}>
                                                    <Text fontSize="12px" color={COLORS.textTertiary}>提交时间：</Text>
                                                    <Text fontSize="12px" color={COLORS.textSecondary}>{item.submitTime}</Text>
                                                </HStack>
                                            </Flex>
                                        </Box>

                                        {index < duplicateItems.length - 1 && <Box h="12px" />}
                                    </Box>
                                ))}
                            </VStack>
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
