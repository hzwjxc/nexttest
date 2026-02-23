'use client';

import React from 'react';
import {
  Box,
  Flex,
  Text,
  Heading,
  Icon,
  Circle,
} from '@chakra-ui/react';
import { Check } from 'lucide-react';

interface TaskStep {
  id: number;
  title: string;
  timestamp: string;
  status: 'completed' | 'current' | 'pending';
}

interface TaskTrackerProps {
  steps: TaskStep[];
  title?: string;
  taskStatus?: string;
}

export default function TaskTracker({ steps, title = '任务跟踪', taskStatus }: TaskTrackerProps) {
  // 根据任务状态和步骤数量决定是否显示
  // 任务已完成（status3）：显示3个步骤
  // 任务已结束（status5）：显示4个步骤
  // 其他状态：不显示
  
  if (!steps || steps.length === 0) {
    return null;
  }

  // 只在任务已完成或已结束时显示
  if (!['status3', 'status5'].includes(taskStatus || '')) {
    return null;
  }

  return (
    <Box bg="white" borderRadius="lg" boxShadow="sm" p={6}>
      {/* Title */}
      <Heading as="h2" size="sm" color="gray.900" mb={6}>
        {title}
      </Heading>

      {/* Steps Container */}
      <Flex
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'flex-start', md: 'center' }}
        justify="space-between"
        position="relative"
        gap={{ base: 8, md: 0 }}
      >
        {steps.map((step, index) => (
          <Flex
            key={step.id}
            direction="column"
            align="flex-start"
            position="relative"
            flex={1}
            width="100%"
          >
            {/* Step Icon and Title */}
            <Flex align="center" width="100%" mb={2}>
              {/* Checkmark Circle */}
              <Circle
                size="32px"
                bg="#E31424"
                flexShrink={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon
                  as={Check}
                  boxSize="18px"
                  color="white"
                  strokeWidth={3}
                />
              </Circle>

              <Text
                fontSize="sm"
                fontWeight="600"
                color="#1D2129"
                ml={3}
              >
                {step.title}
              </Text>

              {/* Horizontal Line Connector (not for last item) */}
              {index < steps.length - 1 && (
                <Box
                  flex={1}
                  height="2px"
                  bg="#E31424"
                  mx={3}
                  display={{ base: 'none', md: 'block' }}
                />
              )}
            </Flex>

            {/* Step Timestamp */}
            <Box ml={11}>
              <Text
                fontSize="xs"
                color="#86909C"
                fontWeight="400"
              >
                {step.timestamp}
              </Text>
            </Box>

            {/* Vertical connector for mobile */}
            {index < steps.length - 1 && (
              <Box
                display={{ base: 'block', md: 'none' }}
                position="absolute"
                left="15px"
                top="32px"
                height="calc(100% + 16px)"
                borderLeft="2px solid"
                borderColor="#E31424"
              />
            )}
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}
