import { Box, Flex, Text, Button, Input, Table, HStack } from "@chakra-ui/react"
import { LuX, LuPencil, LuTrash2 } from "react-icons/lu"
import { useState } from "react"
import { api } from "@/trpc/react"
import { toaster } from "@/app/_components/ui/toaster"
import { Checkbox } from "@/app/_components/ui/checkbox"
import { Pagination } from "./Pagination"

interface SystemManagementModalProps {
    isOpen: boolean
    onClose: () => void
}

export function SystemManagementModal({ isOpen, onClose }: SystemManagementModalProps) {
    const [searchText, setSearchText] = useState("")
    const [selectedSystems, setSelectedSystems] = useState<string[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [editingSystemId, setEditingSystemId] = useState<string | null>(null)
    const [editingSystemName, setEditingSystemName] = useState("")

    // Add System Modal state
    const [showAddModal, setShowAddModal] = useState(false)
    const [newSystemName, setNewSystemName] = useState("")

    // API
    const { data: systemsData, refetch: refetchSystems } = api.testSystem.list.useQuery({
        name: searchText || undefined,
        page: currentPage,
        pageSize,
    }, { enabled: isOpen })

    const { data: allSystemsData, refetch: refetchAllSystems } = api.testSystem.getAll.useQuery()

    const createSystemMutation = api.testSystem.create.useMutation({
        onSuccess: () => {
            toaster.create({ title: "新增成功", type: "success" })
            refetchSystems()
            refetchAllSystems()
            setShowAddModal(false)
            setNewSystemName("")
        },
        onError: (error) => {
            toaster.create({ title: "新增失败", description: error.message, type: "error" })
        },
    })

    const updateSystemMutation = api.testSystem.update.useMutation({
        onSuccess: () => {
            toaster.create({ title: "更新成功", type: "success" })
            refetchSystems()
            refetchAllSystems()
            setEditingSystemId(null)
            setEditingSystemName("")
        },
        onError: (error) => {
            toaster.create({ title: "更新失败", description: error.message, type: "error" })
        },
    })

    const deleteSystemMutation = api.testSystem.delete.useMutation({
        onSuccess: () => {
            toaster.create({ title: "删除成功", type: "success" })
            refetchSystems()
            refetchAllSystems()
        },
        onError: (error) => {
            toaster.create({ title: "删除失败", description: error.message, type: "error" })
        },
    })

    const deleteManySystemsMutation = api.testSystem.deleteMany.useMutation({
        onSuccess: (data) => {
            toaster.create({ title: data.message, type: "success" })
            refetchSystems()
            refetchAllSystems()
            setSelectedSystems([])
        },
        onError: (error) => {
            toaster.create({ title: "删除失败", description: error.message, type: "error" })
        },
    })

    const systemList = systemsData?.data || []
    const totalItems = systemsData?.pagination.total || 0
    const totalPages = systemsData?.pagination.totalPages || 0

    const handleSelectSystem = (id: string) => {
        if (selectedSystems.includes(id)) {
            setSelectedSystems(selectedSystems.filter((sysId) => sysId !== id))
        } else {
            setSelectedSystems([...selectedSystems, id])
        }
    }

    const handleHeaderSelectAll = () => {
        const currentIds = systemList.map((s) => s.id)
        const allSelected = currentIds.every((id) => selectedSystems.includes(id))
        if (allSelected) {
            setSelectedSystems(selectedSystems.filter((id) => !currentIds.includes(id)))
        } else {
            setSelectedSystems([...new Set([...selectedSystems, ...currentIds])])
        }
    }

    const isAllCurrentSelected = systemList.length > 0 &&
        systemList.every((s) => selectedSystems.includes(s.id))

    const handleSearch = () => {
        setCurrentPage(1)
        refetchSystems()
    }

    const handleReset = () => {
        setSearchText("")
        setSelectedSystems([])
        setCurrentPage(1)
        refetchSystems()
    }

    const handleEditSystem = (system: { id?: string; name?: string }) => {
        setEditingSystemId(system.id ?? null)
        setEditingSystemName(system.name ?? "")
    }

    const handleSaveEditSystem = () => {
        if (editingSystemId !== null && editingSystemName.trim()) {
            updateSystemMutation.mutate({ id: editingSystemId, name: editingSystemName.trim() })
        }
    }

    const handleDeleteSystem = (id: string) => {
        if (confirm('确定要删除该系统吗？')) {
            deleteSystemMutation.mutate({ id })
        }
    }

    const handleDeleteSelectedSystems = () => {
        if (selectedSystems.length === 0) {
            toaster.create({ title: "请选择要删除的系统", type: "warning" })
            return
        }
        if (confirm(`确定要删除选中的 ${selectedSystems.length} 个系统吗？`)) {
            deleteManySystemsMutation.mutate({ ids: selectedSystems })
        }
    }

    const handleConfirmAddSystem = () => {
        if (newSystemName.trim()) {
            createSystemMutation.mutate({ name: newSystemName.trim() })
        }
    }

    const handleClose = () => {
        setSearchText("")
        setSelectedSystems([])
        setCurrentPage(1)
        setEditingSystemId(null)
        setEditingSystemName("")
        onClose()
    }

    if (!isOpen) return null

    return (
        <>
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
                    {/* Header */}
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
                            onClick={handleClose}
                        >
                            <LuX size={20} />
                        </Button>
                    </Flex>

                    {/* Body */}
                    <Box flex={1} overflow="auto" p={6}>
                        {/* Search Bar */}
                        <Flex gap={3} mb={4} align="center" justify="space-between">
                            <Flex gap={3} align="center">
                                <Input
                                    placeholder="系统名称"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    size="sm"
                                    w="200px"
                                    bg="white"
                                    borderColor="#E5E6EB"
                                    borderRadius="999px"
                                    fontSize="14px"
                                    _placeholder={{ color: "#86909C" }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSearch()
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
                                onClick={() => setShowAddModal(true)}
                            >
                                新增
                            </Button>
                        </Flex>

                        {/* Table */}
                        <Box border="1px solid" borderColor="#E5E6EB" borderRadius="4px" overflow="hidden">
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
                                        <Table.ColumnHeader px={4} py={3}>
                                            <Text fontSize="14px" color="#86909C" fontWeight="400">系统名称</Text>
                                        </Table.ColumnHeader>
                                        <Table.ColumnHeader w="100px" px={4} py={3} textAlign="center">
                                            <Text fontSize="14px" color="#86909C" fontWeight="400">操作</Text>
                                        </Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {systemList.map((systemItem, index) => (
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
                                                <Text fontSize="14px" color="#1D2129">
                                                    {(currentPage - 1) * pageSize + index + 1}
                                                </Text>
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
                        <Box mt={4}>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                pageSize={pageSize}
                                totalItems={totalItems}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={setPageSize}
                            />
                        </Box>
                    </Box>

                    {/* Footer */}
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
                            onClick={handleClose}
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
                            onClick={handleClose}
                        >
                            确认
                        </Button>
                    </Flex>
                </Box>
            </Box>

            {/* Add System Sub-Modal */}
            {showAddModal && (
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
                    <Box bg="white" borderRadius="8px" w="500px" overflow="hidden">
                        <Flex
                            justify="space-between"
                            align="center"
                            p={4}
                            borderBottom="1px solid"
                            borderColor="#E5E6EB"
                        >
                            <Text fontSize="16px" fontWeight="500" color="#1D2129">新增系统</Text>
                            <Button
                                variant="ghost"
                                p={1}
                                minW="auto"
                                h="auto"
                                color="#86909C"
                                _hover={{ bg: "transparent", color: "#1D2129" }}
                                onClick={() => { setShowAddModal(false); setNewSystemName("") }}
                            >
                                <LuX size={20} />
                            </Button>
                        </Flex>

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
                                onClick={() => { setShowAddModal(false); setNewSystemName("") }}
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
        </>
    )
}
