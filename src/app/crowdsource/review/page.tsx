'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Flex,
  Input,
  Text,
  Button,
  NativeSelectRoot,
  NativeSelectField,
} from '@chakra-ui/react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReviewCard from './components/ReviewCard';
import Pagination from '../task-hall/components/Pagination';
import { PointsApplicationDialog } from './_components/PointsApplicationDialog';
import { RewardDistributionDialog } from './_components/RewardDistributionDialog';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';

// 设计系统颜色
const COLORS = {
  primary: '#E31424',
  textPrimary: '#1D2129',
  textSecondary: '#4E5969',
  textTertiary: '#86909C',
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F2F3F5',
  bgTertiary: '#F3F7FB',
  borderColor: '#E5E6EB',
};

export default function ReviewPage() {
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [taskType, setTaskType] = useState<string>('ALL');
  const [taskStatus, setTaskStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false);
  const [isRewardDistributionDialogOpen, setIsRewardDistributionDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  const activeStatus = taskStatus === 'ALL' ? undefined : (taskStatus as any);

  // 获取审核统计
  const { data: statsData } = api.review.getStats.useQuery();

  // 获取审核列表
  const { data: taskData, isLoading, refetch } = api.review.list.useQuery({
    page: currentPage,
    pageSize: 10,
    keyword: searchQuery || undefined,
    status: activeStatus,
    taskType: taskType !== 'ALL' ? (taskType as any) : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  // 监听页面可见性变化，当页面重新可见时刷新数据
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch]);

  const tasks = taskData?.data ?? [];
  const totalPages = taskData?.pagination?.totalPages ?? 1;
  const totalItems = taskData?.pagination?.total ?? 0;

  // Mutations
  const batchApproveMutation = api.review.batchApproveDept.useMutation({
    onSuccess: () => {
      showSuccessToast('批量审核通过');
      setSelectedIds([]);
      void refetch();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  const deleteMutation = api.review.delete.useMutation({
    onSuccess: () => {
      showSuccessToast('删除成功');
      void refetch();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  const publishMutation = api.review.publish.useMutation({
    onSuccess: () => {
      showSuccessToast('任务已发布');
      void refetch();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  const confirmDistributionMutation = api.review.confirmDistribution.useMutation({
    onSuccess: () => {
      showSuccessToast('积分发放完成');
      void refetch();
    },
    onError: (error) => {
      showErrorToast(error.message);
    },
  });

  const handleCardClick = (id: string) => {
    router.push(`/crowdsource/review/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/crowdsource/publish/basicInformation?id=${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleApplyPoints = (id: string) => {
    setSelectedTaskId(id);
    setIsPointsDialogOpen(true);
  };

  const handleApplyDistribution = (id: string) => {
    setSelectedTaskId(id);
    setIsRewardDistributionDialogOpen(true);
  };

  const handleConfirmDistribution = (id: string) => {
    if (confirm('确定要确认发放积分吗？')) {
      confirmDistributionMutation.mutate({ taskId: id });
    }
  };

  const handlePublish = (id: string) => {
    if (confirm('确定要发布这个任务吗？')) {
      publishMutation.mutate({ id });
    }
  };

  const handleBatchApprove = () => {
    batchApproveMutation.mutate({ ids: selectedIds });
  };

  return (
    <Box bg={COLORS.bgTertiary} minH="100vh" pt="20px">
      <Container maxW="1400px" px={6} pt={0} pb={4}>
        {/* 筛选区域 */}
        <Box
          bg={COLORS.bgPrimary}
          borderRadius="8px"
          boxShadow="0 1px 2px rgba(0,0,0,0.05)"
          p={6}
          mb={4}
        >
          <Flex gap={4} align="center" flexWrap="wrap">
            {/* 任务类型筛选 */}
            <Flex align="center" gap={2}>
              <Text fontSize="14px" color={COLORS.textSecondary} whiteSpace="nowrap">
                任务类型：
              </Text>
              <NativeSelectRoot w="160px">
                <NativeSelectField
                  value={taskType}
                  onChange={(e) => {
                    setTaskType(e.target.value);
                    setCurrentPage(1);
                  }}
                  fontSize="14px"
                  borderColor={COLORS.borderColor}
                  _focus={{ borderColor: COLORS.primary }}
                >
                  <option value="ALL">全部</option>
                  <option value="FUNCTIONAL">功能测试类</option>
                  <option value="UX_SURVEY">问卷调查类</option>
                  <option value="INVITATION_REWARD">邀请有奖类</option>
                </NativeSelectField>
              </NativeSelectRoot>
            </Flex>

            {/* 任务状态筛选 */}
            <Flex align="center" gap={2}>
              <Text fontSize="14px" color={COLORS.textSecondary} whiteSpace="nowrap">
                任务状态：
              </Text>
              <NativeSelectRoot w="200px">
                <NativeSelectField
                  value={taskStatus}
                  onChange={(e) => {
                    setTaskStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  fontSize="14px"
                  borderColor={COLORS.borderColor}
                  _focus={{ borderColor: COLORS.primary }}
                >
                  <option value="ALL">全部</option>
                  <option value="SAVED">已保存</option>
                  <option value="PREPARING">准备中</option>
                  <option value="DEPT_REWARD_REVIEW">部门经理积分审核中</option>
                  <option value="GENERAL_REWARD_REVIEW">总经理积分审核中</option>
                  <option value="PENDING_PUBLISH">待发布</option>
                  <option value="EXECUTING">执行中</option>
                  <option value="EXECUTION_ENDED">执行结束</option>
                  <option value="ACCOUNTING_COMPLETED">核算完成</option>
                  <option value="REWARD_DISTRIBUTION_REVIEW">积分发放审核中</option>
                  <option value="PENDING_REWARD_DISTRIBUTION">待发放积分</option>
                  <option value="COMPLETED">已完成</option>
                </NativeSelectField>
              </NativeSelectRoot>
            </Flex>

            {/* 提交时间筛选 */}
            <Flex align="center" gap={2}>
              <Text fontSize="14px" color={COLORS.textSecondary} whiteSpace="nowrap">
                提交时间：
              </Text>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                w="160px"
                fontSize="14px"
                borderColor={COLORS.borderColor}
                _focus={{ borderColor: COLORS.primary }}
              />
              <Text fontSize="14px" color={COLORS.textSecondary}>
                至
              </Text>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                w="160px"
                fontSize="14px"
                borderColor={COLORS.borderColor}
                _focus={{ borderColor: COLORS.primary }}
              />
            </Flex>

            {/* 搜索框 */}
            <Box position="relative" flex={1} maxW="400px" ml="auto">
              <Input
                type="text"
                placeholder="任务关键词"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                bg={COLORS.bgSecondary}
                border="none"
                borderRadius="24px"
                fontSize="14px"
                color={COLORS.textPrimary}
                _placeholder={{ color: COLORS.textTertiary }}
                _focus={{ boxShadow: 'none' }}
                pl={4}
                pr={10}
                py={2}
              />
              <Box
                position="absolute"
                right={4}
                top="50%"
                transform="translateY(-50%)"
                pointerEvents="none"
              >
                <Search color={COLORS.textSecondary} size={16} />
              </Box>
            </Box>

            {/* 搜索和重置按钮 */}
            <Flex gap={2}>
              <Button
                bg="linear-gradient(to right, #ff9565, #fe5f6b)"
                color="white"
                fontSize="14px"
                fontWeight="500"
                borderRadius="4px"
                px={6}
                h="36px"
                _hover={{ opacity: 0.9 }}
                onClick={() => void refetch()}
              >
                搜索
              </Button>
              <Button
                variant="outline"
                borderColor={COLORS.borderColor}
                color={COLORS.textSecondary}
                fontSize="14px"
                fontWeight="500"
                borderRadius="4px"
                px={6}
                h="36px"
                _hover={{ borderColor: COLORS.primary, color: COLORS.primary }}
                onClick={() => {
                  setSearchQuery('');
                  setTaskType('ALL');
                  setTaskStatus('ALL');
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(1);
                }}
              >
                重置
              </Button>
            </Flex>
          </Flex>
        </Box>

        {/* 批量操作按钮 */}
        {activeStatus === 'DEPT_REWARD_REVIEW' && selectedIds.length > 0 && (
          <Flex justify="flex-end" mb={4}>
            <Button
              bg="linear-gradient(to right, #ff9565, #fe5f6b)"
              color="white"
              fontSize="14px"
              fontWeight="500"
              borderRadius="4px"
              px={6}
              h="36px"
              _hover={{ opacity: 0.9 }}
              onClick={handleBatchApprove}
            >
              批量通过 ({selectedIds.length})
            </Button>
          </Flex>
        )}

        {/* 任务列表 */}
        <Flex direction="column" gap={4} mb={4}>
          {isLoading ? (
            <Box
              textAlign="center"
              py={8}
              bg={COLORS.bgPrimary}
              borderRadius="8px"
              boxShadow="0 1px 2px rgba(0,0,0,0.05)"
            >
              <Text color={COLORS.textTertiary}>加载中...</Text>
            </Box>
          ) : tasks.length > 0 ? (
            tasks.map((task) => (
              <ReviewCard
                key={task.id}
                task={task}
                onClick={handleCardClick}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onApplyPoints={handleApplyPoints}
                onApplyDistribution={handleApplyDistribution}
                onConfirmDistribution={handleConfirmDistribution}
                onPublish={handlePublish}
              />
            ))
          ) : (
            <Box
              textAlign="center"
              py={8}
              bg={COLORS.bgPrimary}
              borderRadius="8px"
              boxShadow="0 1px 2px rgba(0,0,0,0.05)"
            >
              <Text color={COLORS.textTertiary}>暂无任务记录</Text>
            </Box>
          )}
        </Flex>

        {/* 分页 */}
        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
          />
        )}
      </Container>

      {/* Points Application Dialog */}
      <PointsApplicationDialog
        isOpen={isPointsDialogOpen}
        onClose={() => {
          setIsPointsDialogOpen(false);
          setSelectedTaskId('');
        }}
        taskId={selectedTaskId}
        onSuccess={() => void refetch()}
      />

      {/* Reward Distribution Dialog */}
      <RewardDistributionDialog
        isOpen={isRewardDistributionDialogOpen}
        onClose={() => {
          setIsRewardDistributionDialogOpen(false);
          setSelectedTaskId('');
        }}
        taskId={selectedTaskId}
        onSuccess={() => void refetch()}
      />
    </Box>
  );
}
