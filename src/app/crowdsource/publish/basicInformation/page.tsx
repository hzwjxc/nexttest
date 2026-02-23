'use client'

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
} from "@chakra-ui/react"
import { Field } from "@chakra-ui/react"
import { NativeSelectRoot, NativeSelectField } from "@chakra-ui/react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import FileUpload from "../_components/FileUpload"
import { Radio, RadioGroup } from "@/app/_components/ui/radio"
import { api } from "@/trpc/react"
import { useTaskPublishStore } from "../useTaskPublishStore"
import type { FileItem } from "../useTaskPublishStore"

const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    borderColor: '#E5E6EB',
};

// 步骤数据
const steps = [
    { number: 1, title: "基本信息", subtitle: "创建任务基本信息" },
    { number: 2, title: "测试设计", subtitle: "选择测试用例" },
    { number: 3, title: "任务发布", subtitle: "任务发布设置" },
]

// 步骤指示器组件
function StepIndicator() {
    const currentStep = 1

    return (
        <Flex justify="center" align="center" gap={0} mb={12}>
            {steps.map((step, index) => (
                <Flex key={step.number} align="center">
                    {/* 步骤圆圈 */}
                    <Flex direction="column" align="center" position="relative">
                        <Circle
                            size="48px"
                            bg={step.number === currentStep ? "#E31424" : step.number < currentStep ? "#FFE0E1" : "#F2F3F5"}
                            color={step.number === currentStep ? "white" : step.number < currentStep ? "#E31424" : "#86909C"}
                            fontSize="20px"
                            fontWeight="medium"
                        >
                            {step.number}
                        </Circle>
                        <VStack gap={0} mt={3} align="center">
                            <Text
                                fontSize="16px"
                                fontWeight="medium"
                                color={step.number === currentStep ? "#1d2129" : "#4e5969"}
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
                        <Box
                            w="200px"
                            h="2px"
                            bg="#E5E6EB"
                            mx={4}
                            mb={12}
                        />
                    )}
                </Flex>
            ))}
        </Flex>
    )
}

export default function PublishPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const taskId = searchParams.get('id')

    const { basicInfo, setBasicInfo, setCurrentTaskId, setTestDesign, setTaskPublish, currentTaskId } = useTaskPublishStore()

    const [taskSystem, setTaskSystem] = useState('')
    const [taskName, setTaskName] = useState('')
    const [taskDescription, setTaskDescription] = useState('')
    const [testType, setTestType] = useState('手机客户端')
    const [testRules, setTestRules] = useState('')
    const [testData, setTestData] = useState('')
    const [files, setFiles] = useState<FileItem[]>([])

    // 获取任务详情（编辑模式）
    const { data: taskData, isLoading } = api.taskPublish.getById.useQuery(
        { id: taskId! },
        {
            enabled: !!taskId,
            refetchOnMount: true,
            refetchOnWindowFocus: false,
            staleTime: 0, // 立即过期，强制重新获取
        }
    )

    // 当 taskId 变化时，更新 store 中的 currentTaskId
    useEffect(() => {
        if (taskId && currentTaskId !== taskId) {
            setCurrentTaskId(taskId);
        }
    }, [taskId, currentTaskId, setCurrentTaskId]);

    const initialized = useRef(false);

    // 初始化表单数据
    useEffect(() => {
        // 防止重复初始化
        if (initialized.current) {
            return;
        }
        
        // 检查是否已经加载了服务器数据
        const hasServerData = !!taskData;
        
        // 如果有 taskId 且没有服务器数据，则从 store 恢复（处理从任务发布流程返回的情况）
        if (taskId && !hasServerData && !isLoading) {
            setTaskSystem(basicInfo.taskSystem)
            setTaskName(basicInfo.taskName)
            setTaskDescription(basicInfo.taskDescription)
            setTestType(basicInfo.testType)
            setTestRules(basicInfo.testRules)
            setTestData(basicInfo.testData)
            setFiles(basicInfo.files)
            initialized.current = true;
        } else if (!taskId) {
            // 如果没有 taskId，直接从 store 恢复数据（处理全新创建任务的情况）
            setTaskSystem(basicInfo.taskSystem)
            setTaskName(basicInfo.taskName)
            setTaskDescription(basicInfo.taskDescription)
            setTestType(basicInfo.testType)
            setTestRules(basicInfo.testRules)
            setTestData(basicInfo.testData)
            setFiles(basicInfo.files)
            initialized.current = true;
        }
    }, [taskId, taskData, basicInfo, isLoading])

    // 当获取到任务数据时，填充表单
    useEffect(() => {
        if (taskData && taskId) {
            console.log('=== 开始加载任务数据 ===')
            console.log('任务ID:', taskId)
            console.log('任务数据:', taskData)
            console.log('参测人数:', taskData.maxParticipants)

            // 注意：这里不再重复调用 setCurrentTaskId，因为在第一个 useEffect 中已经处理

            // 转换测试类型
            let testTypeValue = '手机客户端'
            if (taskData.testTypes.includes('WEB')) {
                testTypeValue = 'PC客户端'
            } else if (taskData.testTypes.includes('VOICE')) {
                testTypeValue = '语音对话'
            }
            
            // 处理附件数据
            let processedAttachments: FileItem[] = [];
            if (taskData.attachments) {
                try {
                    // 处理附件数据：可能是对象数组或 JSON 字符串
                    let attachments = taskData.attachments
                    if (typeof attachments === 'string') {
                        attachments = JSON.parse(attachments)
                    }
                    console.log('解析的附件数据:', attachments)
                    processedAttachments = Array.isArray(attachments) ? attachments : []
                } catch (e) {
                    console.error('解析附件失败:', e)
                    processedAttachments = []
                }
            } else {
                console.log('没有附件数据')
                processedAttachments = []
            }

            // 填充基本信息
            setTaskSystem(taskData.system)
            setTaskName(taskData.title)
            setTaskDescription(taskData.description || '')
            setTestType(testTypeValue)
            setTestRules(taskData.testRules || '')
            setTestData(taskData.environment || '')
            setFiles(processedAttachments)

            // 填充测试设计
            if (taskData.testCases) {
                setTestDesign({
                    testCases: taskData.testCases.map((tc: any, index: number) => ({
                        id: index + 1,
                        sequence: index + 1,
                        system: tc.system,
                        // API 返回的是 name 和 testFocus，不是 title 和 explanation
                        name: tc.name || tc.title,
                        focus: tc.testFocus || tc.explanation || '',
                        originalId: tc.id,
                    })),
                    testPoints: taskData.testPoints || '',
                })
            }

            // 填充任务发布信息
            if (taskData.rewardConfig && taskData.notificationConfig) {
                // 从 pointsConfig JSON 字段读取动态配置
                let pointsOptions = [
                    { label: '致命', value: 40, unit: '积分' },
                    { label: '严重', value: 30, unit: '积分' },
                    { label: '一般', value: 20, unit: '积分' },
                    { label: '轻微', value: 10, unit: '积分' },
                    { label: '有效建议', value: 20, unit: '积分' },
                    { label: '特别优秀', value: 30, unit: '积分' },
                    { label: '无效', value: 0, unit: '积分' },
                ];

                if (taskData.rewardConfig.pointsConfig) {
                    try {
                        pointsOptions = JSON.parse(taskData.rewardConfig.pointsConfig);
                    } catch (e) {
                        console.error('解析 pointsConfig 失败:', e);
                    }
                }

                console.log('设置任务发布信息 - 参测人数:', taskData.maxParticipants)
                setTaskPublish({
                    personTags: taskData.personTags,
                    selectedTagIds: [],
                    taskDate: typeof taskData.endTime === 'string'
                        ? taskData.endTime.split('T')[0]
                        : new Date(taskData.endTime).toISOString().split('T')[0] || '',
                    participants: taskData.maxParticipants.toString(),
                    executePoints: taskData.executionPoints.toString(),
                    ruleFilter: taskData.ruleFilter || '',
                    pointsOptions: pointsOptions,
                    emailNotify: taskData.notificationConfig.emailEnabled,
                    emailContent: taskData.notificationConfig.emailTemplate || '',
                    selectedEmailTemplate: taskData.notificationConfig.emailTemplateId || '',
                    smsNotify: taskData.notificationConfig.lanxinEnabled,
                    smsContent: taskData.notificationConfig.lanxinTemplate || '',
                    selectedSmsTemplate: taskData.notificationConfig.lanxinTemplateId || '',
                    groupInvite: taskData.notificationConfig.wechatEnabled,
                    thumbnailImage: taskData.thumbnailImage || null,
                    wechatContent: taskData.notificationConfig.wechatTemplate || '',
                    selectedWechatTemplate: taskData.notificationConfig.wechatTemplateId || '',
                })
            }

            console.log('=== 任务数据加载完成 ===')
            
            // 同步数据到 store，确保数据一致性
            setBasicInfo({
                taskSystem: taskData.system,
                taskName: taskData.title,
                taskDescription: taskData.description || '',
                testType: testTypeValue,
                testRules: taskData.testRules || '',
                testData: taskData.environment || '',
                files: processedAttachments,
            });
        }
    }, [taskData, taskId, setTestDesign, setTaskPublish, setBasicInfo])

    // 同步到store
    useEffect(() => {
        // 只有当不是从服务器加载数据时才同步，避免与服务器数据加载逻辑冲突
        if (!taskData) {
            setBasicInfo({
                taskSystem,
                taskName,
                taskDescription,
                testType,
                testRules,
                testData,
                files,
            })
        }
    }, [taskSystem, taskName, taskDescription, testType, testRules, testData, files, setBasicInfo, taskData])

    const handleFileChange = (newFiles: FileItem[]) => {
        setFiles(newFiles)
    }

    const handleNext = () => {
        // 验证必填字段
        if (!taskSystem) {
            alert('请选择系统')
            return
        }
        if (!taskName) {
            alert('请输入任务名称')
            return
        }
        if (!taskDescription) {
            alert('请输入任务描述')
            return
        }
        
        // 将当前页面的数据同步到 store，确保在流程中数据不会丢失
        setBasicInfo({
            taskSystem,
            taskName,
            taskDescription,
            testType,
            testRules,
            testData,
            files,
        })
        
        router.push("/crowdsource/publish/testDesign")
    }

    const { data: allSystemsData } = api.testSystem.getAll.useQuery()

    const systemsOptions = [
        { value: "", label: "所属系统" },
        ...(allSystemsData?.map(s => ({ value: s.name, label: s.name })) || [])
    ]

    return (
        <Box minH="100vh" bg="#F7F8FA">
            <Container maxW="1200px" py={10}>
                {/* 步骤指示器 */}
                <StepIndicator />

                {/* 加载状态 */}
                {isLoading && taskId ? (
                    <Box bg="white" borderRadius="lg" boxShadow="sm" p={8} textAlign="center">
                        <Text color={COLORS.textSecondary}>加载中...</Text>
                    </Box>
                ) : (
                    /* 表单卡片 */
                    <Box bg="white" borderRadius="lg" boxShadow="sm" p={8}>
                        <Heading as="h2" size="lg" color="#1d2129" mb={8}>
                            基本信息
                        </Heading>

                        <VStack gap={6} align="stretch">
                            {/* 选择系统 */}
                            <Field.Root required>
                                <Field.Label fontSize="14px" color="#1d2129" mb={2}>
                                    <Text color={COLORS.primary} mr={1}>
                                        *
                                    </Text>
                                    选择系统
                                </Field.Label>
                                <NativeSelectRoot>
                                    <NativeSelectField
                                        value={taskSystem}
                                        onChange={(e) => setTaskSystem(e.target.value)}
                                        bg="#F7F8FA"
                                        borderColor="#E5E6EB"
                                        _hover={{ borderColor: "#C9CDD4" }}
                                        _focus={{ borderColor: "#E31424", boxShadow: "0 0 0 1px #E31424" }}
                                    >
                                        {systemsOptions.map((sys) => (
                                            <option key={sys.value} value={sys.value}>
                                                {sys.label}
                                            </option>
                                        ))}
                                    </NativeSelectField>
                                </NativeSelectRoot>
                            </Field.Root>

                            {/* 任务名称 */}
                            <Field.Root required>
                                <Field.Label fontSize="14px" color="#1d2129" mb={2}>
                                    <Text color={COLORS.primary} mr={1}>
                                        *
                                    </Text>
                                    任务名称
                                </Field.Label>
                                <Input
                                    placeholder="请输入任务名称"
                                    value={taskName}
                                    onChange={(e) => setTaskName(e.target.value)}
                                    bg="#F7F8FA"
                                    borderColor="#E5E6EB"
                                    _hover={{ borderColor: "#C9CDD4" }}
                                    _focus={{ borderColor: "#E31424", boxShadow: "0 0 0 1px #E31424" }}
                                />
                            </Field.Root>

                            {/* 任务描述 */}
                            <Field.Root required>
                                <Field.Label fontSize="14px" color="#1d2129" mb={2}>
                                    <Text color={COLORS.primary} mr={1}>
                                        *
                                    </Text>
                                    任务描述
                                </Field.Label>
                                <Textarea
                                    placeholder="请输入任务描述"
                                    value={taskDescription}
                                    onChange={(e) => setTaskDescription(e.target.value)}
                                    bg="#F7F8FA"
                                    borderColor="#E5E6EB"
                                    rows={4}
                                    _hover={{ borderColor: "#C9CDD4" }}
                                    _focus={{ borderColor: "#E31424", boxShadow: "0 0 0 1px #E31424" }}
                                />
                            </Field.Root>

                            {/* 测试类型 */}
                            <Field.Root required>
                                <Field.Label fontSize="14px" color="#1d2129" mb={2}>
                                    <Text color={COLORS.primary} mr={1}>
                                        *
                                    </Text>
                                    测试类型
                                </Field.Label>
                                <RadioGroup value={testType} onValueChange={(e) => setTestType(e.value)}>
                                    <HStack gap={6}>
                                        <Radio value="手机客户端" colorPalette="red">
                                            手机客户端
                                        </Radio>
                                        <Radio value="PC客户端" colorPalette="red">
                                            PC客户端
                                        </Radio>
                                        <Radio value="语音对话" colorPalette="red">
                                            语音对话
                                        </Radio>
                                    </HStack>
                                </RadioGroup>
                            </Field.Root>

                            {/* 奖励规则 */}
                            <Field.Root>
                                <Field.Label fontSize="14px" color="#1d2129" mb={2}>
                                    奖励规则
                                </Field.Label>
                                <Textarea
                                    placeholder="请输入奖励"
                                    value={testRules}
                                    onChange={(e) => setTestRules(e.target.value)}
                                    bg="#F7F8FA"
                                    borderColor="#E5E6EB"
                                    rows={4}
                                    _hover={{ borderColor: "#C9CDD4" }}
                                    _focus={{ borderColor: "#E31424", boxShadow: "0 0 0 1px #E31424" }}
                                />
                            </Field.Root>

                            {/* 测试数据 */}
                            <Field.Root>
                                <Field.Label fontSize="14px" color="#1d2129" mb={2}>
                                    测试数据
                                </Field.Label>
                                <Textarea
                                    placeholder="请输入数据"
                                    value={testData}
                                    onChange={(e) => setTestData(e.target.value)}
                                    bg="#F7F8FA"
                                    borderColor="#E5E6EB"
                                    rows={4}
                                    _hover={{ borderColor: "#C9CDD4" }}
                                    _focus={{ borderColor: "#E31424", boxShadow: "0 0 0 1px #E31424" }}
                                />
                            </Field.Root>

                            {/* 上传附件 */}
                            <Field.Root>
                                <Field.Label fontSize="14px" color="#1d2129" mb={2}>
                                    上传附件
                                </Field.Label>
                                <FileUpload value={files} onChange={handleFileChange} />
                            </Field.Root>
                        </VStack>

                        {/* 底部按钮 */}
                        <Flex justify="center" mt={10}>
                            <Button
                                bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                                color="white"
                                fontSize="14px"
                                fontWeight="500"
                                borderRadius="999px"
                                h="40px"
                                px={12}
                                onClick={handleNext}
                                _hover={{
                                    opacity: 0.9,
                                }}
                            >
                                下一步
                            </Button>
                        </Flex>
                    </Box>
                )}
            </Container>
        </Box>
    )
}
