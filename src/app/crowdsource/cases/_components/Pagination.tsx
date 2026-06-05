import { Box, Flex, HStack, Text, Button, Input } from "@chakra-ui/react"
import { NativeSelectRoot, NativeSelectField } from "@chakra-ui/react"
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"
import { useState } from "react"

interface PaginationProps {
    currentPage: number
    totalPages: number
    pageSize: number
    totalItems: number
    pageSizeOptions?: number[]
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
        pages.push(1)
        if (currentPage > 3) pages.push('...')

        const start = Math.max(2, currentPage - 1)
        const end = Math.min(totalPages - 1, currentPage + 1)
        for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) pages.push(i)
        }

        if (currentPage < totalPages - 2) pages.push('...')
        if (!pages.includes(totalPages)) pages.push(totalPages)
    }

    return pages
}

export function Pagination({
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    pageSizeOptions = [10, 20, 50],
    onPageChange,
    onPageSizeChange,
}: PaginationProps) {
    const [jumpPage, setJumpPage] = useState("")

    const handleJump = () => {
        const page = parseInt(jumpPage)
        if (page > 0 && page <= totalPages) {
            onPageChange(page)
            setJumpPage("")
        }
    }

    const pages = getPageNumbers(currentPage, totalPages)

    return (
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
                    onClick={() => onPageChange(currentPage - 1)}
                    _hover={{ bg: "transparent" }}
                >
                    <LuChevronLeft size={16} />
                </Button>

                {pages.map((page, index) => {
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
                            onClick={() => onPageChange(page as number)}
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
                    onClick={() => onPageChange(currentPage + 1)}
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
                            onPageSizeChange(parseInt(e.target.value))
                            onPageChange(1)
                        }}
                        borderColor="#E5E6EB"
                        borderRadius="4px"
                        fontSize="14px"
                        color="#1D2129"
                    >
                        {pageSizeOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}条/页</option>
                        ))}
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
    )
}
