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
    HStack,
} from '@chakra-ui/react';
import { LuX, LuInfo } from 'react-icons/lu';

interface RegistrationNoticeDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RegistrationNoticeDialog = ({ isOpen, onClose }: RegistrationNoticeDialogProps) => {
    return (
        <DialogRoot open={isOpen} onOpenChange={(details) => !details.open && onClose()} closeOnInteractOutside={false}>
            <DialogBackdrop />
            <DialogContent
                maxW="520px"
                borderRadius="8px"
                bg="white"
                boxShadow="0px 0px 18px rgba(0, 65, 215, 0.06)"
                position="fixed"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
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
                        注意
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
                    px={7}
                    py={10}
                    display="flex"
                    gap={3}
                    alignItems="flex-start"
                >
                    <Box flexShrink={0}>
                        <LuInfo size={24} color="#ff9266" />
                    </Box>
                    <Text
                        fontSize="14px"
                        color="#1d2129"
                        lineHeight="24px"
                    >
                        首次登录需要小程序注册绑定信息成功后，PC端才可以登录
                    </Text>
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
                        bg="linear-gradient(90deg, #ff9266 0%, #fe626b 100%)"
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
