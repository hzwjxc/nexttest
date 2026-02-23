'use client';

import React from 'react';
import {
  Box,
  Flex,
  Text,
} from '@chakra-ui/react';
import { useRouter, useParams } from 'next/navigation';
import { LuArrowLeft } from 'react-icons/lu';
import { api } from '@/trpc/react';
import InvitationRewardForm from '../../form';

const COLORS = {
  primary: '#E31424',
  textPrimary: '#1D2129',
  textSecondary: '#4E5969',
  textTertiary: '#86909C',
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F2F3F5',
  borderColor: '#E5E6EB',
};

export default function EditInvitationRewardPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // 获取邀请有奖活动详情
  const { data: initialData, isLoading, isError } = api.invitationReward.getById.useQuery(
    { id },
    {
      enabled: !!id,
    }
  );

  const handleSuccess = () => {
    router.push('/crowdsource/admin/invitation-rewards');
  };

  const handleCancel = () => {
    router.push('/crowdsource/admin/invitation-rewards');
  };

  if (isLoading) {
    return (
      <Box>
        <Box
          bg={COLORS.bgPrimary}
          borderRadius="8px"
          p={6}
          boxShadow="0 1px 2px rgba(0,0,0,0.05)"
        >
          <Text color={COLORS.textTertiary}>加载中...</Text>
        </Box>
      </Box>
    );
  }

  if (isError || !initialData) {
    return (
      <Box>
        <Box
          bg={COLORS.bgPrimary}
          borderRadius="8px"
          p={6}
          boxShadow="0 1px 2px rgba(0,0,0,0.05)"
        >
          <Text color={COLORS.textTertiary}>数据加载失败</Text>
          <button
            onClick={() => router.back()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #E5E6EB',
              borderRadius: '4px',
              color: '#4E5969',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <LuArrowLeft />
            返回
          </button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        bg={COLORS.bgPrimary}
        borderRadius="8px"
        p={6}
        boxShadow="0 1px 2px rgba(0,0,0,0.05)"
      >
        {/* 面包屑和返回按钮 */}
        <Flex align="center" justify="space-between" mb={6}>
          <Flex align="center" gap={2}>
            <button
              onClick={() => router.back()}
              style={{
                padding: '4px 8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                color: '#4E5969',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
              }}
            >
              <LuArrowLeft />
              返回
            </button>
            <Text fontSize="14px" color={COLORS.textSecondary}>
              /
            </Text>
            <Text fontSize="14px" color={COLORS.textPrimary} fontWeight="500">
              编辑邀请有奖活动
            </Text>
          </Flex>
        </Flex>

        {/* 页面标题 */}
        <Text fontSize="20px" fontWeight="600" color={COLORS.textPrimary} mb={6}>
          编辑邀请有奖活动
        </Text>

        {/* 表单 */}
        <Box maxWidth="600px">
          <InvitationRewardForm
            initialValues={initialData}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </Box>
      </Box>
    </Box>
  );
}