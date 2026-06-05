import { Box, Flex, Text, Button, Input } from "@chakra-ui/react"
import { LuX, LuUpload } from "react-icons/lu"
import { useState, useRef } from "react"
import { api } from "@/trpc/react"
import { toaster } from "@/app/_components/ui/toaster"
import { importCasesFromExcel } from "../utils/excelUtils"

interface ImportCasesModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function ImportCasesModal({ isOpen, onClose, onSuccess }: ImportCasesModalProps) {
    const [importFile, setImportFile] = useState<File | null>(null)
    const [isImporting, setIsImporting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const batchCreateMutation = api.testCase.batchCreate.useMutation({
        onSuccess: (data) => {
            toaster.create({
                title: "导入完成",
                description: data.message,
                type: "success",
            })
            onSuccess()
            handleClose()
        },
        onError: (error) => {
            toaster.create({
                title: "导入失败",
                description: error.message,
                type: "error",
            })
        },
    })

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const validTypes = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]
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

    const handleImport = async () => {
        if (!importFile) {
            toaster.create({ title: "请选择文件", type: "error" })
            return
        }

        setIsImporting(true)
        try {
            const cases = await importCasesFromExcel(importFile)

            const validCases = cases.filter(c => c.title && c.system)
            if (validCases.length === 0) {
                toaster.create({
                    title: "导入失败",
                    description: "文件中没有有效的用例数据",
                    type: "error",
                })
                return
            }

            batchCreateMutation.mutate({ cases: validCases })
        } catch (error) {
            toaster.create({
                title: "导入失败",
                description: error instanceof Error ? error.message : "文件解析失败",
                type: "error",
            })
        } finally {
            setIsImporting(false)
        }
    }

    const handleClose = () => {
        setImportFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        onClose()
    }

    if (!isOpen) return null

    return (
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
            <Box bg="white" borderRadius="8px" w="600px" overflow="hidden">
                {/* Header */}
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
                        onClick={handleClose}
                    >
                        <LuX size={20} />
                    </Button>
                </Flex>

                {/* Body */}
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

                {/* Footer */}
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
                        onClick={handleImport}
                        disabled={!importFile || isImporting}
                        loading={isImporting}
                    >
                        开始导入
                    </Button>
                </Flex>
            </Box>
        </Box>
    )
}
