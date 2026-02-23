'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Input,
  Text,
  Button,
  Spinner,
} from '@chakra-ui/react';
import { Search } from 'lucide-react';
import Banner from './components/Banner';
import TaskCard from './components/TaskCard';
import UserCard from './components/UserCard';
import ShortcutsCard from './components/ShortcutsCard';
import MessageCard from './components/MessageCard';
import Pagination from './components/Pagination';
import NotificationBanner from './components/NotificationBanner';
import HomepagePopupModal from './components/HomepagePopupModal';
import { api } from '@/trpc/react';

interface Task {
  id: string;
  title: string;
  image: string;
  timeRemaining: string;
  spotsRemaining: number;
  status: 'available' | 'full' | 'ended';
  type: 'pending' | 'in-progress' | 'completed';
  pendingPoints?: number; // 待发放积分
  reviewStatus?: 'reviewing' | 'approved' | 'rejected'; // 审核状态：审核中、已通过、已驳回
}


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

export default function TaskHallPage() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const tabTypes: Array<'pending' | 'in-progress' | 'completed'> = [
    'pending',
    'in-progress',
    'completed',
  ];
  const activeTab = tabTypes[activeTabIndex];

  // 使用tRPC查询任务列表
  const { data, isLoading, error } = api.taskPublish.getTaskHallList.useQuery(
    {
      page: currentPage,
      pageSize: 10,
      type: activeTab,
      search: searchQuery || undefined,
    },
    {
      // 确保在切换标签时重新获取数据
      refetchOnMount: true,
      staleTime: 0,
    }
  );

  const tasks = data?.data || [];
  const pagination = data?.pagination;

  // 计算各类型任务数量
  const { data: pendingData } = api.taskPublish.getTaskHallList.useQuery({
    page: 1,
    pageSize: 1,
    type: 'pending',
  });
  const { data: inProgressData } = api.taskPublish.getTaskHallList.useQuery({
    page: 1,
    pageSize: 1,
    type: 'in-progress',
  });
  const { data: completedData } = api.taskPublish.getTaskHallList.useQuery({
    page: 1,
    pageSize: 1,
    type: 'completed',
  });

  const pendingCount = pendingData?.pagination.total || 0;
  const inProgressCount = inProgressData?.pagination.total || 0;
  const completedCount = completedData?.pagination.total || 0;

  const tabs = [
    { label: '待领取', count: pendingCount },
    { label: '待完成', count: inProgressCount },
    { label: '已完成', count: completedCount },
  ];

  return (
    <Box bg={COLORS.bgTertiary} minH="100vh">
      {/* 首页弹窗 */}
      <HomepagePopupModal />

      {/* 首页通知横幅 */}
      <NotificationBanner />

      {/* 主容器 */}
      <Container maxW="100%" mb={4} px={6} style={{ background: 'linear-gradient(to bottom, #F3F7FB, #FFF)' }} py={4}>
        <Container maxW="1400px" px="25px">
          {/* 左侧内容区 */}
          <Box>
            <Flex direction="column" gap={6}>
              {/* Banner 和 UserCard 在同一卡片中 */}
              <Box
                borderRadius="8px"
                boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                bgGradient="linear(to-b, #F3F7FB, white)"
              >
                <Flex gap={6}>
                  {/* Banner */}
                  <Box flex={1}>
                    <Banner />
                  </Box>

                  {/* UserCard */}
                  <Box w="310px" flexShrink={0}>
                    <UserCard />
                  </Box>
                </Flex>
              </Box>

              <Flex justify="space-between" align="center" w="1020px">
                {/* 标签页 */}
                <Flex
                  gap={0}
                  borderBottom="1px"
                  borderColor={COLORS.borderColor}
                >
                  {tabs.map((tab, idx) => (
                    <Button
                      key={idx}
                      py={4}
                      px={6}
                      fontSize="14px"
                      fontWeight={activeTabIndex === idx ? '600' : '400'}
                      color={
                        activeTabIndex === idx
                          ? COLORS.textPrimary
                          : COLORS.textSecondary
                      }
                      bg="transparent"
                      borderRadius={0}
                      variant="ghost"
                      position="relative"
                      onClick={() => {
                        setCurrentPage(1);
                        setActiveTabIndex(idx);
                      }}
                      _hover={{ bg: 'transparent' }}
                      _focus={{ outline: 'none' }}
                    >
                      {tab.label}({tab.count})
                      {activeTabIndex === idx && (
                        <Box
                          position="absolute"
                          bottom={0}
                          left={0}
                          right={0}
                          h="4px"
                          bg={COLORS.primary}
                        />
                      )}
                    </Button>
                  ))}
                </Flex>

                {/* 搜索框 */}
                <Box position="relative" w="320px" ml="auto">
                  <Input
                    type="text"
                    placeholder="请输入任务关键词"
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
              </Flex>
            </Flex>
          </Box>
        </Container>
      </Container>

      <Container maxW="1400px" px={6} pb={4}>
        <Flex w="100%" gap={5}>
          <Box flex={1}>
            {/* 任务列表 */}
            <Flex direction="column" gap={4} mb={4}>
              {isLoading ? (
                <Box textAlign="center" py={8} bg={COLORS.bgPrimary} borderRadius="8px">
                  <Spinner size="lg" color={COLORS.primary} />
                </Box>
              ) : error ? (
                <Box textAlign="center" py={8} bg={COLORS.bgPrimary} borderRadius="8px">
                  <Text color={COLORS.primary}>加载失败，请重试</Text>
                </Box>
              ) : tasks.length > 0 ? (
                tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              ) : (
                <Box textAlign="center" py={8} bg={COLORS.bgPrimary} borderRadius="8px">
                  <Text color={COLORS.textTertiary}>暂无任务</Text>
                </Box>
              )}
            </Flex>

            {/* 分页 */}
            {pagination && pagination.total > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                onPageChange={setCurrentPage}
              />
            )}
          </Box>
          <Box w="310px">
            <Flex direction="column" gap={6}>
              <ShortcutsCard />
              <MessageCard />
            </Flex>
          </Box>
        </Flex>
      </Container>

    </Box>
  );
}
