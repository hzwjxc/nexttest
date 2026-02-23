'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Container,
    Flex,
    Grid,
    Text,
    Button,
    HStack,
    VStack,
    Input,
    Image,
} from '@chakra-ui/react';
import { ChevronDown, Info, ChevronRight } from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import StatCard from './components/StatCard';
import FunnelChart from './components/FunnelChart';
import { api } from '@/trpc/react';

const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    bgTertiary: '#F3F7FB',
    borderColor: '#E5E6EB',
    success: '#10CABF',
    info: '#2F88FF',
};

export default function ReportsPage() {
    const router = useRouter();
    const [timeRange, setTimeRange] = useState('month');
    const [department, setDepartment] = useState('');
    
    // 根据timeRange设置默认日期范围
    const getDefaultDates = (range: 'day' | 'month') => {
        const today = new Date();
        let startDateVal;
        
        if (range === 'day') {
            // 日维度：最近30天
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);
            startDateVal = thirtyDaysAgo.toISOString().split('T')[0];
        } else {
            // 月维度：最近12个月
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(today.getMonth() - 11); // 11个月前（加上当前月共12个月）
            startDateVal = twelveMonthsAgo.toISOString().split('T')[0];
        }
        const endDateVal = today.toISOString().split('T')[0];
        
        return { startDate: startDateVal, endDate: endDateVal };
    };

    const [startDate, setStartDate] = useState(getDefaultDates('month').startDate);
    const [endDate, setEndDate] = useState(getDefaultDates('month').endDate);

    // 获取用户统计数据
    const { data: userStatsData, isLoading: userStatsLoading } =
        api.reports.getUserStats.useQuery({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            timeRange: timeRange as 'day' | 'month',
        });

    // 获取活动参与统计数据
    const { data: activityStatsData, isLoading: activityStatsLoading } =
        api.reports.getActivityStats.useQuery({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        });

    // 获取用户增长趋势数据
    const { data: userGrowthTrendData, isLoading: userGrowthLoading } =
        api.reports.getUserGrowthTrend.useQuery({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            timeRange: timeRange as 'day' | 'month',
        });

    // 获取用户活跃度趋势数据
    const { data: userActivityTrendData, isLoading: userActivityLoading } =
        api.reports.getUserActivityTrend.useQuery({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            timeRange: timeRange as 'day' | 'month',
        });

    // 获取参与率和反馈率统计数据
    const {
        data: participationStatsData,
        isLoading: participationStatsLoading,
        error: participationStatsError,
    } = api.reports.getParticipationStats.useQuery({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        timeRange: timeRange as 'day' | 'month',
    });

    // 调试信息
    React.useEffect(() => {
        console.log('参与率统计状态更新:', {
            data: participationStatsData,
            loading: participationStatsLoading,
            error: participationStatsError,
        });

        if (participationStatsError) {
            console.error('参与率统计API错误:', participationStatsError);
        }
        if (participationStatsData) {
            console.log('参与率统计数据:', participationStatsData);
        }
    }, [
        participationStatsData,
        participationStatsLoading,
        participationStatsError,
    ]);

    // 使用模拟数据作为默认值
    const userStats = userStatsData || {
        cumulativeUsers: 921000,
        newUsers: 20,
        activeUsers: 260,
        activeUsersByChannel: {
            miniProgram: 120,
            pc: 140,
        },
    };

    const activityStats = activityStatsData || {
        taskAcceptanceCount: 65,
        taskAcceptancePeople: 32,
        defectReportCount: 88,
        defectReportPeople: 21,
        validDefectCount: 88,
    };

    const userDataChartData = userGrowthTrendData || [
        { time: '1月', cumulativeUsers: 20, newUsers: 5 },
        { time: '2月', cumulativeUsers: 35, newUsers: 15 },
        { time: '3月', cumulativeUsers: 50, newUsers: 15 },
        { time: '4月', cumulativeUsers: 65, newUsers: 15 },
        { time: '5月', cumulativeUsers: 80, newUsers: 15 },
        { time: '6月', cumulativeUsers: 90, newUsers: 10 },
        { time: '7月', cumulativeUsers: 100, newUsers: 10 },
        { time: '8月', cumulativeUsers: 110, newUsers: 10 },
        { time: '9月', cumulativeUsers: 120, newUsers: 10 },
        { time: '10月', cumulativeUsers: 130, newUsers: 10 },
        { time: '11月', cumulativeUsers: 140, newUsers: 10 },
        { time: '12月', cumulativeUsers: 150, newUsers: 10 },
    ];

    const activeUserChartData = userActivityTrendData || [
        { time: '1月', total: 100, miniProgram: 50, pc: 50 },
        { time: '2月', total: 150, miniProgram: 70, pc: 80 },
        { time: '3月', total: 200, miniProgram: 90, pc: 110 },
        { time: '4月', total: 250, miniProgram: 110, pc: 140 },
        { time: '5月', total: 280, miniProgram: 120, pc: 160 },
        { time: '6月', total: 300, miniProgram: 130, pc: 170 },
        { time: '7月', total: 260, miniProgram: 120, pc: 140 },
        { time: '8月', total: 280, miniProgram: 130, pc: 150 },
        { time: '9月', total: 300, miniProgram: 140, pc: 160 },
        { time: '10月', total: 320, miniProgram: 150, pc: 170 },
        { time: '11月', total: 340, miniProgram: 160, pc: 180 },
        { time: '12月', total: 360, miniProgram: 170, pc: 190 },
    ];

    const participationStats = participationStatsData || {
        totalUsers: 921000,
        usersWithOrders: 362000,
        usersWithDefects: 142000,
        participationRate: 39.36,
        totalTasks: 1000,
        totalDefects: 5000,
        validDefects: 916,
        feedbackRate: 18.32,
    };

    const handleStatCardClick = (type: string) => {
        if (type === 'cumulative') {
            router.push('/crowdsource/reports/cumulative-users');
        } else if (type === 'new') {
            router.push('/crowdsource/reports/new-users');
        } else if (type === 'active') {
            router.push('/crowdsource/reports/active-users');
        } else if (type === 'task-acceptance') {
            router.push('/crowdsource/reports/task-acceptance');
        } else if (type === 'task-acceptance-people') {
            router.push('/crowdsource/reports/task-acceptance-people');
        } else if (type === 'defect-report-count') {
            router.push('/crowdsource/reports/defect-report-count');
        } else if (type === 'defect-report-people') {
            router.push('/crowdsource/reports/defect-report-people');
        } else if (type === 'valid-defect-count') {
            router.push('/crowdsource/reports/valid-defect-count');
        }
    };

    const handleQuery = () => {
        // 查询逻辑已经通过tRPC自动处理，这里可以添加额外的处理逻辑
        console.log('查询条件:', { timeRange, department, startDate, endDate });
    };

    const handleReset = () => {
        setDepartment('');
        // 重置为根据当前维度的默认日期
        const dates = getDefaultDates(timeRange as 'day' | 'month');
        setStartDate(dates.startDate);
        setEndDate(dates.endDate);
        // 重置后数据会自动重新加载
    };

    return (
        <Box bg={COLORS.bgTertiary} minH="100vh">
            {/* Header with filters */}
            <Box
                bg={COLORS.bgPrimary}
                borderBottom={`1px solid ${COLORS.borderColor}`}
                py={3}
            >
                <Container maxW="1400px" px={6}>
                    <Flex justify="space-between" align="center">
                        <Text
                            fontSize="16px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                        >
                            分行名称：广州分行
                        </Text>
                        <HStack gap={6}>
                            <HStack gap={4}>
                                <Text
                                    fontSize="14px"
                                    fontWeight="500"
                                    color={COLORS.textPrimary}
                                >
                                    折线数据维度：
                                </Text>
                                <HStack gap={6}>
                                    <Button
                                        variant={
                                            timeRange === 'day'
                                                ? 'solid'
                                                : 'outline'
                                        }
                                        size="sm"
                                        onClick={() => {
                                            setTimeRange('day');
                                            const dates = getDefaultDates('day');
                                            setStartDate(dates.startDate);
                                            setEndDate(dates.endDate);
                                        }}
                                        borderColor={COLORS.borderColor}
                                        color={
                                            timeRange === 'day'
                                                ? 'white'
                                                : COLORS.textPrimary
                                        }
                                        bg={
                                            timeRange === 'day'
                                                ? COLORS.primary
                                                : 'transparent'
                                        }
                                    >
                                        日
                                    </Button>
                                    <Button
                                        variant={
                                            timeRange === 'month'
                                                ? 'solid'
                                                : 'outline'
                                        }
                                        size="sm"
                                        onClick={() => {
                                            setTimeRange('month');
                                            const dates = getDefaultDates('month');
                                            setStartDate(dates.startDate);
                                            setEndDate(dates.endDate);
                                        }}
                                        borderColor={COLORS.borderColor}
                                        color={
                                            timeRange === 'month'
                                                ? 'white'
                                                : COLORS.textPrimary
                                        }
                                        bg={
                                            timeRange === 'month'
                                                ? COLORS.primary
                                                : 'transparent'
                                        }
                                    >
                                        月
                                    </Button>
                                </HStack>
                            </HStack>

                            <HStack gap={3}>
                                <Box position="relative" w="140px">
                                    <select
                                        value={department}
                                        onChange={(e) =>
                                            setDepartment(e.target.value)
                                        }
                                        style={{
                                            background: COLORS.bgSecondary,
                                            border: 'none',
                                            borderRadius: '24px',
                                            fontSize: '14px',
                                            color: COLORS.textTertiary,
                                            padding: '8px 12px',
                                            paddingRight: '32px',
                                            width: '100%',
                                            appearance: 'none',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <option value="">部门名称</option>
                                        <option value="dept1">部门1</option>
                                        <option value="dept2">部门2</option>
                                    </select>
                                    <ChevronDown
                                        size={16}
                                        color={COLORS.textTertiary}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            pointerEvents: 'none',
                                        }}
                                    />
                                </Box>

                                <Box position="relative" w="140px">
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) =>
                                            setStartDate(e.target.value)
                                        }
                                        bg={COLORS.bgSecondary}
                                        border="none"
                                        borderRadius="24px"
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                        _focus={{ boxShadow: 'none' }}
                                        placeholder="开始时间"
                                        pl={3}
                                        pr={8}
                                        py={2}
                                    />
                                </Box>

                                <Box position="relative" w="140px">
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) =>
                                            setEndDate(e.target.value)
                                        }
                                        bg={COLORS.bgSecondary}
                                        border="none"
                                        borderRadius="24px"
                                        fontSize="14px"
                                        color={COLORS.textTertiary}
                                        _focus={{ boxShadow: 'none' }}
                                        placeholder="结束时间"
                                        pl={3}
                                        pr={8}
                                        py={2}
                                    />
                                </Box>

                                <Button
                                    bg="linear-gradient(to right, #FF9565, #FE5F6B)"
                                    color="white"
                                    fontSize="14px"
                                    fontWeight="500"
                                    borderRadius="999px"
                                    px={6}
                                    py={2}
                                    h="36px"
                                    _hover={{ opacity: 0.9 }}
                                    onClick={handleQuery}
                                >
                                    查询
                                </Button>

                                <Button
                                    variant="ghost"
                                    fontSize="14px"
                                    color={COLORS.textTertiary}
                                    _hover={{ bg: 'transparent' }}
                                    onClick={handleReset}
                                >
                                    重置
                                </Button>

                                <Box cursor="pointer">
                                    <Info
                                        size={18}
                                        color={COLORS.textTertiary}
                                    />
                                </Box>
                            </HStack>
                        </HStack>
                    </Flex>
                </Container>
            </Box>

            {/* Main Content */}
            <Container maxW="1400px" px={6} py={6}>
                <VStack gap={6} align="stretch">
                    {/* User Basic Data Section */}
                    <Box
                        bg={COLORS.bgPrimary}
                        borderRadius="8px"
                        p={6}
                        boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                    >
                        <Text
                            fontSize="16px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                            mb={6}
                        >
                            用户基础数据
                        </Text>

                        <Grid templateColumns="1fr 1fr" gap={6} mb={6}>
                            {/* Left Chart */}
                            <Box
                                borderRadius="4px"
                                border={`1px solid ${COLORS.borderColor}`}
                                p={6}
                            >
                                <Flex
                                    gap={4}
                                    align="center"
                                    justifyContent="space-between"
                                >
                                    <Box
                                        cursor="pointer"
                                        onClick={() =>
                                            handleStatCardClick('cumulative')
                                        }
                                        flex={1}
                                    >
                                        <StatCard
                                            icon="👥"
                                            title="累计注册用户数"
                                            value={userStats.cumulativeUsers.toString()}
                                            change="+2%"
                                            changeType="up"
                                        />
                                    </Box>
                                    <ChevronRight color="#aaa" />
                                    <Box
                                        cursor="pointer"
                                        onClick={() =>
                                            handleStatCardClick('new')
                                        }
                                        flex={1}
                                    >
                                        <StatCard
                                            icon="➕"
                                            title="新增注册用户数"
                                            value={userStats.newUsers.toString()}
                                            change="+2%"
                                            changeType="up"
                                        />
                                    </Box>
                                    <ChevronRight color="#aaa" />
                                </Flex>

                                <Box mt={6} h="300px">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <AreaChart data={userDataChartData}>
                                            <defs>
                                                <linearGradient
                                                    id="colorCumulative"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor={COLORS.info}
                                                        stopOpacity={0.3}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor={COLORS.info}
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                                <linearGradient
                                                    id="colorNew"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor={
                                                            COLORS.success
                                                        }
                                                        stopOpacity={0.3}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor={
                                                            COLORS.success
                                                        }
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke={COLORS.borderColor}
                                            />
                                            <XAxis
                                                dataKey="time"
                                                stroke={COLORS.textTertiary}
                                                fontSize={12}
                                            />
                                            <YAxis
                                                stroke={COLORS.textTertiary}
                                                fontSize={12}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor:
                                                        'rgba(255, 255, 255, 0.8)',
                                                    border: `1px solid ${COLORS.borderColor}`,
                                                    borderRadius: '6px',
                                                }}
                                            />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="cumulativeUsers"
                                                name="累计注册用户数"
                                                stroke={COLORS.info}
                                                strokeWidth={2}
                                                fill="url(#colorCumulative)"
                                                dot={false}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="newUsers"
                                                name="新增注册用户数"
                                                stroke={COLORS.success}
                                                strokeWidth={2}
                                                fill="url(#colorNew)"
                                                dot={false}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Box>

                            {/* Right Chart */}
                            <Box
                                borderRadius="4px"
                                border={`1px solid ${COLORS.borderColor}`}
                                p={6}
                                cursor="pointer"
                                onClick={() => handleStatCardClick('active')}
                            >
                                <HStack gap={4} align="center">
                                    <Image
                                        src="/images/reports/login-icon.png"
                                        alt=""
                                        w={12}
                                        h={12}
                                    />
                                    <VStack
                                        justify="space-between"
                                        align="flex-start"
                                    >
                                        <HStack gap={1}>
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.textSecondary}
                                            >
                                                用户登录活跃数
                                            </Text>
                                            <Info
                                                size={16}
                                                color={COLORS.textTertiary}
                                            />
                                        </HStack>
                                        <HStack gap={16}>
                                            <VStack align="start" gap={2}>
                                                <HStack gap={2}>
                                                    <Text
                                                        fontSize="28px"
                                                        fontWeight="600"
                                                        color={
                                                            COLORS.textPrimary
                                                        }
                                                    >
                                                        {userStats.activeUsers}
                                                    </Text>
                                                    <Text
                                                        fontSize="12px"
                                                        color={
                                                            COLORS.textSecondary
                                                        }
                                                    >
                                                        （总数）
                                                    </Text>
                                                </HStack>
                                                <HStack
                                                    gap={1}
                                                    fontSize="12px"
                                                    color={COLORS.textTertiary}
                                                >
                                                    <Text>较前一日</Text>
                                                    <Text
                                                        color={
                                                            COLORS.textPrimary
                                                        }
                                                    >
                                                        +2%
                                                    </Text>
                                                </HStack>
                                            </VStack>
                                            <VStack align="start" gap={2}>
                                                <HStack gap={2}>
                                                    <Text
                                                        fontSize="20px"
                                                        fontWeight="600"
                                                        color={
                                                            COLORS.textPrimary
                                                        }
                                                    >
                                                        {
                                                            userStats
                                                                .activeUsersByChannel
                                                                .miniProgram
                                                        }
                                                    </Text>
                                                    <Text
                                                        fontSize="12px"
                                                        color={
                                                            COLORS.textSecondary
                                                        }
                                                    >
                                                        （小程序）
                                                    </Text>
                                                </HStack>
                                                <HStack
                                                    gap={1}
                                                    fontSize="12px"
                                                    color={COLORS.textTertiary}
                                                >
                                                    <Text>较前一日</Text>
                                                    <Text
                                                        color={
                                                            COLORS.textPrimary
                                                        }
                                                    >
                                                        +2%
                                                    </Text>
                                                </HStack>
                                            </VStack>
                                            <VStack align="start" gap={2}>
                                                <HStack gap={2}>
                                                    <Text
                                                        fontSize="20px"
                                                        fontWeight="600"
                                                        color={
                                                            COLORS.textPrimary
                                                        }
                                                    >
                                                        {
                                                            userStats
                                                                .activeUsersByChannel
                                                                .pc
                                                        }
                                                    </Text>
                                                    <Text
                                                        fontSize="12px"
                                                        color={
                                                            COLORS.textSecondary
                                                        }
                                                    >
                                                        （PC端）
                                                    </Text>
                                                </HStack>
                                                <HStack
                                                    gap={1}
                                                    fontSize="12px"
                                                    color={COLORS.textTertiary}
                                                >
                                                    <Text>较前一日</Text>
                                                    <Text
                                                        color={
                                                            COLORS.textPrimary
                                                        }
                                                    >
                                                        +2%
                                                    </Text>
                                                </HStack>
                                            </VStack>
                                            <ChevronRight color="#aaa" />
                                        </HStack>
                                    </VStack>
                                </HStack>

                                <Box mt={6} h="300px">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <AreaChart data={activeUserChartData}>
                                            <defs>
                                                <linearGradient
                                                    id="colorMiniProgram"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor={COLORS.info}
                                                        stopOpacity={0.3}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor={COLORS.info}
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                                <linearGradient
                                                    id="colorPC"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor={
                                                            COLORS.success
                                                        }
                                                        stopOpacity={0.3}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor={
                                                            COLORS.success
                                                        }
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke={COLORS.borderColor}
                                            />
                                            <XAxis
                                                dataKey="time"
                                                stroke={COLORS.textTertiary}
                                                fontSize={12}
                                            />
                                            <YAxis
                                                stroke={COLORS.textTertiary}
                                                fontSize={12}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor:
                                                        'rgba(255, 255, 255, 0.8)',
                                                    border: `1px solid ${COLORS.borderColor}`,
                                                    borderRadius: '6px',
                                                }}
                                            />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="miniProgram"
                                                name="小程序"
                                                stroke={COLORS.info}
                                                strokeWidth={2}
                                                fill="url(#colorMiniProgram)"
                                                dot={false}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="pc"
                                                name="PC端"
                                                stroke={COLORS.success}
                                                strokeWidth={2}
                                                fill="url(#colorPC)"
                                                dot={false}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Box>
                        </Grid>
                    </Box>

                    {/* Activity Participation Section */}
                    <Box
                        bg={COLORS.bgPrimary}
                        borderRadius="8px"
                        p={6}
                        boxShadow="0 1px 2px rgba(0,0,0,0.05)"
                    >
                        <Text
                            fontSize="16px"
                            fontWeight="500"
                            color={COLORS.textPrimary}
                            mb={6}
                        >
                            活动参与情况
                        </Text>

                        <Box gap={6} w="100%" h="400px" overflow="hidden">
                            {/* Left side - Stats */}
                            <VStack gap={0} align="stretch" w="750px">
                                {/* Row 1 */}
                                <Flex
                                    bg="#F0F5FB"
                                    p={4}
                                    borderBottom={`1px solid ${COLORS.borderColor}`}
                                    cursor="pointer"
                                    _hover={{ bg: '#E8F3FF' }}
                                >
                                    <VStack
                                        align="start"
                                        flex={1}
                                        gap={0}
                                        onClick={() =>
                                            handleStatCardClick(
                                                'task-acceptance'
                                            )
                                        }
                                        zIndex={1}
                                    >
                                        <HStack gap={1}>
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.textSecondary}
                                            >
                                                任务领取人次
                                            </Text>
                                            <Info
                                                size={16}
                                                color={COLORS.textTertiary}
                                            />
                                        </HStack>
                                        <Text
                                            fontSize="24px"
                                            fontWeight="500"
                                            color={COLORS.textPrimary}
                                        >
                                            {activityStats.taskAcceptanceCount}
                                        </Text>
                                        <HStack
                                            gap={1}
                                            fontSize="12px"
                                            color={COLORS.textTertiary}
                                        >
                                            <Text>较前一日</Text>
                                            <Text color={COLORS.textPrimary}>
                                                +2%
                                            </Text>
                                        </HStack>
                                    </VStack>
                                    <Box
                                        cursor="pointer"
                                        onClick={() =>
                                            handleStatCardClick(
                                                'task-acceptance-people'
                                            )
                                        }
                                        flex={1}
                                        zIndex={1}
                                    >
                                        <VStack align="start" gap={0}>
                                            <HStack gap={1}>
                                                <Text
                                                    fontSize="14px"
                                                    color={COLORS.textSecondary}
                                                >
                                                    任务领取人数
                                                </Text>
                                                <Info
                                                    size={16}
                                                    color={COLORS.textTertiary}
                                                />
                                            </HStack>
                                            <Text
                                                fontSize="24px"
                                                fontWeight="500"
                                                color={COLORS.textPrimary}
                                            >
                                                {
                                                    activityStats.taskAcceptancePeople
                                                }
                                            </Text>
                                            <HStack
                                                gap={1}
                                                fontSize="12px"
                                                color={COLORS.textTertiary}
                                            >
                                                <Text>较前一日</Text>
                                                <Text
                                                    color={COLORS.textPrimary}
                                                >
                                                    +2%
                                                </Text>
                                            </HStack>
                                        </VStack>
                                    </Box>
                                </Flex>

                                {/* Row 2 */}
                                <Flex
                                    bg="#F7F8FD"
                                    p={4}
                                    borderBottom={`1px solid ${COLORS.borderColor}`}
                                    cursor="pointer"
                                    _hover={{ bg: '#F0F5FB' }}
                                >
                                    <VStack
                                        align="start"
                                        flex={1}
                                        gap={0}
                                        onClick={() =>
                                            handleStatCardClick(
                                                'defect-report-count'
                                            )
                                        }
                                        zIndex={1}
                                    >
                                        <HStack gap={1}>
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.textSecondary}
                                            >
                                                提报缺陷人次
                                            </Text>
                                            <Info
                                                size={16}
                                                color={COLORS.textTertiary}
                                            />
                                        </HStack>
                                        <Text
                                            fontSize="24px"
                                            fontWeight="500"
                                            color={COLORS.textPrimary}
                                        >
                                            {activityStats.defectReportCount}
                                        </Text>
                                        <HStack
                                            gap={1}
                                            fontSize="12px"
                                            color={COLORS.textTertiary}
                                        >
                                            <Text>较前一日</Text>
                                            <Text color={COLORS.textPrimary}>
                                                -2%
                                            </Text>
                                        </HStack>
                                    </VStack>
                                    <VStack
                                        align="start"
                                        flex={1}
                                        gap={0}
                                        onClick={() =>
                                            handleStatCardClick(
                                                'defect-report-people'
                                            )
                                        }
                                        cursor="pointer"
                                        zIndex={1}
                                    >
                                        <HStack gap={1}>
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.textSecondary}
                                            >
                                                提报缺陷人数
                                            </Text>
                                            <Info
                                                size={16}
                                                color={COLORS.textTertiary}
                                            />
                                        </HStack>
                                        <Text
                                            fontSize="24px"
                                            fontWeight="500"
                                            color={COLORS.textPrimary}
                                        >
                                            {activityStats.defectReportPeople}
                                        </Text>
                                        <HStack
                                            gap={1}
                                            fontSize="12px"
                                            color={COLORS.textTertiary}
                                        >
                                            <Text>较前一日</Text>
                                            <Text color={COLORS.textPrimary}>
                                                -2%
                                            </Text>
                                        </HStack>
                                    </VStack>
                                </Flex>

                                {/* Row 3 */}
                                <Flex
                                    bg="#FBFCFF"
                                    p={4}
                                    cursor="pointer"
                                    onClick={() =>
                                        handleStatCardClick(
                                            'valid-defect-count'
                                        )
                                    }
                                >
                                    <VStack
                                        align="start"
                                        flex={1}
                                        gap={0}
                                        zIndex={1}
                                    >
                                        <HStack gap={1}>
                                            <Text
                                                fontSize="14px"
                                                color={COLORS.textSecondary}
                                            >
                                                提报有效缺陷数
                                            </Text>
                                            <Info
                                                size={16}
                                                color={COLORS.textTertiary}
                                            />
                                        </HStack>
                                        <Text
                                            fontSize="24px"
                                            fontWeight="500"
                                            color={COLORS.textPrimary}
                                        >
                                            {activityStats.validDefectCount}
                                        </Text>
                                        <HStack
                                            gap={1}
                                            fontSize="12px"
                                            color={COLORS.textTertiary}
                                        >
                                            <Text>较前一日</Text>
                                            <Text color={COLORS.textPrimary}>
                                                -2%
                                            </Text>
                                        </HStack>
                                    </VStack>
                                </Flex>
                            </VStack>

                            {/* Right side - Funnel Chart */}
                            <Box
                                display="flex"
                                flexDirection="column"
                                justifyContent="center"
                                alignItems="center"
                                scale={1.53}
                                position="relative"
                                left="420px"
                                top="-8px"
                                h="0px"
                            >
                                <FunnelChart
                                    participationStats={participationStats}
                                    isLoading={participationStatsLoading}
                                />
                            </Box>
                        </Box>
                    </Box>
                </VStack>
            </Container>
        </Box>
    );
}
