import { Box, Flex, Text, Button, Input, Textarea } from "@chakra-ui/react"
import { NativeSelectRoot, NativeSelectField } from "@chakra-ui/react"
import { LuX, LuPlus, LuTrash2 } from "react-icons/lu"
import { useState, useEffect } from "react"
import { toaster } from "@/app/_components/ui/toaster"

export interface CaseStep {
    id: number
    description: string
    expectedResult: string
}

export interface CaseFormData {
    title: string
    system: string
    precondition?: string
    testSteps: string
    explanation?: string
}

export interface SystemOption {
    id: string
    name: string
}

interface CaseFormModalProps {
    mode: 'add' | 'edit'
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: CaseFormData) => void
    allSystemsData?: SystemOption[]
    initialData?: {
        title?: string
        system?: string
        precondition?: string
        explanation?: string
        testSteps?: string
    }
}

const defaultSteps: CaseStep[] = [
    { id: 1, description: "", expectedResult: "" },
    { id: 2, description: "", expectedResult: "" },
]

export function CaseFormModal({
    mode,
    isOpen,
    onClose,
    onSubmit,
    allSystemsData = [],
    initialData,
}: CaseFormModalProps) {
    const [caseName, setCaseName] = useState("")
    const [caseSystem, setCaseSystem] = useState("")
    const [testPreparation, setTestPreparation] = useState("")
    const [keyFocusInput, setKeyFocusInput] = useState("")
    const [caseSteps, setCaseSteps] = useState<CaseStep[]>(defaultSteps)

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setCaseName(initialData?.title ?? "")
            setCaseSystem(initialData?.system ?? "")
            setTestPreparation(initialData?.precondition ?? "")
            setKeyFocusInput(initialData?.explanation ?? "")

            try {
                const steps = JSON.parse(initialData?.testSteps || "[]")
                if (Array.isArray(steps) && steps.length > 0) {
                    setCaseSteps(
                        steps.map((step: CaseStep, index: number) => ({
                            ...step,
                            id: step.id ?? index + 1,
                        }))
                    )
                } else {
                    setCaseSteps(defaultSteps)
                }
            } catch {
                setCaseSteps(defaultSteps)
            }
        }
    }, [isOpen, initialData])

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

    const handleSubmit = () => {
        if (!caseName.trim()) {
            toaster.create({ title: "请输入用例名称", type: "error" })
            return
        }
        if (!caseSystem.trim()) {
            toaster.create({ title: "请选择所属系统", type: "error" })
            return
        }

        onSubmit({
            title: caseName,
            system: caseSystem,
            precondition: testPreparation || undefined,
            testSteps: JSON.stringify(caseSteps),
            explanation: keyFocusInput || undefined,
        })
    }

    if (!isOpen) return null

    const title = mode === 'add' ? '新增用例' : '编辑用例'

    return (
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
                {/* Header */}
                <Flex
                    justify="space-between"
                    align="center"
                    p={4}
                    borderBottom="1px solid"
                    borderColor="#E5E6EB"
                >
                    <Text fontSize="16px" fontWeight="500" color="#1D2129">
                        {title}
                    </Text>
                    <Button
                        variant="ghost"
                        p={1}
                        minW="auto"
                        h="auto"
                        color="#86909C"
                        _hover={{ bg: "transparent", color: "#1D2129" }}
                        onClick={onClose}
                    >
                        <LuX size={20} />
                    </Button>
                </Flex>

                {/* Body */}
                <Box p={6}>
                    {/* Case Name and System */}
                    <Flex gap={6} mb={5}>
                        <Box flex={1}>
                            <Flex mb={2}>
                                <Text fontSize="14px" color="#F53F3F" mr={1}>*</Text>
                                <Text fontSize="14px" color="#1D2129">用例名称</Text>
                            </Flex>
                            <Input
                                placeholder="请输入用例名称"
                                value={caseName}
                                onChange={(e) => setCaseName(e.target.value)}
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
                                    value={caseSystem}
                                    onChange={(e) => setCaseSystem(e.target.value)}
                                    borderColor="#E5E6EB"
                                    borderRadius="4px"
                                    fontSize="14px"
                                    color={caseSystem ? "#1D2129" : "#C9CDD4"}
                                >
                                    <option value="">请选择所属系统</option>
                                    {allSystemsData.map((sys) => (
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
                                <Flex
                                    key={step.id ?? `step-${index}`}
                                    borderBottom={index < caseSteps.length - 1 ? "1px solid" : "none"}
                                    borderColor="#E5E6EB"
                                >
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

                {/* Footer */}
                <Flex justify="flex-end" gap={3} p={4} borderTop="1px solid" borderColor="#E5E6EB">
                    {mode === 'edit' && (
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
                            onClick={onClose}
                        >
                            取消
                        </Button>
                    )}
                    {mode === 'add' && (
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
                            onClick={handleSubmit}
                        >
                            保存
                        </Button>
                    )}
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
                        {mode === 'add' ? '提交' : '保存'}
                    </Button>
                </Flex>
            </Box>
        </Box>
    )
}
