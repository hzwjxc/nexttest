'use client';
import React, { useState } from 'react';
import { LiaSlashSolid } from 'react-icons/lia';
import { FiAlignJustify } from 'react-icons/fi';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';
import {
    Breadcrumb,
    Box,
    Flex,
    Text,
    Button,
    Table,
    Tabs,
    Image,
    Menu,
    Dialog,
} from '@chakra-ui/react';
import { Radio, RadioGroup } from '@/app/_components/ui/radio';
import {
    LuPencil,
    LuTrash2,
    LuChevronUp,
    LuChevronDown,
    LuX,
} from 'react-icons/lu';
import CarouselDialog from './_components/CarouselDialog';
import SlidingTabDialog from './_components/SlidingTabDialog';
import HomepagePopupDialog from './_components/HomepagePopupDialog';

const COLORS = {
    primary: '#E31424',
    textPrimary: '#1D2129',
    textSecondary: '#4E5969',
    textTertiary: '#86909C',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F3F5',
    borderColor: '#E5E6EB',
};

type CarouselItem = {
    id: string;
    sequence: number;
    image: string;
    link: string;
    channels: string[];
    createdAt: string;
    updatedAt: string;
};

const HomePageManagementType = {
    carousel: 'carousel',
    slidingTabs: 'slidingTabs',
    homePage: 'homePage',
    homepagePopup: 'homepagePopup',
};

export default function HomePageManagement() {
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [currentTab, setCurrentTab] = useState<string>(
        HomePageManagementType.carousel
    );
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCarouselId, setEditingCarouselId] = useState<
        string | undefined
    >(undefined);
    const [editingSlidingTabId, setEditingSlidingTabId] = useState<
        string | undefined
    >(undefined);
    const [editingPopupId, setEditingPopupId] = useState<string | undefined>(
        undefined
    );
    const [popupType, setPopupType] = useState<string>('IMAGE'); // IMAGE 或 TEXT
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // 查询轮播图列表
    const { data, isLoading, refetch } = api.carousel.list.useQuery(
        {
            page: currentPage,
            pageSize: pageSize,
        },
        {
            // 确保页面挂载时重新获取数据
            refetchOnMount: 'always',
            // 当窗口重新获得焦点时刷新数据
            refetchOnWindowFocus: true,
            enabled: currentTab === HomePageManagementType.carousel,
        }
    );

    // 查询滑动标签列表
    const {
        data: slidingTabData,
        isLoading: slidingTabLoading,
        refetch: refetchSlidingTabs,
    } = api.slidingTab.list.useQuery(
        {
            page: currentPage,
            pageSize: pageSize,
        },
        {
            // 确保页面挂载时重新获取数据
            refetchOnMount: 'always',
            // 当窗口重新获得焦点时刷新数据
            refetchOnWindowFocus: true,
            enabled: currentTab === HomePageManagementType.slidingTabs,
        }
    );

    // 查询首页弹窗列表
    const {
        data: popupData,
        isLoading: popupLoading,
        refetch: refetchPopups,
    } = api.homepagePopup.list.useQuery(
        {
            type: popupType,
            page: currentPage,
            pageSize: pageSize,
        },
        {
            // 确保页面挂载时重新获取数据
            refetchOnMount: 'always',
            // 当窗口重新获得焦点时刷新数据
            refetchOnWindowFocus: true,
            enabled: currentTab === HomePageManagementType.homepagePopup,
        }
    );

    // 删除轮播图
    const deleteMutation = api.carousel.delete.useMutation({
        onSuccess: () => {
            showSuccessToast('删除成功');
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 上移轮播图
    const moveUpMutation = api.carousel.moveUp.useMutation({
        onSuccess: () => {
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 下移轮播图
    const moveDownMutation = api.carousel.moveDown.useMutation({
        onSuccess: () => {
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 删除滑动标签
    const deleteSlidingTabMutation = api.slidingTab.delete.useMutation({
        onSuccess: () => {
            showSuccessToast('删除成功');
            void refetchSlidingTabs();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 上移滑动标签
    const moveUpSlidingTabMutation = api.slidingTab.moveUp.useMutation({
        onSuccess: () => {
            void refetchSlidingTabs();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 下移滑动标签
    const moveDownSlidingTabMutation = api.slidingTab.moveDown.useMutation({
        onSuccess: () => {
            void refetchSlidingTabs();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 删除首页弹窗
    const deletePopupMutation = api.homepagePopup.delete.useMutation({
        onSuccess: () => {
            showSuccessToast('删除成功');
            void refetchPopups();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 上移首页弹窗
    const moveUpPopupMutation = api.homepagePopup.moveUp.useMutation({
        onSuccess: () => {
            void refetchPopups();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 下移首页弹窗
    const moveDownPopupMutation = api.homepagePopup.moveDown.useMutation({
        onSuccess: () => {
            void refetchPopups();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    const totalItems =
        currentTab === HomePageManagementType.carousel
            ? data?.pagination.total || 0
            : currentTab === HomePageManagementType.slidingTabs
              ? slidingTabData?.pagination.total || 0
              : currentTab === HomePageManagementType.homepagePopup
                ? popupData?.pagination.total || 0
                : 0;

    const totalPages =
        currentTab === HomePageManagementType.carousel
            ? data?.pagination.totalPages || 0
            : currentTab === HomePageManagementType.slidingTabs
              ? slidingTabData?.pagination.totalPages || 0
              : currentTab === HomePageManagementType.homepagePopup
                ? popupData?.pagination.totalPages || 0
                : 0;

    const currentData =
        currentTab === HomePageManagementType.carousel
            ? ((data?.data || []) as CarouselItem[])
            : currentTab === HomePageManagementType.slidingTabs
              ? ((slidingTabData?.data || []) as any[])
              : currentTab === HomePageManagementType.homepagePopup
                ? ((popupData?.data || []) as any[])
                : [];

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleNewCarousel = () => {
        if (currentTab === HomePageManagementType.carousel) {
            setEditingCarouselId(undefined);
            setEditingSlidingTabId(undefined);
            setEditingPopupId(undefined);
            setDialogOpen(true);
        } else if (currentTab === HomePageManagementType.slidingTabs) {
            setEditingSlidingTabId(undefined);
            setEditingCarouselId(undefined);
            setEditingPopupId(undefined);
            setDialogOpen(true);
        } else if (currentTab === HomePageManagementType.homepagePopup) {
            setEditingPopupId(undefined);
            setEditingCarouselId(undefined);
            setEditingSlidingTabId(undefined);
            setDialogOpen(true);
        }
    };

    const handleEditCarousel = (item: CarouselItem) => {
        setEditingCarouselId(item.id);
        setEditingSlidingTabId(undefined);
        setEditingPopupId(undefined);
        setDialogOpen(true);
    };

    const handleEditSlidingTab = (item: any) => {
        setEditingSlidingTabId(item.id);
        setEditingCarouselId(undefined);
        setEditingPopupId(undefined);
        setDialogOpen(true);
    };

    const handleEditPopup = (item: any) => {
        setEditingPopupId(item.id);
        setEditingCarouselId(undefined);
        setEditingSlidingTabId(undefined);
        setDialogOpen(true);
    };

    const handleDeleteCarousel = (item: CarouselItem) => {
        if (window.confirm('确定要删除这个轮播图吗?')) {
            deleteMutation.mutate({ id: item.id });
        }
    };

    const handleDeleteSlidingTab = (item: any) => {
        if (window.confirm('确定要删除这个滑动标签吗?')) {
            deleteSlidingTabMutation.mutate({ id: item.id });
        }
    };

    const handleDeletePopup = (item: any) => {
        if (window.confirm('确定要删除这个首页弹窗吗?')) {
            deletePopupMutation.mutate({ id: item.id });
        }
    };

    const handleMoveUp = (item: CarouselItem) => {
        moveUpMutation.mutate({ id: item.id });
    };

    const handleMoveUpSlidingTab = (item: any) => {
        moveUpSlidingTabMutation.mutate({ id: item.id });
    };

    const handleMoveUpPopup = (item: any) => {
        moveUpPopupMutation.mutate({ id: item.id, type: popupType });
    };

    const handleMoveDown = (item: CarouselItem) => {
        moveDownMutation.mutate({ id: item.id });
    };

    const handleMoveDownSlidingTab = (item: any) => {
        moveDownSlidingTabMutation.mutate({ id: item.id });
    };

    const handleMoveDownPopup = (item: any) => {
        moveDownPopupMutation.mutate({ id: item.id, type: popupType });
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 5; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    const getTabLabel = (type: string) => {
        switch (type) {
            case HomePageManagementType.carousel:
                return '轮播图管理';
            case HomePageManagementType.slidingTabs:
                return '滑动标签管理';
            case HomePageManagementType.homepagePopup:
                return '首页弹窗';
            case HomePageManagementType.homePage:
                return '首页管理';
            default:
                return '';
        }
    };

    const handleTabChange = (value: string) => {
        setCurrentTab(value as string);
        setCurrentPage(1);
        // 重置弹窗类型为默认值
        if (value === HomePageManagementType.homepagePopup) {
            setPopupType('IMAGE');
        }
    };

    const handlePopupTypeChange = (type: string) => {
        setPopupType(type);
        setCurrentPage(1);
    };

    const getChannelDisplay = (channels: string[]) => {
        const channelMap: Record<string, string> = {
            MINI_PROGRAM: '小程序',
            PC: 'PC端',
        };
        return channels.map((c) => channelMap[c] || c).join('、');
    };

    const getPopupTypeLabel = (type: string) => {
        return type === 'IMAGE' ? '图片弹窗' : '文字弹窗';
    };

    return (
        <Box>
            {/* 面包屑导航 */}
            <Breadcrumb.Root>
                <Breadcrumb.List>
                    <Breadcrumb.Item>
                        <Breadcrumb.Link href="/crowdsource/admin">
                            <FiAlignJustify />
                            后台管理
                        </Breadcrumb.Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Separator>
                        <LiaSlashSolid />
                    </Breadcrumb.Separator>

                    <Breadcrumb.Item>
                        <Breadcrumb.Link href="/crowdsource/admin/system-announcement">
                            公告与消息管理
                        </Breadcrumb.Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Separator>
                        <LiaSlashSolid />
                    </Breadcrumb.Separator>

                    <Breadcrumb.Item>
                        <Breadcrumb.CurrentLink>
                            首页管理
                        </Breadcrumb.CurrentLink>
                    </Breadcrumb.Item>
                </Breadcrumb.List>
            </Breadcrumb.Root>

            {/* 标题和发布按钮 */}
            <Box
                bg="white"
                p={4}
                pb={1}
                mt={4}
                borderRadius="md"
                boxShadow="md"
            >
                <Flex justifyContent="space-between" alignItems="center" mb={4}>
                    {/* Tab 切换 */}
                    <Tabs.Root
                        value={currentTab}
                        onValueChange={(e) => handleTabChange(e.value)}
                    >
                        <Tabs.List>
                            <Tabs.Trigger
                                value="carousel"
                                px={4}
                                py={3}
                                fontSize="14px"
                                color={COLORS.textSecondary}
                                borderBottom="2px solid transparent"
                                _selected={{
                                    color: COLORS.textPrimary,
                                    borderBottomColor: COLORS.primary,
                                    fontWeight: '500',
                                    _before: {
                                        bg: 'transparent',
                                    },
                                }}
                            >
                                {getTabLabel(HomePageManagementType.carousel)}
                            </Tabs.Trigger>
                            <Tabs.Trigger
                                value="slidingTabs"
                                px={4}
                                py={3}
                                fontSize="14px"
                                color={COLORS.textSecondary}
                                borderBottom="2px solid transparent"
                                _selected={{
                                    color: COLORS.textPrimary,
                                    borderBottomColor: COLORS.primary,
                                    fontWeight: '500',
                                    _before: {
                                        bg: 'transparent',
                                    },
                                }}
                            >
                                {getTabLabel(
                                    HomePageManagementType.slidingTabs
                                )}
                            </Tabs.Trigger>
                            <Tabs.Trigger
                                value="homepagePopup"
                                px={4}
                                py={3}
                                fontSize="14px"
                                color={COLORS.textSecondary}
                                borderBottom="2px solid transparent"
                                _selected={{
                                    color: COLORS.textPrimary,
                                    borderBottomColor: COLORS.primary,
                                    fontWeight: '500',
                                    _before: {
                                        bg: 'transparent',
                                    },
                                }}
                            >
                                {getTabLabel(
                                    HomePageManagementType.homepagePopup
                                )}
                            </Tabs.Trigger>
                        </Tabs.List>
                    </Tabs.Root>
                    <Button
                        bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                        color="white"
                        fontSize="14px"
                        fontWeight="500"
                        borderRadius="18px"
                        h="36px"
                        px={6}
                        _hover={{ opacity: 0.9 }}
                        onClick={handleNewCarousel}
                    >
                        新增
                    </Button>
                </Flex>
            </Box>

            {/* 灰色间隙 */}
            <Box h="16px" bg={COLORS.bgSecondary} flexShrink={0} />

            {/* 表格 */}
            <Box
                overflowX="auto"
                bg="white"
                p={4}
                borderRadius="md"
                boxShadow="md"
            >
                {currentTab === HomePageManagementType.carousel ? (
                    // 轮播图表格
                    isLoading ? (
                        <Flex justify="center" align="center" py={8}>
                            <Text color={COLORS.textSecondary}>加载中...</Text>
                        </Flex>
                    ) : currentData.length === 0 ? (
                        <Flex justify="center" align="center" py={8}>
                            <Text color={COLORS.textSecondary}>暂无数据</Text>
                        </Flex>
                    ) : (
                        <Table.Root variant="outline" size="sm">
                            <Table.Header>
                                <Table.Row bg={COLORS.bgSecondary}>
                                    <Table.ColumnHeader
                                        py={4}
                                        px={4}
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textSecondary}
                                        textAlign="center"
                                        w="80px"
                                    >
                                        序号
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader
                                        py={4}
                                        px={4}
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textSecondary}
                                    >
                                        图片
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader
                                        py={4}
                                        px={4}
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textSecondary}
                                        w="200px"
                                    >
                                        链接
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader
                                        py={4}
                                        px={4}
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textSecondary}
                                        w="180px"
                                    >
                                        渠道
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader
                                        py={4}
                                        px={4}
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textSecondary}
                                        textAlign="center"
                                        w="120px"
                                    >
                                        操作
                                    </Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {currentData.map((item, index) => (
                                    <Table.Row
                                        key={item.id}
                                        borderBottom="1px solid"
                                        borderColor={COLORS.borderColor}
                                        _hover={{ bg: COLORS.bgSecondary }}
                                    >
                                        <Table.Cell
                                            py={4}
                                            px={4}
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                            textAlign="center"
                                        >
                                            {(currentPage - 1) * pageSize +
                                                index +
                                                1}
                                        </Table.Cell>
                                        <Table.Cell py={4} px={4}>
                                            <Image
                                                src={item.image}
                                                alt="图片"
                                                w="160px"
                                                h="90px"
                                                objectFit="cover"
                                                borderRadius="4px"
                                                cursor="pointer"
                                                onClick={() =>
                                                    setPreviewImage(item.image)
                                                }
                                                _hover={{ opacity: 0.8 }}
                                            />
                                        </Table.Cell>
                                        <Table.Cell
                                            py={4}
                                            px={4}
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                        >
                                            {item.link}
                                        </Table.Cell>
                                        <Table.Cell
                                            py={4}
                                            px={4}
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                        >
                                            {getChannelDisplay(item.channels)}
                                        </Table.Cell>
                                        <Table.Cell
                                            py={4}
                                            px={4}
                                            textAlign="center"
                                        >
                                            <Flex
                                                justify="center"
                                                align="center"
                                                gap={3}
                                            >
                                                <Box
                                                    as="button"
                                                    cursor="pointer"
                                                    color={COLORS.textSecondary}
                                                    _hover={{
                                                        color: COLORS.primary,
                                                    }}
                                                    onClick={() =>
                                                        handleMoveUp(item)
                                                    }
                                                >
                                                    <LuChevronUp size={18} />
                                                </Box>
                                                <Box
                                                    as="button"
                                                    cursor="pointer"
                                                    color={COLORS.textSecondary}
                                                    _hover={{
                                                        color: COLORS.primary,
                                                    }}
                                                    onClick={() =>
                                                        handleMoveDown(item)
                                                    }
                                                >
                                                    <LuChevronDown size={18} />
                                                </Box>
                                                <Box
                                                    as="button"
                                                    cursor="pointer"
                                                    color={COLORS.textSecondary}
                                                    _hover={{
                                                        color: COLORS.primary,
                                                    }}
                                                    onClick={() =>
                                                        handleEditCarousel(item)
                                                    }
                                                >
                                                    <LuPencil size={18} />
                                                </Box>
                                                <Box
                                                    as="button"
                                                    cursor="pointer"
                                                    color={COLORS.textSecondary}
                                                    _hover={{
                                                        color: COLORS.primary,
                                                    }}
                                                    onClick={() =>
                                                        handleDeleteCarousel(
                                                            item
                                                        )
                                                    }
                                                >
                                                    <LuTrash2 size={18} />
                                                </Box>
                                            </Flex>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    )
                ) : currentTab === HomePageManagementType.slidingTabs ? (
                    // 滑动标签表格
                    slidingTabLoading ? (
                        <Flex justify="center" align="center" py={8}>
                            <Text color={COLORS.textSecondary}>加载中...</Text>
                        </Flex>
                    ) : currentData.length === 0 ? (
                        <Flex justify="center" align="center" py={8}>
                            <Text color={COLORS.textSecondary}>暂无数据</Text>
                        </Flex>
                    ) : (
                        <Table.Root variant="outline" size="sm">
                            <Table.Header>
                                <Table.Row bg={COLORS.bgSecondary}>
                                    <Table.ColumnHeader
                                        py={4}
                                        px={4}
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textSecondary}
                                        textAlign="center"
                                        w="80px"
                                    >
                                        序号
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader
                                        py={4}
                                        px={4}
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textSecondary}
                                    >
                                        图片
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader
                                        py={4}
                                        px={4}
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textSecondary}
                                        w="150px"
                                    >
                                        标签文字
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader
                                        py={4}
                                        px={4}
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textSecondary}
                                        w="200px"
                                    >
                                        链接
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader
                                        py={4}
                                        px={4}
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textSecondary}
                                        w="180px"
                                    >
                                        渠道
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader
                                        py={4}
                                        px={4}
                                        fontSize="14px"
                                        fontWeight="500"
                                        color={COLORS.textSecondary}
                                        textAlign="center"
                                        w="120px"
                                    >
                                        操作
                                    </Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {currentData.map((item, index) => (
                                    <Table.Row
                                        key={item.id}
                                        borderBottom="1px solid"
                                        borderColor={COLORS.borderColor}
                                        _hover={{ bg: COLORS.bgSecondary }}
                                    >
                                        <Table.Cell
                                            py={4}
                                            px={4}
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                            textAlign="center"
                                        >
                                            {(currentPage - 1) * pageSize +
                                                index +
                                                1}
                                        </Table.Cell>
                                        <Table.Cell py={4} px={4}>
                                            <Image
                                                src={item.image}
                                                alt="图片"
                                                w="160px"
                                                h="90px"
                                                objectFit="cover"
                                                borderRadius="4px"
                                                cursor="pointer"
                                                onClick={() =>
                                                    setPreviewImage(item.image)
                                                }
                                                _hover={{ opacity: 0.8 }}
                                            />
                                        </Table.Cell>
                                        <Table.Cell
                                            py={4}
                                            px={4}
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                        >
                                            {item.text}
                                        </Table.Cell>
                                        <Table.Cell
                                            py={4}
                                            px={4}
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                        >
                                            {item.link}
                                        </Table.Cell>
                                        <Table.Cell
                                            py={4}
                                            px={4}
                                            fontSize="14px"
                                            color={COLORS.textPrimary}
                                        >
                                            {getChannelDisplay(item.channels)}
                                        </Table.Cell>
                                        <Table.Cell
                                            py={4}
                                            px={4}
                                            textAlign="center"
                                        >
                                            <Flex
                                                justify="center"
                                                align="center"
                                                gap={3}
                                            >
                                                <Box
                                                    as="button"
                                                    cursor="pointer"
                                                    color={COLORS.textSecondary}
                                                    _hover={{
                                                        color: COLORS.primary,
                                                    }}
                                                    onClick={() =>
                                                        handleMoveUpSlidingTab(
                                                            item
                                                        )
                                                    }
                                                >
                                                    <LuChevronUp size={18} />
                                                </Box>
                                                <Box
                                                    as="button"
                                                    cursor="pointer"
                                                    color={COLORS.textSecondary}
                                                    _hover={{
                                                        color: COLORS.primary,
                                                    }}
                                                    onClick={() =>
                                                        handleMoveDownSlidingTab(
                                                            item
                                                        )
                                                    }
                                                >
                                                    <LuChevronDown size={18} />
                                                </Box>
                                                <Box
                                                    as="button"
                                                    cursor="pointer"
                                                    color={COLORS.textSecondary}
                                                    _hover={{
                                                        color: COLORS.primary,
                                                    }}
                                                    onClick={() =>
                                                        handleEditSlidingTab(
                                                            item
                                                        )
                                                    }
                                                >
                                                    <LuPencil size={18} />
                                                </Box>
                                                <Box
                                                    as="button"
                                                    cursor="pointer"
                                                    color={COLORS.textSecondary}
                                                    _hover={{
                                                        color: COLORS.primary,
                                                    }}
                                                    onClick={() =>
                                                        handleDeleteSlidingTab(
                                                            item
                                                        )
                                                    }
                                                >
                                                    <LuTrash2 size={18} />
                                                </Box>
                                            </Flex>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    )
                ) : currentTab === HomePageManagementType.homepagePopup ? (
                    // 首页弹窗表格
                    <>
                        {/* 弹窗类型切换 */}
                        <RadioGroup
                            mb={6}
                            value={popupType}
                            onValueChange={(e) =>
                                handlePopupTypeChange(e.value)
                            }
                        >
                            <Flex gap={6}>
                                <Radio value="IMAGE" colorPalette="red">
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textPrimary}
                                    >
                                        图片弹窗
                                    </Text>
                                </Radio>
                                <Radio value="TEXT" colorPalette="red">
                                    <Text
                                        fontSize="14px"
                                        color={COLORS.textPrimary}
                                    >
                                        文字弹窗
                                    </Text>
                                </Radio>
                            </Flex>
                        </RadioGroup>

                        {popupLoading ? (
                            <Flex justify="center" align="center" py={8}>
                                <Text color={COLORS.textSecondary}>
                                    加载中...
                                </Text>
                            </Flex>
                        ) : currentData.length === 0 ? (
                            <Flex justify="center" align="center" py={8}>
                                <Text color={COLORS.textSecondary}>
                                    暂无数据
                                </Text>
                            </Flex>
                        ) : (
                            <Table.Root variant="outline" size="sm">
                                <Table.Header>
                                    <Table.Row bg={COLORS.bgSecondary}>
                                        <Table.ColumnHeader
                                            py={4}
                                            px={4}
                                            fontSize="14px"
                                            fontWeight="500"
                                            color={COLORS.textSecondary}
                                            textAlign="center"
                                            w="80px"
                                        >
                                            序号
                                        </Table.ColumnHeader>
                                        {popupType === 'IMAGE' && (
                                            <Table.ColumnHeader
                                                py={4}
                                                px={4}
                                                fontSize="14px"
                                                fontWeight="500"
                                                color={COLORS.textSecondary}
                                            >
                                                图片
                                            </Table.ColumnHeader>
                                        )}
                                        <Table.ColumnHeader
                                            py={4}
                                            px={4}
                                            fontSize="14px"
                                            fontWeight="500"
                                            color={COLORS.textSecondary}
                                            w="150px"
                                        >
                                            弹窗标题
                                        </Table.ColumnHeader>
                                        {popupType === 'TEXT' && (
                                            <Table.ColumnHeader
                                                py={4}
                                                px={4}
                                                fontSize="14px"
                                                fontWeight="500"
                                                color={COLORS.textSecondary}
                                                w="200px"
                                            >
                                                内容摘要
                                            </Table.ColumnHeader>
                                        )}
                                        <Table.ColumnHeader
                                            py={4}
                                            px={4}
                                            fontSize="14px"
                                            fontWeight="500"
                                            color={COLORS.textSecondary}
                                            w="150px"
                                        >
                                            链接
                                        </Table.ColumnHeader>
                                        <Table.ColumnHeader
                                            py={4}
                                            px={4}
                                            fontSize="14px"
                                            fontWeight="500"
                                            color={COLORS.textSecondary}
                                            w="180px"
                                        >
                                            起始时间
                                        </Table.ColumnHeader>
                                        <Table.ColumnHeader
                                            py={4}
                                            px={4}
                                            fontSize="14px"
                                            fontWeight="500"
                                            color={COLORS.textSecondary}
                                            w="180px"
                                        >
                                            关闭时间
                                        </Table.ColumnHeader>
                                        <Table.ColumnHeader
                                            py={4}
                                            px={4}
                                            fontSize="14px"
                                            fontWeight="500"
                                            color={COLORS.textSecondary}
                                            textAlign="center"
                                            w="120px"
                                        >
                                            操作
                                        </Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {currentData.map(
                                        (item: any, index: number) => (
                                            <Table.Row
                                                key={item.id}
                                                borderBottom="1px solid"
                                                borderColor={COLORS.borderColor}
                                                _hover={{
                                                    bg: COLORS.bgSecondary,
                                                }}
                                            >
                                                <Table.Cell
                                                    py={4}
                                                    px={4}
                                                    fontSize="14px"
                                                    color={COLORS.textPrimary}
                                                    textAlign="center"
                                                >
                                                    {(currentPage - 1) *
                                                        pageSize +
                                                        index +
                                                        1}
                                                </Table.Cell>
                                                {popupType === 'IMAGE' && (
                                                    <Table.Cell py={4} px={4}>
                                                        <Image
                                                            src={item.image}
                                                            alt="图片"
                                                            w="160px"
                                                            h="90px"
                                                            objectFit="cover"
                                                            borderRadius="4px"
                                                            cursor="pointer"
                                                            onClick={() =>
                                                                setPreviewImage(
                                                                    item.image
                                                                )
                                                            }
                                                            _hover={{
                                                                opacity: 0.8,
                                                            }}
                                                        />
                                                    </Table.Cell>
                                                )}
                                                <Table.Cell
                                                    py={4}
                                                    px={4}
                                                    fontSize="14px"
                                                    color={COLORS.textPrimary}
                                                >
                                                    {item.title}
                                                </Table.Cell>
                                                {popupType === 'TEXT' && (
                                                    <Table.Cell
                                                        py={4}
                                                        px={4}
                                                        fontSize="14px"
                                                        color={
                                                            COLORS.textPrimary
                                                        }
                                                    >
                                                        {item.content}
                                                    </Table.Cell>
                                                )}
                                                <Table.Cell
                                                    py={4}
                                                    px={4}
                                                    fontSize="14px"
                                                    color={COLORS.textPrimary}
                                                >
                                                    {item.link || '-'}
                                                </Table.Cell>
                                                <Table.Cell
                                                    py={4}
                                                    px={4}
                                                    fontSize="14px"
                                                    color={COLORS.textPrimary}
                                                >
                                                    {new Date(
                                                        item.startTime
                                                    ).toLocaleString('zh-CN')}
                                                </Table.Cell>
                                                <Table.Cell
                                                    py={4}
                                                    px={4}
                                                    fontSize="14px"
                                                    color={COLORS.textPrimary}
                                                >
                                                    {new Date(
                                                        item.endTime
                                                    ).toLocaleString('zh-CN')}
                                                </Table.Cell>
                                                <Table.Cell
                                                    py={4}
                                                    px={4}
                                                    textAlign="center"
                                                >
                                                    <Flex
                                                        justify="center"
                                                        align="center"
                                                        gap={3}
                                                    >
                                                        <Box
                                                            as="button"
                                                            cursor="pointer"
                                                            color={
                                                                COLORS.textSecondary
                                                            }
                                                            _hover={{
                                                                color: COLORS.primary,
                                                            }}
                                                            onClick={() =>
                                                                handleMoveUpPopup(
                                                                    item
                                                                )
                                                            }
                                                        >
                                                            <LuChevronUp
                                                                size={18}
                                                            />
                                                        </Box>
                                                        <Box
                                                            as="button"
                                                            cursor="pointer"
                                                            color={
                                                                COLORS.textSecondary
                                                            }
                                                            _hover={{
                                                                color: COLORS.primary,
                                                            }}
                                                            onClick={() =>
                                                                handleMoveDownPopup(
                                                                    item
                                                                )
                                                            }
                                                        >
                                                            <LuChevronDown
                                                                size={18}
                                                            />
                                                        </Box>
                                                        <Box
                                                            as="button"
                                                            cursor="pointer"
                                                            color={
                                                                COLORS.textSecondary
                                                            }
                                                            _hover={{
                                                                color: COLORS.primary,
                                                            }}
                                                            onClick={() =>
                                                                handleEditPopup(
                                                                    item
                                                                )
                                                            }
                                                        >
                                                            <LuPencil
                                                                size={18}
                                                            />
                                                        </Box>
                                                        <Box
                                                            as="button"
                                                            cursor="pointer"
                                                            color={
                                                                COLORS.textSecondary
                                                            }
                                                            _hover={{
                                                                color: COLORS.primary,
                                                            }}
                                                            onClick={() =>
                                                                handleDeletePopup(
                                                                    item
                                                                )
                                                            }
                                                        >
                                                            <LuTrash2
                                                                size={18}
                                                            />
                                                        </Box>
                                                    </Flex>
                                                </Table.Cell>
                                            </Table.Row>
                                        )
                                    )}
                                </Table.Body>
                            </Table.Root>
                        )}
                    </>
                ) : (
                    // 首页管理内容
                    <Flex justify="center" align="center" py={8}>
                        <Text color={COLORS.textSecondary}>
                            首页管理功能开发中...
                        </Text>
                    </Flex>
                )}
            </Box>

            {/* 分页 */}
            <Flex
                justify="space-between"
                align="center"
                mt={6}
                bg="white"
                p={4}
                borderRadius="md"
                boxShadow="md"
            >
                <Text fontSize="14px" color={COLORS.textSecondary}>
                    共{totalItems}条
                </Text>

                <Flex align="center" gap={2}>
                    {getPageNumbers().map((page, index) =>
                        typeof page === 'number' ? (
                            <Button
                                key={index}
                                minW="32px"
                                h="32px"
                                px={2}
                                fontSize="14px"
                                bg={
                                    currentPage === page
                                        ? COLORS.primary
                                        : 'transparent'
                                }
                                color={
                                    currentPage === page
                                        ? 'white'
                                        : COLORS.textSecondary
                                }
                                border="1px solid"
                                borderColor={
                                    currentPage === page
                                        ? COLORS.primary
                                        : COLORS.borderColor
                                }
                                borderRadius="4px"
                                onClick={() => handlePageChange(page)}
                                _hover={{
                                    bg:
                                        currentPage === page
                                            ? COLORS.primary
                                            : COLORS.bgSecondary,
                                }}
                            >
                                {page}
                            </Button>
                        ) : (
                            <Text
                                key={index}
                                px={2}
                                color={COLORS.textTertiary}
                            >
                                {page}
                            </Text>
                        )
                    )}

                    <Box w="1px" h="20px" bg={COLORS.borderColor} mx={2} />

                    <Menu.Root>
                        <Menu.Trigger asChild>
                            <Button
                                variant="outline"
                                fontSize="14px"
                                h="32px"
                                px={3}
                                borderColor={COLORS.borderColor}
                                color={COLORS.textSecondary}
                                _hover={{ bg: COLORS.bgSecondary }}
                            >
                                {pageSize}条/页
                            </Button>
                        </Menu.Trigger>
                        <Menu.Content>
                            {[10, 20, 50, 100].map((size) => (
                                <Menu.Item
                                    key={size}
                                    value={size.toString()}
                                    onClick={() => {
                                        setPageSize(size);
                                        setCurrentPage(1);
                                    }}
                                >
                                    {size}条/页
                                </Menu.Item>
                            ))}
                        </Menu.Content>
                    </Menu.Root>

                    <Button
                        fontSize="14px"
                        h="32px"
                        px={3}
                        variant="outline"
                        borderColor={COLORS.borderColor}
                        color={COLORS.textSecondary}
                        _hover={{ bg: COLORS.bgSecondary }}
                    >
                        前往
                    </Button>
                </Flex>
            </Flex>

            {/* 弹窗 */}
            {currentTab === HomePageManagementType.carousel && (
                <CarouselDialog
                    open={dialogOpen}
                    onClose={() => {
                        setDialogOpen(false);
                        setEditingCarouselId(undefined);
                        setEditingSlidingTabId(undefined);
                        setEditingPopupId(undefined);
                    }}
                    carouselId={editingCarouselId}
                    onSuccess={() => void refetch()}
                />
            )}

            {currentTab === HomePageManagementType.slidingTabs && (
                <SlidingTabDialog
                    open={dialogOpen}
                    onClose={() => {
                        setDialogOpen(false);
                        setEditingCarouselId(undefined);
                        setEditingSlidingTabId(undefined);
                        setEditingPopupId(undefined);
                    }}
                    slidingTabId={editingSlidingTabId}
                    onSuccess={() => void refetchSlidingTabs()}
                />
            )}

            {currentTab === HomePageManagementType.homepagePopup && (
                <HomepagePopupDialog
                    open={dialogOpen}
                    onClose={() => {
                        setDialogOpen(false);
                        setEditingCarouselId(undefined);
                        setEditingSlidingTabId(undefined);
                        setEditingPopupId(undefined);
                    }}
                    popupId={editingPopupId}
                    initialType={popupType} // 传递当前选中的弹窗类型
                    onSuccess={() => void refetchPopups()}
                />
            )}

            {/* 图片预览弹窗 */}
            {previewImage && (
                <Dialog.Root
                    open={true}
                    onOpenChange={() => setPreviewImage(null)}
                    size="xl"
                >
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content
                            maxW="90vw"
                            maxH="90vh"
                            bg="transparent"
                            boxShadow="none"
                        >
                            <Box position="relative">
                                <Image
                                    src={previewImage}
                                    alt="预览图片"
                                    maxW="100%"
                                    maxH="90vh"
                                    objectFit="contain"
                                    borderRadius="8px"
                                />
                                <Button
                                    position="absolute"
                                    top={2}
                                    right={2}
                                    size="sm"
                                    colorScheme="red"
                                    onClick={() => setPreviewImage(null)}
                                >
                                    <LuX />
                                </Button>
                            </Box>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Dialog.Root>
            )}
        </Box>
    );
}
