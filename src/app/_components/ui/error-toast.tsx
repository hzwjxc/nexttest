'use client';

import { Box, Text } from '@chakra-ui/react';
import { FiAlertCircle } from 'react-icons/fi';

interface ErrorToastProps {
    message: string;
}

export const ErrorToast = ({ message }: ErrorToastProps) => {
    return (
        <Box
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            bg="rgba(0, 0, 0, 0.7)"
            borderRadius="16px"
            p={4}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={2}
            w="120px"
            h="120px"
            zIndex={9999}
        >
            <FiAlertCircle size={27} color="white" />
            <Text
                fontSize="14px"
                color="white"
                textAlign="center"
                fontWeight="400"
                lineHeight="1.4"
            >
                {message}
            </Text>
        </Box>
    );
};
