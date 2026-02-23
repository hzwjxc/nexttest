'use client';

import {
    Box,
    Container,
    Image,
    Input,
    Text,
    Flex,
    Link,
    VStack,
    HStack,
    Button as ChakraButton,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Field, InputGroup, PasswordInput, Checkbox } from '@/app/_components/ui';
import { ErrorToast } from '@/app/_components/ui/error-toast';
import { LoginHelpDialog } from '@/app/_components/ui/login-help-dialog';
import { RegistrationNoticeDialog } from '@/app/_components/ui/registration-notice-dialog';
import { useState, useEffect } from 'react';

type LoginForm = {
    account: string;
    password: string;
    rememberAccount: boolean;
    rememberPassword: boolean;
};

const imgImage30 = '/images/login/logo.png';

// 从MCP配置获取资源
const getMcpAssetUrl = (assetId: string) => {
    return `https://www.figma.com/api/mcp/asset/${assetId}`;
};

export default function Login() {
    const router = useRouter();
    const { update } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
    const [isRegistrationNoticeOpen, setIsRegistrationNoticeOpen] = useState(false);

    // 从 localStorage 读取保存的值
    const getInitialValues = () => {
        if (typeof window === 'undefined') {
            return {
                account: '',
                password: '',
                rememberAccount: false,
                rememberPassword: false,
            };
        }
        const savedAccount = localStorage.getItem('rememberedAccount');
        const savedPassword = localStorage.getItem('rememberedPassword');
        const rememberAccount = localStorage.getItem('rememberAccount') === 'true';
        const rememberPassword = localStorage.getItem('rememberPassword') === 'true';

        return {
            account: savedAccount || '',
            password: (savedPassword && rememberPassword) ? savedPassword : '',
            rememberAccount: !!savedAccount || rememberAccount,
            rememberPassword: rememberPassword,
        };
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<LoginForm>({
        mode: 'onBlur',
        defaultValues: getInitialValues(),
    });

    const rememberAccount = watch('rememberAccount');
    const rememberPassword = watch('rememberPassword');

    const onSubmit = async (data: LoginForm) => {
        try {
            setIsLoading(true);
            setErrorMessage(null);
            const res = await signIn('credentials', {
                phone: data.account,
                password: data.password,
                redirect: false,
            });

            if (res?.error) {
                // 检查是否是未注册的错误
                if (res.error.includes('未激活') || res.error.includes('未注册')) {
                    setIsRegistrationNoticeOpen(true);
                } else {
                    setErrorMessage('错误的用户名或密码');
                    setTimeout(() => setErrorMessage(null), 3000);
                }
            } else if (res?.ok) {
                // 处理记住账号和密码
                if (data.rememberAccount) {
                    localStorage.setItem('rememberedAccount', data.account);
                    localStorage.setItem('rememberAccount', 'true');
                } else {
                    localStorage.removeItem('rememberedAccount');
                    localStorage.removeItem('rememberAccount');
                }

                if (data.rememberPassword) {
                    localStorage.setItem('rememberedPassword', data.password);
                    localStorage.setItem('rememberPassword', 'true');
                } else {
                    localStorage.removeItem('rememberedPassword');
                    localStorage.removeItem('rememberPassword');
                }

                await update();
                setTimeout(() => {
                    router.replace('/crowdsource/task-hall');
                }, 500);
            }
        } catch (error) {
            console.error('Login error:', error);
            setErrorMessage('登录失败，请重试');
            setTimeout(() => setErrorMessage(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box
            minH="100vh"
            bg="white"
            position="relative"
            overflow="hidden"
        >
            {errorMessage && <ErrorToast message={errorMessage} />}
            {/* Background Image - Top 2/3 */}
            <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="66.67vh"
                backgroundImage="url('/images/login/bg.png')"
                backgroundSize="cover"
                backgroundPosition="center"
                zIndex={0}
            />
            {/* Background Color - Bottom 1/3 */}
            <Box
                position="absolute"
                top="66.67vh"
                left={0}
                right={0}
                bottom={0}
                bgGradient="to-r"
                gradientFrom="white"
                gradientTo="#f0f7ff"
                zIndex={0}
            />
            {/* Header */}
            <Flex
                as="header"
                h="72px"
                bg="white"
                borderBottom="1px solid"
                borderColor="gray.200"
                boxShadow="0px 10px 20px rgba(38, 18, 120, 0.04)"
                align="center"
                px={8}
                position="relative"
                zIndex={10}
            >
                <Image
                    src={imgImage30}
                    alt="广发众测"
                    h="40px"
                    w="auto"
                    ml={4}
                />
                <Text ml={4} fontSize="16px" fontWeight="500" color="gray.800">
                    登录
                </Text>
            </Flex>

            {/* Main Content */}
            <Container
                maxW="100%"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                position="relative"
                zIndex={5}
                pt={12}
                pb={12}
            >
                {/* Logo */}
                <VStack
                    gap={8}
                    alignItems="center"
                    mb={8}
                >
                    <Image
                        src={imgImage30}
                        alt="广发众测"
                        h="60px"
                        w="auto"
                    />
                </VStack>

                {/* Login Card */}
                <Box
                    as="form"
                    onSubmit={handleSubmit(onSubmit)}
                    w="520px"
                    bg="white"
                    borderRadius="10px"
                    boxShadow="0px 0px 18px rgba(0, 65, 215, 0.06)"
                    border="4px solid white"
                    p={12}
                >
                    {/* Title */}
                    <Text
                        fontSize="24px"
                        fontWeight="600"
                        color="gray.800"
                        mb={8}
                        textAlign="center"
                    >
                        欢迎登录众测测试
                    </Text>

                    {/* Account Field */}
                    <VStack gap={2} mb={6} align="stretch">
                        <Text fontSize="14px" color="gray.800" fontWeight="500">
                            OA账号
                        </Text>
                        <Field
                            invalid={!!errors.account}
                            errorText={errors.account?.message}
                        >
                            <Input
                                id="account"
                                {...register('account', {
                                    required: '请输入OA账号',
                                })}
                                placeholder="请输入OA账号"
                                borderColor={
                                    errors.account ? '#23a8ea' : '#e5e6eb'
                                }
                                borderWidth="1.729px"
                                borderRadius="9.19px"
                                h="52px"
                                fontSize="14px"
                                _focus={{
                                    borderColor: '#23a8ea',
                                    boxShadow:
                                        '0px 0px 4px rgba(254, 99, 107, 0.52)',
                                }}
                                _placeholder={{
                                    color: '#86909c',
                                }}
                            />
                        </Field>
                    </VStack>

                    {/* Password Field */}
                    <VStack gap={2} mb={6} align="stretch">
                        <Text fontSize="14px" color="gray.800" fontWeight="500">
                            OA密码
                        </Text>
                        <Field
                            invalid={!!errors.password}
                            errorText={errors.password?.message}
                        >
                            <Input
                                id="password"
                                {...register('password', {
                                    required: '请输入OA密码',
                                })}
                                placeholder="请输入OA密码"
                                type="password"
                                borderColor={
                                    errors.password ? '#23a8ea' : '#e5e6eb'
                                }
                                borderWidth="1.729px"
                                borderRadius="8px"
                                h="52px"
                                fontSize="14px"
                                _focus={{
                                    borderColor: '#23a8ea',
                                    boxShadow:
                                        '0px 0px 4px rgba(254, 99, 107, 0.52)',
                                }}
                                _placeholder={{
                                    color: '#86909c',
                                }}
                            />
                        </Field>
                    </VStack>

                    {/* Checkboxes */}
                    <HStack gap={8} mb={8}>
                        <Checkbox
                            {...register('rememberAccount')}
                            checked={rememberAccount}
                            colorPalette="blue"
                        >
                            记住账号
                        </Checkbox>
                        <Checkbox
                            {...register('rememberPassword')}
                            checked={rememberPassword}
                            colorPalette="blue"
                        >
                            记住密码
                        </Checkbox>
                    </HStack>

                    {/* Login Button */}
                    <ChakraButton
                        type="submit"
                        w="100%"
                        h="52px"
                        bg="linear-gradient(90deg, #66c7f8 0%, #11a0e6 100%)"
                        color="white"
                        fontSize="16px"
                        fontWeight="500"
                        borderRadius="999px"
                        mb={4}
                        _hover={{
                            opacity: 0.9,
                        }}
                        _active={{
                            opacity: 0.8,
                        }}
                        loading={isLoading}
                    >
                        立即登录
                    </ChakraButton>

                    {/* Help Link */}
                    <Text
                        fontSize="16px"
                        color="#62c3f4"
                        textAlign="center"
                        cursor="pointer"
                        _hover={{
                            textDecoration: 'underline',
                        }}
                        onClick={() => setIsHelpDialogOpen(true)}
                    >
                        登录问题指引
                    </Text>
                </Box>
            </Container>

            <LoginHelpDialog
                isOpen={isHelpDialogOpen}
                onClose={() => setIsHelpDialogOpen(false)}
            />

            <RegistrationNoticeDialog
                isOpen={isRegistrationNoticeOpen}
                onClose={() => setIsRegistrationNoticeOpen(false)}
            />
        </Box>
    );
}
