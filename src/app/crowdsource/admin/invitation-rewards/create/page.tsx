'use client';

import React from 'react';
import {
  Box,
  Flex,
  Text,
  Button as ChakraButton,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft } from 'react-icons/lu';
import InvitationRewardForm from '../form';

const COLORS = {
  primary: '#E31424',
  textPrimary: '#1D2129',
  textSecondary: '#4E5969',
  textTertiary: '#86909C',
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F2F3F5',
  borderColor: '#E5E6EB',
};

export default function CreateInvitationRewardPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/crowdsource/admin/invitation-rewards');
  };

  const handleCancel = () => {
    router.push('/crowdsource/admin/invitation-rewards');
  };

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
            <ChakraButton
              variant="ghost"
              size="sm"
              onClick={() => router.back()}

            >
              <LuArrowLeft />
              返回
            </ChakraButton>
            <Text fontSize="14px" color={COLORS.textSecondary}>
              /
            </Text>
            <Text fontSize="14px" color={COLORS.textPrimary} fontWeight="500">
              新增邀请有奖活动
            </Text>
          </Flex>
        </Flex>

        {/* 页面标题 */}
        <Text fontSize="20px" fontWeight="600" color={COLORS.textPrimary} mb={6}>
          新增邀请有奖活动
        </Text>

        {/* 表单 */}
        <Box maxWidth="600px">
          <InvitationRewardForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </Box>
      </Box>
    </Box>
  );
}