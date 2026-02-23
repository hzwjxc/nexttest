'use client';

import React from 'react';
import {
  Box,
  Flex,
  Text,
  Image,
  Grid,
  GridItem,
  VStack,
  HStack,
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogCloseTrigger,
} from '@chakra-ui/react';
import { LuX, LuDownload, LuBug, LuPlay } from 'react-icons/lu';

const COLORS = {
  primary: '#E31424',
  textPrimary: '#1D2129',
  textSecondary: '#4E5969',
  textTertiary: '#86909C',
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F2F3F5',
  borderColor: '#E5E6EB',
  orange: '#F34724',
  green: '#00B42A',
  blue: '#165DFF',
  yellow: '#FF7D00',
  lightBlue: 'rgba(22, 93, 255, 0.05)',
};

export interface DuplicateDefectItem {
  id: string;
  number: string;
  points: number;
  type: 'defect' | 'suggestion';
  title: string;
  description: string;
  status: string;
  severity?: string;
  suggestionLevel?: string;
  attachments: string[];
  caseName: string;
  relatedSteps: string;
  reviewComment: string;
  supplementaryExplanation: string;
  deviceModel: string;
  system: string;
  submitter: string;
  submitTime: string;
}

interface DuplicateDefectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: DuplicateDefectItem[];
  defectSeverityDict?: any;
  suggestionLevelDict?: any;
  onPreview: (attachments: string[], index: number) => void;
  onDownloadAll: (attachments: string[]) => void;
}

export function DuplicateDefectsModal({
  isOpen,
  onClose,
  title,
  items,
  defectSeverityDict,
  suggestionLevelDict,
  onPreview,
  onDownloadAll,
}: DuplicateDefectsModalProps) {
  const getBadge = (item: DuplicateDefectItem) => {
    if (item.status === 'TO_CONFIRM' || item.status === 'TO_CONFIRM_DEV') {
      return { text: '待确认', bg: 'rgba(255, 125, 0, 0.1)', color: '#FF7D00' };
    }
    if (item.status === 'REVIEWING') {
      return { text: '判定中', bg: 'rgba(22, 93, 255, 0.1)', color: '#2067F6' };
    }
    if (item.type === 'defect') {
      const severityItem = defectSeverityDict?.items?.find((i: any) => i.code === item.severity);
      if (severityItem) {
        const colorMap: Record<string, { bg: string; color: string }> = {
          'CRITICAL': { bg: 'rgba(227, 20, 36, 0.1)', color: '#E31424' },
          'MAJOR': { bg: 'rgba(227, 20, 36, 0.1)', color: '#D54531' },
          'MINOR': { bg: 'rgba(255, 125, 0, 0.1)', color: '#F77234' },
          'TRIVIAL': { bg: 'rgba(255, 237, 232, 1)', color: '#F77234' },
        };
        const colorConfig = colorMap[item.severity || ''] || { bg: 'rgba(255, 125, 0, 0.1)', color: '#F77234' };
        return { text: severityItem.label, ...colorConfig };
      }
    } else if (item.type === 'suggestion') {
      const suggestionItem = suggestionLevelDict?.items?.find((i: any) => i.code === item.suggestionLevel);
      if (suggestionItem) {
        return { text: suggestionItem.label, bg: 'rgba(0, 180, 42, 0.1)', color: '#3AB385' };
      }
    }
    return { text: '', bg: '', color: '' };
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(details) => !details.open && onClose()} closeOnInteractOutside={true}>
      <DialogBackdrop />
      <DialogContent
        maxW="1080px"
        borderRadius="8px"
        bg="white"
        boxShadow="0px 0px 18px rgba(0, 65, 215, 0.06)"
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        maxH="90vh"
        m={4}
        zIndex={2000}
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <DialogHeader
          borderBottom="1px solid"
          borderColor={COLORS.borderColor}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          px={4}
          py={3}
        >
          <Text fontSize="16px" fontWeight="500" color={COLORS.textPrimary}>
            {title}
          </Text>
          <DialogCloseTrigger
            position="static"
            onClick={onClose}
            _hover={{ bg: 'transparent' }}
            asChild
          >
            <LuX size={16} color={COLORS.textTertiary} style={{ cursor: 'pointer' }} />
          </DialogCloseTrigger>
        </DialogHeader>

        {/* Body */}
        <DialogBody overflowY="auto" flex="1" px={12} py={6}>
          {/* Duplicate Count Label */}
          <Flex justify="flex-end" pr={6} pb={6}>
            <Text fontSize="14px" color={COLORS.textSecondary}>
              缺陷数量：{items.length}
            </Text>
          </Flex>
          <VStack gap={6} align="stretch">
            {items.map((item, index) => {
              const badge = getBadge(item);

              return (
                <Box key={item.id}>
                  {/* Item Header */}
                  <Flex
                    align="center"
                    justify="space-between"
                    bg={COLORS.bgSecondary}
                    px={6}
                    py={4}
                    borderRadius="8px 8px 0 0"
                    border="1px solid"
                    borderColor={COLORS.borderColor}
                    borderBottom="none"
                    gap={6}
                  >
                    <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} w="30px">
                      {index + 1}
                    </Text>
                    <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary} w="120px">
                      {item.number}
                    </Text>

                    <HStack gap={1} w="auto" minW="180px">
                      <Text fontSize="14px" color={COLORS.textSecondary}>缺陷/建议积分：</Text>
                      <Text fontSize="14px" fontWeight="600" color={COLORS.textPrimary}>
                        {item.points}
                      </Text>
                      <Image
                        src="/images/task-hall/jinbi.png"
                        alt="积分"
                        w="16px"
                        h="16px"
                      />
                    </HStack>

                    <HStack gap={1} w="auto" minW="60px">
                      <LuBug size={16} color={item.type === 'defect' ? '#165DFF' : '#00B42A'} />
                      <Text fontSize="14px" fontWeight="500" color={COLORS.textPrimary}>
                        {item.type === 'defect' ? '缺陷' : '建议'}
                      </Text>
                    </HStack>

                    {badge.text && (
                      <Box
                        px={3}
                        py={1}
                        borderRadius="12px"
                        bg={badge.bg}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        minW="70px"
                        ml="auto"
                      >
                        <Text fontSize="14px" color={badge.color} fontWeight="500">
                          {badge.text}
                        </Text>
                      </Box>
                    )}
                  </Flex>

                  {/* Item Content */}
                  <Box
                    bg={COLORS.bgPrimary}
                    border="1px solid"
                    borderColor={COLORS.borderColor}
                    borderTop="none"
                    borderRadius="0 0 8px 8px"
                  >
                    <Grid templateColumns="1fr 1px 1fr" gap={0} p={6} minH="200px">
                      {/* Left Column */}
                      <GridItem pr={6}>
                        <VStack align="stretch" gap={4}>
                          <HStack align="flex-start" gap={2}>
                            <Text fontSize="14px" color={COLORS.textSecondary} flexShrink={0}>标题：</Text>
                            <Text fontSize="14px" color={COLORS.textSecondary}>{item.title}</Text>
                          </HStack>
                          <HStack align="flex-start" gap={2}>
                            <Text fontSize="14px" color={COLORS.textSecondary} flexShrink={0}>描述：</Text>
                            <Text fontSize="14px" color={COLORS.textSecondary} lineHeight="1.6">
                              {item.description}
                            </Text>
                          </HStack>
                          <VStack align="stretch" gap={2}>
                            <Flex justify="space-between" align="center">
                              <Text fontSize="14px" color={COLORS.textSecondary}>附件：</Text>
                              {item.attachments.length > 0 && (
                                <HStack
                                  gap={1}
                                  cursor="pointer"
                                  color={COLORS.textTertiary}
                                  _hover={{ color: COLORS.textPrimary }}
                                  onClick={() => onDownloadAll(item.attachments)}
                                >
                                  <LuDownload size={14} />
                                  <Text fontSize="12px">全部下载</Text>
                                </HStack>
                              )}
                            </Flex>
                            {item.attachments.length > 0 ? (
                              <Flex gap="12px" wrap="wrap">
                                {item.attachments.map((url, i) => {
                                  const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.avi');
                                  return (
                                    <Box
                                      key={i}
                                      w="80px"
                                      h="80px"
                                      borderRadius="4px"
                                      overflow="hidden"
                                      border="1px solid"
                                      borderColor={COLORS.borderColor}
                                      cursor="pointer"
                                      position="relative"
                                      onClick={() => onPreview(item.attachments, i)}
                                      _hover={{ opacity: 0.8 }}
                                    >
                                      {isVideo ? (
                                        <>
                                          <video
                                            src={url}
                                            style={{
                                              width: '100%',
                                              height: '100%',
                                              objectFit: 'cover',
                                            }}
                                          />
                                          <Flex
                                            position="absolute"
                                            top="50%"
                                            left="50%"
                                            transform="translate(-50%, -50%)"
                                            bg="rgba(0, 0, 0, 0.5)"
                                            borderRadius="50%"
                                            w="24px"
                                            h="24px"
                                            align="center"
                                            justify="center"
                                          >
                                            <LuPlay size={12} color="white" />
                                          </Flex>
                                        </>
                                      ) : (
                                        <Image
                                          src={url}
                                          alt={`附件 ${i + 1}`}
                                          w="100%"
                                          h="100%"
                                          objectFit="cover"
                                        />
                                      )}
                                    </Box>
                                  );
                                })}
                              </Flex>
                            ) : (
                              <Text fontSize="14px" color={COLORS.textTertiary}>-</Text>
                            )}
                          </VStack>
                        </VStack>
                      </GridItem>

                      {/* Divider */}
                      <Box bg={COLORS.borderColor} />

                      {/* Right Column */}
                      <GridItem pl={6}>
                        <VStack align="stretch" gap={4}>
                          <HStack align="flex-start" gap={2}>
                            <Text fontSize="14px" color={COLORS.textSecondary} flexShrink={0}>所属用例：</Text>
                            <Text fontSize="14px" color={COLORS.textPrimary}>{item.caseName || '-'}</Text>
                          </HStack>
                          <HStack align="flex-start" gap={2}>
                            <Text fontSize="14px" color={COLORS.textSecondary} flexShrink={0}>关联步骤：</Text>
                            <Text fontSize="14px" color={COLORS.textPrimary}>{item.relatedSteps || '-'}</Text>
                          </HStack>
                          <HStack align="flex-start" gap={2}>
                            <Text fontSize="14px" color={COLORS.textSecondary} flexShrink={0}>审核意见：</Text>
                            <Text fontSize="14px" color={COLORS.textPrimary}>{item.reviewComment || '-'}</Text>
                          </HStack>
                          <HStack align="flex-start" gap={2}>
                            <Text fontSize="14px" color={COLORS.textSecondary} flexShrink={0}>补充说明：</Text>
                            <Text fontSize="14px" color={COLORS.textPrimary}>{item.supplementaryExplanation || '-'}</Text>
                          </HStack>
                        </VStack>
                      </GridItem>
                    </Grid>

                    {/* Card Footer Row */}
                    <Flex
                      px={6}
                      py={3}
                      borderTop="1px dashed"
                      borderColor={COLORS.borderColor}
                      gap={10}
                    >
                      <HStack gap={1}>
                        <Text fontSize="12px" color={COLORS.textTertiary}>机型：</Text>
                        <Text fontSize="12px" color={COLORS.textSecondary}>{item.deviceModel || '-'}</Text>
                      </HStack>
                      <HStack gap={1}>
                        <Text fontSize="12px" color={COLORS.textTertiary}>系统：</Text>
                        <Text fontSize="12px" color={COLORS.textSecondary}>{item.system || '-'}</Text>
                      </HStack>
                      <HStack gap={1}>
                        <Text fontSize="12px" color={COLORS.textTertiary}>提交人：</Text>
                        <Text fontSize="12px" color={COLORS.textSecondary}>{item.submitter || '-'}</Text>
                      </HStack>
                      <HStack gap={1}>
                        <Text fontSize="12px" color={COLORS.textTertiary}>提交时间：</Text>
                        <Text fontSize="12px" color={COLORS.textSecondary}>{item.submitTime}</Text>
                      </HStack>
                    </Flex>
                  </Box>

                  {index < items.length - 1 && <Box h="12px" />}
                </Box>
              );
            })}
          </VStack>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
}
