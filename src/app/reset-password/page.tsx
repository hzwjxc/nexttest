'use client';

import { Container, Heading, Text, Input } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { Button, InputGroup, Field, PasswordInput } from '@/app/_components/ui';
import useCustomToast from '@/app/hooks/useCustomToast';
import { FiLock } from 'react-icons/fi';
import { api } from '@/trpc/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleError, passwordRules } from '@/app/utils';

interface ResetPasswordForm {
    password: string;
    confirmPassword: string;
}

export default function ResetPassword() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
    } = useForm<ResetPasswordForm>({
        mode: 'onBlur',
        defaultValues: { 
            password: '',
            confirmPassword: ''
        },
    });
    
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    
    const resetPasswordMutation = api.user.resetPassword.useMutation({
        onSuccess: () => {
            showSuccessToast('密码重置成功，请使用新密码登录');
            router.push('/login');
        },
        onError: (err: any) => {
            showErrorToast(err?.message ?? '密码重置失败');
            router.push('/login'); // 如果令牌无效，重定向到登录页
        },
    });

    const onSubmit = async (data: ResetPasswordForm) => {
        if (!token) {
            showErrorToast('缺少重置令牌');
            return;
        }
        
        if (data.password !== data.confirmPassword) {
            showErrorToast('两次输入的密码不一致');
            return;
        }
        
        await resetPasswordMutation.mutateAsync({ 
            token,
            newPassword: data.password 
        });
    };

    // 如果没有令牌，重定向到登录页
    useEffect(() => {
        if (!token) {
            showErrorToast('缺少重置令牌，请重新申请');
            router.push('/recover-password');
        }
    }, [token, router, showErrorToast]);

    if (!token) {
        return null; // 等待重定向
    }

    return (
        <Container
            as="form"
            onSubmit={handleSubmit(onSubmit)}
            h="calc(100vh - 64px)"
            maxW="sm"
            alignItems="stretch"
            justifyContent="center"
            gap={4}
            centerContent
        >
            <Heading size="xl" color="ui.main" textAlign="center" mb={2}>
                重置密码
            </Heading>
            <Text textAlign="center" mb={4}>
                请输入新密码
            </Text>
            
            <Field 
                invalid={!!errors.password} 
                errorText={errors.password?.message}
            >
                <PasswordInput
                    id="password"
                    type="password"
                    errors={errors}
                    startElement={<FiLock />}
                    {...register('password', {
                        required: '请输入密码',
                        minLength: { value: 6, message: '密码至少6位' },
                    })}
                    placeholder="请输入新密码"
                />
            </Field>
            
            <Field 
                invalid={!!errors.confirmPassword} 
                errorText={errors.confirmPassword?.message}
            >
                <PasswordInput
                    id="confirmPassword"
                    type="confirmPassword"
                    errors={errors}
                    startElement={<FiLock />}
                    {...register('confirmPassword', {
                        required: '请确认密码',
                        validate: (value) => {
                            const password = watch('password');
                            if (value !== password) {
                                return '两次输入的密码不一致';
                            }
                            return undefined;
                        }
                    })}
                    placeholder="请确认新密码"
                />
            </Field>
            
            <Button variant="solid" type="submit" loading={isSubmitting}>
                确定
            </Button>
        </Container>
    );
}