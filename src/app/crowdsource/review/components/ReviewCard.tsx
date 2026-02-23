'use client';

import React from 'react';
import { Box, Flex, Image, Text, Button } from '@chakra-ui/react';

interface ReviewCardProps {
  task: {
    id?: string;
    title?: string;
    thumbnailImage?: string | null;
    type?: string;
    status?: string;
    currentParticipants?: number;
    maxParticipants?: number;
    createdAt?: Date | string;
    publishedAt?: Date | string | null;
    deptApprovalStatus?: string | null;
    generalApprovalStatus?: string | null;
    totalBudget?: number;
    testCases?: any[];
    rewardConfig?: any;
    pendingReviewDefects?: number;
    validDefects?: number;
    invalidDefects?: number;
    pendingDistributionPoints?: number;
    pointsApplications?: Array<{
      appliedPoints?: number;
      status?: string;
      createdAt?: Date | string;
      [key: string]: any;
    }>;
    [key: string]: any;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onApplyPoints?: (id: string) => void;
  onApplyDistribution?: (id: string) => void;
  onConfirmDistribution?: (id: string) => void;
  onPublish?: (id: string) => void;
  onClick?: (id: string) => void;
}

const COLORS = {
  primary: '#E31424',
  textPrimary: '#1D2129',
  textSecondary: '#4E5969',
  textTertiary: '#86909C',
  bgPrimary: '#FFFFFF',
  bgSecondary: '#FAFCFD',
  borderColor: '#E5E6EB',
  orange: '#F34724',
  green: '#00B42A',
  blue: '#165DFF',
  yellow: '#FF7D00',
};

export default function ReviewCard({
  task,
  onEdit,
  onDelete,
  onApplyPoints,
  onApplyDistribution,
  onConfirmDistribution,
  onPublish,
  onClick
}: ReviewCardProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hour = String(d.getUTCHours()).padStart(2, '0');
    const minute = String(d.getUTCMinutes()).padStart(2, '0');
    const second = String(d.getUTCSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
  };

  // 获取任务状态配置
  const getTaskStatusConfig = () => {
    switch (task.status) {
      case 'SAVED':
        return {
          text: '已保存',
          color: COLORS.textTertiary,
          bg: 'rgba(134, 144, 156, 0.1)',
        };
      case 'PREPARING':
        return {
          text: '准备中',
          color: COLORS.textSecondary,
          bg: 'rgba(78, 89, 105, 0.1)',
        };
      case 'DEPT_REWARD_REVIEW':
        return {
          text: '部门经理积分审核中',
          color: COLORS.orange,
          bg: 'rgba(243, 71, 36, 0.1)',
        };
      case 'GENERAL_REWARD_REVIEW':
        return {
          text: '总经理积分审核中',
          color: COLORS.yellow,
          bg: 'rgba(255, 125, 0, 0.1)',
        };
      case 'PENDING_PUBLISH':
        return {
          text: '待发布',
          color: COLORS.orange,
          bg: 'rgba(243, 71, 36, 0.1)',
        };
      case 'EXECUTING':
        return {
          text: '执行中',
          color: COLORS.blue,
          bg: 'rgba(22, 93, 255, 0.1)',
        };
      case 'EXECUTION_ENDED':
        return {
          text: '执行结束',
          color: COLORS.textSecondary,
          bg: 'rgba(78, 89, 105, 0.1)',
        };
      case 'ACCOUNTING_COMPLETED':
        return {
          text: '核算完成',
          color: COLORS.blue,
          bg: 'rgba(22, 93, 255, 0.1)',
        };
      case 'REWARD_DISTRIBUTION_REVIEW':
        return {
          text: '积分发放审核中',
          color: COLORS.yellow,
          bg: 'rgba(255, 125, 0, 0.1)',
        };
      case 'PENDING_REWARD_DISTRIBUTION':
        return {
          text: '待发放积分',
          color: COLORS.orange,
          bg: 'rgba(243, 71, 36, 0.1)',
        };
      case 'COMPLETED':
        return {
          text: '已完成',
          color: COLORS.green,
          bg: 'rgba(0, 180, 42, 0.1)',
        };
      default:
        return {
          text: task.status,
          color: COLORS.textTertiary,
          bg: 'rgba(134, 144, 156, 0.1)',
        };
    }
  };

  const statusConfig = getTaskStatusConfig();

  // 获取最新的积分申请
  const latestApplication = task.pointsApplications?.[0];

  // 预计发放积分：直接使用申请的积分值
  const estimatedPoints = latestApplication?.appliedPoints || task.totalBudget || 0;

  return (
    <Box
      bg={COLORS.bgPrimary}
      borderRadius="8px"
      boxShadow="0 1px 2px rgba(0,0,0,0.05)"
      p={6}
      _hover={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer' }}
      transition="all 0.2s"
      onClick={() => onClick?.(task.id)}
    >
      <Flex gap={6} align="flex-start" justify="space-between">
        <Flex gap={6} flex={1}>
          {/* 任务图片 */}
          <Box flexShrink={0}>
            <Image
              src={task.thumbnailImage ?? '/images/task-hall/task-icon.png'}
              alt={task.title ?? '任务'}
              w="72px"
              h="72px"
              borderRadius="8px"
              objectFit="cover"
            />
          </Box>

          {/* 任务信息 */}
          <Flex direction="column" gap={3} flex={1}>
            {/* 标题和状态 */}
            <Flex align="center" gap={2}>
              <Text
                fontSize="16px"
                fontWeight="500"
                color={COLORS.textPrimary}
                lineHeight="1.4"
              >
                {task.title ?? '未命名任务'}
              </Text>
              <Flex
                align="center"
                justify="center"
                w="20px"
                h="20px"
                borderRadius="50%"
                bg={COLORS.bgSecondary}
                mx={1}
              >
                <Text
                  fontSize="14px"
                  color={COLORS.textSecondary}
                >
                  &gt;
                </Text>
              </Flex>
              <Box
                px={3}
                py={1}
                borderRadius="4px"
                bg={statusConfig.bg}
              >
                <Text
                  fontSize="12px"
                  fontWeight="500"
                  color={statusConfig.color}
                >
                  {statusConfig.text}
                </Text>
              </Box>
            </Flex>

            {/* 详细信息 */}
            <Flex direction="column" gap={2} fontSize="14px">
              {/* 第一行 - 基础信息（最多3个字段） */}
              <Flex gap={6}>
                {/* 用例数量 */}
                <Flex gap={1} align="center" w="200px">
                  <Text color={COLORS.textSecondary} whiteSpace="nowrap">用例数量：</Text>
                  <Text fontWeight="500" color={COLORS.textPrimary}>
                    {task.testCases?.length ?? 0}
                  </Text>
                </Flex>

                {/* 招募名额 */}
                <Flex gap={1} align="center" w="200px">
                  <Text color={COLORS.textSecondary} whiteSpace="nowrap">招募名额：</Text>
                  <Text fontWeight="500" color={COLORS.textPrimary}>
                    {task.currentParticipants ?? 0}/{task.maxParticipants ?? 0}
                  </Text>
                </Flex>

                {/* 预计发放积分 - 除了已保存和准备中状态，其他状态都显示 */}
                {!['SAVED', 'PREPARING'].includes(task.status ?? '') && (
                  <Flex gap={1} align="center" w="200px">
                    <Text color={COLORS.textSecondary} whiteSpace="nowrap">预计发放积分：</Text>
                    <Text fontWeight="500" color={COLORS.textPrimary}>
                      {estimatedPoints}
                    </Text>
                  </Flex>
                )}
              </Flex>

              {/* 第二行 - 执行结束、核算完成、积分发放审核中、待发放积分、已完成状态显示详细信息 */}
              {['EXECUTION_ENDED', 'ACCOUNTING_COMPLETED', 'REWARD_DISTRIBUTION_REVIEW', 'PENDING_REWARD_DISTRIBUTION', 'COMPLETED'].includes(task.status ?? '') && (
                <Flex gap={6}>
                  {/* 待审核缺陷/建议 */}
                  <Flex gap={1} align="center" w="200px">
                    <Text color={COLORS.textSecondary} whiteSpace="nowrap">待审核缺陷/建议：</Text>
                    <Text fontWeight="500" color={COLORS.textPrimary}>
                      {task.pendingReviewDefects ?? 0}
                    </Text>
                  </Flex>

                  {/* 有效缺陷/建议 */}
                  <Flex gap={1} align="center" w="200px">
                    <Text color={COLORS.textSecondary} whiteSpace="nowrap">有效缺陷/建议：</Text>
                    <Text fontWeight="500" color={COLORS.textPrimary}>
                      {task.validDefects ?? 0}
                    </Text>
                  </Flex>

                  {/* 无效缺陷/建议 */}
                  <Flex gap={1} align="center" w="200px">
                    <Text color={COLORS.textSecondary} whiteSpace="nowrap">无效缺陷/建议：</Text>
                    <Text fontWeight="500" color={COLORS.textPrimary}>
                      {task.invalidDefects ?? 0}
                    </Text>
                  </Flex>
                </Flex>
              )}

              {/* 第三行 - 根据不同状态显示不同字段 */}
              {['EXECUTION_ENDED', 'ACCOUNTING_COMPLETED', 'COMPLETED'].includes(task.status ?? '') ? (
                // 执行结束、核算完成、已完成：显示待发放积分和发布时间
                <Flex gap={6}>
                  <Flex gap={1} align="center" w="200px">
                    <Text color={COLORS.textSecondary} whiteSpace="nowrap">待发放积分：</Text>
                    <Text fontWeight="500" color={COLORS.textPrimary}>
                      {task.pendingDistributionPoints ?? 0}
                    </Text>
                  </Flex>
                  <Flex gap={1} align="center" w="280px">
                    <Text color={COLORS.textSecondary} whiteSpace="nowrap">发布时间：</Text>
                    <Text fontWeight="500" color={COLORS.textPrimary} whiteSpace="nowrap">
                      {formatDate(task.publishedAt ?? task.createdAt)}
                    </Text>
                  </Flex>
                </Flex>
              ) : ['REWARD_DISTRIBUTION_REVIEW', 'PENDING_REWARD_DISTRIBUTION'].includes(task.status ?? '') ? (
                // 积分发放审核中、待发放积分：显示待发放积分和发布时间
                <Flex gap={6}>
                  <Flex gap={1} align="center" w="200px">
                    <Text color={COLORS.textSecondary} whiteSpace="nowrap">待发放积分：</Text>
                    <Text fontWeight="500" color={COLORS.textPrimary}>
                      {task.pendingDistributionPoints ?? 0}
                    </Text>
                  </Flex>
                  <Flex gap={1} align="center" w="280px">
                    <Text color={COLORS.textSecondary} whiteSpace="nowrap">发布时间：</Text>
                    <Text fontWeight="500" color={COLORS.textPrimary} whiteSpace="nowrap">
                      {formatDate(task.publishedAt ?? task.createdAt)}
                    </Text>
                  </Flex>
                </Flex>
              ) : (
                // 其他状态：只显示发布时间
                !['SAVED', 'PREPARING', 'DEPT_REWARD_REVIEW', 'GENERAL_REWARD_REVIEW', 'PENDING_PUBLISH'].includes(task.status ?? '') && (
                  <Flex gap={6}>
                    <Flex gap={1} align="center" w="280px">
                      <Text color={COLORS.textSecondary} whiteSpace="nowrap">发布时间：</Text>
                      <Text fontWeight="500" color={COLORS.textPrimary} whiteSpace="nowrap">
                        {formatDate(task.publishedAt ?? task.createdAt)}
                      </Text>
                    </Flex>
                  </Flex>
                )
              )}
            </Flex>
          </Flex>
        </Flex>

        {/* 操作按钮 */}
        <Flex gap={3} flexShrink={0} flexWrap="wrap">
          {/* 删除按钮 - 在已保存和准备中状态显示 */}
          {(task.status === 'SAVED' || task.status === 'PREPARING') && (
            <Button
              variant="outline"
              borderColor="#F34724"
              color="#FE606B"
              w="88px"
              h="36px"
              fontSize="14px"
              fontWeight="500"
              borderRadius="4px"
              _hover={{ borderColor: COLORS.primary, color: COLORS.primary }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(task.id);
              }}
            >
              删除
            </Button>
          )}

          {/* 编辑按钮 - 在已保存、准备中、待发布状态显示 */}
          {(task.status === 'SAVED' || task.status === 'PREPARING' || task.status === 'PENDING_PUBLISH') && (
            <Button
              variant="outline"
              borderColor="#F34724"
              color="#FE606B"
              w="88px"
              h="36px"
              fontSize="14px"
              fontWeight="500"
              borderRadius="4px"
              _hover={{ borderColor: COLORS.primary, color: COLORS.primary }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(task.id);
              }}
            >
              编辑
            </Button>
          )}

          {/* 积分申请按钮 - 在准备中状态显示 */}
          {task.status === 'PREPARING' && (
            <Button
              bg="linear-gradient(to right, #ff9565, #fe5f6b)"
              color="white"
              w="88px"
              h="36px"
              fontSize="14px"
              fontWeight="500"
              borderRadius="4px"
              _hover={{ opacity: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onApplyPoints?.(task.id);
              }}
            >
              积分申请
            </Button>
          )}

          {/* 发布按钮 - 在待发布状态显示 */}
          {task.status === 'PENDING_PUBLISH' && (
            <Button
              bg="linear-gradient(to right, #ff9565, #fe5f6b)"
              color="white"
              w="88px"
              h="36px"
              fontSize="14px"
              fontWeight="500"
              borderRadius="4px"
              _hover={{ opacity: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onPublish?.(task.id);
              }}
            >
              发布
            </Button>
          )}

          {/* 确认发放按钮 - 在待发放积分状态显示 */}
          {task.status === 'PENDING_REWARD_DISTRIBUTION' && (
            <Button
              bg="linear-gradient(to right, #ff9565, #fe5f6b)"
              color="white"
              w="88px"
              h="36px"
              fontSize="14px"
              fontWeight="500"
              borderRadius="4px"
              _hover={{ opacity: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onConfirmDistribution?.(task.id);
              }}
            >
              确认发放
            </Button>
          )}

          {/* 积分发放申请按钮 - 在核算完成状态显示 */}
          {task.status === 'ACCOUNTING_COMPLETED' && (
            <Button
              bg="linear-gradient(to right, #ff9565, #fe5f6b)"
              color="white"
              w="110px"
              h="36px"
              fontSize="14px"
              fontWeight="500"
              borderRadius="4px"
              _hover={{ opacity: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onApplyDistribution?.(task.id);
              }}
            >
              积分发放申请
            </Button>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
