'use client'

import {
    Box,
    Container,
    Flex,
    Text,
    Heading,
    Button,
    Textarea,
    VStack,
    HStack,
    Circle,
    Table,
    Icon,
    Input,
} from "@chakra-ui/react"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "@chakra-ui/react"
import { Edit, Trash2, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/app/_components/ui/checkbox"
import { api } from "@/trpc/react"
import { useTaskPublishStore } from "../useTaskPublishStore"
import type { TestCaseItem } from "../useTaskPublishStore"
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogTitle,
    DialogCloseTrigger,
} from "@/app/_components/ui/dialog"
import {
    PaginationRoot,
    PaginationNextTrigger,
    PaginationItems,
} from "@/app/_components/ui/pagination"
import { toaster } from "@/app/_components/ui/toaster"
import { downloadTemplate, importCasesFromExcel, type TestCaseRow } from "@/app/crowdsource/cases/utils/excelUtils"
import { useRef } from "react"
import { LuPlus, LuMinus } from "react-icons/lu"

// 用例步骤类型
type CaseStep = {
    id: number
    description: string
    expectedResult: string
}

// 步骤数据
const steps = [
    { number: 1, title: "基本信息", subtitle: "创建任务基本信息", completed: true },
    { number: 2, title: "测试设计", subtitle: "选择测试用例", completed: false },
    { number: 3, title: "任务发布", subtitle: "任务发布设置", completed: false },
]

// 步骤指示器组件
function StepIndicator() {
    const currentStep = 2

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
                                    ? "#FFE0E1"
                                    : step.number === currentStep
                                        ? "#E31424"
                                        : "#F2F3F5"
                            }
                            color={
                                step.completed
                                    ? "#E31424"
                                    : step.number === currentStep
                                        ? "white"
                                        : "#86909C"
                            }
                            fontSize="20px"
                            fontWeight="medium"
                        >
                            {step.completed ? "✓" : step.number}
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
                        <Box w="200px" h="2px" bg="#E5E6EB" mx={4} mb={12} />
                    )}
                </Flex>
            ))}
        </Flex>
    )
}

// 主列表测试用例类型
type MainTestCase = TestCaseItem

export default function testDesign() {
    const router = useRouter()
    const { testDesign, setTestDesign, currentTaskId } = useTaskPublishStore()

    const [selectedCases, setSelectedCases] = useState<number[]>([])

    // 直接从 store 初始化，并且总是保持同步
    const [testPoints, setTestPoints] = useState(testDesign.testPoints)
    const [mainTestCases, setMainTestCases] = useState<MainTestCase[]>(testDesign.testCases)

    // 用一个 ref 来追踪当前加载的任务 ID
    const loadedTaskIdRef = useRef<string | null>(null)

    // 当 store 中的数据变化时，更新本地状态
    useEffect(() => {
        // 如果是编辑模式且任务ID变化了，或者store有数据但本地没有
        const shouldUpdate =
            (currentTaskId && currentTaskId !== loadedTaskIdRef.current) ||
            (testDesign.testCases.length > 0 && mainTestCases.length === 0) ||
            (testDesign.testPoints && !testPoints)

        if (shouldUpdate) {
            setMainTestCases(testDesign.testCases)
            setTestPoints(testDesign.testPoints)
            if (currentTaskId) {
                loadedTaskIdRef.current = currentTaskId
            }
        }
    }, [currentTaskId, testDesign.testCases, testDesign.testPoints, mainTestCases.length, testPoints])

    // 同步本地修改到 store
    useEffect(() => {
        setTestDesign({
            testCases: mainTestCases,
            testPoints,
        })
    }, [mainTestCases, testPoints, setTestDesign])

    // 主列表分页状态
    const [mainCurrentPage, setMainCurrentPage] = useState(1)
    const [mainPageSize] = useState(10)

    // 文件上传引用
    const fileInputRef = useRef<HTMLInputElement>(null)

    // 引用用例对话框
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [dialogSelectedCases, setDialogSelectedCases] = useState<string[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(10)
    const [searchKeyword, setSearchKeyword] = useState("")
    const [searchInput, setSearchInput] = useState("")
    const [selectedDate, setSelectedDate] = useState("")
    const [dateInput, setDateInput] = useState("")

    // 用例详情对话框
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)

    // 编辑用例对话框
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingCase, setEditingCase] = useState<{
        id: string
        title: string
        system: string
        precondition: string
        testSteps: string
        explanation: string
    } | null>(null)
    const [caseSteps, setCaseSteps] = useState<CaseStep[]>([
        { id: 1, description: "", expectedResult: "" },
        { id: 2, description: "", expectedResult: "" },
    ])

    // 获取用例详情数据 (用于详情对话框和编辑对话框)
    const { data: caseDetail, isLoading: isDetailLoading } = api.testCase.getById.useQuery(
        { id: selectedCaseId! },
        {
            enabled: (isDetailDialogOpen || isEditDialogOpen) && !!selectedCaseId,
        }
    )

    // 更新用例mutation
    const updateCaseMutation = api.testCase.update.useMutation({
        onSuccess: (result) => {
            toaster.create({
                title: "更新用例成功",
                type: "success",
                duration: 2000,
            })

            // 关闭对话框并重置表单
            setIsEditDialogOpen(false)
            setEditingCase(null)
            setCaseSteps([
                { id: 1, description: "", expectedResult: "" },
                { id: 2, description: "", expectedResult: "" },
            ])

            // 刷新引用对话框的用例列表
            refetchTestCases()

            // 更新主列表中对应的用例数据
            if (result.data) {
                setMainTestCases(prev => prev.map(tc =>
                    tc.originalId === result.data?.id
                        ? { ...tc, name: result.data.title, system: result.data.system, focus: result.data.explanation || "" }
                        : tc
                ))
            }
        },
        onError: (error) => {
            toaster.create({
                title: error.message || "更新用例失败",
                type: "error",
                duration: 3000,
            })
        },
    })

    // 获取用例列表数据
    const { data: testCaseData, isLoading, refetch: refetchTestCases } = api.testCase.list.useQuery(
        {
            title: searchKeyword,
            createdDate: selectedDate,
            page: currentPage,
            pageSize: pageSize,
        },
        {
            enabled: isDialogOpen, // 只在对话框打开时才请求数据
        }
    )

    // 计算分页数据
    const totalCount = testCaseData?.pagination.total ?? 0
    const currentPageData = testCaseData?.data ?? []

    // 计算主列表分页数据
    const mainTotalCount = mainTestCases.length
    const mainStartIndex = (mainCurrentPage - 1) * mainPageSize
    const mainEndIndex = mainStartIndex + mainPageSize
    const mainCurrentPageData = mainTestCases.slice(mainStartIndex, mainEndIndex)

    // 处理单个选择
    const handleSelectCase = (id: number) => {
        if (selectedCases.includes(id)) {
            setSelectedCases(selectedCases.filter((caseId) => caseId !== id))
        } else {
            setSelectedCases([...selectedCases, id])
        }
    }

    // 处理全选
    const handleSelectAll = () => {
        if (selectedCases.length === mainCurrentPageData.length && mainCurrentPageData.length > 0) {
            // 取消选中当前页的所有用例
            const currentPageIds = mainCurrentPageData.map((c) => c.id)
            setSelectedCases(selectedCases.filter((id) => !currentPageIds.includes(id)))
        } else {
            // 选中当前页的所有用例
            const currentPageIds = mainCurrentPageData.map((c) => c.id)
            const newSelected = [...new Set([...selectedCases, ...currentPageIds])]
            setSelectedCases(newSelected)
        }
    }

    // 对话框内的全选
    const handleDialogSelectAll = () => {
        if (dialogSelectedCases.length === currentPageData.length) {
            setDialogSelectedCases([])
        } else {
            setDialogSelectedCases(currentPageData.map((c) => c.id))
        }
    }

    // 对话框内的单个选择
    const handleDialogSelectCase = (id: string) => {
        if (dialogSelectedCases.includes(id)) {
            setDialogSelectedCases(dialogSelectedCases.filter((caseId) => caseId !== id))
        } else {
            setDialogSelectedCases([...dialogSelectedCases, id])
        }
    }

    // 编辑用例
    const handleEdit = (id: number) => {
        const caseToEdit = mainTestCases.find(tc => tc.id === id)
        if (caseToEdit) {
            // 如果有原始ID,说明是从引用对话框添加的,可以编辑原始数据
            if (caseToEdit.originalId && !caseToEdit.originalId.startsWith('imported-')) {
                // 从引用的用例中查找原始数据
                handleEditCase(caseToEdit.originalId)
            } else {
                // 导入的用例,直接编辑主列表中的数据
                toaster.create({
                    title: "导入的用例暂不支持编辑",
                    description: "请在用例管理中编辑后重新引用",
                    type: "info",
                    duration: 3000,
                })
            }
        }
    }

    // 删除单个用例
    const handleDelete = (id: number) => {
        setMainTestCases(mainTestCases.filter((testCase) => testCase.id !== id))
        // 同时从选中列表中移除
        setSelectedCases(selectedCases.filter((caseId) => caseId !== id))
    }

    // 批量删除引用
    const handleDeleteSelected = () => {
        if (selectedCases.length === 0) {
            toaster.create({
                title: "请先选择要删除的用例",
                type: "warning",
                duration: 3000,
            })
            return
        }
        // 过滤掉选中的用例
        setMainTestCases(mainTestCases.filter((testCase) => !selectedCases.includes(testCase.id)))
        // 清空选中列表
        setSelectedCases([])
        toaster.create({
            title: "删除成功",
            type: "success",
            duration: 2000,
        })
    }

    // 打开引用用例对话框
    const handleOpenDialog = () => {
        // 获取已引用用例的原始ID列表,用于默认勾选
        const referencedIds = mainTestCases
            .map((tc) => tc.originalId)
            .filter((id): id is string => !!id)

        setIsDialogOpen(true)
        setDialogSelectedCases(referencedIds) // 默认勾选已引用的用例
        setCurrentPage(1)
        setSearchKeyword("")
        setSearchInput("")
        setSelectedDate("")
        setDateInput("")
    }

    // 搜索
    const handleSearch = () => {
        setSearchKeyword(searchInput)
        setSelectedDate(dateInput)
        setCurrentPage(1)
    }

    // 重置搜索
    const handleResetSearch = () => {
        setSearchInput("")
        setSearchKeyword("")
        setSelectedDate("")
        setDateInput("")
        setCurrentPage(1)
    }

    // 确认引用用例
    const handleConfirmReference = () => {
        // 从对话框选中的用例ID中获取完整的用例数据
        const selectedCasesData = currentPageData.filter((testCase) =>
            dialogSelectedCases.includes(testCase.id)
        )

        // 验证选中的用例数据
        const validCasesData = selectedCasesData.filter(testCase => 
            testCase.title && testCase.title.trim() !== '' && testCase.system && testCase.system.trim() !== ''
        )

        if (validCasesData.length === 0) {
            toaster.create({
                title: "没有有效的用例可供引用",
                description: "请确保选中的用例名称和所属系统不为空",
                type: "error",
                duration: 3000,
            })
            return
        }

        if (validCasesData.length < selectedCasesData.length) {
            toaster.create({
                title: `过滤掉${selectedCasesData.length - validCasesData.length}条无效数据`,
                description: "无效数据：用例名称或所属系统为空",
                type: "warning",
                duration: 3000,
            })
        }

        // 获取已存在的原始用例ID集合
        const existingOriginalIds = new Set(
            mainTestCases.map((tc) => tc.originalId).filter(Boolean)
        )

        // 过滤掉已经存在的用例，只添加新用例
        const newCasesData = validCasesData.filter(
            (testCase) => !existingOriginalIds.has(testCase.id)
        )

        // 转换为主列表格式并添加到主列表
        const newCases = newCasesData.map((testCase, index) => ({
            id: mainTestCases.length + index + 1,
            sequence: mainTestCases.length + index + 1,
            system: testCase.system,
            name: testCase.title,
            focus: testCase.explanation || "",
            originalId: testCase.id, // 保存原始ID用于去重
        }))

        setMainTestCases([...mainTestCases, ...newCases])
        setIsDialogOpen(false)
        setDialogSelectedCases([])
    }

    // 打开用例详情
    const handleViewDetail = (caseId: string) => {
        setSelectedCaseId(caseId)
        setIsDetailDialogOpen(true)
    }

    // 打开编辑用例对话框
    const handleEditCase = (caseId: string) => {
        // 首先尝试从引用对话框的数据中查找
        const caseToEdit = currentPageData.find(c => c.id === caseId)

        if (caseToEdit) {
            // 从引用列表中找到了，直接使用
            populateEditForm(caseToEdit)
            setIsEditDialogOpen(true)
        } else {
            // 如果在引用列表中找不到，设置selectedCaseId触发API查询
            setSelectedCaseId(caseId)
            setIsEditDialogOpen(true)
        }
    }

    // 填充编辑表单的通用函数
    const populateEditForm = (caseData: any) => {
        setEditingCase({
            id: caseData.id,
            title: caseData.title,
            system: caseData.system,
            precondition: caseData.precondition || '',
            testSteps: caseData.testSteps,
            explanation: caseData.explanation || '',
        })

        // Parse testSteps JSON
        try {
            const steps = JSON.parse(caseData.testSteps)
            // 确保每个步骤都有唯一的 id
            const stepsWithUniqueIds = steps.map((step: CaseStep, index: number) => ({
                ...step,
                id: step.id ?? index + 1
            }))
            setCaseSteps(stepsWithUniqueIds)
        } catch (e) {
            console.error("Failed to parse testSteps:", e)
            setCaseSteps([
                { id: 1, description: "", expectedResult: "" },
                { id: 2, description: "", expectedResult: "" },
            ])
        }
    }

    // 当caseDetail加载完成且编辑对话框打开时,填充编辑表单
    useEffect(() => {
        if (isEditDialogOpen && caseDetail && selectedCaseId && !editingCase) {
            populateEditForm(caseDetail)
        }
    }, [isEditDialogOpen, caseDetail, selectedCaseId, editingCase])

    // 保存编辑的用例
    const handleSaveEdit = () => {
        if (!editingCase) return

        if (!editingCase.title.trim()) {
            toaster.create({
                title: "请输入用例名称",
                type: "error",
                duration: 3000,
            })
            return
        }
        if (!editingCase.system.trim()) {
            toaster.create({
                title: "请选择所属系统",
                type: "error",
                duration: 3000,
            })
            return
        }

        updateCaseMutation.mutate({
            id: editingCase.id,
            title: editingCase.title,
            system: editingCase.system,
            precondition: editingCase.precondition || undefined,
            testSteps: JSON.stringify(caseSteps),
            explanation: editingCase.explanation || undefined,
        })
    }

    // 步骤管理函数
    const handleAddStep = () => {
        const newId = caseSteps.length > 0 ? Math.max(...caseSteps.map(s => s.id ?? 0)) + 1 : 1
        setCaseSteps([...caseSteps, { id: newId, description: "", expectedResult: "" }])
    }

    const handleRemoveStep = (id: number) => {
        if (caseSteps.length > 1) {
            setCaseSteps(caseSteps.filter(step => step.id !== id))
        }
    }

    const handleStepChange = (id: number, field: 'description' | 'expectedResult', value: string) => {
        if (value.length <= 500) {
            setCaseSteps(caseSteps.map(step =>
                step.id === id ? { ...step, [field]: value } : step
            ))
        }
    }

    // 上一步
    const handlePrevious = () => {
        // 将当前页面的数据同步到 store，确保返回基本信息页面时数据不会丢失
        setTestDesign({
            testCases: mainTestCases,
            testPoints: testPoints,
        })
        router.push("/crowdsource/publish/basicInformation")
    }

    // 下一步
    const handleNext = () => {
        router.push("/crowdsource/publish/taskPublish")
    }

    // 下载用例模板
    const handleDownloadTemplate = () => {
        try {
            downloadTemplate()
            toaster.create({
                title: "模板下载成功",
                type: "success",
                duration: 2000,
            })
        } catch (error) {
            toaster.create({
                title: "模板下载失败",
                type: "error",
                duration: 3000,
            })
        }
    }

    // 触发文件选择
    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    // 处理文件导入
    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // 验证文件类型
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            toaster.create({
                title: "请选择Excel文件(.xlsx或.xls)",
                type: "error",
                duration: 3000,
            })
            return
        }

        try {
            const importedCases = await importCasesFromExcel(file)

            if (importedCases.length === 0) {
                toaster.create({
                    title: "Excel文件中没有有效的用例数据",
                    type: "warning",
                    duration: 3000,
                })
                return
            }

            // 验证导入的数据
            const validCases = importedCases.filter(caseItem => 
                caseItem.title && caseItem.title.trim() !== '' && caseItem.system && caseItem.system.trim() !== ''
            )

            if (validCases.length === 0) {
                toaster.create({
                    title: "Excel文件中没有有效的用例数据",
                    description: "请确保用例名称和所属系统不为空",
                    type: "error",
                    duration: 3000,
                })
                return
            }

            if (validCases.length < importedCases.length) {
                toaster.create({
                    title: `过滤掉${importedCases.length - validCases.length}条无效数据`,
                    description: "无效数据：用例名称或所属系统为空",
                    type: "warning",
                    duration: 3000,
                })
            }

            // 转换导入的用例为主列表格式
            const newCases: MainTestCase[] = validCases.map((caseItem, index) => ({
                id: mainTestCases.length + index + 1,
                sequence: mainTestCases.length + index + 1,
                system: caseItem.system,
                name: caseItem.title,
                focus: caseItem.explanation || "",
                originalId: `imported-${Date.now()}-${index}`, // 为导入的用例生成唯一ID
            }))

            setMainTestCases([...mainTestCases, ...newCases])

            toaster.create({
                title: `成功导入${validCases.length}条用例`,
                type: "success",
                duration: 2000,
            })
        } catch (error) {
            toaster.create({
                title: error instanceof Error ? error.message : "导入失败",
                type: "error",
                duration: 3000,
            })
        } finally {
            // 清空文件选择，允许重复导入同一文件
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    return (
        <Box minH="100vh" bg="#F7F8FA">
            {/* 隐藏的文件上传input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileImport}
            />

            <Container maxW="1200px" py={10}>
                {/* 步骤指示器 */}
                <StepIndicator />

                {/* 表单卡片 */}
                <Box bg="white" borderRadius="lg" boxShadow="sm" p={8}>
                    <VStack gap={8} align="stretch">
                        {/* 标题和操作按钮 */}
                        <Flex justify="space-between" align="center">
                            <Heading as="h2" size="lg" color="#1d2129">
                                选择测试用例
                            </Heading>
                            <HStack gap={3}>
                                {/* 操作下拉菜单 */}
                                <MenuRoot>
                                    <MenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            borderColor="#E5E6EB"
                                            color="#4E5969"
                                            fontSize="14px"
                                            h="36px"
                                            px={4}
                                        >
                                            操作
                                            <Icon as={ChevronDown} boxSize={4} ml={2} />
                                        </Button>
                                    </MenuTrigger>
                                    <MenuContent
                                        position="absolute"
                                        right="0"
                                        minW="160px"
                                        zIndex={10}
                                        bg="white"
                                        borderRadius="8px"
                                        borderWidth="1px"
                                        borderColor="#E5E6EB"
                                        boxShadow="0 2px 8px rgba(0,0,0,0.1)"
                                    >
                                        <MenuItem value="import" onClick={handleOpenDialog}>
                                            引用用例
                                        </MenuItem>
                                        <MenuItem value="copy" onClick={handleDeleteSelected}>
                                            删除引用
                                        </MenuItem>
                                        <MenuItem value="export" onClick={handleImportClick}>导入用例</MenuItem>
                                        <MenuItem value="download" onClick={handleDownloadTemplate}>下载用例模板</MenuItem>
                                    </MenuContent>
                                </MenuRoot>
                            </HStack>
                        </Flex>

                        {/* 测试用例表格 */}
                        <Box
                            borderWidth="1px"
                            borderColor="#E5E6EB"
                            borderRadius="8px"
                            overflow="hidden"
                        >
                            <Table.Root size="sm" variant="outline">
                                <Table.Header bg="#F7F8FA">
                                    <Table.Row>
                                        <Table.ColumnHeader w="60px" textAlign="center">
                                            <Checkbox
                                                checked={
                                                    mainCurrentPageData.length > 0 &&
                                                    mainCurrentPageData.every((tc) => selectedCases.includes(tc.id))
                                                }
                                                onCheckedChange={handleSelectAll}
                                                disabled={mainCurrentPageData.length === 0}
                                            />
                                        </Table.ColumnHeader>
                                        <Table.ColumnHeader w="80px">序号</Table.ColumnHeader>
                                        <Table.ColumnHeader w="150px">所属系统</Table.ColumnHeader>
                                        <Table.ColumnHeader>用例名称</Table.ColumnHeader>
                                        <Table.ColumnHeader>测试重点</Table.ColumnHeader>
                                        <Table.ColumnHeader w="120px" textAlign="center">
                                            操作
                                        </Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {mainTestCases.length === 0 ? (
                                        <Table.Row>
                                            <Table.Cell colSpan={6} textAlign="center" py={8}>
                                                <Text color="#86909C">
                                                    暂无测试用例,请点击"操作 → 引用用例"添加
                                                </Text>
                                            </Table.Cell>
                                        </Table.Row>
                                    ) : (
                                        mainCurrentPageData.map((testCase) => (
                                            <Table.Row key={testCase.id} _hover={{ bg: "#FAFAFA" }}>
                                                <Table.Cell textAlign="center">
                                                    <Checkbox
                                                        checked={selectedCases.includes(testCase.id)}
                                                        onCheckedChange={() => handleSelectCase(testCase.id)}
                                                    />
                                                </Table.Cell>
                                                <Table.Cell>{testCase.sequence}</Table.Cell>
                                                <Table.Cell>{testCase.system}</Table.Cell>
                                                <Table.Cell>{testCase.name}</Table.Cell>
                                                <Table.Cell>{testCase.focus}</Table.Cell>
                                                <Table.Cell>
                                                    <HStack gap={2} justify="center">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            color="#165DFF"
                                                            onClick={() => handleEdit(testCase.id)}
                                                            px={2}
                                                        >
                                                            <Icon as={Edit} boxSize={4} mr={1} />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            color="#F53F3F"
                                                            onClick={() => handleDelete(testCase.id)}
                                                            px={2}
                                                        >
                                                            <Icon as={Trash2} boxSize={4} mr={1} />
                                                        </Button>
                                                    </HStack>
                                                </Table.Cell>
                                            </Table.Row>
                                        ))
                                    )}
                                </Table.Body>
                            </Table.Root>
                        </Box>

                        {/* 分页 */}
                        <Flex justify="space-between" align="center">
                            <Text fontSize="14px" color="#4E5969">
                                共{mainTotalCount}条
                            </Text>
                            <Flex align="center" gap={4}>
                                <PaginationRoot
                                    count={mainTotalCount}
                                    pageSize={mainPageSize}
                                    page={mainCurrentPage}
                                    onPageChange={(e) => setMainCurrentPage(e.page)}
                                >
                                    <HStack gap={2}>
                                        <PaginationItems />
                                        <PaginationNextTrigger />
                                    </HStack>
                                </PaginationRoot>
                                <Flex align="center" gap={2}>
                                    <Text fontSize="14px" color="#4E5969">
                                        {mainPageSize}条/页
                                    </Text>
                                    <Icon as={ChevronDown} boxSize={4} color="#4E5969" />
                                </Flex>
                            </Flex>
                        </Flex>

                        {/* 测试重点输入 */}
                        <Box>
                            <Heading as="h3" size="md" color="#1d2129" mb={4}>
                                测试重点及无需关注的缺陷
                            </Heading>
                            <Textarea
                                placeholder="请输入测试重点及无需关注的缺陷"
                                value={testPoints}
                                onChange={(e) => setTestPoints(e.target.value)}
                                bg="#F7F8FA"
                                borderColor="#E5E6EB"
                                rows={6}
                                _hover={{ borderColor: "#C9CDD4" }}
                                _focus={{ borderColor: "#E31424", boxShadow: "0 0 0 1px #E31424" }}
                            />
                        </Box>
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
                                borderColor: "#C9CDD4",
                                bg: "#FAFAFA",
                            }}
                        >
                            上一步
                        </Button>
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

                {/* 引用用例对话框 */}
                <DialogRoot
                    open={isDialogOpen}
                    onOpenChange={(e) => setIsDialogOpen(e.open)}
                    size="xl"
                >
                    <DialogContent maxW="1000px" p={0}>
                        <DialogHeader
                            borderBottomWidth="1px"
                            borderColor="#E5E6EB"
                            px={6}
                            py={4}
                        >
                            <DialogTitle fontSize="18px" fontWeight="600" color="#1d2129">
                                引用用例
                            </DialogTitle>
                            <DialogCloseTrigger />
                        </DialogHeader>

                        <DialogBody px={6} py={4}>
                            <VStack gap={4} align="stretch">
                                {/* 搜索和筛选 */}
                                <Flex gap={3} align="center">
                                    <Input
                                        type="date"
                                        placeholder="创建时间"
                                        value={dateInput}
                                        onChange={(e) => setDateInput(e.target.value)}
                                        bg="#F7F8FA"
                                        borderColor="#E5E6EB"
                                        fontSize="14px"
                                        h="36px"
                                        w="160px"
                                        _hover={{ borderColor: "#C9CDD4" }}
                                        _focus={{
                                            borderColor: "#E31424",
                                            boxShadow: "0 0 0 1px #E31424",
                                        }}
                                    />
                                    <Input
                                        placeholder="用例名称"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleSearch()
                                            }
                                        }}
                                        bg="#F7F8FA"
                                        borderColor="#E5E6EB"
                                        fontSize="14px"
                                        h="36px"
                                        w="200px"
                                        _hover={{ borderColor: "#C9CDD4" }}
                                        _focus={{
                                            borderColor: "#E31424",
                                            boxShadow: "0 0 0 1px #E31424",
                                        }}
                                    />
                                    <Button
                                        bg="#E31424"
                                        color="white"
                                        fontSize="14px"
                                        h="36px"
                                        px={6}
                                        onClick={handleSearch}
                                        _hover={{ bg: "#C41122" }}
                                    >
                                        搜索
                                    </Button>
                                    <Button
                                        variant="outline"
                                        borderColor="#E5E6EB"
                                        color="#4E5969"
                                        fontSize="14px"
                                        h="36px"
                                        px={6}
                                        onClick={handleResetSearch}
                                        _hover={{ borderColor: "#C9CDD4", bg: "#FAFAFA" }}
                                    >
                                        重置
                                    </Button>
                                </Flex>

                                {/* 用例表格 */}
                                <Box
                                    borderWidth="1px"
                                    borderColor="#E5E6EB"
                                    borderRadius="8px"
                                    overflow="hidden"
                                    minH="400px"
                                >
                                    <Table.Root size="sm" variant="outline">
                                        <Table.Header bg="#F7F8FA">
                                            <Table.Row>
                                                <Table.ColumnHeader w="60px" textAlign="center">
                                                    <Checkbox
                                                        checked={
                                                            currentPageData.length > 0 &&
                                                            dialogSelectedCases.length ===
                                                            currentPageData.length
                                                        }
                                                        onCheckedChange={handleDialogSelectAll}
                                                        disabled={isLoading || currentPageData.length === 0}
                                                    />
                                                </Table.ColumnHeader>
                                                <Table.ColumnHeader w="80px">
                                                    序号
                                                </Table.ColumnHeader>
                                                <Table.ColumnHeader w="120px">
                                                    所属系统
                                                </Table.ColumnHeader>
                                                <Table.ColumnHeader>用例名称</Table.ColumnHeader>
                                                <Table.ColumnHeader>
                                                    测试重点
                                                </Table.ColumnHeader>
                                                <Table.ColumnHeader w="120px">
                                                    创建时间
                                                </Table.ColumnHeader>
                                                <Table.ColumnHeader w="120px" textAlign="center">
                                                    操作
                                                </Table.ColumnHeader>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            {isLoading ? (
                                                <Table.Row>
                                                    <Table.Cell colSpan={7} textAlign="center" py={8}>
                                                        <Text color="#86909C">加载中...</Text>
                                                    </Table.Cell>
                                                </Table.Row>
                                            ) : currentPageData.length === 0 ? (
                                                <Table.Row>
                                                    <Table.Cell colSpan={7} textAlign="center" py={8}>
                                                        <Text color="#86909C">暂无数据</Text>
                                                    </Table.Cell>
                                                </Table.Row>
                                            ) : (
                                                currentPageData.map((testCase, index) => (
                                                    <Table.Row
                                                        key={testCase.id}
                                                        _hover={{ bg: "#FAFAFA" }}
                                                    >
                                                        <Table.Cell textAlign="center">
                                                            <Checkbox
                                                                checked={dialogSelectedCases.includes(
                                                                    testCase.id
                                                                )}
                                                                onCheckedChange={() =>
                                                                    handleDialogSelectCase(testCase.id)
                                                                }
                                                            />
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            {(currentPage - 1) * pageSize + index + 1}
                                                        </Table.Cell>
                                                        <Table.Cell>{testCase.system}</Table.Cell>
                                                        <Table.Cell>{testCase.title}</Table.Cell>
                                                        <Table.Cell>
                                                            {testCase.explanation || "-"}
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            {new Date(testCase.createdAt).toLocaleDateString(
                                                                "zh-CN"
                                                            )}
                                                        </Table.Cell>
                                                        <Table.Cell textAlign="center">
                                                            <HStack gap={2} justify="center">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    color="#165DFF"
                                                                    fontSize="14px"
                                                                    h="28px"
                                                                    px={2}
                                                                    onClick={() => handleEditCase(testCase.id)}
                                                                >
                                                                    编辑
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    color="#165DFF"
                                                                    fontSize="14px"
                                                                    h="28px"
                                                                    px={2}
                                                                    onClick={() => handleViewDetail(testCase.id)}
                                                                >
                                                                    详情
                                                                </Button>
                                                            </HStack>
                                                        </Table.Cell>
                                                    </Table.Row>
                                                ))
                                            )}
                                        </Table.Body>
                                    </Table.Root>
                                </Box>

                                {/* 分页 */}
                                <Flex justify="space-between" align="center">
                                    <Text fontSize="14px" color="#4E5969">
                                        共{totalCount}条
                                    </Text>
                                    <Flex align="center" gap={4}>
                                        <PaginationRoot
                                            count={totalCount}
                                            pageSize={pageSize}
                                            page={currentPage}
                                            onPageChange={(e) => setCurrentPage(e.page)}
                                        >
                                            <HStack gap={2}>
                                                <PaginationItems />
                                                <PaginationNextTrigger />
                                            </HStack>
                                        </PaginationRoot>
                                        <Flex align="center" gap={2}>
                                            <Text fontSize="14px" color="#4E5969">
                                                {pageSize}条/页
                                            </Text>
                                            <Icon as={ChevronDown} boxSize={4} color="#4E5969" />
                                        </Flex>
                                    </Flex>
                                </Flex>
                            </VStack>
                        </DialogBody>

                        <DialogFooter
                            borderTopWidth="1px"
                            borderColor="#E5E6EB"
                            px={6}
                            py={4}
                            justifyContent="center"
                        >
                            <HStack gap={3}>
                                <Button
                                    variant="outline"
                                    borderColor="#E5E6EB"
                                    color="#4E5969"
                                    fontSize="14px"
                                    h="36px"
                                    px={8}
                                    onClick={() => setIsDialogOpen(false)}
                                    _hover={{ borderColor: "#C9CDD4", bg: "#FAFAFA" }}
                                >
                                    取消
                                </Button>
                                <Button
                                    bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                                    color="white"
                                    fontSize="14px"
                                    h="36px"
                                    px={8}
                                    onClick={handleConfirmReference}
                                    _hover={{ opacity: 0.9 }}
                                >
                                    确认
                                </Button>
                            </HStack>
                        </DialogFooter>
                    </DialogContent>
                </DialogRoot>

                {/* 用例详情对话框 */}
                <DialogRoot
                    open={isDetailDialogOpen}
                    onOpenChange={(e) => setIsDetailDialogOpen(e.open)}
                    size="lg"
                >
                    <DialogContent maxW="800px" p={0}>
                        <DialogHeader
                            borderBottomWidth="1px"
                            borderColor="#E5E6EB"
                            px={6}
                            py={4}
                        >
                            <DialogTitle fontSize="18px" fontWeight="600" color="#1d2129">
                                用例详情
                            </DialogTitle>
                            <DialogCloseTrigger />
                        </DialogHeader>

                        <DialogBody px={6} py={4}>
                            {isDetailLoading ? (
                                <Flex justify="center" align="center" minH="300px">
                                    <Text color="#86909C">加载中...</Text>
                                </Flex>
                            ) : caseDetail ? (
                                <VStack gap={4} align="stretch">
                                    {/* 基本信息 */}
                                    <Box>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="600"
                                            color="#1d2129"
                                            mb={2}
                                        >
                                            用例名称
                                        </Text>
                                        <Text fontSize="14px" color="#4E5969">
                                            {caseDetail.title}
                                        </Text>
                                    </Box>

                                    <Box>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="600"
                                            color="#1d2129"
                                            mb={2}
                                        >
                                            所属系统
                                        </Text>
                                        <Text fontSize="14px" color="#4E5969">
                                            {caseDetail.system}
                                        </Text>
                                    </Box>

                                    {caseDetail.precondition && (
                                        <Box>
                                            <Text
                                                fontSize="14px"
                                                fontWeight="600"
                                                color="#1d2129"
                                                mb={2}
                                            >
                                                测试准备
                                            </Text>
                                            <Text
                                                fontSize="14px"
                                                color="#4E5969"
                                                whiteSpace="pre-wrap"
                                            >
                                                {caseDetail.precondition}
                                            </Text>
                                        </Box>
                                    )}

                                    <Box>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="600"
                                            color="#1d2129"
                                            mb={2}
                                        >
                                            测试步骤
                                        </Text>
                                        <Box
                                            bg="#F7F8FA"
                                            borderRadius="8px"
                                            p={4}
                                            borderWidth="1px"
                                            borderColor="#E5E6EB"
                                        >
                                            <Text
                                                fontSize="14px"
                                                color="#4E5969"
                                                whiteSpace="pre-wrap"
                                            >
                                                {typeof caseDetail.testSteps === "string"
                                                    ? caseDetail.testSteps
                                                    : JSON.stringify(
                                                        JSON.parse(caseDetail.testSteps),
                                                        null,
                                                        2
                                                    )}
                                            </Text>
                                        </Box>
                                    </Box>

                                    {caseDetail.explanation && (
                                        <Box>
                                            <Text
                                                fontSize="14px"
                                                fontWeight="600"
                                                color="#1d2129"
                                                mb={2}
                                            >
                                                重点关注
                                            </Text>
                                            <Text
                                                fontSize="14px"
                                                color="#4E5969"
                                                whiteSpace="pre-wrap"
                                            >
                                                {caseDetail.explanation}
                                            </Text>
                                        </Box>
                                    )}

                                    <Box>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="600"
                                            color="#1d2129"
                                            mb={2}
                                        >
                                            创建时间
                                        </Text>
                                        <Text fontSize="14px" color="#4E5969">
                                            {new Date(caseDetail.createdAt).toLocaleString(
                                                "zh-CN"
                                            )}
                                        </Text>
                                    </Box>
                                </VStack>
                            ) : (
                                <Flex justify="center" align="center" minH="300px">
                                    <Text color="#86909C">未找到用例详情</Text>
                                </Flex>
                            )}
                        </DialogBody>

                        <DialogFooter
                            borderTopWidth="1px"
                            borderColor="#E5E6EB"
                            px={6}
                            py={4}
                            justifyContent="center"
                        >
                            <Button
                                variant="outline"
                                borderColor="#E5E6EB"
                                color="#4E5969"
                                fontSize="14px"
                                h="36px"
                                px={8}
                                onClick={() => setIsDetailDialogOpen(false)}
                                _hover={{ borderColor: "#C9CDD4", bg: "#FAFAFA" }}
                            >
                                关闭
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </DialogRoot>

                {/* 编辑用例对话框 */}
                <DialogRoot
                    open={isEditDialogOpen}
                    onOpenChange={(e) => setIsEditDialogOpen(e.open)}
                    size="lg"
                >
                    <DialogContent maxW="800px" p={0}>
                        <DialogHeader
                            borderBottomWidth="1px"
                            borderColor="#E5E6EB"
                            px={6}
                            py={4}
                        >
                            <DialogTitle fontSize="18px" fontWeight="600" color="#1d2129">
                                编辑用例
                            </DialogTitle>
                            <DialogCloseTrigger />
                        </DialogHeader>

                        <DialogBody px={6} py={4}>
                            {editingCase && (
                                <VStack gap={4} align="stretch">
                                    {/* 用例名称 */}
                                    <Box>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="600"
                                            color="#1d2129"
                                            mb={2}
                                        >
                                            用例名称
                                        </Text>
                                        <Input
                                            value={editingCase.title}
                                            onChange={(e) =>
                                                setEditingCase({ ...editingCase, title: e.target.value })
                                            }
                                            bg="#F7F8FA"
                                            borderColor="#E5E6EB"
                                            fontSize="14px"
                                            _hover={{ borderColor: "#C9CDD4" }}
                                            _focus={{
                                                borderColor: "#E31424",
                                                boxShadow: "0 0 0 1px #E31424",
                                            }}
                                        />
                                    </Box>

                                    {/* 所属系统 */}
                                    <Box>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="600"
                                            color="#1d2129"
                                            mb={2}
                                        >
                                            所属系统
                                        </Text>
                                        <Input
                                            value={editingCase.system}
                                            onChange={(e) =>
                                                setEditingCase({ ...editingCase, system: e.target.value })
                                            }
                                            bg="#F7F8FA"
                                            borderColor="#E5E6EB"
                                            fontSize="14px"
                                            _hover={{ borderColor: "#C9CDD4" }}
                                            _focus={{
                                                borderColor: "#E31424",
                                                boxShadow: "0 0 0 1px #E31424",
                                            }}
                                        />
                                    </Box>

                                    {/* 测试准备 */}
                                    <Box>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="600"
                                            color="#1d2129"
                                            mb={2}
                                        >
                                            测试准备
                                        </Text>
                                        <Textarea
                                            value={editingCase.precondition}
                                            onChange={(e) =>
                                                setEditingCase({
                                                    ...editingCase,
                                                    precondition: e.target.value,
                                                })
                                            }
                                            bg="#F7F8FA"
                                            borderColor="#E5E6EB"
                                            fontSize="14px"
                                            rows={3}
                                            _hover={{ borderColor: "#C9CDD4" }}
                                            _focus={{
                                                borderColor: "#E31424",
                                                boxShadow: "0 0 0 1px #E31424",
                                            }}
                                        />
                                    </Box>

                                    {/* 测试步骤 */}
                                    <Box>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="600"
                                            color="#1d2129"
                                            mb={2}
                                        >
                                            测试步骤
                                        </Text>
                                        <Box borderWidth="1px" borderColor="#E5E6EB" borderRadius="8px" overflow="hidden">
                                            {/* 表头 */}
                                            <Flex bg="#F7F8FA" borderBottom="1px solid" borderColor="#E5E6EB">
                                                <Box w="60px" p={2} display="flex" alignItems="center" justifyContent="center">
                                                    <Text fontSize="14px" fontWeight="600" color="#1D2129">步骤</Text>
                                                </Box>
                                                <Box flex={1} p={2} borderLeft="1px solid" borderColor="#E5E6EB">
                                                    <Text fontSize="14px" fontWeight="600" color="#1D2129">步骤描述</Text>
                                                </Box>
                                                <Box flex={1} p={2} borderLeft="1px solid" borderColor="#E5E6EB">
                                                    <Text fontSize="14px" fontWeight="600" color="#1D2129">预期结果</Text>
                                                </Box>
                                                <Box w="80px" p={2} borderLeft="1px solid" borderColor="#E5E6EB" display="flex" alignItems="center" justifyContent="center">
                                                    <Text fontSize="14px" fontWeight="600" color="#1D2129">操作</Text>
                                                </Box>
                                            </Flex>

                                            {/* 步骤列表 */}
                                            {caseSteps.map((step, index) => (
                                                <Flex key={step.id ?? `step-${index}`} borderBottom={index < caseSteps.length - 1 ? "1px solid" : "none"} borderColor="#E5E6EB">
                                                    <Box w="60px" p={3} display="flex" alignItems="center" justifyContent="center">
                                                        <Text fontSize="14px" color="#1D2129">{index + 1}</Text>
                                                    </Box>
                                                    <Box flex={1} p={2} borderLeft="1px solid" borderColor="#E5E6EB">
                                                        <Box position="relative">
                                                            <Textarea
                                                                placeholder="请输入步骤描述"
                                                                value={step.description}
                                                                onChange={(e) => handleStepChange(step.id, 'description', e.target.value)}
                                                                bg="#F7F8FA"
                                                                borderColor="#E5E6EB"
                                                                fontSize="14px"
                                                                minH="60px"
                                                                resize="vertical"
                                                                _hover={{ borderColor: "#C9CDD4" }}
                                                                _focus={{ borderColor: "#E31424", boxShadow: "0 0 0 1px #E31424" }}
                                                            />
                                                            <Text
                                                                position="absolute"
                                                                bottom="4px"
                                                                right="8px"
                                                                fontSize="12px"
                                                                color="#C9CDD4"
                                                            >
                                                                {step.description.length}/500
                                                            </Text>
                                                        </Box>
                                                    </Box>
                                                    <Box flex={1} p={2} borderLeft="1px solid" borderColor="#E5E6EB">
                                                        <Box position="relative">
                                                            <Textarea
                                                                placeholder="请输入预期结果"
                                                                value={step.expectedResult}
                                                                onChange={(e) => handleStepChange(step.id, 'expectedResult', e.target.value)}
                                                                bg="#F7F8FA"
                                                                borderColor="#E5E6EB"
                                                                fontSize="14px"
                                                                minH="60px"
                                                                resize="vertical"
                                                                _hover={{ borderColor: "#C9CDD4" }}
                                                                _focus={{ borderColor: "#E31424", boxShadow: "0 0 0 1px #E31424" }}
                                                            />
                                                            <Text
                                                                position="absolute"
                                                                bottom="4px"
                                                                right="8px"
                                                                fontSize="12px"
                                                                color="#C9CDD4"
                                                            >
                                                                {step.expectedResult.length}/500
                                                            </Text>
                                                        </Box>
                                                    </Box>
                                                    <Box w="80px" p={2} borderLeft="1px solid" borderColor="#E5E6EB" display="flex" alignItems="center" justifyContent="center" gap={2}>
                                                        <Button
                                                            variant="ghost"
                                                            p={1}
                                                            minW="auto"
                                                            h="auto"
                                                            color="#86909C"
                                                            _hover={{ color: "#E31424" }}
                                                            onClick={handleAddStep}
                                                        >
                                                            <Icon as={LuPlus} boxSize={4} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            p={1}
                                                            minW="auto"
                                                            h="auto"
                                                            color="#86909C"
                                                            _hover={{ color: "#F53F3F" }}
                                                            onClick={() => handleRemoveStep(step.id)}
                                                            disabled={caseSteps.length === 1}
                                                        >
                                                            <Icon as={LuMinus} boxSize={4} />
                                                        </Button>
                                                    </Box>
                                                </Flex>
                                            ))}
                                        </Box>
                                    </Box>

                                    {/* 重点关注 */}
                                    <Box>
                                        <Text
                                            fontSize="14px"
                                            fontWeight="600"
                                            color="#1d2129"
                                            mb={2}
                                        >
                                            重点关注
                                        </Text>
                                        <Textarea
                                            value={editingCase.explanation}
                                            onChange={(e) =>
                                                setEditingCase({
                                                    ...editingCase,
                                                    explanation: e.target.value,
                                                })
                                            }
                                            bg="#F7F8FA"
                                            borderColor="#E5E6EB"
                                            fontSize="14px"
                                            rows={3}
                                            _hover={{ borderColor: "#C9CDD4" }}
                                            _focus={{
                                                borderColor: "#E31424",
                                                boxShadow: "0 0 0 1px #E31424",
                                            }}
                                        />
                                    </Box>
                                </VStack>
                            )}
                        </DialogBody>

                        <DialogFooter
                            borderTopWidth="1px"
                            borderColor="#E5E6EB"
                            px={6}
                            py={4}
                            justifyContent="center"
                        >
                            <HStack gap={3}>
                                <Button
                                    variant="outline"
                                    borderColor="#E5E6EB"
                                    color="#4E5969"
                                    fontSize="14px"
                                    h="36px"
                                    px={8}
                                    onClick={() => setIsEditDialogOpen(false)}
                                    _hover={{ borderColor: "#C9CDD4", bg: "#FAFAFA" }}
                                >
                                    取消
                                </Button>
                                <Button
                                    bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
                                    color="white"
                                    fontSize="14px"
                                    h="36px"
                                    px={8}
                                    onClick={handleSaveEdit}
                                    _hover={{ opacity: 0.9 }}
                                >
                                    保存
                                </Button>
                            </HStack>
                        </DialogFooter>
                    </DialogContent>
                </DialogRoot>
            </Container>
        </Box>
    )
}
