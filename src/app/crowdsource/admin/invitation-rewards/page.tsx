'use client';

import React, { useState } from 'react';
import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

import {
    LuPlus,
    LuChevronUp,
    LuChevronDown,
    LuPencil,
    LuTrash2,
} from 'react-icons/lu';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';


const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    borderColor: '#E5E6EB',
};

export default function InvitationRewardsPage() {
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);

    // 查询邀请有奖列表
    const { data, isLoading, refetch } = api.invitationReward.list.useQuery(
        {
            page,
            pageSize,
        },
        {
            refetchOnMount: 'always',
            refetchOnWindowFocus: true,
        }
    );

    // 删除邀请有奖活动
    const deleteMutation = api.invitationReward.delete.useMutation({
        onSuccess: () => {
            showSuccessToast('删除成功');
            refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 上移邀请有奖活动
    const moveUpMutation = api.invitationReward.moveUp.useMutation({
        onSuccess: (result) => {
            if (result.success) {
                showSuccessToast(result.message);
                refetch();
            } else {
                showErrorToast(result.message);
            }
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 下移邀请有奖活动
    const moveDownMutation = api.invitationReward.moveDown.useMutation({
        onSuccess: (result) => {
            if (result.success) {
                showSuccessToast(result.message);
                refetch();
            } else {
                showErrorToast(result.message);
            }
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 切换状态
    const toggleStatusMutation = api.invitationReward.toggleStatus.useMutation({
        onSuccess: (result) => {
            showSuccessToast(result.message);
            refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    const rewards = data?.data || [];
    const pagination = data?.pagination;

    // 生成页码
    const totalPages = pagination?.totalPages || 0;
    const pageNumbers = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }
    } else {
        if (page <= 4) {
            pageNumbers.push(1, 2, 3, 4, 5, -1, totalPages);
        } else if (page >= totalPages - 3) {
            pageNumbers.push(
                1,
                -1,
                totalPages - 4,
                totalPages - 3,
                totalPages - 2,
                totalPages - 1,
                totalPages
            );
        } else {
            pageNumbers.push(1, -1, page - 1, page, page + 1, -1, totalPages);
        }
    }

    // 处理新增
    const handleAdd = () => {
        router.push('/crowdsource/admin/invitation-rewards/create');
    };

    // 处理编辑
    const handleEdit = (reward: any) => {
        router.push(`/crowdsource/admin/invitation-rewards/${reward.id}/edit`);
    };

    // 处理删除
    const handleDelete = (id: string) => {
        if (confirm('确定要删除这个邀请有奖活动吗？')) {
            deleteMutation.mutate({ id });
        }
    };

    // 处理上移
    const handleMoveUp = (id: string) => {
        moveUpMutation.mutate({ id });
    };

    // 处理下移
    const handleMoveDown = (id: string) => {
        moveDownMutation.mutate({ id });
    };

    // 处理状态切换
    const handleToggleStatus = (id: string, currentStatus: boolean) => {
        toggleStatusMutation.mutate({ id, isActive: !currentStatus });
    };



    // 格式化日期时间
    const formatDateTime = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    return (
        <Box>
            <Box
                bg={COLORS.bgPrimary}
                borderRadius="8px"
                p={6}
                boxShadow="0 1px 2px rgba(0,0,0,0.05)"
            >
                {/* 面包屑 */}
                <Flex align="center" gap={2} mb={4}>
                    <Text fontSize="14px" color={COLORS.textSecondary}>
                        后台管理
                    </Text>
                    <Text fontSize="14px" color={COLORS.textTertiary}>
                        /
                    </Text>
                    <Text
                        fontSize="14px"
                        color={COLORS.textPrimary}
                        fontWeight="500"
                    >
                        邀请有奖管理
                    </Text>
                </Flex>

                {/* 标题 */}
                <Text
                    fontSize="20px"
                    fontWeight="600"
                    color={COLORS.textPrimary}
                    mb={6}
                >
                    邀请有奖管理
                </Text>

                {/* 新增按钮 */}
                <Flex justify="flex-end" mb={6}>
                    <Button
                        background="linear-gradient(to right, #FF9566, #FE606B)"
                        color="white"
                        fontSize="14px"
                        px={6}
                        _hover={{ opacity: 0.9 }}
                        onClick={handleAdd}
                    >
                        <Flex align="center" gap={2}>
                            <LuPlus />
                            <Text>新增</Text>
                        </Flex>
                    </Button>
                </Flex>

                {/* 表格 */}
                <Box overflowX="auto">
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '14px',
                        }}
                    >
                        <thead>
                            <tr style={{ background: COLORS.bgSecondary }}>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '60px',
                                    }}
                                >
                                    序号
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '120px',
                                    }}
                                >
                                    海报
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '160px',
                                    }}
                                >
                                    起始时间
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '160px',
                                    }}
                                >
                                    关闭时间
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '100px',
                                    }}
                                >
                                    邀请人数
                                </th>
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        borderBottom: `1px solid ${COLORS.borderColor}`,
                                        minWidth: '120px',
                                    }}
                                >
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        style={{
                                            padding: '40px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Text color={COLORS.textTertiary}>
                                            加载中...
                                        </Text>
                                    </td>
                                </tr>
                            ) : rewards.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        style={{
                                            padding: '40px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Text color={COLORS.textTertiary}>
                                            暂无数据
                                        </Text>
                                    </td>
                                </tr>
                            ) : (
                                rewards.map((reward: any, index: number) => (
                                    <tr
                                        key={reward.id}
                                        style={{
                                            borderBottom: `1px solid ${COLORS.borderColor}`,
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {(page - 1) * pageSize + index + 1}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                            }}
                                        >
                                            <img
                                                src={reward.posterImage}
                                                alt="海报"
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    objectFit: 'cover',
                                                    borderRadius: '4px',
                                                }}
                                            />
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textSecondary,
                                            }}
                                        >
                                            {formatDateTime(reward.startTime)}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textSecondary,
                                            }}
                                        >
                                            {formatDateTime(reward.endTime)}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                color: COLORS.textPrimary,
                                            }}
                                        >
                                            {reward.selectedTagIds && reward.selectedTagIds.length > 0
                                                ? `${reward.expectedInviteCount}人`
                                                : '未选择标签'
                                            }
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                            }}
                                        >
                                            <Flex gap={2} justify="center">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    colorScheme="gray"
                                                    onClick={() =>
                                                        handleMoveUp(reward.id)
                                                    }
                                                >
                                                    <LuChevronUp />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    colorScheme="gray"
                                                    onClick={() =>
                                                        handleMoveDown(
                                                            reward.id
                                                        )
                                                    }
                                                >
                                                    <LuChevronDown />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    colorScheme="blue"
                                                    onClick={() =>
                                                        handleEdit(reward)
                                                    }
                                                >
                                                    <LuPencil />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    colorScheme="red"
                                                    onClick={() =>
                                                        handleDelete(reward.id)
                                                    }
                                                >
                                                    <LuTrash2 />
                                                </Button>
                                            </Flex>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Box>

                {/* 分页 */}
                {pagination && pagination.total > 0 && (
                    <Flex justify="space-between" align="center" mt={6}>
                        <Text fontSize="14px" color={COLORS.textSecondary}>
                            共{pagination.total}条
                        </Text>
                        <Flex gap={2} align="center">
                            {pageNumbers.map((pageNum, idx) =>
                                pageNum === -1 ? (
                                    <Text
                                        key={`ellipsis-${idx}`}
                                        px={2}
                                        color={COLORS.textSecondary}
                                    >
                                        ...
                                    </Text>
                                ) : (
                                    <Box
                                        key={pageNum}
                                        as="button"
                                        minW="32px"
                                        h="32px"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        bg={
                                            page === pageNum
                                                ? '#FFECE8'
                                                : 'transparent'
                                        }
                                        color={
                                            page === pageNum
                                                ? COLORS.primary
                                                : COLORS.textPrimary
                                        }
                                        borderRadius="2px"
                                        fontSize="14px"
                                        cursor="pointer"
                                        transition="all 0.2s"
                                        _hover={{
                                            bg:
                                                page === pageNum
                                                    ? '#FFECE8'
                                                    : COLORS.bgSecondary,
                                        }}
                                        onClick={() => setPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Box>
                                )
                            )}
                            <Flex gap={2} align="center" ml={4}>
                                <Text
                                    fontSize="14px"
                                    color={COLORS.textSecondary}
                                >
                                    {pageSize}条/页
                                </Text>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    fontSize="14px"
                                    borderColor={COLORS.borderColor}
                                    color={COLORS.textSecondary}
                                    borderRadius="2px"
                                    disabled={page === 1}
                                    _disabled={{
                                        opacity: 0.5,
                                        cursor: 'not-allowed',
                                    }}
                                    onClick={() =>
                                        setPage(Math.max(1, page - 1))
                                    }
                                >
                                    上一页
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    fontSize="14px"
                                    borderColor={COLORS.borderColor}
                                    color={COLORS.textSecondary}
                                    borderRadius="2px"
                                    disabled={page === totalPages}
                                    _disabled={{
                                        opacity: 0.5,
                                        cursor: 'not-allowed',
                                    }}
                                    onClick={() =>
                                        setPage(Math.min(totalPages, page + 1))
                                    }
                                >
                                    下一页
                                </Button>
                            </Flex>
                        </Flex>
                    </Flex>
                )}
            </Box>


        </Box>
    );
}
