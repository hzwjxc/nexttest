'use client'

import {
    Box,
    Container,
    Flex,
    Text,
    Button,
    Input,
    Table,
} from "@chakra-ui/react"
import { NativeSelectRoot, NativeSelectField } from "@chakra-ui/react"
import { useState, useRef, useEffect } from "react"
import { Checkbox } from "@/app/_components/ui/checkbox"
import { LuChevronDown, LuTrash2, LuPencil } from "react-icons/lu"
import { api } from "@/trpc/react"
import { toaster } from "@/app/_components/ui/toaster"
import { downloadTemplate, exportCases } from "./utils/excelUtils"
import { Pagination } from "./_components/Pagination"
import { CaseFormModal, type CaseFormData } from "./_components/CaseFormModal"
import { SystemManagementModal } from "./_components/SystemManagementModal"
import { ImportCasesModal } from "./_components/ImportCasesModal"

export default function CasesManagement() {
    const [searchText, setSearchText] = useState("")
    const [systemFilter, setSystemFilter] = useState("")
    const [selectedCases, setSelectedCases] = useState<string[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [showActionMenu, setShowActionMenu] = useState(false)
    const actionMenuRef = useRef<HTMLDivElement>(null)

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingCaseId, setEditingCaseId] = useState<string | null>(null)
    const [editingCaseData, setEditingCaseData] = useState<{
        title?: string; system?: string; precondition?: string;
        explanation?: string; testSteps?: string
    } | undefined>(undefined)
    const [showSystemModal, setShowSystemModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)

    // API Queries
    const { data: casesData, refetch: refetchCases } = api.testCase.list.useQuery({
        title: searchText || undefined,
        system: systemFilter || undefined,
        page: currentPage,
        pageSize,
    })

    const { data: allSystemsData } = api.testSystem.getAll.useQuery()

    // Mutations
    const createCaseMutation = api.testCase.create.useMutation({
        onSuccess: () => {
            toaster.create({ title: "新增用例成功", type: "success" })
            refetchCases()
            setShowAddModal(false)
        },
        onError: (error) => {
            toaster.create({ title: "新增失败", description: error.message, type: "error" })
        },
    })

    const updateCaseMutation = api.testCase.update.useMutation({
        onSuccess: () => {
            toaster.create({ title: "更新用例成功", type: "success" })
            refetchCases()
            setShowEditModal(false)
            setEditingCaseId(null)
        },
        onError: (error) => {
            toaster.create({ title: "更新失败", description: error.message, type: "error" })
        },
    })

    const deleteManyCasesMutation = api.testCase.deleteMany.useMutation({
        onSuccess: (data) => {
            toaster.create({ title: data.message, type: "success" })
            refetchCases()
            setSelectedCases([])
        },
        onError: (error) => {
            toaster.create({ title: "删除失败", description: error.message, type: "error" })
        },
    })

    const casesList = casesData?.data || []
    const totalItems = casesData?.pagination.total || 0
    const totalPages = casesData?.pagination.totalPages || 0

    const systemsOptions = [
        { value: "", label: "所属系统" },
        ...(allSystemsData?.map(s => ({ value: s.name, label: s.name })) || [])
    ]

    // Click outside to close action menu
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

    // Selection handlers
    const handleSelectCase = (id: string) => {
        if (selectedCases.includes(id)) {
            setSelectedCases(selectedCases.filter((caseId) => caseId !== id))
        } else {
            setSelectedCases([...selectedCases, id])
        }
    }

    const handleHeaderSelectAll = () => {
        const currentIds = casesList.map((c) => c.id)
        const allSelected = currentIds.every((id) => selectedCases.includes(id))
        if (allSelected) {
            setSelectedCases(selectedCases.filter((id) => !currentIds.includes(id)))
        } else {
            setSelectedCases([...new Set([...selectedCases, ...currentIds])])
        }
    }

    const isAllCurrentSelected = casesList.length > 0 &&
        casesList.every((c) => selectedCases.includes(c.id))

    // Search / Reset
    const handleSearch = () => {
        setCurrentPage(1)
        refetchCases()
    }

    const handleReset = () => {
        setSearchText("")
        setSystemFilter("")
        setSelectedCases([])
        setCurrentPage(1)
        refetchCases()
    }

    // Edit / Delete
    const handleEditCase = (caseItem: {
        id?: string; title?: string; system?: string;
        precondition?: string; explanation?: string; testSteps?: string
    }) => {
        setEditingCaseId(caseItem.id ?? null)
        setEditingCaseData({
            title: caseItem.title,
            system: caseItem.system,
            precondition: caseItem.precondition,
            explanation: caseItem.explanation,
            testSteps: caseItem.testSteps,
        })
        setShowEditModal(true)
    }

    const handleDeleteCase = (id: string) => {
        if (confirm('确定要删除该用例吗？')) {
            deleteManyCasesMutation.mutate({ ids: [id] })
        }
    }

    const handleDeleteSelectedCases = () => {
        if (selectedCases.length === 0) {
            toaster.create({ title: "请选择要删除的用例", type: "error" })
            return
        }
        deleteManyCasesMutation.mutate({ ids: selectedCases })
    }

    // Form submit handlers
    const handleCreateCase = (data: CaseFormData) => {
        createCaseMutation.mutate(data)
    }

    const handleUpdateCase = (data: CaseFormData) => {
        if (editingCaseId) {
            updateCaseMutation.mutate({ id: editingCaseId, ...data })
        }
    }

    // Export / Import
    const handleExportAllCases = () => {
        setShowActionMenu(false)
        if (casesList.length === 0) {
            toaster.create({ title: "没有可导出的用例", type: "warning" })
            return
        }
        exportCases(casesList, `所有用例_${new Date().toLocaleDateString('zh-CN')}.xlsx`)
        toaster.create({ title: "导出成功", type: "success" })
    }

    const handleExportSelectedCases = () => {
        setShowActionMenu(false)
        if (selectedCases.length === 0) {
            toaster.create({ title: "请选择要导出的用例", type: "warning" })
            return
        }
        const selectedData = casesList.filter(c => selectedCases.includes(c.id))
        exportCases(selectedData, `选中用例_${new Date().toLocaleDateString('zh-CN')}.xlsx`)
        toaster.create({ title: `成功导出 ${selectedData.length} 个用例`, type: "success" })
    }

    const handleDownloadTemplate = () => {
        setShowActionMenu(false)
        downloadTemplate()
        toaster.create({ title: "模板下载成功", type: "success" })
    }

    const actionItems = [
        { label: "新增用例", action: () => setShowAddModal(true) },
        { label: "选择删除用例", action: handleDeleteSelectedCases },
        { label: "导入用例", action: () => setShowImportModal(true) },
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
                                checked={isAllCurrentSelected}
                                onCheckedChange={handleHeaderSelectAll}
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
                                onClick={() => setShowSystemModal(true)}
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
                            {casesList.map((caseItem, index) => (
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
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalItems={totalItems}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                </Box>

                {/* Footer */}
                <Box textAlign="center" py={6}>
                    <Text fontSize="14px" color="#86909C">
                        备案信息
                    </Text>
                </Box>
            </Container>

            {/* Modals */}
            <CaseFormModal
                mode="add"
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleCreateCase}
                allSystemsData={allSystemsData}
            />

            <CaseFormModal
                mode="edit"
                isOpen={showEditModal}
                onClose={() => { setShowEditModal(false); setEditingCaseId(null) }}
                onSubmit={handleUpdateCase}
                allSystemsData={allSystemsData}
                initialData={editingCaseData}
            />

            <SystemManagementModal
                isOpen={showSystemModal}
                onClose={() => setShowSystemModal(false)}
            />

            <ImportCasesModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={refetchCases}
            />
        </Box>
    )
}
