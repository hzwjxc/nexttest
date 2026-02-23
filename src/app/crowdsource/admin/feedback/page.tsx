'use client';

import React, { useState } from 'react';
import { api } from '@/trpc/react';
import { FiAlignJustify } from 'react-icons/fi';

export default function FeedbackManagement() {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [previewMedia, setPreviewMedia] = useState<{
        url: string;
        type: string;
    } | null>(null);

    // 获取反馈列表数据
    const {
        data: feedbackData,
        isLoading,
        refetch,
    } = api.admin.getFeedbackList.useQuery(
        {
            page: currentPage,
            pageSize,
            searchTerm,
            startDate,
            endDate,
        },
        {
            staleTime: 30000,
        }
    );

    const exportFeedback = api.admin.exportFeedback.useMutation({
        onSuccess: (data) => {
            const blob = new Blob([data.csv], {
                type: 'text/csv;charset=utf-8;',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `feedback_export_${new Date().toISOString().slice(0, 19).replace('T', '_')}.csv`
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (
                typeof window !== 'undefined' &&
                (window as any).showSuccessToast
            ) {
                (window as any).showSuccessToast(
                    '导出成功',
                    '意见反馈数据已导出'
                );
            }
        },
        onError: (error) => {
            if (
                typeof window !== 'undefined' &&
                (window as any).showErrorToast
            ) {
                (window as any).showErrorToast('导出失败', error.message);
            }
        },
    });

    const handleExport = () => {
        exportFeedback.mutate({
            searchTerm,
            startDate,
            endDate,
        });
    };

    const handleSearch = () => {
        setCurrentPage(1);
        refetch();
    };

    const handleReset = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
        refetch();
    };

    const handleDownloadAll = (attachments: string[]) => {
        attachments.forEach((url: string, index: number) => {
            const link = document.createElement('a');
            link.href = url;
            link.download = `attachment-${index + 1}`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        if (typeof window !== 'undefined' && (window as any).showSuccessToast) {
            (window as any).showSuccessToast(
                '下载开始',
                `正在下载 ${attachments.length} 个附件`
            );
        }
    };

    const handlePreviewMedia = (url: string) => {
        const isVideo =
            url.includes('.mp4') ||
            url.includes('.mov') ||
            url.includes('video');
        setPreviewMedia({
            url,
            type: isVideo ? 'video/mp4' : 'image/jpeg',
        });
    };

    const totalItems = feedbackData?.total ?? 0;
    const totalPages = feedbackData?.totalPages ?? 0;
    const currentData = feedbackData?.data ?? [];

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div
            style={{
                backgroundColor: '#F2F3F5',
                minHeight: '100vh',
            }}
        >
            {/* 页面标题和面包屑 */}
            <div style={{ marginBottom: '14px' }}>
                <p
                    style={{
                        fontSize: '14px',
                        color: '#86909C',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <FiAlignJustify />
                    后台管理 / 意见反馈
                </p>
            </div>

            {/* 筛选区域 */}
            <div
                style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    gap: '16px',
                }}
            >
                <div
                    style={{ display: 'flex', gap: '16px', alignItems: 'end' }}
                >
                    <div style={{ flex: '0 0 200px' }}>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '14px',
                                color: '#4E5969',
                                marginBottom: '8px',
                            }}
                        >
                            提交时间
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    border: '1px solid #E5E6EB',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    color: '#1D2129',
                                }}
                            />
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: '#86909C',
                                    fontSize: '14px',
                                }}
                            >
                                至
                            </span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    border: '1px solid #E5E6EB',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    color: '#1D2129',
                                }}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            flex: '1',
                            minWidth: '200px',
                            maxWidth: '300px',
                        }}
                    >
                        <label
                            style={{
                                display: 'block',
                                fontSize: '14px',
                                color: '#4E5969',
                                marginBottom: '8px',
                            }}
                        >
                            手机号/用户名/反馈编号
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="请输入搜索关键词"
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #E5E6EB',
                                borderRadius: '4px',
                                fontSize: '14px',
                            }}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && handleSearch()
                            }
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            style={{
                                padding: '8px 16px',
                                background:
                                    'linear-gradient(90deg, #ff9266 0%, #fe626b 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                            onClick={handleSearch}
                            disabled={isLoading}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            查询
                        </button>

                        <button
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #E5E6EB',
                                borderRadius: '4px',
                                backgroundColor: 'white',
                                color: '#4E5969',
                                cursor: 'pointer',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            onClick={handleReset}
                        >
                            重置
                        </button>
                    </div>
                </div>
                <button
                    style={{
                        padding: '8px 16px',
                        border: '1px solid #E5E6EB',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        color: '#4E5969',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        height: '36px',
                    }}
                    onClick={handleExport}
                    disabled={exportFeedback.isPending}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    导出
                </button>
            </div>

            {/* 反馈列表 */}
            <div
                style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '24px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
            >
                <h2
                    style={{
                        fontSize: '16px',
                        fontWeight: 500,
                        color: '#1D2129',
                        marginBottom: '16px',
                    }}
                >
                    反馈列表
                </h2>

                {isLoading ? (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '32px',
                            color: '#86909C',
                        }}
                    >
                        加载中...
                    </div>
                ) : currentData.length === 0 ? (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '32px',
                            color: '#86909C',
                        }}
                    >
                        暂无数据
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                        }}
                    >
                        {currentData.map((feedback: any, index: number) => (
                            <div
                                key={feedback.id}
                                style={{
                                    border: '1px solid #E5E6EB',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    backgroundColor: '#FFFFFF',
                                }}
                            >
                                {/* 头部信息 */}
                                <div
                                    style={{
                                        backgroundColor: '#F5F7FA',
                                        padding: '12px 16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '14px',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: '#1D2129',
                                                fontWeight: 500,
                                            }}
                                        >
                                            {(currentPage - 1) * pageSize +
                                                index +
                                                1}
                                        </span>
                                        <span
                                            style={{
                                                color: '#1D2129',
                                                fontWeight: 500,
                                            }}
                                        >
                                            {feedback.id}
                                        </span>
                                    </div>
                                    <span style={{ color: '#4E5969' }}>
                                        提交人：
                                        {feedback.user?.name || '匿名用户'}
                                    </span>

                                    <span style={{ color: '#4E5969' }}>
                                        手机号：
                                        {feedback.user?.phone || '-'}
                                    </span>
                                </div>

                                {/* 内容区域 */}
                                <div style={{ padding: '16px' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <div
                                            style={{
                                                fontSize: '14px',
                                                color: '#86909C',
                                                marginBottom: '4px',
                                            }}
                                        >
                                            反馈内容
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '14px',
                                                color: '#1D2129',
                                                lineHeight: '1.5',
                                            }}
                                        >
                                            {feedback.content}
                                        </div>
                                    </div>

                                    {/* 附件区域 */}
                                    {feedback.attachments &&
                                        feedback.attachments.length > 0 && (
                                            <div
                                                style={{
                                                    width: '50%',
                                                    paddingRight: '18px',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'space-between',
                                                        marginBottom: '8px',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: '14px',
                                                            color: '#86909C',
                                                        }}
                                                    >
                                                        附件
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            gap: '4px',
                                                            color: '#86909C',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                        }}
                                                        onClick={() => {
                                                            feedback.attachments.forEach(
                                                                (
                                                                    url: string,
                                                                    index: number
                                                                ) => {
                                                                    const link =
                                                                        document.createElement(
                                                                            'a'
                                                                        );
                                                                    link.href =
                                                                        url;
                                                                    link.download = `attachment-${index + 1}`;
                                                                    link.target =
                                                                        '_blank';
                                                                    document.body.appendChild(
                                                                        link
                                                                    );
                                                                    link.click();
                                                                    document.body.removeChild(
                                                                        link
                                                                    );
                                                                }
                                                            );

                                                            if (
                                                                typeof window !==
                                                                    'undefined' &&
                                                                (window as any)
                                                                    .showSuccessToast
                                                            ) {
                                                                (
                                                                    window as any
                                                                ).showSuccessToast(
                                                                    '下载开始',
                                                                    `正在下载 ${feedback.attachments.length} 个附件`
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <svg
                                                            width="14"
                                                            height="14"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                        >
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                            <polyline points="7 10 12 15 17 10" />
                                                            <line
                                                                x1="12"
                                                                y1="15"
                                                                x2="12"
                                                                y2="3"
                                                            />
                                                        </svg>
                                                        全部下载
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        gap: '8px',
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
                                                    {feedback.attachments
                                                        .slice(0, 4)
                                                        .map(
                                                            (
                                                                attachment: string,
                                                                index: number
                                                            ) => {
                                                                const isVideo =
                                                                    attachment.includes(
                                                                        '.mp4'
                                                                    ) ||
                                                                    attachment.includes(
                                                                        '.mov'
                                                                    ) ||
                                                                    attachment.includes(
                                                                        'video'
                                                                    );
                                                                return (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        style={{
                                                                            width: '120px',
                                                                            height: '120px',
                                                                            borderRadius:
                                                                                '4px',
                                                                            overflow:
                                                                                'hidden',
                                                                            position:
                                                                                'relative',
                                                                            cursor: 'pointer',
                                                                            border: '1px solid #E5E6EB',
                                                                        }}
                                                                        onClick={() =>
                                                                            handlePreviewMedia(
                                                                                attachment
                                                                            )
                                                                        }
                                                                    >
                                                                        {isVideo ? (
                                                                            <div
                                                                                style={{
                                                                                    position:
                                                                                        'relative',
                                                                                    width: '100%',
                                                                                    height: '100%',
                                                                                }}
                                                                            >
                                                                                <div
                                                                                    style={{
                                                                                        width: '100%',
                                                                                        height: '100%',
                                                                                        backgroundColor:
                                                                                            '#F2F3F5',
                                                                                        display:
                                                                                            'flex',
                                                                                        alignItems:
                                                                                            'center',
                                                                                        justifyContent:
                                                                                            'center',
                                                                                    }}
                                                                                >
                                                                                    <div
                                                                                        style={{
                                                                                            width: '40px',
                                                                                            height: '40px',
                                                                                            borderRadius:
                                                                                                '50%',
                                                                                            backgroundColor:
                                                                                                'rgba(255, 255, 255, 0.9)',
                                                                                            display:
                                                                                                'flex',
                                                                                            alignItems:
                                                                                                'center',
                                                                                            justifyContent:
                                                                                                'center',
                                                                                        }}
                                                                                    >
                                                                                        <div
                                                                                            style={{
                                                                                                width: '0',
                                                                                                height: '0',
                                                                                                borderLeft:
                                                                                                    '12px solid #1D2129',
                                                                                                borderTop:
                                                                                                    '8px solid transparent',
                                                                                                borderBottom:
                                                                                                    '8px solid transparent',
                                                                                                marginLeft:
                                                                                                    '4px',
                                                                                            }}
                                                                                        ></div>
                                                                                    </div>
                                                                                </div>
                                                                                <div
                                                                                    style={{
                                                                                        position:
                                                                                            'absolute',
                                                                                        bottom: '4px',
                                                                                        right: '4px',
                                                                                        backgroundColor:
                                                                                            'rgba(0,0,0,0.6)',
                                                                                        borderRadius:
                                                                                            '2px',
                                                                                        padding:
                                                                                            '2px 4px',
                                                                                        fontSize:
                                                                                            '10px',
                                                                                        color: 'white',
                                                                                    }}
                                                                                >
                                                                                    视频
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <img
                                                                                src={
                                                                                    attachment
                                                                                }
                                                                                alt={`附件 ${index + 1}`}
                                                                                style={{
                                                                                    width: '100%',
                                                                                    height: '100%',
                                                                                    objectFit:
                                                                                        'cover',
                                                                                }}
                                                                                onError={(
                                                                                    e
                                                                                ) => {
                                                                                    const target =
                                                                                        e.target as HTMLImageElement;
                                                                                    target.src =
                                                                                        'https://placehold.co/120x120/e0e0e0/999999?text=图片';
                                                                                }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                );
                                                            }
                                                        )}
                                                </div>
                                                {feedback.attachments.length >
                                                    4 && (
                                                    <div
                                                        style={{
                                                            fontSize: '12px',
                                                            color: '#86909C',
                                                            marginTop: '8px',
                                                        }}
                                                    >
                                                        +
                                                        {feedback.attachments
                                                            .length - 4}{' '}
                                                        更多附件
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 分页控件 */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '24px',
                        paddingTop: '16px',
                        borderTop: '1px solid #E5E6EB',
                    }}
                >
                    <div style={{ fontSize: '14px', color: '#4E5969' }}>
                        共{totalItems}条
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <button
                            style={{
                                padding: '4px 12px',
                                border: '1px solid #E5E6EB',
                                borderRadius: '4px',
                                backgroundColor: 'white',
                                color: '#4E5969',
                                cursor:
                                    currentPage <= 1
                                        ? 'not-allowed'
                                        : 'pointer',
                                opacity: currentPage <= 1 ? 0.5 : 1,
                            }}
                            onClick={() =>
                                setCurrentPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={currentPage <= 1}
                        >
                            上一页
                        </button>

                        {getPageNumbers().map((page, index) =>
                            page === '...' ? (
                                <span
                                    key={`ellipsis-${index}`}
                                    style={{
                                        padding: '0 8px',
                                        color: '#86909C',
                                    }}
                                >
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    style={{
                                        padding: '4px 12px',
                                        border: '1px solid #E5E6EB',
                                        borderRadius: '4px',
                                        backgroundColor:
                                            page === currentPage
                                                ? '#E31424'
                                                : 'white',
                                        color:
                                            page === currentPage
                                                ? 'white'
                                                : '#4E5969',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() =>
                                        setCurrentPage(page as number)
                                    }
                                >
                                    {page}
                                </button>
                            )
                        )}

                        <button
                            style={{
                                padding: '4px 12px',
                                border: '1px solid #E5E6EB',
                                borderRadius: '4px',
                                backgroundColor: 'white',
                                color: '#4E5969',
                                cursor:
                                    currentPage >= totalPages
                                        ? 'not-allowed'
                                        : 'pointer',
                                opacity: currentPage >= totalPages ? 0.5 : 1,
                            }}
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(totalPages, prev + 1)
                                )
                            }
                            disabled={currentPage >= totalPages}
                        >
                            下一页
                        </button>

                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            style={{
                                padding: '4px 8px',
                                border: '1px solid #E5E6EB',
                                borderRadius: '4px',
                                fontSize: '14px',
                            }}
                        >
                            <option value={10}>10条/页</option>
                            <option value={20}>20条/页</option>
                            <option value={50}>50条/页</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {previewMedia && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                    }}
                    onClick={() => setPreviewMedia(null)}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            cursor: 'pointer',
                            color: 'white',
                            fontSize: '32px',
                        }}
                        onClick={() => setPreviewMedia(null)}
                    >
                        ×
                    </div>
                    <div
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {previewMedia.type.startsWith('video/') ? (
                            <video
                                src={previewMedia.url}
                                controls
                                autoPlay
                                style={{
                                    maxWidth: '90vw',
                                    maxHeight: '90vh',
                                    width: 'auto',
                                    height: 'auto',
                                }}
                            />
                        ) : (
                            <img
                                src={previewMedia.url}
                                alt="Preview"
                                style={{
                                    maxWidth: '90vw',
                                    maxHeight: '90vh',
                                    width: 'auto',
                                    height: 'auto',
                                    objectFit: 'contain',
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
