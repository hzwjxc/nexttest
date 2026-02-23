'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, Flex, Image, Text, Button } from '@chakra-ui/react';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    image: string;
    timeRemaining: string;
    spotsRemaining: number;
    status: 'available' | 'full' | 'ended';
    type?: 'pending' | 'in-progress' | 'completed';
    pendingPoints?: number; // 待发放积分
    reviewStatus?: 'reviewing' | 'approved' | 'rejected'; // 审核状态
  };
}

const COLORS = {
  primary: '#E31424',
  textPrimary: '#1D2129',
  textSecondary: '#4E5969',
  textTertiary: '#86909C',
  bgPrimary: '#FFFFFF',
  bgSecondary: '#FAFCFD',
  orange: '#F34724',
};

export default function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const isCompleted = task.type === 'completed';

  // 领取任务mutation
  const utils = api.useUtils();
  const claimTaskMutation = api.taskPublish.claimTask.useMutation({
    onSuccess: (data) => {
      showSuccessToast(data.message || '任务领取成功');
      // 使任务大厅列表查询失效并重新获取数据
      utils.taskPublish.getTaskHallList.invalidate();
      // 领取成功后跳转到任务详情页
      router.push(`/crowdsource/task-hall/${task.id}`);
    },
    onError: (error) => {
      showErrorToast(error.message || '任务领取失败');
    },
  });

  const handleCardClick = () => {
    router.push(`/crowdsource/task-hall/${task.id}`);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 待完成任务，跳转到任务详情页
    if (task.type === 'in-progress') {
      router.push(`/crowdsource/task-hall/${task.id}`);
      return;
    }
    
    // 可领取任务，调用领取接口
    if (task.status === 'available' && task.type === 'pending') {
      claimTaskMutation.mutate({ taskId: task.id });
    }
  };

  const getButtonProps = () => {
    // 已完成任务显示"已完成"
    if (isCompleted) {
      return {
        text: '已完成',
        bg: 'linear-gradient(90deg, rgba(254, 148, 99, 0.2) 0%, rgba(254, 95, 107, 0.20) 100%)',
        color: '#FE606B',
        isDisabled: true,
      };
    }

    // 待完成任务显示"立即参与"（已结束任务除外）
    if (task.type === 'in-progress') {
      if (task.status === 'ended') {
        return {
          text: '已结束',
          bg: '#EFF0F3',
          color: '#999999',
          isDisabled: true,
        };
      }
      return {
        text: '立即参与',
        bg: 'linear-gradient(to right, #ff9565, #fe5f6b)',
        color: 'white',
        isDisabled: false,
        _hover: { opacity: 0.9 },
      };
    }

    // 待领取任务根据状态显示不同按钮
    switch (task.status) {
      case 'available':
        return {
          text: '领取',
          bg: 'linear-gradient(to right, #ff9565, #fe5f6b)',
          color: 'white',
          isDisabled: false,
          _hover: { opacity: 0.9 },
        };
      case 'full':
        return {
          text: '已满员',
          bg: 'rgba(255, 149, 101, 0.2)',
          color: '#FE606B',
          isDisabled: true,
        };
      case 'ended':
        return {
          text: '已结束',
          bg: '#EFF0F3',
          color: '#999999',
          isDisabled: true,
        };
      default:
        return {
          text: '领取',
          bg: 'linear-gradient(to right, #ff9565, #fe5f6b)',
          color: 'white',
          isDisabled: false,
          _hover: { opacity: 0.9 },
        };
    }
  };

  const buttonProps = getButtonProps();
  // 已完成任务使用不同的背景色和样式
  const bgColor = isCompleted ? COLORS.bgPrimary : (task.status === 'available' ? COLORS.bgPrimary : COLORS.bgSecondary);

  return (
    <Box
      bg={bgColor}
      borderRadius="8px"
      boxShadow={isCompleted ? "0 1px 2px rgba(0,0,0,0.05)" : "0 1px 2px rgba(0,0,0,0.05)"}
      p={6}
      border={isCompleted ? "1px solid #E5E6EB" : "none"}
      opacity={isCompleted ? 0.8 : 1}
      _hover={isCompleted ? {} : { boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer' }}
      transition="all 0.2s"
      onClick={handleCardClick}
    >
      <Flex gap={6} align="flex-end" justify="space-between">
        <Flex gap={6} flex={1}>
          {/* 任务图片 */}
          <Box flexShrink={0} position="relative">
            <Image
              src={task.image}
              alt={task.title}
              w="72px"
              h="72px"
              borderRadius="8px"
              objectFit="cover"
              opacity={isCompleted ? 0.6 : 1}
              filter={isCompleted ? "grayscale(20%)" : "none"}
              transition="all 0.2s"
            />
          </Box>

          {/* 任务信息 */}
          <Flex direction="column" gap={3} flex={1}>
            <Text
              fontSize="18px"
              fontWeight="500"
              color={isCompleted ? COLORS.textSecondary : COLORS.textPrimary}
              lineHeight="1.4"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {task.title}
            </Text>

            <Flex gap={6} fontSize="14px">
              {isCompleted ? (
                // 已完成任务显示待发放积分
                <Flex gap={1} align="center">
                  <Image src="/images/task-hall/clock.png" alt="积分" w={4} h={4} />
                  <Text color={COLORS.orange}>
                    待发放积分
                  </Text>
                </Flex>
              ) : task.type === 'in-progress' ? (
                // 待完成任务只显示剩余时间，不显示剩余名额
                <Flex gap={1} align="center">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    style={{ flexShrink: 0 }}
                  >
                    <circle cx="7" cy="7" r="6" stroke={COLORS.textSecondary} strokeWidth="1" />
                    <path
                      d="M7 3v4h3"
                      stroke={COLORS.textSecondary}
                      strokeWidth="1"
                      strokeLinecap="round"
                    />
                  </svg>
                  <Text color={COLORS.textSecondary}>
                    剩余时间：
                  </Text>
                  <Text fontWeight="500" color={COLORS.orange}>
                    {task.timeRemaining}
                  </Text>
                </Flex>
              ) : (
                <>
                  {/* 剩余时间 */}
                  <Flex gap={1} align="center">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      style={{ flexShrink: 0 }}
                    >
                      <circle cx="7" cy="7" r="6" stroke={COLORS.textSecondary} strokeWidth="1" />
                      <path
                        d="M7 3v4h3"
                        stroke={COLORS.textSecondary}
                        strokeWidth="1"
                        strokeLinecap="round"
                      />
                    </svg>
                    <Text color={COLORS.textSecondary}>
                      剩余时间：
                    </Text>
                    <Text fontWeight="500" color={COLORS.orange}>
                      {task.timeRemaining}
                    </Text>
                  </Flex>

                  {/* 剩余名额 */}
                  <Flex gap={1} align="center">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      style={{ flexShrink: 0 }}
                    >
                      <circle cx="7" cy="4" r="2" stroke={COLORS.textSecondary} strokeWidth="1" />
                      <path
                        d="M2 10c0-1.5 2-2.5 5-2.5s5 1 5 2.5"
                        stroke={COLORS.textSecondary}
                        strokeWidth="1"
                      />
                    </svg>
                    <Text color={COLORS.textSecondary}>
                      剩余名额：
                    </Text>
                    <Text fontWeight="500" color={COLORS.orange}>
                      {task.spotsRemaining}
                    </Text>
                  </Flex>
                </>
              )}
            </Flex>
          </Flex>
        </Flex>

        {/* 按钮 */}
        <Box flexShrink={0} onClick={(e) => e.stopPropagation()}>
          <Button
            bg={buttonProps.bg}
            color={buttonProps.color}
            disabled={buttonProps.isDisabled || claimTaskMutation.isPending}
            w="88px"
            h="36px"
            fontSize="14px"
            fontWeight="500"
            borderRadius="999px"
            _hover={buttonProps._hover}
            _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
            onClick={handleButtonClick}
          >
            {claimTaskMutation.isPending ? '领取中...' : buttonProps.text}
          </Button>
        </Box>
      </Flex>
    </Box>
  );
}
