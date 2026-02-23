'use client';

import {
    Box,
    Container,
    Flex,
    Text,
    Heading,
    Button,
    Input,
    Textarea,
    VStack,
    HStack,
    Circle,
    IconButton,
    Image,
    NativeSelectRoot,
    NativeSelectField,
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogBackdrop,
    DialogTitle,
    DialogCloseTrigger,
} from '@chakra-ui/react';
import { Field } from '@chakra-ui/react';
import { Switch } from '@/app/_components/ui/switch';
import { Checkbox } from '@/app/_components/ui/checkbox';
import RichTextEditor from '@/app/_components/ui/rich-text-editor';
import { Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { useTaskPublishStore } from '../useTaskPublishStore';
import type { PointsOption } from '../useTaskPublishStore';
import { toaster } from '@/app/_components/ui/toaster';

// 步骤数据
const steps = [
    {
        number: 1,
        title: '基本信息',
        subtitle: '创建任务基本信息',
        completed: true,
    },
    { number: 2, title: '测试设计', subtitle: '选择测试用例', completed: true },
    {
        number: 3,
        title: '任务发布',
        subtitle: '任务发布设置',
        completed: false,
    },
];

// 步骤指示器组件
function StepIndicator() {
    const currentStep = 3;

    return (
        <Flex justify="center" align="center" gap={0} mb={12}>
            {steps.map((step, index) => (
                <Flex key={step.number} align="center">
                    {/* 步骤圆圈 */}
                    <Flex direction="column" align="center" position="relative">
                        <Circle
                            size="48px"
                            bg={
                                step.completed
                                    ? '#FFE0E1'
                                    : step.number === currentStep
                                        ? '#E31424'
                                        : '#F2F3F5'
                            }
                            color={
                                step.completed
                                    ? '#E31424'
                                    : step.number === currentStep
                                        ? 'white'
                                        : '#86909C'
                            }
                            fontSize="20px"
                            fontWeight="medium"
                        >
                            {step.completed ? '✓' : step.number}
                        </Circle>
                        <VStack gap={0} mt={3} align="center">
                            <Text
                                fontSize="16px"
                                fontWeight="medium"
                                color={
                                    step.number === currentStep
                                        ? '#1d2129'
                                        : '#4e5969'
                                }
                            >
                                {step.title}
                            </Text>
                            <Text fontSize="12px" color="#86909C">
                                {step.subtitle}
                            </Text>
                        </VStack>
                    </Flex>

                    {/* 连接线 */}
                    {index < steps.length - 1 && (
                        <Box w="200px" h="2px" bg="#E5E6EB" mx={4} mb={12} />
                    )}
                </Flex>
            ))}
        </Flex>
    );
}

// 积分分配规则映射
const RULE_STATUS_MAP = {
    0: { label: '重复缺陷无效' },
    1: { label: '重复缺陷均分' },
    2: { label: '重复缺陷均按执行积分发放' },
    3: { label: '无奖励' },
} as const;

type RuleStatus = keyof typeof RULE_STATUS_MAP;

export default function TaskPublish() {
    const router = useRouter();
    const { basicInfo, testDesign, taskPublish, setBasicInfo, setTestDesign, setTaskPublish, reset } =
        useTaskPublishStore();

    // API Queries - 获取模版数据
    const { data: smsTemplatesData, refetch: refetchSms } =
        api.notificationTemplate.getAll.useQuery({
            type: 'SMS',
        });
    const { data: emailTemplatesData, refetch: refetchEmail } =
        api.notificationTemplate.getAll.useQuery({
            type: 'EMAIL',
        });
    const { data: wechatTemplatesData, refetch: refetchWechat } =
        api.notificationTemplate.getAll.useQuery({
            type: 'WECHAT',
        });

    // API Queries - 获取标签数据
    const { data: tagCategoriesData } =
        api.tagManagement.getAllWithUserCount.useQuery();

    // API Queries - 获取数据字典
    const { data: testLevelDict } =
        api.dataDictionary.getByCode.useQuery('DEFECT_SEVERITY');
    const { data: suggestionLevelDict } =
        api.dataDictionary.getByCode.useQuery('SUGGESTION_LEVEL');

    // API Mutation - 获取用户清单
    const getUsersByTagsMutation =
        api.tagManagement.getUsersByTags.useMutation();

    // API Mutations - 创建和更新模板
    const createSmsMutation = api.notificationTemplate.create.useMutation({
        onSuccess: () => {
            void refetchSms();
        },
    });
    const updateSmsMutation = api.notificationTemplate.update.useMutation({
        onSuccess: () => {
            void refetchSms();
        },
    });

    const createEmailMutation = api.notificationTemplate.create.useMutation({
        onSuccess: () => {
            void refetchEmail();
        },
    });
    const updateEmailMutation = api.notificationTemplate.update.useMutation({
        onSuccess: () => {
            void refetchEmail();
        },
    });

    const createWechatMutation = api.notificationTemplate.create.useMutation({
        onSuccess: () => {
            void refetchWechat();
        },
    });
    const updateWechatMutation = api.notificationTemplate.update.useMutation({
        onSuccess: () => {
            void refetchWechat();
        },
    });

    // API Mutations - 删除模版
    const deleteSmsMutation = api.notificationTemplate.delete.useMutation({
        onSuccess: () => {
            void refetchSms();
        },
    });
    const deleteEmailMutation = api.notificationTemplate.delete.useMutation({
        onSuccess: () => {
            void refetchEmail();
        },
    });
    const deleteWechatMutation = api.notificationTemplate.delete.useMutation({
        onSuccess: () => {
            void refetchWechat();
        },
    });

    const [personTags, setPersonTags] = useState<string[]>(
        taskPublish.personTags
    );
    const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
        new Set(taskPublish.selectedTagIds)
    );
    const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
    const [tempSelectedTags, setTempSelectedTags] = useState<Set<string>>(
        new Set()
    );
    const [taskDate, setTaskDate] = useState(taskPublish.taskDate);
    const [participants, setParticipants] = useState(taskPublish.participants);
    const [executePoints, setExecutePoints] = useState(
        taskPublish.executePoints
    );
    // 积分选项数据
    const [pointsOptions, setPointsOptions] = useState<PointsOption[]>(
        taskPublish.pointsOptions
    );
    const [emailNotify, setEmailNotify] = useState(taskPublish.emailNotify);
    const [emailContent, setEmailContent] = useState(taskPublish.emailContent);
    const [smsNotify, setSmsNotify] = useState(taskPublish.smsNotify);
    const [smsContent, setSmsContent] = useState(taskPublish.smsContent);
    const [groupInvite, setGroupInvite] = useState(taskPublish.groupInvite);
    const [thumbnailImage, setthumbnailImage] = useState<string | null>(
        taskPublish.thumbnailImage
    );
    const [wechatContent, setWechatContent] = useState(
        taskPublish.wechatContent
    );
    const [isEditingPoints, setIsEditingPoints] = useState(false);

    const [ruleFilter, setRuleFilter] = useState<string>(
        taskPublish.ruleFilter || ''
    );

    // 编辑模式：根据 personTags 名称反向查找标签 ID
    useEffect(() => {
        if (
            tagCategoriesData &&
            personTags.length > 0 &&
            selectedTagIds.size === 0
        ) {
            const tagIds = new Set<string>();
            Object.values(tagCategoriesData).forEach((tags) => {
                tags.forEach((tag) => {
                    if (personTags.includes(tag.name)) {
                        tagIds.add(tag.id);
                    }
                });
            });
            if (tagIds.size > 0) {
                setSelectedTagIds(tagIds);
            }
        }
    }, [tagCategoriesData, personTags, selectedTagIds.size]);

    // 下载人员清单
    const handleDownloadUserList = async () => {
        if (!tagCategoriesData || tempSelectedTags.size === 0) {
            toaster.create({
                title: '请先选择标签',
                type: 'warning',
                duration: 3000,
            });
            return;
        }

        try {
            // 构建标签选择参数
            const tagSelections: Array<{ tagId: string; value: string }> = [];
            Object.values(tagCategoriesData).forEach((tags) => {
                tags.forEach((tag) => {
                    if (tempSelectedTags.has(tag.id)) {
                        tagSelections.push({
                            tagId: tag.tagId,
                            value: tag.value,
                        });
                    }
                });
            });

            // 调用API获取用户清单
            const users = await getUsersByTagsMutation.mutateAsync({
                tagSelections,
            });

            if (users.length === 0) {
                toaster.create({
                    title: '没有符合条件的用户',
                    type: 'info',
                    duration: 3000,
                });
                return;
            }

            // 生成CSV内容
            const headers = [
                '序号',
                '姓名',
                '角色',
                '手机号',
                'OA账号',
                '注册时间',
                '总积分',
                '可用积分',
                '参与活动数',
                '最后登录IP',
                '机构',
                '部门',
                '二级部门',
                '状态',
                '操作',
            ];
            const rows = users.map((user, index) => {
                const tagStr = user.tags
                    .map((t) => `${t.category}:${t.value}`)
                    .join('; ');
                return [
                    (index + 1).toString(), // 序号
                    user.name || '', // 姓名
                    tagStr, // 角色（标签）
                    user.phone || '', // 手机号
                    user.oaId || '', // OA账号
                    new Date(user.createdAt).toLocaleString('zh-CN'), // 注册时间
                    user.totalPoints.toString(), // 总积分
                    user.availablePoints.toString(), // 可用积分
                    user.activityCount.toString(), // 参与活动数
                    user.lastLoginIp || '', // 最后登录IP
                    user.organization || '', // 机构
                    user.department || '', // 部门
                    user.subDepartment || '', // 二级部门
                    user.status ? '启用' : '禁用', // 状态
                    '', // 操作（空）
                ];
            });

            // 创建CSV内容
            const csvContent = [
                headers.join(','),
                ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
            ].join('\n');

            // 添加BOM以支持中文
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], {
                type: 'text/csv;charset=utf-8;',
            });

            // 创建下载链接
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute(
                'download',
                `人员清单_${new Date().toISOString().slice(0, 10)}.csv`
            );
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toaster.create({
                title: `已导出 ${users.length} 位用户`,
                type: 'success',
                duration: 3000,
            });
        } catch (error) {
            console.error('下载失败:', error);
            toaster.create({
                title: '下载失败，请重试',
                type: 'error',
                duration: 3000,
            });
        }
    };

    // 内容模版相关状态 - 移到这里以便在useEffect中使用
    const [selectedSmsTemplate, setSelectedSmsTemplate] = useState<string>(
        taskPublish.selectedSmsTemplate
    );
    const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<string>(
        taskPublish.selectedEmailTemplate
    );
    const [selectedWechatTemplate, setSelectedWechatTemplate] =
        useState<string>(taskPublish.selectedWechatTemplate);
    const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
    const [isEditingSms, setIsEditingSms] = useState(false);
    const [currentSmsTemplate, setCurrentSmsTemplate] = useState({
        id: '',
        name: '',
        content: '',
    });

    // 邮件模版相关状态
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [currentEmailTemplate, setCurrentEmailTemplate] = useState({
        id: '',
        name: '',
        content: '',
    });

    // 微信小程序模版相关状态
    const [isWechatDialogOpen, setIsWechatDialogOpen] = useState(false);
    const [isEditingWechat, setIsEditingWechat] = useState(false);
    const [currentWechatTemplate, setCurrentWechatTemplate] = useState({
        id: '',
        name: '',
        content: '',
    });

    // 初始化积分选项 - 从数据字典加载
    useEffect(() => {
        if (testLevelDict && suggestionLevelDict) {
            // 检查是否是默认的硬编码值（通过检查第一个标签是否为"致命"）
            const isDefaultValues =
                pointsOptions.length === 7 &&
                pointsOptions[0]?.label === '致命';

            if (isDefaultValues) {
                const newPointsOptions: PointsOption[] = [];

                // 添加测试等级
                testLevelDict.items
                    .sort((a, b) => a.sort - b.sort)
                    .forEach((item) => {
                        newPointsOptions.push({
                            label: item.label,
                            value: parseInt(item.value || '0'),
                            unit: '积分',
                        });
                    });

                // 添加建议等级
                suggestionLevelDict.items
                    .sort((a, b) => a.sort - b.sort)
                    .forEach((item) => {
                        newPointsOptions.push({
                            label: item.label,
                            value: parseInt(item.value || '0'),
                            unit: '积分',
                        });
                    });

                setPointsOptions(newPointsOptions);
            }
        }
    }, [testLevelDict, suggestionLevelDict]);

    // 同步到store
    useEffect(() => {
        setTaskPublish({
            personTags,
            selectedTagIds: Array.from(selectedTagIds),
            taskDate,
            participants,
            executePoints,
            ruleFilter,
            pointsOptions,
            emailNotify,
            emailContent,
            selectedEmailTemplate,
            smsNotify,
            smsContent,
            selectedSmsTemplate,
            groupInvite,
            thumbnailImage,
            wechatContent,
            selectedWechatTemplate,
        });
    }, [
        personTags,
        selectedTagIds,
        taskDate,
        participants,
        executePoints,
        ruleFilter,
        pointsOptions,
        emailNotify,
        emailContent,
        selectedEmailTemplate,
        smsNotify,
        smsContent,
        selectedSmsTemplate,
        groupInvite,
        thumbnailImage,
        wechatContent,
        selectedWechatTemplate,
        setTaskPublish,
    ]);

    // 打开标签配置对话框
    const handleOpenTagDialog = () => {
        setTempSelectedTags(new Set(selectedTagIds));
        setIsTagDialogOpen(true);
    };

    // 关闭对话框
    const handleCloseTagDialog = () => {
        setIsTagDialogOpen(false);
    };

    // 切换标签选择
    const handleToggleTag = (tagId: string) => {
        const newSelected = new Set(tempSelectedTags);
        if (newSelected.has(tagId)) {
            newSelected.delete(tagId);
        } else {
            newSelected.add(tagId);
        }
        setTempSelectedTags(newSelected);
    };

    // 确认选择标签
    const handleConfirmTags = () => {
        setSelectedTagIds(tempSelectedTags);

        // 根据选中的ID获取标签文本
        const selectedTagLabels: string[] = [];
        if (tagCategoriesData) {
            Object.values(tagCategoriesData).forEach((tags) => {
                tags.forEach((tag) => {
                    if (tempSelectedTags.has(tag.id)) {
                        selectedTagLabels.push(tag.name);
                    }
                });
            });
        }

        setPersonTags(selectedTagLabels);
        setIsTagDialogOpen(false);
    };

    // 计算已选人数（去重）
    const calculateSelectedCount = () => {
        const uniqueUserIds = new Set<string>();
        if (tagCategoriesData) {
            Object.values(tagCategoriesData).forEach((tags) => {
                tags.forEach((tag) => {
                    if (selectedTagIds.has(tag.id)) {
                        // 将该标签的所有用户ID添加到Set中，自动去重
                        tag.userIds.forEach((userId) =>
                            uniqueUserIds.add(userId)
                        );
                    }
                });
            });
        }
        return uniqueUserIds.size;
    };

    // 删除标签
    const handleRemoveTag = (tagLabel: string) => {
        // 从personTags中移除
        setPersonTags(personTags.filter((tag) => tag !== tagLabel));

        // 从selectedTagIds中移除对应的ID
        const newSelectedIds = new Set(selectedTagIds);
        if (tagCategoriesData) {
            Object.values(tagCategoriesData).forEach((tags) => {
                tags.forEach((tag) => {
                    if (tag.name === tagLabel) {
                        newSelectedIds.delete(tag.id);
                    }
                });
            });
        }
        setSelectedTagIds(newSelectedIds);
    };

    // 上一步
    const handlePrevious = () => {
        // 将当前页面的数据同步到 store，确保返回测试设计页面时数据不会丢失
        setTaskPublish({
            personTags,
            selectedTagIds: Array.from(selectedTagIds),
            taskDate,
            participants,
            executePoints,
            ruleFilter,
            pointsOptions,
            emailNotify,
            emailContent,
            selectedEmailTemplate,
            smsNotify,
            smsContent,
            selectedSmsTemplate,
            groupInvite,
            thumbnailImage,
            wechatContent,
            selectedWechatTemplate,
        });
        router.push('/crowdsource/publish/testDesign');
    };

    // 保存任务mutation
    const saveTaskMutation = api.taskPublish.save.useMutation({
        onSuccess: (data) => {
            toaster.create({
                title: data.message,
                type: 'success',
                duration: 2000,
            });
            // 清空store
            reset();
            // 跳转到审核页面
            router.push('/crowdsource/review');
        },
        onError: (error) => {
            toaster.create({
                title: error.message || '保存失败',
                type: 'error',
                duration: 3000,
            });
        },
    });

    // 更新任务mutation
    const utils = api.useUtils();
    const updateTaskMutation = api.taskPublish.update.useMutation({
        onSuccess: (data) => {
            const taskId = useTaskPublishStore.getState().currentTaskId;

            toaster.create({
                title: data.message,
                type: 'success',
                duration: 2000,
            });
            // 使审核列表缓存失效，强制重新获取数据
            void utils.review.list.invalidate();
            // 使特定任务详情缓存失效，确保下次编辑时获取最新数据
            if (taskId) {
                void utils.taskPublish.getById.invalidate({ id: taskId });
            }
            // 使所有任务详情缓存失效
            void utils.taskPublish.getById.invalidate();
            // 清空store
            reset();
            // 跳转到审核页面
            router.push('/crowdsource/review');
        },
        onError: (error) => {
            toaster.create({
                title: error.message || '更新失败',
                type: 'error',
                duration: 3000,
            });
        },
    });

    // 保存
    const handleSave = () => {
        // 验证必填字段
        if (!taskDate) {
            toaster.create({
                title: '请选择结束日期',
                type: 'error',
                duration: 3000,
            });
            return;
        }
        if (!participants) {
            toaster.create({
                title: '请输入参测人数',
                type: 'error',
                duration: 3000,
            });
            return;
        }
        if (!executePoints) {
            toaster.create({
                title: '请输入执行积分',
                type: 'error',
                duration: 3000,
            });
            return;
        }

        // 验证测试用例数据
        const invalidTestCases = testDesign.testCases.filter(tc =>
            !tc.name || tc.name.trim() === '' || !tc.system || tc.system.trim() === ''
        );

        if (invalidTestCases.length > 0) {
            toaster.create({
                title: '存在无效的测试用例',
                description: '请检查测试用例的名称和所属系统是否完整',
                type: 'error',
                duration: 3000,
            });
            return;
        }

        const taskData = {
            basicInfo,
            testDesign,
            taskPublish: {
                personTags,
                selectedTagIds: Array.from(selectedTagIds),
                taskDate,
                participants,
                executePoints,
                ruleFilter,
                pointsOptions,
                emailNotify,
                emailContent,
                selectedEmailTemplate,
                smsNotify,
                smsContent,
                selectedSmsTemplate,
                groupInvite,
                thumbnailImage,
                wechatContent,
                selectedWechatTemplate,
            },
            isDraft: true,
        };

        // 判断是编辑模式还是新增模式
        if (useTaskPublishStore.getState().currentTaskId) {
            // 编辑模式：调用update
            updateTaskMutation.mutate({
                id: useTaskPublishStore.getState().currentTaskId!,
                data: taskData,
            });
        } else {
            // 新增模式：调用save
            saveTaskMutation.mutate(taskData);
        }
    };

    // 提交
    const handleSubmit = () => {
        // 验证必填字段
        if (!taskDate) {
            toaster.create({
                title: '请选择结束日期',
                type: 'error',
                duration: 3000,
            });
            return;
        }
        if (!participants) {
            toaster.create({
                title: '请输入参测人数',
                type: 'error',
                duration: 3000,
            });
            return;
        }
        if (!executePoints) {
            toaster.create({
                title: '请输入执行积分',
                type: 'error',
                duration: 3000,
            });
            return;
        }

        // 验证测试用例数据
        const invalidTestCases = testDesign.testCases.filter(tc =>
            !tc.name || tc.name.trim() === '' || !tc.system || tc.system.trim() === ''
        );

        if (invalidTestCases.length > 0) {
            toaster.create({
                title: '存在无效的测试用例',
                description: '请检查测试用例的名称和所属系统是否完整',
                type: 'error',
                duration: 3000,
            });
            return;
        }

        const taskData = {
            basicInfo,
            testDesign,
            taskPublish: {
                personTags,
                selectedTagIds: Array.from(selectedTagIds),
                taskDate,
                participants,
                executePoints,
                ruleFilter,
                pointsOptions,
                emailNotify,
                emailContent,
                selectedEmailTemplate,
                smsNotify,
                smsContent,
                selectedSmsTemplate,
                groupInvite,
                thumbnailImage,
                wechatContent,
                selectedWechatTemplate,
            },
            isDraft: false,
        };

        // 判断是编辑模式还是新增模式
        if (useTaskPublishStore.getState().currentTaskId) {
            // 编辑模式：调用update
            updateTaskMutation.mutate({
                id: useTaskPublishStore.getState().currentTaskId!,
                data: taskData,
            });
        } else {
            // 新增模式：调用save
            saveTaskMutation.mutate(taskData);
        }
    };

    // 打开添加内容模版对话框
    const handleOpenAddSmsDialog = () => {
        setIsEditingSms(false);
        setCurrentSmsTemplate({
            id: Date.now().toString(),
            name: '',
            content: '',
        });
        setIsSmsDialogOpen(true);
    };

    // 打开编辑内容模版对话框
    const handleOpenEditSmsDialog = () => {
        if (!selectedSmsTemplate) {
            alert('请先选择一个内容模版');
            return;
        }
        const template = smsTemplatesData?.find(
            (t) => t.id === selectedSmsTemplate
        );
        if (template) {
            setIsEditingSms(true);
            setCurrentSmsTemplate({
                id: template.id,
                name: template.name,
                content: template.content,
            });
            setIsSmsDialogOpen(true);
        }
    };

    // 保存内容模版
    const handleSaveSmsTemplate = async () => {
        if (!currentSmsTemplate.name.trim()) {
            alert('请输入模版名称');
            return;
        }
        if (!currentSmsTemplate.content.trim()) {
            alert('请输入模版内容');
            return;
        }

        try {
            if (isEditingSms) {
                // 编辑模式：更新现有模板
                await updateSmsMutation.mutateAsync({
                    id: currentSmsTemplate.id,
                    name: currentSmsTemplate.name,
                    content: currentSmsTemplate.content,
                });
            } else {
                // 添加模式：新增模板
                const newTemplate = await createSmsMutation.mutateAsync({
                    name: currentSmsTemplate.name,
                    type: 'SMS',
                    content: currentSmsTemplate.content,
                });
                setSelectedSmsTemplate(newTemplate.id);
            }

            // 更新显示内容
            setSmsContent(currentSmsTemplate.content);
            setIsSmsDialogOpen(false);
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败，请重试');
        }
    };

    // 选择内容模版
    const handleSelectSmsTemplate = (templateId: string) => {
        setSelectedSmsTemplate(templateId);
        const template = smsTemplatesData?.find((t) => t.id === templateId);
        if (template) {
            setSmsContent(template.content);
        }
    };

    // 删除蓝信模版
    const handleDeleteSmsTemplate = async () => {
        if (!selectedSmsTemplate) {
            alert('请先选择一个内容模版');
            return;
        }
        if (!confirm('确定要删除该模版吗?')) {
            return;
        }
        try {
            await deleteSmsMutation.mutateAsync({ id: selectedSmsTemplate });
            setSelectedSmsTemplate('');
            setSmsContent('');
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败，请重试');
        }
    };

    // 邮件模版相关处理函数
    const handleOpenAddEmailDialog = () => {
        setIsEditingEmail(false);
        setCurrentEmailTemplate({
            id: Date.now().toString(),
            name: '',
            content: '',
        });
        setIsEmailDialogOpen(true);
    };

    const handleOpenEditEmailDialog = () => {
        if (!selectedEmailTemplate) {
            alert('请先选择一个邮件模版');
            return;
        }
        const template = emailTemplatesData?.find(
            (t) => t.id === selectedEmailTemplate
        );
        if (template) {
            setIsEditingEmail(true);
            setCurrentEmailTemplate({
                id: template.id,
                name: template.name,
                content: template.content,
            });
            setIsEmailDialogOpen(true);
        }
    };

    const handleSaveEmailTemplate = async () => {
        if (!currentEmailTemplate.name.trim()) {
            alert('请输入模版名称');
            return;
        }
        if (!currentEmailTemplate.content.trim()) {
            alert('请输入模版内容');
            return;
        }

        try {
            if (isEditingEmail) {
                await updateEmailMutation.mutateAsync({
                    id: currentEmailTemplate.id,
                    name: currentEmailTemplate.name,
                    content: currentEmailTemplate.content,
                });
            } else {
                const newTemplate = await createEmailMutation.mutateAsync({
                    name: currentEmailTemplate.name,
                    type: 'EMAIL',
                    content: currentEmailTemplate.content,
                });
                setSelectedEmailTemplate(newTemplate.id);
            }

            setEmailContent(currentEmailTemplate.content);
            setIsEmailDialogOpen(false);
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败，请重试');
        }
    };

    const handleSelectEmailTemplate = (templateId: string) => {
        setSelectedEmailTemplate(templateId);
        const template = emailTemplatesData?.find((t) => t.id === templateId);
        if (template) {
            setEmailContent(template.content);
        }
    };

    // 删除邮件模版
    const handleDeleteEmailTemplate = async () => {
        if (!selectedEmailTemplate) {
            alert('请先选择一个邮件模版');
            return;
        }
        if (!confirm('确定要删除该模版吗?')) {
            return;
        }
        try {
            await deleteEmailMutation.mutateAsync({
                id: selectedEmailTemplate,
            });
            setSelectedEmailTemplate('');
            setEmailContent('');
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败，请重试');
        }
    };

    // 微信小程序模版相关处理函数
    const handleOpenAddWechatDialog = () => {
        setIsEditingWechat(false);
        setCurrentWechatTemplate({
            id: Date.now().toString(),
            name: '',
            content: '',
        });
        setIsWechatDialogOpen(true);
    };

    const handleOpenEditWechatDialog = () => {
        if (!selectedWechatTemplate) {
            alert('请先选择一个微信小程序模版');
            return;
        }
        const template = wechatTemplatesData?.find(
            (t) => t.id === selectedWechatTemplate
        );
        if (template) {
            setIsEditingWechat(true);
            setCurrentWechatTemplate({
                id: template.id,
                name: template.name,
                content: template.content,
            });
            setIsWechatDialogOpen(true);
        }
    };

    const handleSaveWechatTemplate = async () => {
        if (!currentWechatTemplate.name.trim()) {
            alert('请输入模版名称');
            return;
        }
        if (!currentWechatTemplate.content.trim()) {
            alert('请输入模版内容');
            return;
        }

        try {
            if (isEditingWechat) {
                await updateWechatMutation.mutateAsync({
                    id: currentWechatTemplate.id,
                    name: currentWechatTemplate.name,
                    content: currentWechatTemplate.content,
                });
            } else {
                const newTemplate = await createWechatMutation.mutateAsync({
                    name: currentWechatTemplate.name,
                    type: 'WECHAT',
                    content: currentWechatTemplate.content,
                });
                setSelectedWechatTemplate(newTemplate.id);
            }

            setWechatContent(currentWechatTemplate.content);
            setIsWechatDialogOpen(false);
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败，请重试');
        }
    };

    const handleSelectWechatTemplate = (templateId: string) => {
        setSelectedWechatTemplate(templateId);
        const template = wechatTemplatesData?.find((t) => t.id === templateId);
        if (template) {
            setWechatContent(template.content);
        }
    };

    // 删除微信小程序模版
    const handleDeleteWechatTemplate = async () => {
        if (!selectedWechatTemplate) {
            alert('请先选择一个微信小程序模版');
            return;
        }
        if (!confirm('确定要删除该模版吗?')) {
            return;
        }
        try {
            await deleteWechatMutation.mutateAsync({
                id: selectedWechatTemplate,
            });
            setSelectedWechatTemplate('');
            setWechatContent('');
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败，请重试');
        }
    };

    return (
        <Box minH="100vh" bg="#F7F8FA">
            <Container maxW="1200px" py={10}>
                {/* 步骤指示器 */}
                <StepIndicator />

                {/* 表单卡片 */}
                <Box bg="white" borderRadius="lg" boxShadow="sm" p={8}>
                    <Heading as="h2" size="lg" color="#1d2129" mb={8}>
                        任务发布
                    </Heading>

                    <VStack gap={6} align="stretch">
                        {/* 人员标签 */}
                        <Field.Root required>
                            <Field.Label fontSize="14px" color="#1d2129" mb={2}>
                                人员标签
                            </Field.Label>
                            <Flex gap={2} wrap="wrap" mb={2}>
                                {personTags.map((tag, index) => (
                                    <Flex
                                        key={index}
                                        align="center"
                                        bg="#F2F3F5"
                                        borderRadius="4px"
                                        px={3}
                                        py={1}
                                        gap={2}
                                    >
                                        <Text fontSize="14px" color="#4E5969">
                                            {tag}
                                        </Text>
                                        <IconButton
                                            aria-label="删除标签"
                                            size="xs"
                                            variant="ghost"
                                            onClick={() => handleRemoveTag(tag)}
                                        >
                                            <X size={14} />
                                        </IconButton>
                                    </Flex>
                                ))}
                            </Flex>
                            <Flex gap={2} align="center">
                                <Button
                                    variant="outline"
                                    borderColor="#E5E6EB"
                                    color="#4E5969"
                                    flex={1}
                                    onClick={handleOpenTagDialog}
                                    justifyContent="flex-start"
                                    bg="#F7F8FA"
                                >
                                    请选择标签
                                </Button>
                                {selectedTagIds.size > 0 && (
                                    <Text fontSize="14px" color="#165DFF">
                                        已选择：{calculateSelectedCount()}人
                                    </Text>
                                )}
                            </Flex>
                        </Field.Root>

                        {/* 结束日期 */}
                        <Field.Root required>
                            <Field.Label fontSize="14px" color="#1d2129" mb={2}>
                                结束日期
                            </Field.Label>
                            <Input
                                type="date"
                                value={taskDate}
                                onChange={(e) => setTaskDate(e.target.value)}
                                bg="#F7F8FA"
                                borderColor="#E5E6EB"
                                _hover={{ borderColor: '#C9CDD4' }}
                                _focus={{
                                    borderColor: '#E31424',
                                    boxShadow: '0 0 0 1px #E31424',
                                }}
                            />
                        </Field.Root>

                        {/* 参测人数 */}
                        <Field.Root required>
                            <Field.Label fontSize="14px" color="#1d2129" mb={2}>
                                参测人数
                            </Field.Label>
                            <Input
                                type="number"
                                placeholder="请输入参测人数"
                                value={participants}
                                onChange={(e) =>
                                    setParticipants(e.target.value)
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

                        {/* 积分分配规则 */}
                        <Field.Root required>
                            <Field.Label fontSize="14px" color="#1d2129" mb={2}>
                                积分分配规则
                            </Field.Label>
                            <Flex gap={2}>
                                <NativeSelectRoot flex={1}>
                                    <NativeSelectField
                                        placeholder="请选择积分分配规则"
                                        value={ruleFilter}
                                        onChange={(e) =>
                                            setRuleFilter(e.target.value.toString())
                                        }
                                        bg="#F7F8FA"
                                        borderColor="#E5E6EB"
                                    >
                                        {Object.entries(RULE_STATUS_MAP).map(
                                            ([key, value]) => (
                                                <option key={key} value={key}>
                                                    {value.label}
                                                </option>
                                            )
                                        )}
                                    </NativeSelectField>
                                </NativeSelectRoot>
                            </Flex>
                        </Field.Root>

                        {/* 积分奖励 */}
                        <Field.Root required>
                            <Field.Label fontSize="14px" color="#1d2129" mb={2}>
                                缺陷奖励
                            </Field.Label>
                            <Box
                                bg="#F7F8FA"
                                borderRadius="8px"
                                p={4}
                                borderWidth="1px"
                                borderColor="#E5E6EB"
                            >
                                <Flex gap={4} wrap="wrap">
                                    {pointsOptions.map((option, index) => (
                                        <Flex
                                            key={index}
                                            align="center"
                                            gap={2}
                                            minW="150px"
                                        >
                                            <Text
                                                fontSize="14px"
                                                color="#4E5969"
                                                minW="80px"
                                            >
                                                {option.label}:
                                            </Text>
                                            <Input
                                                type="number"
                                                value={option.value}
                                                size="sm"
                                                w="80px"
                                                bg="white"
                                                borderColor="#E5E6EB"
                                                disabled={!isEditingPoints}
                                                onChange={(e) => {
                                                    const newPoints = parseInt(
                                                        e.target.value
                                                    );
                                                    const updatedPoints = [
                                                        ...pointsOptions,
                                                    ];
                                                    updatedPoints[index].value =
                                                        newPoints;
                                                    setPointsOptions(
                                                        updatedPoints
                                                    );
                                                    console.log(
                                                        'Updated Points Options:',
                                                        pointsOptions
                                                    );
                                                }}
                                                _disabled={{
                                                    opacity: 0.6,
                                                    cursor: 'not-allowed',
                                                }}
                                            />
                                            <Text
                                                fontSize="14px"
                                                color="#4E5969"
                                            >
                                                {option.unit}
                                            </Text>
                                        </Flex>
                                    ))}
                                </Flex>
                            </Box>
                            <Button
                                variant="plain"
                                color="#165DFF"
                                fontSize="14px"
                                mt={2}
                                p={0}
                                onClick={() =>
                                    setIsEditingPoints(!isEditingPoints)
                                }
                            >
                                {isEditingPoints ? '完成' : '编辑'}
                            </Button>
                        </Field.Root>

                        {/* 执行积分 */}
                        <Field.Root required>
                            <Field.Label fontSize="14px" color="#1d2129" mb={2}>
                                执行积分
                            </Field.Label>
                            <Input
                                type="number"
                                placeholder="请输入执行积分"
                                value={executePoints}
                                onChange={(e) =>
                                    setExecutePoints(e.target.value)
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

                        {/* 蓝信通知 */}
                        <Field.Root>
                            <Flex align="center" gap={3} mb={2}>
                                <Field.Label
                                    fontSize="14px"
                                    color="#1d2129"
                                    mb={0}
                                >
                                    蓝信通知
                                </Field.Label>
                                <Switch
                                    checked={smsNotify}
                                    onCheckedChange={(e) =>
                                        setSmsNotify(e.checked)
                                    }
                                    colorPalette="red"
                                />
                            </Flex>
                            {smsNotify && (
                                <>
                                    <Flex gap={2} mb={2} align="center">
                                        <NativeSelectRoot flex={1}>
                                            <NativeSelectField
                                                placeholder="请选择内容模版"
                                                value={selectedSmsTemplate}
                                                onChange={(e) =>
                                                    handleSelectSmsTemplate(
                                                        e.target.value
                                                    )
                                                }
                                                bg="#F7F8FA"
                                                borderColor="#E5E6EB"
                                            >
                                                {smsTemplatesData?.map(
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
                                        <IconButton
                                            aria-label="删除模版"
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleDeleteSmsTemplate}
                                            disabled={!selectedSmsTemplate}
                                            color={
                                                selectedSmsTemplate
                                                    ? '#E31424'
                                                    : '#C9CDD4'
                                            }
                                            _hover={{ bg: '#FFF0F0' }}
                                        >
                                            <X size={18} />
                                        </IconButton>
                                    </Flex>
                                    <Flex gap={2} mb={2}>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            borderColor="#E5E6EB"
                                            color="#4E5969"
                                            onClick={handleOpenAddSmsDialog}
                                        >
                                            添加
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            borderColor="#E5E6EB"
                                            color="#4E5969"
                                            onClick={handleOpenEditSmsDialog}
                                        >
                                            编辑
                                        </Button>
                                    </Flex>
                                    <Textarea
                                        placeholder="请输入"
                                        value={smsContent}
                                        onChange={(e) =>
                                            setSmsContent(e.target.value)
                                        }
                                        bg="#F7F8FA"
                                        borderColor="#E5E6EB"
                                        rows={6}
                                        _hover={{ borderColor: '#C9CDD4' }}
                                        _focus={{
                                            borderColor: '#E31424',
                                            boxShadow: '0 0 0 1px #E31424',
                                        }}
                                    />
                                </>
                            )}
                        </Field.Root>

                        {/* 邮件通知 */}
                        <Field.Root>
                            <Flex align="center" gap={3} mb={2}>
                                <Field.Label
                                    fontSize="14px"
                                    color="#1d2129"
                                    mb={0}
                                >
                                    邮件通知
                                </Field.Label>
                                <Switch
                                    checked={emailNotify}
                                    onCheckedChange={(e) =>
                                        setEmailNotify(e.checked)
                                    }
                                    colorPalette="red"
                                />
                            </Flex>
                            {emailNotify && (
                                <>
                                    <Flex gap={2} mb={2} align="center">
                                        <NativeSelectRoot flex={1}>
                                            <NativeSelectField
                                                placeholder="请选择内容模板"
                                                value={selectedEmailTemplate}
                                                onChange={(e) =>
                                                    handleSelectEmailTemplate(
                                                        e.target.value
                                                    )
                                                }
                                                bg="#F7F8FA"
                                                borderColor="#E5E6EB"
                                            >
                                                {emailTemplatesData?.map(
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
                                        <IconButton
                                            aria-label="删除模版"
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleDeleteEmailTemplate}
                                            disabled={!selectedEmailTemplate}
                                            color={
                                                selectedEmailTemplate
                                                    ? '#E31424'
                                                    : '#C9CDD4'
                                            }
                                            _hover={{ bg: '#FFF0F0' }}
                                        >
                                            <X size={18} />
                                        </IconButton>
                                    </Flex>
                                    <Flex gap={2} mb={2}>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            borderColor="#E5E6EB"
                                            color="#4E5969"
                                            onClick={handleOpenAddEmailDialog}
                                        >
                                            添加
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            borderColor="#E5E6EB"
                                            color="#4E5969"
                                            onClick={handleOpenEditEmailDialog}
                                        >
                                            编辑
                                        </Button>
                                    </Flex>
                                    <RichTextEditor
                                        value={emailContent}
                                        onChange={setEmailContent}
                                        placeholder="请输入邮件内容"
                                        minHeight="200px"
                                    />
                                </>
                            )}
                        </Field.Root>

                        {/* 微信小程序通知 */}
                        <Field.Root>
                            <Flex align="center" gap={3} mb={2}>
                                <Field.Label
                                    fontSize="14px"
                                    color="#1d2129"
                                    mb={0}
                                >
                                    微信小程序通知
                                </Field.Label>
                                <Switch
                                    checked={groupInvite}
                                    onCheckedChange={(e) =>
                                        setGroupInvite(e.checked)
                                    }
                                    colorPalette="red"
                                />
                            </Flex>
                            {groupInvite && (
                                <>
                                    <Flex gap={2} mb={2} align="center">
                                        <NativeSelectRoot flex={1}>
                                            <NativeSelectField
                                                placeholder="请选择内容模板"
                                                value={selectedWechatTemplate}
                                                onChange={(e) =>
                                                    handleSelectWechatTemplate(
                                                        e.target.value
                                                    )
                                                }
                                                bg="#F7F8FA"
                                                borderColor="#E5E6EB"
                                            >
                                                {wechatTemplatesData?.map(
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
                                        <IconButton
                                            aria-label="删除模版"
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleDeleteWechatTemplate}
                                            disabled={!selectedWechatTemplate}
                                            color={
                                                selectedWechatTemplate
                                                    ? '#E31424'
                                                    : '#C9CDD4'
                                            }
                                            _hover={{ bg: '#FFF0F0' }}
                                        >
                                            <X size={18} />
                                        </IconButton>
                                    </Flex>
                                    <Flex gap={2} mb={2}>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            borderColor="#E5E6EB"
                                            color="#4E5969"
                                            onClick={handleOpenAddWechatDialog}
                                        >
                                            添加
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            borderColor="#E5E6EB"
                                            color="#4E5969"
                                            onClick={handleOpenEditWechatDialog}
                                        >
                                            编辑
                                        </Button>
                                    </Flex>
                                    <Textarea
                                        placeholder="请输入"
                                        value={wechatContent}
                                        onChange={(e) =>
                                            setWechatContent(e.target.value)
                                        }
                                        bg="#F7F8FA"
                                        borderColor="#E5E6EB"
                                        rows={6}
                                        _hover={{ borderColor: '#C9CDD4' }}
                                        _focus={{
                                            borderColor: '#E31424',
                                            boxShadow: '0 0 0 1px #E31424',
                                        }}
                                    />
                                </>
                            )}
                        </Field.Root>

                        {/* 上传缩略图 */}
                        <Field.Root>
                            <Field.Label fontSize="14px" color="#1d2129" mb={2}>
                                上传缩略图
                            </Field.Label>
                            <Flex
                                direction="column"
                                align="center"
                                justify="center"
                                borderWidth="1px"
                                borderStyle="dashed"
                                borderColor="#E5E6EB"
                                borderRadius="8px"
                                p={8}
                                bg="#FAFAFA"
                                cursor="pointer"
                                _hover={{ borderColor: '#C9CDD4' }}
                            >
                                {thumbnailImage ? (
                                    <VStack gap={3} w="100%">
                                        <Image
                                            src={thumbnailImage}
                                            alt="上传的图片"
                                            maxH="200px"
                                            borderRadius="4px"
                                        />
                                        <Flex gap={2}>
                                            <Box as="label" cursor="pointer">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    borderColor="#E5E6EB"
                                                    color="#4E5969"
                                                    as="span"
                                                >
                                                    重新上传
                                                </Button>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    display="none"
                                                    onChange={(e) => {
                                                        const file =
                                                            e.target.files?.[0];
                                                        if (file) {
                                                            const reader =
                                                                new FileReader();
                                                            reader.onloadend =
                                                                () => {
                                                                    setthumbnailImage(
                                                                        reader.result as string
                                                                    );
                                                                };
                                                            reader.readAsDataURL(
                                                                file
                                                            );
                                                        }
                                                        // 重置 input 值，允许选择相同文件
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </Box>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                borderColor="#E5E6EB"
                                                color="#E31424"
                                                onClick={() =>
                                                    setthumbnailImage(null)
                                                }
                                            >
                                                删除
                                            </Button>
                                        </Flex>
                                    </VStack>
                                ) : (
                                    <Box
                                        as="label"
                                        w="80px"
                                        h="80px"
                                        borderRadius="8px"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        cursor="pointer"
                                        mb={3}
                                    >
                                        <Text fontSize="100px" color="#ddd">
                                            +
                                        </Text>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            display="none"
                                            onChange={(e) => {
                                                const file =
                                                    e.target.files?.[0];
                                                if (file) {
                                                    const reader =
                                                        new FileReader();
                                                    reader.onloadend = () => {
                                                        setthumbnailImage(
                                                            reader.result as string
                                                        );
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                                // 重置 input 值，允许选择相同文件
                                                e.target.value = '';
                                            }}
                                        />
                                    </Box>
                                )}
                            </Flex>
                        </Field.Root>
                    </VStack>

                    {/* 底部按钮 */}
                    <Flex justify="center" gap={4} mt={10}>
                        <Button
                            variant="outline"
                            borderColor="#E5E6EB"
                            color="#4E5969"
                            fontSize="14px"
                            fontWeight="500"
                            borderRadius="999px"
                            h="40px"
                            px={12}
                            onClick={handlePrevious}
                            _hover={{
                                borderColor: '#C9CDD4',
                                bg: '#FAFAFA',
                            }}
                        >
                            上一步
                        </Button>
                        <Button
                            variant="outline"
                            borderColor="#E5E6EB"
                            color="#4E5969"
                            fontSize="14px"
                            fontWeight="500"
                            borderRadius="999px"
                            h="40px"
                            px={12}
                            onClick={handleSave}
                            _hover={{
                                borderColor: '#C9CDD4',
                                bg: '#FAFAFA',
                            }}
                        >
                            保存
                        </Button>
                        <Button
                            bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                            color="white"
                            fontSize="14px"
                            fontWeight="500"
                            borderRadius="999px"
                            h="40px"
                            px={12}
                            onClick={handleSubmit}
                            _hover={{
                                opacity: 0.9,
                            }}
                        >
                            确认
                        </Button>
                    </Flex>
                </Box>

                {/* 标签配置对话框 */}
                <DialogRoot
                    open={isTagDialogOpen}
                    onOpenChange={(e) => setIsTagDialogOpen(e.open)}
                    size="xl"
                    placement="center"
                    motionPreset="slide-in-bottom"
                >
                    <DialogBackdrop />
                    <DialogContent
                        maxW="800px"
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
                                配置标签
                            </DialogTitle>
                            <DialogCloseTrigger />
                        </DialogHeader>
                        <DialogBody>
                            <VStack
                                gap={4}
                                align="stretch"
                                maxH="60vh"
                                overflowY="auto"
                            >
                                {tagCategoriesData &&
                                    Object.entries(tagCategoriesData).map(
                                        ([category, tags]) => (
                                            <Box key={category}>
                                                <Text
                                                    fontSize="14px"
                                                    fontWeight="500"
                                                    color="#4E5969"
                                                    mb={3}
                                                    bg="#F2F3F5"
                                                    px={4}
                                                    py={2}
                                                >
                                                    {category}
                                                </Text>
                                                <Flex
                                                    gap={3}
                                                    wrap="wrap"
                                                    px={4}
                                                >
                                                    {tags.map((tag) => (
                                                        <Checkbox
                                                            key={tag.id}
                                                            checked={tempSelectedTags.has(
                                                                tag.id
                                                            )}
                                                            onCheckedChange={() =>
                                                                handleToggleTag(
                                                                    tag.id
                                                                )
                                                            }
                                                            colorPalette="red"
                                                        >
                                                            <Text
                                                                fontSize="14px"
                                                                color="#1d2129"
                                                            >
                                                                {tag.name}{' '}
                                                                {tag.userCount}
                                                                人
                                                            </Text>
                                                        </Checkbox>
                                                    ))}
                                                </Flex>
                                            </Box>
                                        )
                                    )}
                            </VStack>
                        </DialogBody>
                        <DialogFooter>
                            <Flex
                                justify="space-between"
                                align="center"
                                w="100%"
                            >
                                <Text
                                    fontSize="14px"
                                    color="#165DFF"
                                    display="flex"
                                    alignItems="center"
                                >
                                    已选择：
                                    {(() => {
                                        const uniqueUserIds = new Set<string>();
                                        if (tagCategoriesData) {
                                            Object.values(
                                                tagCategoriesData
                                            ).forEach((tags) => {
                                                tags.forEach((tag) => {
                                                    if (
                                                        tempSelectedTags.has(
                                                            tag.id
                                                        )
                                                    ) {
                                                        // 将该标签的所有用户ID添加到Set中，自动去重
                                                        tag.userIds.forEach(
                                                            (userId) =>
                                                                uniqueUserIds.add(
                                                                    userId
                                                                )
                                                        );
                                                    }
                                                });
                                            });
                                        }
                                        return uniqueUserIds.size;
                                    })()}
                                    人
                                    <Button
                                        variant="plain"
                                        color="#165DFF"
                                        fontSize="14px"
                                        ml={2}
                                        p={0}
                                        onClick={handleDownloadUserList}
                                    >
                                        下载人员清单
                                    </Button>
                                </Text>
                                <Flex gap={3}>
                                    <Button
                                        variant="outline"
                                        borderColor="#E5E6EB"
                                        color="#4E5969"
                                        onClick={handleCloseTagDialog}
                                    >
                                        取消
                                    </Button>
                                    <Button
                                        bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                                        color="white"
                                        onClick={handleConfirmTags}
                                    >
                                        确认
                                    </Button>
                                </Flex>
                            </Flex>
                        </DialogFooter>
                    </DialogContent>
                </DialogRoot>

                {/* 内容模版对话框 */}
                <DialogRoot
                    open={isSmsDialogOpen}
                    onOpenChange={(e) => setIsSmsDialogOpen(e.open)}
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
                                {isEditingSms ? '编辑内容模版' : '添加内容模版'}
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
                                        value={currentSmsTemplate.name}
                                        onChange={(e) =>
                                            setCurrentSmsTemplate({
                                                ...currentSmsTemplate,
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
                                        value={currentSmsTemplate.content}
                                        onChange={(e) =>
                                            setCurrentSmsTemplate({
                                                ...currentSmsTemplate,
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
                                    onClick={() => setIsSmsDialogOpen(false)}
                                >
                                    取消
                                </Button>
                                <Button
                                    bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                                    color="white"
                                    onClick={handleSaveSmsTemplate}
                                >
                                    保存
                                </Button>
                            </Flex>
                        </DialogFooter>
                    </DialogContent>
                </DialogRoot>

                {/* 邮件模版对话框 */}
                <DialogRoot
                    open={isEmailDialogOpen}
                    onOpenChange={(e) => setIsEmailDialogOpen(e.open)}
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
                                {isEditingEmail
                                    ? '编辑邮件模版'
                                    : '添加邮件模版'}
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
                                        value={currentEmailTemplate.name}
                                        onChange={(e) =>
                                            setCurrentEmailTemplate({
                                                ...currentEmailTemplate,
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
                                    <RichTextEditor
                                        value={currentEmailTemplate.content}
                                        onChange={(value) =>
                                            setCurrentEmailTemplate({
                                                ...currentEmailTemplate,
                                                content: value,
                                            })
                                        }
                                        placeholder="请输入邮件内容"
                                        minHeight="300px"
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
                                    onClick={() => setIsEmailDialogOpen(false)}
                                >
                                    取消
                                </Button>
                                <Button
                                    bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                                    color="white"
                                    onClick={handleSaveEmailTemplate}
                                >
                                    保存
                                </Button>
                            </Flex>
                        </DialogFooter>
                    </DialogContent>
                </DialogRoot>

                {/* 微信小程序模版对话框 */}
                <DialogRoot
                    open={isWechatDialogOpen}
                    onOpenChange={(e) => setIsWechatDialogOpen(e.open)}
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
                                {isEditingWechat
                                    ? '编辑微信小程序模版'
                                    : '添加微信小程序模版'}
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
                                        value={currentWechatTemplate.name}
                                        onChange={(e) =>
                                            setCurrentWechatTemplate({
                                                ...currentWechatTemplate,
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
                                        value={currentWechatTemplate.content}
                                        onChange={(e) =>
                                            setCurrentWechatTemplate({
                                                ...currentWechatTemplate,
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
                                    onClick={() => setIsWechatDialogOpen(false)}
                                >
                                    取消
                                </Button>
                                <Button
                                    bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                                    color="white"
                                    onClick={handleSaveWechatTemplate}
                                >
                                    保存
                                </Button>
                            </Flex>
                        </DialogFooter>
                    </DialogContent>
                </DialogRoot>
            </Container>
        </Box>
    );
}
