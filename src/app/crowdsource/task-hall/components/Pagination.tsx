import React, { useState } from 'react';
import { Box, Flex, Button, Input, Text } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    onPageChange,
}: PaginationProps) {
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [jumpPage, setJumpPage] = useState('');

    const handlePrevious = () => {
        if (currentPage > 1) onPageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) onPageChange(currentPage + 1);
    };

    const handlePageClick = (page: number) => {
        onPageChange(page);
    };

    const handleJump = () => {
        const page = parseInt(jumpPage);
        if (page > 0 && page <= totalPages) {
            onPageChange(page);
            setJumpPage('');
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <Box bg="white" borderRadius="8px" boxShadow="0 1px 2px rgba(0,0,0,0.05)" p={4}>
            <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
                <Text fontSize="14px" color="#4E5969">
                    共{totalItems}条
                </Text>

                <Flex gap={2}>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentPage === 1}
                        color="#FE606B"
                    >
                        <ChevronLeft size={16} style={{ marginRight: '0.5rem' }} />
                        上一页
                    </Button>

                    {getPageNumbers().map((page, index) => {
                        if (page === '...') {
                            return (
                                <Text key={`ellipsis-${index}`} px={2} color="#4E5969">
                                    ⋯
                                </Text>
                            );
                        }

                        return (
                            <Button
                                key={page}
                                size="sm"
                                variant={currentPage === page ? 'solid' : 'outline'}
                                colorScheme={currentPage === page ? 'red' : 'gray'}
                                bg={currentPage === page ? '#FEDFE1' : undefined}
                                color={currentPage === page ? '#FE606B' : '#4E5969'}
                                border={currentPage === page ? undefined : 'none'}
                                onClick={() => handlePageClick(page as number)}
                            >
                                {page}
                            </Button>
                        );
                    })}

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        color="#FE606B"
                    >
                        下一页
                        <ChevronRight size={16} style={{ marginLeft: '0.5rem' }} />
                    </Button>
                </Flex>

                <Flex gap={2} align="center">
                    <select
                        style={{
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #E5E6EB',
                            fontSize: '0.875rem',
                            width: '120px',
                        }}
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                    >
                        <option value={10}>10条/页</option>
                        <option value={20}>20条/页</option>
                        <option value={50}>50条/页</option>
                    </select>

                    <Flex gap={1} align="center">
                        <Text fontSize="14px" color="#86909C">
                            前往
                        </Text>
                        <Input
                            type="number"
                            size="sm"
                            w="60px"
                            value={jumpPage}
                            onChange={(e) => setJumpPage(e.target.value)}
                            placeholder=" "
                            min="1"
                            max={totalPages}
                        />
                        <Button 
                            size="sm" 
                            colorScheme="red" 
                            bg="#FEDFE1"
                            color="#FE606B" 
                            onClick={handleJump}
                        >
                            跳转
                        </Button>
                    </Flex>
                </Flex>
            </Flex>
        </Box>
    );
}
