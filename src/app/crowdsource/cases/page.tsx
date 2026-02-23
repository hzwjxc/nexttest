'use client'

import {
    Box,
    Container,
    Flex,
    Text,
    Button,
    Input,
    Table,
    HStack,
    Textarea,
} from "@chakra-ui/react"
import { NativeSelectRoot, NativeSelectField } from "@chakra-ui/react"
import { useState, useRef, useEffect } from "react"
import { Checkbox } from "@/app/_components/ui/checkbox"
import { LuChevronDown, LuChevronLeft, LuChevronRight, LuPlus, LuTrash2, LuX, LuPencil, LuUpload, LuDownload } from "react-icons/lu"
import { api } from "@/trpc/react"
import { toaster } from "@/app/_components/ui/toaster"
import { downloadTemplate, exportCases, importCasesFromExcel } from "./utils/excelUtils"

// Interface for case steps
interface CaseStep {
    id: number
    description: string
    expectedResult: string
}

// Mock data for cases
const mockCases = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    system: "呼叫系统",
    caseName: i === 0 ? "黄金积存-个人网银用例" : "黄金积存-手机银行用例",
    keyFocus: i === 0 ? "黄金积存-个人网银用例" : "黄金积存-手机银行用例",
    createTime: "2024-09-19",
}))

export default function CasesManagement() {
    const [searchText, setSearchText] = useState("")
    const [systemFilter, setSystemFilter] = useState("")
    const [selectedCases, setSelectedCases] = useState<string[]>([])
    const [selectAll, setSelectAll] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [jumpPage, setJumpPage] = useState("")
    const [showActionMenu, setShowActionMenu] = useState(false)
    const actionMenuRef = useRef<HTMLDivElement>(null)

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false)
    const [newCaseName, setNewCaseName] = useState("")
    const [newCaseSystem, setNewCaseSystem] = useState("")
    const [testPreparation, setTestPreparation] = useState("")
    const [keyFocusInput, setKeyFocusInput] = useState("")
    const [caseSteps, setCaseSteps] = useState<CaseStep[]>([
        { id: 1, description: "", expectedResult: "" },
        { id: 2, description: "", expectedResult: "" },
    ])

    // System Management Modal state
    const [showSystemModal, setShowSystemModal] = useState(false)
    const [systemSearchText, setSystemSearchText] = useState("")
    const [selectedSystems, setSelectedSystems] = useState<string[]>([]) // 改为存储 ID 而不是序号
    const [systemCurrentPage, setSystemCurrentPage] = useState(1)
    const [systemPageSize, setSystemPageSize] = useState(10)
    const [systemJumpPage, setSystemJumpPage] = useState("")
    const [editingSystemId, setEditingSystemId] = useState<string | null>(null)
    const [editingSystemName, setEditingSystemName] = useState("")

    // Add System Modal state
    const [showAddSystemModal, setShowAddSystemModal] = useState(false)
    const [newSystemName, setNewSystemName] = useState("")

    // Edit Case Modal state
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingCaseId, setEditingCaseId] = useState<string | null>(null)

    // Import Modal state
    const [showImportModal, setShowImportModal] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // API Queries
    const { data: systemsData, refetch: refetchSystems, isLoading: systemsLoading } = api.testSystem.list.useQuery({
        name: systemSearchText || undefined,
        page: systemCurrentPage,
        pageSize: systemPageSize,
    }, {
        enabled: showSystemModal,
    })

    const { data: casesData, refetch: refetchCases, isLoading: casesLoading } = api.testCase.list.useQuery({
        title: searchText || undefined,
        system: systemFilter || undefined,
        page: currentPage,
        pageSize: pageSize,
    })

    const { data: allSystemsData, refetch: refetchAllSystems } = api.testSystem.getAll.useQuery()

    const createSystemMutation = api.testSystem.create.useMutation({
        onSuccess: () => {
            toaster.create({
                title: "新增成功",
                type: "success",
            })
            refetchSystems()
            refetchAllSystems()
            handleCloseAddSystemModal()
        },
        onError: (error) => {
            toaster.create({
                title: "新增失败",
                description: error.message,
                type: "error",
            })
        },
    })

    const updateSystemMutation = api.testSystem.update.useMutation({
        onSuccess: () => {
            toaster.create({
                title: "更新成功",
                type: "success",
            })
            refetchSystems()
            refetchAllSystems()
            setEditingSystemId(null)
            setEditingSystemName("")
        },
        onError: (error) => {
            toaster.create({
                title: "更新失败",
                description: error.message,
                type: "error",
            })
        },
    })

    const deleteSystemMutation = api.testSystem.delete.useMutation({
        onSuccess: () => {
            toaster.create({
                title: "删除成功",
                type: "success",
            })
            refetchSystems()
            refetchAllSystems()
        },
        onError: (error) => {
            toaster.create({
                title: "删除失败",
                description: error.message,
                type: "error",
            })
        },
    })

    const deleteManySystemsMutation = api.testSystem.deleteMany.useMutation({
        onSuccess: (data) => {
            toaster.create({
                title: data.message,
                type: "success",
            })
            refetchSystems()
            refetchAllSystems()
            setSelectedSystems([])
        },
        onError: (error) => {
            toaster.create({
                title: "删除失败",
                description: error.message,
                type: "error",
            })
        },
    })

    // Test Case Mutations
    const createCaseMutation = api.testCase.create.useMutation({
        onSuccess: () => {
            toaster.create({
                title: "新增用例成功",
                type: "success",
            })
            refetchCases()
            handleCloseAddModal()
        },
        onError: (error) => {
            toaster.create({
                title: "新增失败",
                description: error.message,
                type: "error",
            })
        },
    })

    const updateCaseMutation = api.testCase.update.useMutation({
        onSuccess: () => {
            toaster.create({
                title: "更新用例成功",
                type: "success",
            })
            refetchCases()
            handleCloseEditModal()
        },
        onError: (error) => {
            toaster.create({
                title: "更新失败",
                description: error.message,
                type: "error",
            })
        },
    })

    const deleteManyCasesMutation = api.testCase.deleteMany.useMutation({
        onSuccess: (data) => {
            toaster.create({
                title: data.message,
                type: "success",
            })
            refetchCases()
            setSelectedCases([])
        },
        onError: (error) => {
            toaster.create({
                title: "删除失败",
                description: error.message,
                type: "error",
            })
        },
    })

    const systemList = systemsData?.data || []
    const systemTotalItems = systemsData?.pagination.total || 0
    const systemTotalPages = systemsData?.pagination.totalPages || 0

    const casesList = casesData?.data || []
    const totalItems = casesData?.pagination.total || 0
    const totalPages = casesData?.pagination.totalPages || 0

    // Get current page data
    const currentData = casesList

    // Build systems dropdown options from API data
    const systemsOptions = [
        { value: "", label: "所属系统" },
        ...(allSystemsData?.map(s => ({ value: s.name, label: s.name })) || [])
    ]

    // Handle click outside to close action menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
                setShowActionMenu(false)
            }
        }

        if (showActionMenu) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showActionMenu])

    // Handle individual checkbox selection
    const handleSelectCase = (id: string) => {
        if (selectedCases.includes(id)) {
            setSelectedCases(selectedCases.filter((caseId) => caseId !== id))
        } else {
            setSelectedCases([...selectedCases, id])
        }
    }

    // Handle select all checkbox
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedCases([])
            setSelectAll(false)
        } else {
            setSelectedCases(currentData.map((c) => c.id))
            setSelectAll(true)
        }
    }

    // Handle header checkbox for current page
    const handleHeaderSelectAll = () => {
        const currentIds = currentData.map((c) => c.id)
        const allSelected = currentIds.every((id) => selectedCases.includes(id))

        if (allSelected) {
            setSelectedCases(selectedCases.filter((id) => !currentIds.includes(id)))
        } else {
            const newSelected = [...new Set([...selectedCases, ...currentIds])]
            setSelectedCases(newSelected)
        }
    }

    // Check if all current page items are selected
    const isAllCurrentSelected = currentData.length > 0 &&
        currentData.every((c) => selectedCases.includes(c.id))

    // Handle search
    const handleSearch = () => {
        setCurrentPage(1)
        refetchCases()
    }

    // Handle reset
    const handleReset = () => {
        setSearchText("")
        setSystemFilter("")
        setSelectedCases([])
        setSelectAll(false)
        setCurrentPage(1)
        refetchCases()
    }

    // Handle page jump
    const handleJump = () => {
        const page = parseInt(jumpPage)
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page)
            setJumpPage("")
        }
    }

    // Get page numbers to display
    const getPageNumbers = () => {
        const pages: (number | string)[] = []

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
            pages.push(1)

            if (currentPage > 3) {
                pages.push('...')
            }

            const start = Math.max(2, currentPage - 1)
            const end = Math.min(totalPages - 1, currentPage + 1)

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i)
            }

            if (currentPage < totalPages - 2) {
                pages.push('...')
            }

            if (!pages.includes(totalPages)) {
                pages.push(totalPages)
            }
        }

        return pages
    }

    // Modal handlers
    const handleOpenAddModal = () => {
        setShowAddModal(true)
        setShowActionMenu(false)
    }

    const handleCloseAddModal = () => {
        setShowAddModal(false)
        setNewCaseName("")
        setNewCaseSystem("")
        setTestPreparation("")
        setKeyFocusInput("")
        setCaseSteps([
            { id: 1, description: "", expectedResult: "" },
            { id: 2, description: "", expectedResult: "" },
        ])
    }

    const handleCloseEditModal = () => {
        setShowEditModal(false)
        setEditingCaseId(null)
        setNewCaseName("")
        setNewCaseSystem("")
        setTestPreparation("")
        setKeyFocusInput("")
        setCaseSteps([
            { id: 1, description: "", expectedResult: "" },
            { id: 2, description: "", expectedResult: "" },
        ])
    }

    const handleAddStep = () => {
        const newId = caseSteps.length > 0 ? Math.max(...caseSteps.map(s => s.id)) + 1 : 1
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

    const handleSave = () => {
        if (!newCaseName.trim()) {
            toaster.create({
                title: "请输入用例名称",
                type: "error",
            })
            return
        }
        if (!newCaseSystem.trim()) {
            toaster.create({
                title: "请选择所属系统",
                type: "error",
            })
            return
        }

        createCaseMutation.mutate({
            title: newCaseName,
            system: newCaseSystem,
            precondition: testPreparation || undefined,
            testSteps: JSON.stringify(caseSteps),
            explanation: keyFocusInput || undefined,
        })
    }

    const handleSubmit = () => {
        handleSave()
    }

    // System Management Modal handlers
    const currentSystemData = systemList // API 已经返回分页数据，不需要再次切片

    const handleOpenSystemModal = () => {
        setShowSystemModal(true)
    }

    const handleCloseSystemModal = () => {
        setShowSystemModal(false)
        setSystemSearchText("")
        setSelectedSystems([])
        setSystemCurrentPage(1)
        setEditingSystemId(null)
        setEditingSystemName("")
    }

    const handleSystemSearch = () => {
        setSystemCurrentPage(1)
        refetchSystems()
    }

    const handleSystemReset = () => {
        setSystemSearchText("")
        setSelectedSystems([])
        setSystemCurrentPage(1)
        refetchSystems()
    }

    const handleSelectSystem = (id: string) => {
        if (selectedSystems.includes(id)) {
            setSelectedSystems(selectedSystems.filter((sysId) => sysId !== id))
        } else {
            setSelectedSystems([...selectedSystems, id])
        }
    }

    const handleSystemHeaderSelectAll = () => {
        const currentIds = currentSystemData.map((s: { id: string }) => s.id)
        const allSelected = currentIds.every((id: string) => selectedSystems.includes(id))

        if (allSelected) {
            setSelectedSystems(selectedSystems.filter((id: string) => !currentIds.includes(id)))
        } else {
            const newSelected = [...new Set([...selectedSystems, ...currentIds])]
            setSelectedSystems(newSelected)
        }
    }

    const isAllSystemCurrentSelected = currentSystemData.length > 0 &&
        currentSystemData.every((s: { id: string }) => selectedSystems.includes(s.id))

    const handleAddSystem = () => {
        setShowAddSystemModal(true)
    }

    const handleCloseAddSystemModal = () => {
        setShowAddSystemModal(false)
        setNewSystemName("")
    }

    const handleConfirmAddSystem = () => {
        if (newSystemName.trim()) {
            createSystemMutation.mutate({
                name: newSystemName.trim(),
            })
        }
    }

    const handleEditSystem = (system: { id: string; name: string }) => {
        setEditingSystemId(system.id)
        setEditingSystemName(system.name)
    }

    const handleSaveEditSystem = () => {
        if (editingSystemId !== null && editingSystemName.trim()) {
            updateSystemMutation.mutate({
                id: editingSystemId,
                name: editingSystemName.trim(),
            })
        }
    }

    const handleDeleteSystem = (id: string) => {
        if (confirm('确定要删除该系统吗？')) {
            deleteSystemMutation.mutate({ id })
        }
    }

    const handleDeleteSelectedSystems = () => {
        if (selectedSystems.length === 0) {
            toaster.create({
                title: "请选择要删除的系统",
                type: "warning",
            })
            return
        }

        if (confirm(`确定要删除选中的 ${selectedSystems.length} 个系统吗？`)) {
            deleteManySystemsMutation.mutate({
                ids: selectedSystems,
            })
        }
    }

    const handleSystemPageJump = () => {
        const page = parseInt(systemJumpPage)
        if (page > 0 && page <= systemTotalPages) {
            setSystemCurrentPage(page)
            setSystemJumpPage("")
        }
    }

    const getSystemPageNumbers = () => {
        const pages: (number | string)[] = []

        if (systemTotalPages <= 7) {
            for (let i = 1; i <= systemTotalPages; i++) pages.push(i)
        } else {
            pages.push(1)

            if (systemCurrentPage > 3) {
                pages.push('...')
            }

            const start = Math.max(2, systemCurrentPage - 1)
            const end = Math.min(systemTotalPages - 1, systemCurrentPage + 1)

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i)
            }

            if (systemCurrentPage < systemTotalPages - 2) {
                pages.push('...')
            }

            if (!pages.includes(systemTotalPages)) {
                pages.push(systemTotalPages)
            }
        }

        return pages
    }

    const handleConfirmSystems = () => {
        console.log("Confirmed systems:", systemList)
        handleCloseSystemModal()
    }

    const handleDeleteSelectedCases = () => {
        if (selectedCases.length === 0) {
            toaster.create({
                title: "请选择要删除的用例",
                type: "error",
            })
            return
        }

        deleteManyCasesMutation.mutate({
            ids: selectedCases,
        })
    }

    const handleEditCase = (caseItem: any) => {
        setEditingCaseId(caseItem.id)
        setNewCaseName(caseItem.title)
        setNewCaseSystem(caseItem.system)
        setTestPreparation(caseItem.precondition || "")
        setKeyFocusInput(caseItem.explanation || "")

        // Parse testSteps JSON
        try {
            const steps = JSON.parse(caseItem.testSteps)
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

        setShowEditModal(true)
    }

    const handleDeleteCase = (id: string) => {
        if (confirm('确定要删除该用例吗？')) {
            deleteManyCasesMutation.mutate({
                ids: [id],
            })
        }
    }

    const handleUpdateCase = () => {
        if (!newCaseName.trim()) {
            toaster.create({
                title: "请输入用例名称",
                type: "error",
            })
            return
        }
        if (!newCaseSystem.trim()) {
            toaster.create({
                title: "请选择所属系统",
                type: "error",
            })
            return
        }

        if (editingCaseId) {
            updateCaseMutation.mutate({
                id: editingCaseId,
                title: newCaseName,
                system: newCaseSystem,
                precondition: testPreparation || undefined,
                testSteps: JSON.stringify(caseSteps),
                explanation: keyFocusInput || undefined,
            })
        }
    }

    // Import and Export handlers
    const handleOpenImportModal = () => {
        setShowImportModal(true)
        setShowActionMenu(false)
    }

    const handleCloseImportModal = () => {
        setShowImportModal(false)
        setImportFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // 验证文件类型
            const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
            if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                toaster.create({
                    title: "文件格式错误",
                    description: "请选择Excel文件（.xlsx或.xls）",
                    type: "error",
                })
                return
            }
            setImportFile(file)
        }
    }

    const handleImportCases = async () => {
        if (!importFile) {
            toaster.create({
                title: "请选择文件",
                type: "error",
            })
            return
        }

        try {
            const cases = await importCasesFromExcel(importFile)

            // 验证数据
            const validCases = cases.filter(c => c.title && c.system)
            if (validCases.length === 0) {
                toaster.create({
                    title: "导入失败",
                    description: "文件中没有有效的用例数据",
                    type: "error",
                })
                return
            }

            // 批量创建用例
            let successCount = 0
            let failCount = 0

            for (const caseData of validCases) {
                try {
                    await createCaseMutation.mutateAsync(caseData)
                    successCount++
                } catch (error) {
                    failCount++
                }
            }

            toaster.create({
                title: "导入完成",
                description: `成功导入 ${successCount} 个用例${failCount > 0 ? `，失败 ${failCount} 个` : ''}`,
                type: successCount > 0 ? "success" : "error",
            })

            if (successCount > 0) {
                refetchCases()
            }

            handleCloseImportModal()
        } catch (error) {
            toaster.create({
                title: "导入失败",
                description: error instanceof Error ? error.message : "文件解析失败",
                type: "error",
            })
        }
    }

    const handleExportAllCases = () => {
        setShowActionMenu(false)
        if (casesList.length === 0) {
            toaster.create({
                title: "没有可导出的用例",
                type: "warning",
            })
            return
        }

        exportCases(casesList, `所有用例_${new Date().toLocaleDateString('zh-CN')}.xlsx`)
        toaster.create({
            title: "导出成功",
            type: "success",
        })
    }

    const handleExportSelectedCases = () => {
        setShowActionMenu(false)
        if (selectedCases.length === 0) {
            toaster.create({
                title: "请选择要导出的用例",
                type: "warning",
            })
            return
        }

        const selectedData = casesList.filter(c => selectedCases.includes(c.id))
        exportCases(selectedData, `选中用例_${new Date().toLocaleDateString('zh-CN')}.xlsx`)
        toaster.create({
            title: `成功导出 ${selectedData.length} 个用例`,
            type: "success",
        })
    }

    const handleDownloadTemplate = () => {
        setShowActionMenu(false)
        downloadTemplate()
        toaster.create({
            title: "模板下载成功",
            type: "success",
        })
    }

    // Action menu items
    const actionItems = [
        { label: "新增用例", action: handleOpenAddModal },
        { label: "选择删除用例", action: handleDeleteSelectedCases },
        { label: "导入用例", action: handleOpenImportModal },
        { label: "全部导出用例", action: handleExportAllCases },
        { label: "选择导出用例", action: handleExportSelectedCases },
        { label: "用例模板下载", action: handleDownloadTemplate },
    ]

    return (
        <Box minH="100vh" bg="#F3F7FB">
            <Container maxW="1400px" py={6}>
                {/* Filter Bar */}
                <Box bg="white" borderRadius="8px" p={4} mb={4}>
                    <Flex gap={3} wrap="wrap" align="center" justify="space-between">
                        <Flex gap={3} wrap="wrap" align="center">
                            <Checkbox
                                checked={selectAll}
                                onCheckedChange={handleSelectAll}
                            >
                                <Text fontSize="14px" color="#1D2129">全选</Text>
                            </Checkbox>

                            <NativeSelectRoot w="120px" size="sm">
                                <NativeSelectField
                                    value={systemFilter}
                                    onChange={(e) => setSystemFilter(e.target.value)}
                                    bg="white"
                                    borderColor="#E5E6EB"
                                    borderRadius="4px"
                                    fontSize="14px"
                                    color="#86909C"
                                >
                                    {systemsOptions.map((sys) => (
                                        <option key={sys.value} value={sys.value}>
                                            {sys.label}
                                        </option>
                                    ))}
                                </NativeSelectField>
                            </NativeSelectRoot>

                            <Input
                                placeholder="用例名称"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                size="sm"
                                w="180px"
                                bg="white"
                                borderColor="#E5E6EB"
                                borderRadius="4px"
                                fontSize="14px"
                                _placeholder={{ color: "#86909C" }}
                            />

                            <Button
                                size="sm"
                                bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                                color="white"
                                borderRadius="999px"
                                px={6}
                                h="32px"
                                fontSize="14px"
                                fontWeight="400"
                                _hover={{ opacity: 0.9 }}
                                onClick={handleSearch}
                            >
                                查询
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                color="#86909C"
                                fontSize="14px"
                                fontWeight="400"
                                h="32px"
                                _hover={{ bg: "transparent" }}
                                onClick={handleReset}
                            >
                                重置
                            </Button>
                        </Flex>

                        <Flex gap={3} align="center">
                            <Button
                                size="sm"
                                variant="outline"
                                borderColor="#FE606B"
                                color="#FE606B"
                                borderRadius="999px"
                                px={4}
                                h="32px"
                                fontSize="14px"
                                fontWeight="400"
                                _hover={{ bg: "#FEDFE1" }}
                                onClick={handleOpenSystemModal}
                            >
                                系统管理
                            </Button>

                            {/* Action Dropdown */}
                            <Box position="relative" ref={actionMenuRef}>
                                <Button
                                    size="sm"
                                    bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                                    color="white"
                                    borderRadius="999px"
                                    px={4}
                                    h="32px"
                                    fontSize="14px"
                                    fontWeight="400"
                                    _hover={{ opacity: 0.9 }}
                                    onClick={() => setShowActionMenu(!showActionMenu)}
                                >
                                    操作
                                    <LuChevronDown style={{ marginLeft: '4px' }} />
                                </Button>

                                {showActionMenu && (
                                    <Box
                                        position="absolute"
                                        top="100%"
                                        right={0}
                                        mt={2}
                                        bg="white"
                                        borderRadius="8px"
                                        boxShadow="0 2px 8px rgba(0,0,0,0.15)"
                                        zIndex={10}
                                        minW="140px"
                                        py={2}
                                    >
                                        {actionItems.map((item, index) => (
                                            <Box
                                                key={index}
                                                px={4}
                                                py={2}
                                                fontSize="14px"
                                                color="#1D2129"
                                                cursor="pointer"
                                                _hover={{ bg: "#F2F3F5" }}
                                                onClick={() => {
                                                    item.action()
                                                    setShowActionMenu(false)
                                                }}
                                            >
                                                {item.label}
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        </Flex>
                    </Flex>
                </Box>

                {/* Data Table */}
                <Box bg="white" borderRadius="8px" overflow="hidden" mb={4}>
                    <Table.Root size="sm">
                        <Table.Header>
                            <Table.Row bg="#F7F8FA">
                                <Table.ColumnHeader w="50px" px={4} py={3}>
                                    <Checkbox
                                        checked={isAllCurrentSelected}
                                        onCheckedChange={handleHeaderSelectAll}
                                    />
                                </Table.ColumnHeader>
                                <Table.ColumnHeader w="80px" px={4} py={3}>
                                    <Text fontSize="14px" color="#86909C" fontWeight="400">序号</Text>
                                </Table.ColumnHeader>
                                <Table.ColumnHeader w="120px" px={4} py={3}>
                                    <Text fontSize="14px" color="#86909C" fontWeight="400">所属系统</Text>
                                </Table.ColumnHeader>
                                <Table.ColumnHeader px={4} py={3}>
                                    <Text fontSize="14px" color="#86909C" fontWeight="400">用例名称</Text>
                                </Table.ColumnHeader>
                                <Table.ColumnHeader px={4} py={3}>
                                    <Text fontSize="14px" color="#86909C" fontWeight="400">重点关注</Text>
                                </Table.ColumnHeader>
                                <Table.ColumnHeader w="140px" px={4} py={3}>
                                    <Text fontSize="14px" color="#86909C" fontWeight="400">创建时间</Text>
                                </Table.ColumnHeader>
                                <Table.ColumnHeader w="120px" px={4} py={3} textAlign="center">
                                    <Text fontSize="14px" color="#86909C" fontWeight="400">操作</Text>
                                </Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {currentData.map((caseItem, index) => (
                                <Table.Row
                                    key={caseItem.id}
                                    borderBottom="1px solid"
                                    borderColor="#F2F3F5"
                                    _hover={{ bg: "#FAFBFC" }}
                                >
                                    <Table.Cell px={4} py={3}>
                                        <Checkbox
                                            checked={selectedCases.includes(caseItem.id)}
                                            onCheckedChange={() => handleSelectCase(caseItem.id)}
                                        />
                                    </Table.Cell>
                                    <Table.Cell px={4} py={3}>
                                        <Text fontSize="14px" color="#1D2129">
                                            {(currentPage - 1) * pageSize + index + 1}
                                        </Text>
                                    </Table.Cell>
                                    <Table.Cell px={4} py={3}>
                                        <Text fontSize="14px" color="#1D2129">{caseItem.system}</Text>
                                    </Table.Cell>
                                    <Table.Cell px={4} py={3}>
                                        <Text fontSize="14px" color="#1D2129">{caseItem.title}</Text>
                                    </Table.Cell>
                                    <Table.Cell px={4} py={3}>
                                        <Text fontSize="14px" color="#1D2129">{caseItem.explanation || '-'}</Text>
                                    </Table.Cell>
                                    <Table.Cell px={4} py={3}>
                                        <Text fontSize="14px" color="#1D2129">
                                            {new Date(caseItem.createdAt).toLocaleDateString('zh-CN')}
                                        </Text>
                                    </Table.Cell>
                                    <Table.Cell px={4} py={3}>
                                        <Flex gap={2} justify="center">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                color="#165DFF"
                                                px={2}
                                                h="28px"
                                                fontSize="14px"
                                                _hover={{ bg: "#E8F3FF" }}
                                                onClick={() => handleEditCase(caseItem)}
                                            >
                                                <LuPencil size={14} />
                                                <Text ml={1}>编辑</Text>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                color="#F53F3F"
                                                px={2}
                                                h="28px"
                                                fontSize="14px"
                                                _hover={{ bg: "#FFECE8" }}
                                                onClick={() => handleDeleteCase(caseItem.id)}
                                            >
                                                <LuTrash2 size={14} />
                                                <Text ml={1}>删除</Text>
                                            </Button>
                                        </Flex>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Box>

                {/* Pagination */}
                <Box bg="white" borderRadius="8px" p={4}>
                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                        <Text fontSize="14px" color="#86909C">
                            共{totalItems}条
                        </Text>

                        <HStack gap={1}>
                            <Button
                                size="sm"
                                variant="ghost"
                                p={0}
                                minW="32px"
                                h="32px"
                                color="#C9CDD4"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(currentPage - 1)}
                                _hover={{ bg: "transparent" }}
                            >
                                <LuChevronLeft size={16} />
                            </Button>

                            {getPageNumbers().map((page, index) => {
                                if (page === '...') {
                                    return (
                                        <Text key={`ellipsis-${index}`} px={2} color="#86909C" fontSize="14px">
                                            ...
                                        </Text>
                                    )
                                }

                                return (
                                    <Button
                                        key={page}
                                        size="sm"
                                        minW="32px"
                                        h="32px"
                                        p={0}
                                        bg={currentPage === page ? "#FEDFE1" : "transparent"}
                                        color={currentPage === page ? "#FE606B" : "#1D2129"}
                                        border={currentPage === page ? "1px solid #FE606B" : "1px solid #E5E6EB"}
                                        borderRadius="4px"
                                        fontSize="14px"
                                        fontWeight="400"
                                        _hover={{
                                            bg: currentPage === page ? "#FEDFE1" : "#F2F3F5",
                                        }}
                                        onClick={() => setCurrentPage(page as number)}
                                    >
                                        {page}
                                    </Button>
                                )
                            })}

                            <Button
                                size="sm"
                                variant="ghost"
                                p={0}
                                minW="32px"
                                h="32px"
                                color="#C9CDD4"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(currentPage + 1)}
                                _hover={{ bg: "transparent" }}
                            >
                                <LuChevronRight size={16} />
                            </Button>
                        </HStack>

                        <HStack gap={2}>
                            <NativeSelectRoot size="sm" w="100px">
                                <NativeSelectField
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(parseInt(e.target.value))
                                        setCurrentPage(1)
                                    }}
                                    borderColor="#E5E6EB"
                                    borderRadius="4px"
                                    fontSize="14px"
                                    color="#1D2129"
                                >
                                    <option value={10}>10条/页</option>
                                    <option value={20}>20条/页</option>
                                    <option value={50}>50条/页</option>
                                </NativeSelectField>
                            </NativeSelectRoot>

                            <HStack gap={1}>
                                <Text fontSize="14px" color="#86909C">前往</Text>
                                <Input
                                    type="number"
                                    size="sm"
                                    w="50px"
                                    h="32px"
                                    value={jumpPage}
                                    onChange={(e) => setJumpPage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleJump()
                                    }}
                                    borderColor="#E5E6EB"
                                    borderRadius="4px"
                                    fontSize="14px"
                                    textAlign="center"
                                    min={1}
                                    max={totalPages}
                                />
                            </HStack>
                        </HStack>
                    </Flex>
                </Box>

                {/* Footer */}
                <Box textAlign="center" py={6}>
                    <Text fontSize="14px" color="#86909C">
                        备案信息
                    </Text>
                </Box>
            </Container>

            {/* Add Case Modal */}
            {showAddModal && (
                <Box
                    position="fixed"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="rgba(0,0,0,0.5)"
                    zIndex={1000}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Box
                        bg="white"
                        borderRadius="8px"
                        w="900px"
                        maxH="90vh"
                        overflow="auto"
                        position="relative"
                    >
                        {/* Modal Header */}
                        <Flex
                            justify="space-between"
                            align="center"
                            p={4}
                            borderBottom="1px solid"
                            borderColor="#E5E6EB"
                        >
                            <Text fontSize="16px" fontWeight="500" color="#1D2129">
                                新增用例
                            </Text>
                            <Button
                                variant="ghost"
                                p={1}
                                minW="auto"
                                h="auto"
                                color="#86909C"
                                _hover={{ bg: "transparent", color: "#1D2129" }}
                                onClick={handleCloseAddModal}
                            >
                                <LuX size={20} />
                            </Button>
                        </Flex>

                        {/* Modal Body */}
                        <Box p={6}>
                            {/* Form Row 1: Case Name and System */}
                            <Flex gap={6} mb={5}>
                                <Box flex={1}>
                                    <Flex mb={2}>
                                        <Text fontSize="14px" color="#F53F3F" mr={1}>*</Text>
                                        <Text fontSize="14px" color="#1D2129">用例名称</Text>
                                    </Flex>
                                    <Input
                                        placeholder="请输入用例名称"
                                        value={newCaseName}
                                        onChange={(e) => setNewCaseName(e.target.value)}
                                        size="md"
                                        borderColor="#E5E6EB"
                                        borderRadius="4px"
                                        fontSize="14px"
                                        _placeholder={{ color: "#C9CDD4" }}
                                        _focus={{ borderColor: "#FE606B", boxShadow: "none" }}
                                    />
                                </Box>
                                <Box flex={1}>
                                    <Flex mb={2}>
                                        <Text fontSize="14px" color="#F53F3F" mr={1}>*</Text>
                                        <Text fontSize="14px" color="#1D2129">所属系统</Text>
                                    </Flex>
                                    <NativeSelectRoot size="md">
                                        <NativeSelectField
                                            value={newCaseSystem}
                                            onChange={(e) => setNewCaseSystem(e.target.value)}
                                            borderColor="#E5E6EB"
                                            borderRadius="4px"
                                            fontSize="14px"
                                            color={newCaseSystem ? "#1D2129" : "#C9CDD4"}
                                        >
                                            <option value="">请选择所属系统</option>
                                            {allSystemsData?.map((sys) => (
                                                <option key={sys.id} value={sys.name}>
                                                    {sys.name}
                                                </option>
                                            ))}
                                        </NativeSelectField>
                                    </NativeSelectRoot>
                                </Box>
                            </Flex>

                            {/* Test Preparation */}
                            <Box mb={5}>
                                <Text fontSize="14px" color="#1D2129" mb={2}>测试准备</Text>
                                <Textarea
                                    placeholder="请输入测试准备"
                                    value={testPreparation}
                                    onChange={(e) => setTestPreparation(e.target.value)}
                                    size="md"
                                    borderColor="#E5E6EB"
                                    borderRadius="4px"
                                    fontSize="14px"
                                    minH="80px"
                                    resize="vertical"
                                    _placeholder={{ color: "#C9CDD4" }}
                                    _focus={{ borderColor: "#FE606B", boxShadow: "none" }}
                                />
                            </Box>

                            {/* Key Focus */}
                            <Box mb={5}>
                                <Text fontSize="14px" color="#1D2129" mb={2}>关注重点</Text>
                                <Textarea
                                    placeholder="请输入关注重点"
                                    value={keyFocusInput}
                                    onChange={(e) => setKeyFocusInput(e.target.value)}
                                    size="md"
                                    borderColor="#E5E6EB"
                                    borderRadius="4px"
                                    fontSize="14px"
                                    minH="80px"
                                    resize="vertical"
                                    _placeholder={{ color: "#C9CDD4" }}
                                    _focus={{ borderColor: "#FE606B", boxShadow: "none" }}
                                />
                            </Box>

                            {/* Case Steps */}
                            <Box>
                                <Text fontSize="14px" color="#1D2129" mb={3}>用例步骤</Text>
                                <Box border="1px solid" borderColor="#E5E6EB" borderRadius="4px" overflow="hidden">
                                    {/* Steps Table Header */}
                                    <Flex bg="#F7F8FA" borderBottom="1px solid" borderColor="#E5E6EB">
                                        <Box w="60px" p={3} textAlign="center">
                                            <Text fontSize="14px" color="#86909C">序号</Text>
                                        </Box>
                                        <Box flex={1} p={3} borderLeft="1px solid" borderColor="#E5E6EB">
                                            <Text fontSize="14px" color="#86909C">步骤描述</Text>
                                        </Box>
                                        <Box flex={1} p={3} borderLeft="1px solid" borderColor="#E5E6EB">
                                            <Text fontSize="14px" color="#86909C">预期结果</Text>
                                        </Box>
                                        <Box w="80px" p={3} borderLeft="1px solid" borderColor="#E5E6EB" textAlign="center">
                                            <Text fontSize="14px" color="#86909C">操作</Text>
                                        </Box>
                                    </Flex>

                                    {/* Steps Rows */}
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
                                                        size="sm"
                                                        border="1px solid"
                                                        borderColor="#E5E6EB"
                                                        borderRadius="4px"
                                                        fontSize="14px"
                                                        minH="60px"
                                                        resize="vertical"
                                                        _placeholder={{ color: "#C9CDD4" }}
                                                        _focus={{ borderColor: "#FE606B", boxShadow: "none" }}
                                                    />
                                                    <Text
                                                        position="absolute"
                                                        bottom="8px"
                                                        right="8px"
                                                        fontSize="12px"
                                                        color="#C9CDD4"
                                                    >
                                                        {(step.description || "").length}/500
                                                    </Text>
                                                </Box>
                                            </Box>
                                            <Box flex={1} p={2} borderLeft="1px solid" borderColor="#E5E6EB">
                                                <Box position="relative">
                                                    <Textarea
                                                        placeholder="请输入预期结果"
                                                        value={step.expectedResult}
                                                        onChange={(e) => handleStepChange(step.id, 'expectedResult', e.target.value)}
                                                        size="sm"
                                                        border="1px solid"
                                                        borderColor="#E5E6EB"
                                                        borderRadius="4px"
                                                        fontSize="14px"
                                                        minH="60px"
                                                        resize="vertical"
                                                        _placeholder={{ color: "#C9CDD4" }}
                                                        _focus={{ borderColor: "#FE606B", boxShadow: "none" }}
                                                    />
                                                    <Text
                                                        position="absolute"
                                                        bottom="8px"
                                                        right="8px"
                                                        fontSize="12px"
                                                        color="#C9CDD4"
                                                    >
                                                        {(step.expectedResult || "").length}/500
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
                                                    _hover={{ color: "#FE606B" }}
                                                    onClick={handleAddStep}
                                                >
                                                    <LuPlus size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    p={1}
                                                    minW="auto"
                                                    h="auto"
                                                    color="#86909C"
                                                    _hover={{ color: "#F53F3F" }}
                                                    onClick={() => handleRemoveStep(step.id)}
                                                    disabled={caseSteps.length <= 1}
                                                >
                                                    <LuTrash2 size={16} />
                                                </Button>
                                            </Box>
                                        </Flex>
                                    ))}
                                </Box>
                            </Box>
                        </Box>

                        {/* Modal Footer */}
                        <Flex justify="flex-end" gap={3} p={4} borderTop="1px solid" borderColor="#E5E6EB">
                            <Button
                                size="md"
                                variant="outline"
                                borderColor="#E5E6EB"
                                color="#1D2129"
                                borderRadius="999px"
                                px={6}
                                fontSize="14px"
                                fontWeight="400"
                                _hover={{ bg: "#F2F3F5" }}
                                onClick={handleSave}
                            >
                                保存
                            </Button>
                            <Button
                                size="md"
                                bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                                color="white"
                                borderRadius="999px"
                                px={6}
                                fontSize="14px"
                                fontWeight="400"
                                _hover={{ opacity: 0.9 }}
                                onClick={handleSubmit}
                            >
                                提交
                            </Button>
                        </Flex>
                    </Box>
                </Box>
            )}

            {/* Edit Case Modal */}
            {showEditModal && (
                <Box
                    position="fixed"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="rgba(0,0,0,0.5)"
                    zIndex={1000}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Box
                        bg="white"
                        borderRadius="8px"
                        w="900px"
                        maxH="90vh"
                        overflow="auto"
                        position="relative"
                    >
                        {/* Modal Header */}
                        <Flex
                            justify="space-between"
                            align="center"
                            p={4}
                            borderBottom="1px solid"
                            borderColor="#E5E6EB"
                        >
                            <Text fontSize="16px" fontWeight="500" color="#1D2129">
                                编辑用例
                            </Text>
                            <Button
                                variant="ghost"
                                p={1}
                                minW="auto"
                                h="auto"
                                color="#86909C"
                                _hover={{ bg: "transparent", color: "#1D2129" }}
                                onClick={handleCloseEditModal}
                            >
                                <LuX size={20} />
                            </Button>
                        </Flex>

                        {/* Modal Body */}
                        <Box p={6}>
                            {/* Form Row 1: Case Name and System */}
                            <Flex gap={6} mb={5}>
                                <Box flex={1}>
                                    <Flex mb={2}>
                                        <Text fontSize="14px" color="#F53F3F" mr={1}>*</Text>
                                        <Text fontSize="14px" color="#1D2129">用例名称</Text>
                                    </Flex>
                                    <Input
                                        placeholder="请输入用例名称"
                                        value={newCaseName}
                                        onChange={(e) => setNewCaseName(e.target.value)}
                                        size="md"
                                        borderColor="#E5E6EB"
                                        borderRadius="4px"
                                        fontSize="14px"
                                        _placeholder={{ color: "#C9CDD4" }}
                                        _focus={{ borderColor: "#FE606B", boxShadow: "none" }}
                                    />
                                </Box>
                                <Box flex={1}>
                                    <Flex mb={2}>
                                        <Text fontSize="14px" color="#F53F3F" mr={1}>*</Text>
                                        <Text fontSize="14px" color="#1D2129">所属系统</Text>
                                    </Flex>
                                    <NativeSelectRoot size="md">
                                        <NativeSelectField
                                            value={newCaseSystem}
                                            onChange={(e) => setNewCaseSystem(e.target.value)}
                                            borderColor="#E5E6EB"
                                            borderRadius="4px"
                                            fontSize="14px"
                                            color={newCaseSystem ? "#1D2129" : "#C9CDD4"}
                                        >
                                            <option value="">请选择所属系统</option>
                                            {allSystemsData?.map((sys) => (
                                                <option key={sys.id} value={sys.name}>
                                                    {sys.name}
                                                </option>
                                            ))}
                                        </NativeSelectField>
                                    </NativeSelectRoot>
                                </Box>
                            </Flex>

                            {/* Test Preparation */}
                            <Box mb={5}>
                                <Text fontSize="14px" color="#1D2129" mb={2}>测试准备</Text>
                                <Textarea
                                    placeholder="请输入测试准备"
                                    value={testPreparation}
                                    onChange={(e) => setTestPreparation(e.target.value)}
                                    size="md"
                                    borderColor="#E5E6EB"
                                    borderRadius="4px"
                                    fontSize="14px"
                                    minH="80px"
                                    resize="vertical"
                                    _placeholder={{ color: "#C9CDD4" }}
                                    _focus={{ borderColor: "#FE606B", boxShadow: "none" }}
                                />
                            </Box>

                            {/* Key Focus */}
                            <Box mb={5}>
                                <Text fontSize="14px" color="#1D2129" mb={2}>关注重点</Text>
                                <Textarea
                                    placeholder="请输入关注重点"
                                    value={keyFocusInput}
                                    onChange={(e) => setKeyFocusInput(e.target.value)}
                                    size="md"
                                    borderColor="#E5E6EB"
                                    borderRadius="4px"
                                    fontSize="14px"
                                    minH="80px"
                                    resize="vertical"
                                    _placeholder={{ color: "#C9CDD4" }}
                                    _focus={{ borderColor: "#FE606B", boxShadow: "none" }}
                                />
                            </Box>

                            {/* Case Steps */}
                            <Box>
                                <Text fontSize="14px" color="#1D2129" mb={3}>用例步骤</Text>
                                <Box border="1px solid" borderColor="#E5E6EB" borderRadius="4px" overflow="hidden">
                                    {/* Steps Table Header */}
                                    <Flex bg="#F7F8FA" borderBottom="1px solid" borderColor="#E5E6EB">
                                        <Box w="60px" p={3} textAlign="center">
                                            <Text fontSize="14px" color="#86909C">序号</Text>
                                        </Box>
                                        <Box flex={1} p={3} borderLeft="1px solid" borderColor="#E5E6EB">
                                            <Text fontSize="14px" color="#86909C">步骤描述</Text>
                                        </Box>
                                        <Box flex={1} p={3} borderLeft="1px solid" borderColor="#E5E6EB">
                                            <Text fontSize="14px" color="#86909C">预期结果</Text>
                                        </Box>
                                        <Box w="80px" p={3} borderLeft="1px solid" borderColor="#E5E6EB" textAlign="center">
                                            <Text fontSize="14px" color="#86909C">操作</Text>
                                        </Box>
                                    </Flex>

                                    {/* Steps Rows */}
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
                                                        size="sm"
                                                        border="1px solid"
                                                        borderColor="#E5E6EB"
                                                        borderRadius="4px"
                                                        fontSize="14px"
                                                        minH="60px"
                                                        resize="vertical"
                                                        _placeholder={{ color: "#C9CDD4" }}
                                                        _focus={{ borderColor: "#FE606B", boxShadow: "none" }}
                                                    />
                                                    <Text
                                                        position="absolute"
                                                        bottom="8px"
                                                        right="8px"
                                                        fontSize="12px"
                                                        color="#C9CDD4"
                                                    >
                                                        {(step.description || "").length}/500
                                                    </Text>
                                                </Box>
                                            </Box>
                                            <Box flex={1} p={2} borderLeft="1px solid" borderColor="#E5E6EB">
                                                <Box position="relative">
                                                    <Textarea
                                                        placeholder="请输入预期结果"
                                                        value={step.expectedResult}
                                                        onChange={(e) => handleStepChange(step.id, 'expectedResult', e.target.value)}
                                                        size="sm"
                                                        border="1px solid"
                                                        borderColor="#E5E6EB"
                                                        borderRadius="4px"
                                                        fontSize="14px"
                                                        minH="60px"
                                                        resize="vertical"
                                                        _placeholder={{ color: "#C9CDD4" }}
                                                        _focus={{ borderColor: "#FE606B", boxShadow: "none" }}
                                                    />
                                                    <Text
                                                        position="absolute"
                                                        bottom="8px"
                                                        right="8px"
                                                        fontSize="12px"
                                                        color="#C9CDD4"
                                                    >
                                                        {(step.expectedResult || "").length}/500
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
                                                    _hover={{ color: "#FE606B" }}
                                                    onClick={handleAddStep}
                                                >
                                                    <LuPlus size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    p={1}
                                                    minW="auto"
                                                    h="auto"
                                                    color="#86909C"
                                                    _hover={{ color: "#F53F3F" }}
                                                    onClick={() => handleRemoveStep(step.id)}
                                                    disabled={caseSteps.length <= 1}
                                                >
                                                    <LuTrash2 size={16} />
                                                </Button>
                                            </Box>
                                        </Flex>
                                    ))}
                                </Box>
                            </Box>
                        </Box>

                        {/* Modal Footer */}
                        <Flex justify="flex-end" gap={3} p={4} borderTop="1px solid" borderColor="#E5E6EB">
                            <Button
                                size="md"
                                variant="outline"
                                borderColor="#E5E6EB"
                                color="#1D2129"
                                borderRadius="999px"
                                px={6}
                                fontSize="14px"
                                fontWeight="400"
                                _hover={{ bg: "#F2F3F5" }}
                                onClick={handleCloseEditModal}
                            >
                                取消
                            </Button>
                            <Button
                                size="md"
                                bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                                color="white"
                                borderRadius="999px"
                                px={6}
                                fontSize="14px"
                                fontWeight="400"
                                _hover={{ opacity: 0.9 }}
                                onClick={handleUpdateCase}
                            >
                                保存
                            </Button>
                        </Flex>
                    </Box>
                </Box>
            )}

            {/* System Management Modal */}
            {showSystemModal && (
                <Box
                    position="fixed"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="rgba(0,0,0,0.5)"
                    zIndex={1000}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Box
                        bg="white"
                        borderRadius="8px"
                        w="900px"
                        maxH="90vh"
                        overflow="hidden"
                        display="flex"
                        flexDirection="column"
                    >
                        {/* Modal Header */}
                        <Flex
                            justify="space-between"
                            align="center"
                            p={4}
                            borderBottom="1px solid"
                            borderColor="#E5E6EB"
                            flexShrink={0}
                        >
                            <Text fontSize="16px" fontWeight="500" color="#1D2129">
                                系统管理
                            </Text>
                            <Button
                                variant="ghost"
                                p={1}
                                minW="auto"
                                h="auto"
                                color="#86909C"
                                _hover={{ bg: "transparent", color: "#1D2129" }}
                                onClick={handleCloseSystemModal}
                            >
                                <LuX size={20} />
                            </Button>
                        </Flex>

                        {/* Modal Body */}
                        <Box flex={1} overflow="auto" p={6}>
                            {/* Search Bar */}
                            <Flex gap={3} mb={4} align="center" justify="space-between">
                                <Flex gap={3} align="center">
                                    <Input
                                        placeholder="系统名称"
                                        value={systemSearchText}
                                        onChange={(e) => setSystemSearchText(e.target.value)}
                                        size="sm"
                                        w="200px"
                                        bg="white"
                                        borderColor="#E5E6EB"
                                        borderRadius="999px"
                                        fontSize="14px"
                                        _placeholder={{ color: "#86909C" }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSystemSearch()
                                        }}
                                    />

                                    <Button
                                        size="sm"
                                        bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                                        color="white"
                                        borderRadius="999px"
                                        px={6}
                                        h="32px"
                                        fontSize="14px"
                                        fontWeight="400"
                                        _hover={{ opacity: 0.9 }}
                                        onClick={handleSystemSearch}
                                    >
                                        查询
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        color="#86909C"
                                        fontSize="14px"
                                        fontWeight="400"
                                        h="32px"
                                        _hover={{ bg: "transparent" }}
                                        onClick={handleSystemReset}
                                    >
                                        重置
                                    </Button>

                                    {selectedSystems.length > 0 && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            borderColor="#FE606B"
                                            color="#FE606B"
                                            borderRadius="999px"
                                            px={4}
                                            h="32px"
                                            fontSize="14px"
                                            fontWeight="400"
                                            _hover={{ bg: "#FEDFE1" }}
                                            onClick={handleDeleteSelectedSystems}
                                        >
                                            批量删除 ({selectedSystems.length})
                                        </Button>
                                    )}
                                </Flex>

                                <Button
                                    size="sm"
                                    bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                                    color="white"
                                    borderRadius="999px"
                                    px={6}
                                    h="32px"
                                    fontSize="14px"
                                    fontWeight="400"
                                    _hover={{ opacity: 0.9 }}
                                    onClick={handleAddSystem}
                                >
                                    新增
                                </Button>
                            </Flex>

                            {/* Systems Table */}
                            <Box border="1px solid" borderColor="#E5E6EB" borderRadius="4px" overflow="hidden">
                                <Table.Root size="sm">
                                    <Table.Header>
                                        <Table.Row bg="#F7F8FA">
                                            <Table.ColumnHeader w="50px" px={4} py={3}>
                                                <Checkbox
                                                    checked={isAllSystemCurrentSelected}
                                                    onCheckedChange={handleSystemHeaderSelectAll}
                                                />
                                            </Table.ColumnHeader>
                                            <Table.ColumnHeader w="80px" px={4} py={3}>
                                                <Text fontSize="14px" color="#86909C" fontWeight="400">序号</Text>
                                            </Table.ColumnHeader>
                                            <Table.ColumnHeader px={4} py={3}>
                                                <Text fontSize="14px" color="#86909C" fontWeight="400">系统名称</Text>
                                            </Table.ColumnHeader>
                                            <Table.ColumnHeader w="100px" px={4} py={3} textAlign="center">
                                                <Text fontSize="14px" color="#86909C" fontWeight="400">操作</Text>
                                            </Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {currentSystemData.map((systemItem: { id: string; name: string; createdAt: string; updatedAt: string }, index: number) => (
                                            <Table.Row
                                                key={systemItem.id}
                                                borderBottom="1px solid"
                                                borderColor="#F2F3F5"
                                                _hover={{ bg: "#FAFBFC" }}
                                            >
                                                <Table.Cell px={4} py={3}>
                                                    <Checkbox
                                                        checked={selectedSystems.includes(systemItem.id)}
                                                        onCheckedChange={() => handleSelectSystem(systemItem.id)}
                                                    />
                                                </Table.Cell>
                                                <Table.Cell px={4} py={3}>
                                                    <Text fontSize="14px" color="#1D2129">{(systemCurrentPage - 1) * systemPageSize + index + 1}</Text>
                                                </Table.Cell>
                                                <Table.Cell px={4} py={3}>
                                                    {editingSystemId === systemItem.id ? (
                                                        <Input
                                                            value={editingSystemName}
                                                            onChange={(e) => setEditingSystemName(e.target.value)}
                                                            size="sm"
                                                            borderColor="#FE606B"
                                                            borderRadius="4px"
                                                            fontSize="14px"
                                                            autoFocus
                                                            onBlur={handleSaveEditSystem}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveEditSystem()
                                                            }}
                                                        />
                                                    ) : (
                                                        <Text fontSize="14px" color="#1D2129">{systemItem.name}</Text>
                                                    )}
                                                </Table.Cell>
                                                <Table.Cell px={4} py={3}>
                                                    <Flex gap={3} justify="center">
                                                        <Button
                                                            variant="ghost"
                                                            p={1}
                                                            minW="auto"
                                                            h="auto"
                                                            color="#86909C"
                                                            _hover={{ color: "#FE606B" }}
                                                            onClick={() => handleEditSystem(systemItem)}
                                                        >
                                                            <LuPencil size={16} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            p={1}
                                                            minW="auto"
                                                            h="auto"
                                                            color="#FE606B"
                                                            _hover={{ color: "#F53F3F" }}
                                                            onClick={() => handleDeleteSystem(systemItem.id)}
                                                        >
                                                            <LuTrash2 size={16} />
                                                        </Button>
                                                    </Flex>
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table.Root>
                            </Box>

                            {/* Pagination */}
                            <Flex justify="space-between" align="center" mt={4} flexWrap="wrap" gap={4}>
                                <Text fontSize="14px" color="#86909C">
                                    共{systemTotalItems}条
                                </Text>

                                <HStack gap={1}>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        p={0}
                                        minW="32px"
                                        h="32px"
                                        color="#C9CDD4"
                                        disabled={systemCurrentPage === 1}
                                        onClick={() => setSystemCurrentPage(systemCurrentPage - 1)}
                                        _hover={{ bg: "transparent" }}
                                    >
                                        <LuChevronLeft size={16} />
                                    </Button>

                                    {getSystemPageNumbers().map((page, index) => {
                                        if (page === '...') {
                                            return (
                                                <Text key={`sys-ellipsis-${index}`} px={2} color="#86909C" fontSize="14px">
                                                    ...
                                                </Text>
                                            )
                                        }

                                        return (
                                            <Button
                                                key={`sys-page-${page}`}
                                                size="sm"
                                                minW="32px"
                                                h="32px"
                                                p={0}
                                                bg={systemCurrentPage === page ? "#FEDFE1" : "transparent"}
                                                color={systemCurrentPage === page ? "#FE606B" : "#1D2129"}
                                                border={systemCurrentPage === page ? "1px solid #FE606B" : "1px solid #E5E6EB"}
                                                borderRadius="4px"
                                                fontSize="14px"
                                                fontWeight="400"
                                                _hover={{
                                                    bg: systemCurrentPage === page ? "#FEDFE1" : "#F2F3F5",
                                                }}
                                                onClick={() => setSystemCurrentPage(page as number)}
                                            >
                                                {page}
                                            </Button>
                                        )
                                    })}

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        p={0}
                                        minW="32px"
                                        h="32px"
                                        color="#C9CDD4"
                                        disabled={systemCurrentPage === systemTotalPages}
                                        onClick={() => setSystemCurrentPage(systemCurrentPage + 1)}
                                        _hover={{ bg: "transparent" }}
                                    >
                                        <LuChevronRight size={16} />
                                    </Button>
                                </HStack>

                                <HStack gap={2}>
                                    <NativeSelectRoot size="sm" w="100px">
                                        <NativeSelectField
                                            value={systemPageSize}
                                            onChange={(e) => {
                                                setSystemPageSize(parseInt(e.target.value))
                                                setSystemCurrentPage(1)
                                            }}
                                            borderColor="#E5E6EB"
                                            borderRadius="4px"
                                            fontSize="14px"
                                            color="#1D2129"
                                        >
                                            <option value={10}>10条/页</option>
                                            <option value={20}>20条/页</option>
                                            <option value={50}>50条/页</option>
                                        </NativeSelectField>
                                    </NativeSelectRoot>

                                    <HStack gap={1}>
                                        <Text fontSize="14px" color="#86909C">前往</Text>
                                        <Input
                                            type="number"
                                            size="sm"
                                            w="50px"
                                            h="32px"
                                            value={systemJumpPage}
                                            onChange={(e) => setSystemJumpPage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSystemPageJump()
                                            }}
                                            borderColor="#E5E6EB"
                                            borderRadius="4px"
                                            fontSize="14px"
                                            textAlign="center"
                                            min={1}
                                            max={systemTotalPages}
                                        />
                                    </HStack>
                                </HStack>
                            </Flex>
                        </Box>

                        {/* Modal Footer */}
                        <Flex justify="flex-end" gap={3} p={4} borderTop="1px solid" borderColor="#E5E6EB" flexShrink={0}>
                            <Button
                                size="md"
                                variant="outline"
                                borderColor="#E5E6EB"
                                color="#1D2129"
                                borderRadius="999px"
                                px={6}
                                fontSize="14px"
                                fontWeight="400"
                                _hover={{ bg: "#F2F3F5" }}
                                onClick={handleCloseSystemModal}
                            >
                                取消
                            </Button>
                            <Button
                                size="md"
                                bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                                color="white"
                                borderRadius="999px"
                                px={6}
                                fontSize="14px"
                                fontWeight="400"
                                _hover={{ opacity: 0.9 }}
                                onClick={handleConfirmSystems}
                            >
                                确认
                            </Button>
                        </Flex>
                    </Box>
                </Box>
            )}

            {/* Add System Modal */}
            {showAddSystemModal && (
                <Box
                    position="fixed"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="rgba(0,0,0,0.5)"
                    zIndex={1100}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Box
                        bg="white"
                        borderRadius="8px"
                        w="500px"
                        overflow="hidden"
                    >
                        {/* Modal Header */}
                        <Flex
                            justify="space-between"
                            align="center"
                            p={4}
                            borderBottom="1px solid"
                            borderColor="#E5E6EB"
                        >
                            <Text fontSize="16px" fontWeight="500" color="#1D2129">
                                新增系统
                            </Text>
                            <Button
                                variant="ghost"
                                p={1}
                                minW="auto"
                                h="auto"
                                color="#86909C"
                                _hover={{ bg: "transparent", color: "#1D2129" }}
                                onClick={handleCloseAddSystemModal}
                            >
                                <LuX size={20} />
                            </Button>
                        </Flex>

                        {/* Modal Body */}
                        <Box p={6}>
                            <Box>
                                <Flex mb={2}>
                                    <Text fontSize="14px" color="#F53F3F" mr={1}>*</Text>
                                    <Text fontSize="14px" color="#1D2129">系统名称</Text>
                                </Flex>
                                <Input
                                    placeholder="请输入系统名称"
                                    value={newSystemName}
                                    onChange={(e) => setNewSystemName(e.target.value)}
                                    size="md"
                                    borderColor="#E5E6EB"
                                    borderRadius="4px"
                                    fontSize="14px"
                                    _placeholder={{ color: "#C9CDD4" }}
                                    _focus={{ borderColor: "#FE606B", boxShadow: "none" }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleConfirmAddSystem()
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Modal Footer */}
                        <Flex justify="flex-end" gap={3} p={4} borderTop="1px solid" borderColor="#E5E6EB">
                            <Button
                                size="md"
                                variant="outline"
                                borderColor="#E5E6EB"
                                color="#1D2129"
                                borderRadius="999px"
                                px={6}
                                fontSize="14px"
                                fontWeight="400"
                                _hover={{ bg: "#F2F3F5" }}
                                onClick={handleCloseAddSystemModal}
                            >
                                取消
                            </Button>
                            <Button
                                size="md"
                                bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                                color="white"
                                borderRadius="999px"
                                px={6}
                                fontSize="14px"
                                fontWeight="400"
                                _hover={{ opacity: 0.9 }}
                                onClick={handleConfirmAddSystem}
                                disabled={!newSystemName.trim()}
                            >
                                确认
                            </Button>
                        </Flex>
                    </Box>
                </Box>
            )}

            {/* Import Cases Modal */}
            {showImportModal && (
                <Box
                    position="fixed"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="rgba(0,0,0,0.5)"
                    zIndex={1100}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Box
                        bg="white"
                        borderRadius="8px"
                        w="600px"
                        overflow="hidden"
                    >
                        {/* Modal Header */}
                        <Flex
                            justify="space-between"
                            align="center"
                            p={4}
                            borderBottom="1px solid"
                            borderColor="#E5E6EB"
                        >
                            <Text fontSize="16px" fontWeight="500" color="#1D2129">
                                导入用例
                            </Text>
                            <Button
                                variant="ghost"
                                p={1}
                                minW="auto"
                                h="auto"
                                color="#86909C"
                                _hover={{ bg: "transparent", color: "#1D2129" }}
                                onClick={handleCloseImportModal}
                            >
                                <LuX size={20} />
                            </Button>
                        </Flex>

                        {/* Modal Body */}
                        <Box p={6}>
                            <Box mb={4}>
                                <Text fontSize="14px" color="#1D2129" mb={2}>
                                    选择Excel文件
                                </Text>
                                <Text fontSize="12px" color="#86909C" mb={3}>
                                    支持.xlsx和.xls格式文件，请先下载模板填写后再导入
                                </Text>
                                <Input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    display="none"
                                />
                                <Flex gap={3} align="center">
                                    <Button
                                        size="md"
                                        variant="outline"
                                        borderColor="#E5E6EB"
                                        color="#1D2129"
                                        borderRadius="4px"
                                        px={4}
                                        fontSize="14px"
                                        fontWeight="400"
                                        _hover={{ bg: "#F2F3F5" }}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <LuUpload size={16} />
                                        <Text ml={2}>选择文件</Text>
                                    </Button>
                                    {importFile && (
                                        <Text fontSize="14px" color="#1D2129">
                                            {importFile.name}
                                        </Text>
                                    )}
                                </Flex>
                            </Box>

                            <Box
                                bg="#F7F8FA"
                                borderRadius="4px"
                                p={3}
                                border="1px solid"
                                borderColor="#E5E6EB"
                            >
                                <Text fontSize="14px" color="#1D2129" fontWeight="500" mb={2}>
                                    导入说明
                                </Text>
                                <Text fontSize="12px" color="#4E5969" lineHeight="20px">
                                    1. 用例名称和所属系统为必填项<br />
                                    2. 测试步骤需要按照JSON格式填写<br />
                                    3. 建议先下载模板，按照模板格式填写数据<br />
                                    4. 导入过程中遇到错误的数据将被跳过
                                </Text>
                            </Box>
                        </Box>

                        {/* Modal Footer */}
                        <Flex justify="flex-end" gap={3} p={4} borderTop="1px solid" borderColor="#E5E6EB">
                            <Button
                                size="md"
                                variant="outline"
                                borderColor="#E5E6EB"
                                color="#1D2129"
                                borderRadius="999px"
                                px={6}
                                fontSize="14px"
                                fontWeight="400"
                                _hover={{ bg: "#F2F3F5" }}
                                onClick={handleCloseImportModal}
                            >
                                取消
                            </Button>
                            <Button
                                size="md"
                                bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                                color="white"
                                borderRadius="999px"
                                px={6}
                                fontSize="14px"
                                fontWeight="400"
                                _hover={{ opacity: 0.9 }}
                                onClick={handleImportCases}
                                disabled={!importFile}
                            >
                                开始导入
                            </Button>
                        </Flex>
                    </Box>
                </Box>
            )}
        </Box>
    )
}
