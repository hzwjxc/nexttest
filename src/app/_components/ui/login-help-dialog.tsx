'use client';

import {
    DialogRoot,
    DialogBackdrop,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogCloseTrigger,
    Box,
    Text,
    Button,
    VStack,
} from '@chakra-ui/react';
import { LuX } from 'react-icons/lu';

interface LoginHelpDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginHelpDialog = ({ isOpen, onClose }: LoginHelpDialogProps) => {
    return (
        <DialogRoot open={isOpen} onOpenChange={(details) => !details.open && onClose()} closeOnInteractOutside={false}>
            <DialogBackdrop />
            <DialogContent
                maxW="870px"
                borderRadius="8px"
                bg="white"
                boxShadow="0px 0px 18px rgba(0, 65, 215, 0.06)"
                position="fixed"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                maxH="80vh"
            >
                {/* Header */}
                <DialogHeader
                    borderBottom="1px solid"
                    borderColor="#e5e6eb"
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    px={4}
                    py={3}
                >
                    <Text fontSize="16px" fontWeight="500" color="#1d2129">
                        登录问题指引
                    </Text>
                    <DialogCloseTrigger
                        position="static"
                        onClick={onClose}
                        _hover={{ bg: 'transparent' }}
                        asChild
                    >
                        <button>
                            <LuX size={16} color="#4e5969" />
                        </button>
                    </DialogCloseTrigger>
                </DialogHeader>

                {/* Body */}
                <DialogBody
                    px={15}
                    py={5}
                    maxH="690px"
                    overflowY="auto"
                    fontSize="14px"
                    color="#4e5969"
                    lineHeight="24px"
                >
                    <VStack gap={4} align="start">
                        <Box>
                            <Text fontWeight="500" color="#1d2129" mb={2}>
                                登录账号是什么？
                            </Text>
                            <Text>
                                账号分为系统账号和员工编号；员工编号可以在企业通讯工具点击自己头像查看，也可以登录统一身份管理平台查看。
                            </Text>
                        </Box>

                        <Box>
                            <Text fontWeight="500" color="#1d2129" mb={2}>
                                忘记密码如何处理？
                            </Text>
                            <Text>
                                打开统一身份管理平台，点击"找回密码"，找回系统账号密码或员工编号密码，按照页面指引找回密码。
                            </Text>
                        </Box>

                        <Box>
                            <Text fontWeight="500" color="#1d2129" mb={2}>
                                提示账号被锁定了怎么办？
                            </Text>
                            <Text>
                                如因违规操作导致账号被锁定，请提交解锁申请工单。按照流程，需要在运维管理平台提交服务请求，说明账号被锁定的情况，提交申请至科技部门审批，待审批后由管理员执行账号解禁操作。
                            </Text>
                            <Text mt={2}>
                                如统一身份账号登录提示"用户已被禁用、锁定或离职"，请打开统一身份管理平台，点击"解锁"选项，按照页面指引解锁账号。
                            </Text>
                        </Box>

                        <Box>
                            <Text fontWeight="500" color="#1d2129" mb={2}>
                                iPhone手机未授权证书导致的闪退问题
                            </Text>
                            <Text>
                                打开设置-&gt;通用-&gt;描述文件（或设备管理），找到企业开发者证书，点击并验证应用即可。
                            </Text>
                        </Box>

                        <Box>
                            <Text fontWeight="500" color="#1d2129" mb={2}>
                                APP打开后闪退怎么办？
                            </Text>
                            <Text>
                                请确认是否授权APP使用储存信息等权限，可在本机系统设置-&gt;应用设置中解决。
                            </Text>
                            <Text mt={2}>
                                另外，可以通过重新下载安装解决，请在浏览器下载安装APP时选择信任来源。
                            </Text>
                        </Box>

                        <Box>
                            <Text fontWeight="500" color="#1d2129" mb={2}>
                                收不到APP消息通知怎么办？
                            </Text>
                            <Text>
                                请先确定当前所使用的设备机型，目前支持主流品牌设备（华为、荣耀、小米、苹果等）的APP离线状态下消息推送功能，其它厂商的离线消息推送功能正在开发中。
                            </Text>
                        </Box>
                    </VStack>
                </DialogBody>

                {/* Footer */}
                <DialogFooter
                    borderTop="1px solid"
                    borderColor="#e5e6eb"
                    px={4}
                    py={4}
                    display="flex"
                    justifyContent="flex-end"
                >
                    <Button
                        bg="linear-gradient(90deg, #66c7f8 0%, #11a0e6 100%)"
                        color="white"
                        fontSize="14px"
                        fontWeight="500"
                        borderRadius="999px"
                        h="36px"
                        px={4}
                        onClick={onClose}
                        _hover={{
                            opacity: 0.9,
                        }}
                    >
                        我知道了
                    </Button>
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    );
};
