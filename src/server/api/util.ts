import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// MIME 类型到文件扩展名的映射
const MIME_TO_EXTENSION: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
    'image/tiff': 'tiff',
    'image/avif': 'avif',
};

// 视频 MIME 类型到文件扩展名的映射
const VIDEO_MIME_TO_EXTENSION: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/webm': 'webm',
    'video/ogg': 'ogv',
    'video/3gpp': '3gp',
    'video/x-flv': 'flv',
};

// 通用文件 MIME 类型到文件扩展名的映射
const FILE_MIME_TO_EXTENSION: Record<string, string> = {
    // 文档类型
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
    'application/x-7z-compressed': '7z',
    'text/plain': 'txt',
    'text/csv': 'csv',
    // 图片类型（补充）
    ...MIME_TO_EXTENSION,
    // 视频类型（补充）
    ...VIDEO_MIME_TO_EXTENSION,
};

// 从文件名获取扩展名的辅助函数
function getExtensionFromFilename(filename: string): string {
    const parts = filename.split('.');
    if (parts.length > 1) {
        return parts[parts.length - 1].toLowerCase();
    }
    return '';
}

export const utilRouter = createTRPCRouter({
    uploadImage: publicProcedure
        .input(
            z.object({
                image: z.string(), // base64 encoded image
                filename: z.string(),
                folder: z.string().optional().default('uploads'), // 可选的文件夹名称
            })
        )
        .mutation(async ({ input }) => {
            try {
                const { image, filename, folder } = input;

                // 验证 base64 格式
                if (!image.startsWith('data:image/')) {
                    throw new Error('Invalid image format');
                }

                // 提取文件扩展名
                const mimeType = image.split(';')[0]?.split(':')[1];
                const extension = MIME_TO_EXTENSION[mimeType || ''] || 'jpg';

                // 生成唯一文件名
                const timestamp = Date.now();
                const randomString = Math.random()
                    .toString(36)
                    .substring(2, 15);
                const newFilename = `${timestamp}_${randomString}.${extension}`;

                // 创建上传目录
                const uploadDir = join(
                    process.cwd(),
                    'output/uploads/images',
                    folder
                );

                // 确保目录存在，如果不存在则创建
                if (!existsSync(uploadDir)) {
                    try {
                        await mkdir(uploadDir, {
                            recursive: true,
                            mode: 0o777,
                        });
                    } catch (error) {
                        console.error('创建目录失败:', error);
                        // 尝试创建父目录
                        const parentDir = join(
                            process.cwd(),
                            'output/uploads/images'
                        );
                        if (!existsSync(parentDir)) {
                            await mkdir(parentDir, {
                                recursive: true,
                                mode: 0o777,
                            });
                        }
                        // 再次尝试创建目标目录
                        await mkdir(uploadDir, {
                            recursive: true,
                            mode: 0o777,
                        });
                    }
                }

                // 将 base64 转换为 buffer
                const base64Data = image.replace(
                    /^data:image\/[^;]+;base64,/,
                    ''
                );
                const buffer = Buffer.from(base64Data, 'base64');

                // 保存文件
                const filePath = join(uploadDir, newFilename);
                await writeFile(filePath, buffer, { mode: 0o666 });

                // 返回可访问的 URL
                const url = `/uploads/images/${folder}/${newFilename}`;

                return {
                    success: true,
                    url,
                    filename: newFilename,
                    originalFilename: filename,
                };
            } catch (error) {
                console.error('Upload error:', error);
                throw new Error('文件上传失败');
            }
        }),

    uploadMultipleImages: publicProcedure
        .input(
            z.object({
                images: z.array(
                    z.object({
                        image: z.string(), // base64 encoded image
                        filename: z.string(),
                    })
                ),
                folder: z.string().optional().default('uploads'),
            })
        )
        .mutation(async ({ input }) => {
            try {
                const { images, folder } = input;
                const results = [];

                // 创建上传目录
                const uploadDir = join(
                    process.cwd(),
                    'output/uploads/images',
                    folder
                );
                if (!existsSync(uploadDir)) {
                    try {
                        await mkdir(uploadDir, { recursive: true });
                    } catch (error) {
                        console.error('创建目录失败:', error);
                        throw new Error('无法创建上传目录');
                    }
                }

                for (const imageData of images) {
                    const { image, filename } = imageData;

                    // 验证 base64 格式
                    if (!image.startsWith('data:image/')) {
                        throw new Error(`Invalid image format for ${filename}`);
                    }

                    // 提取文件扩展名
                    const mimeType = image.split(';')[0]?.split(':')[1];
                    const extension =
                        MIME_TO_EXTENSION[mimeType || ''] || 'jpg';

                    // 生成唯一文件名
                    const timestamp = Date.now();
                    const randomString = Math.random()
                        .toString(36)
                        .substring(2, 15);
                    const newFilename = `${timestamp}_${randomString}.${extension}`;

                    // 将 base64 转换为 buffer
                    const base64Data = image.replace(
                        /^data:image\/[^;]+;base64,/,
                        ''
                    );
                    const buffer = Buffer.from(base64Data, 'base64');

                    // 保存文件
                    const filePath = join(uploadDir, newFilename);
                    await writeFile(filePath, buffer);

                    // 添加到结果数组
                    const url = `/uploads/images/${folder}/${newFilename}`;
                    results.push({
                        success: true,
                        url,
                        filename: newFilename,
                        originalFilename: filename,
                    });
                }

                return {
                    success: true,
                    results,
                };
            } catch (error) {
                console.error('Multiple upload error:', error);
                throw new Error('文件上传失败');
            }
        }),

    // 视频上传
    uploadVideo: publicProcedure
        .input(
            z.object({
                video: z.string(), // base64 encoded video
                filename: z.string(),
                folder: z.string().optional().default('videos'),
            })
        )
        .mutation(async ({ input }) => {
            try {
                const { video, filename, folder } = input;

                // 验证 base64 格式
                if (!video.startsWith('data:video/')) {
                    throw new Error('Invalid video format');
                }

                // 提取文件扩展名
                const mimeType = video.split(';')[0]?.split(':')[1];
                const extension =
                    VIDEO_MIME_TO_EXTENSION[mimeType || ''] || 'mp4';

                // 生成唯一文件名
                const timestamp = Date.now();
                const randomString = Math.random()
                    .toString(36)
                    .substring(2, 15);
                const newFilename = `${timestamp}_${randomString}.${extension}`;

                // 创建上传目录
                const uploadDir = join(
                    process.cwd(),
                    'output/uploads/videos',
                    folder
                );
                if (!existsSync(uploadDir)) {
                    await mkdir(uploadDir, { recursive: true });
                }

                // 将 base64 转换为 buffer
                const base64Data = video.replace(
                    /^data:video\/[^;]+;base64,/,
                    ''
                );
                const buffer = Buffer.from(base64Data, 'base64');

                // 保存文件
                const filePath = join(uploadDir, newFilename);
                await writeFile(filePath, buffer);

                // 视频上传完成，不提取封面图和时长

                // 返回可访问的 URL
                const url = `/uploads/videos/${folder}/${newFilename}`;

                return {
                    success: true,
                    url,
                    filename: newFilename,
                    originalFilename: filename,
                };
            } catch (error) {
                console.error('Video upload error:', error);
                throw new Error('视频上传失败');
            }
        }),

    // 通用文件上传
    uploadFile: publicProcedure
        .input(
            z.object({
                file: z.string(), // base64 encoded file
                filename: z.string(),
                folder: z.string().optional().default('files'),
            })
        )
        .mutation(async ({ input }) => {
            try {
                const { file, filename, folder } = input;

                // 验证 base64 格式
                if (!file.startsWith('data:')) {
                    throw new Error('Invalid file format');
                }

                // 提取 MIME 类型和文件扩展名
                const mimeMatch = file.match(/^data:([^;]+)/);
                const mimeType = mimeMatch ? mimeMatch[1] : '';

                // 优先从文件名获取扩展名,其次从 MIME 类型
                let extension = getExtensionFromFilename(filename);
                if (!extension && mimeType) {
                    extension = FILE_MIME_TO_EXTENSION[mimeType] || 'bin';
                }
                if (!extension) {
                    extension = 'bin';
                }

                // 生成唯一文件名
                const timestamp = Date.now();
                const randomString = Math.random()
                    .toString(36)
                    .substring(2, 15);
                const newFilename = `${timestamp}_${randomString}.${extension}`;

                // 创建上传目录
                const uploadDir = join(
                    process.cwd(),
                    'output/uploads/files',
                    folder
                );
                if (!existsSync(uploadDir)) {
                    await mkdir(uploadDir, { recursive: true });
                }

                // 将 base64 转换为 buffer
                const base64Data = file.replace(/^data:[^;]+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');

                // 保存文件
                const filePath = join(uploadDir, newFilename);
                await writeFile(filePath, buffer, { mode: 0o666 });

                // 返回可访问的 URL
                const url = `/uploads/files/${folder}/${newFilename}`;

                return {
                    success: true,
                    url,
                    filename: newFilename,
                    originalFilename: filename,
                    size: buffer.length,
                };
            } catch (error) {
                console.error('File upload error:', error);
                throw new Error('文件上传失败');
            }
        }),

    // 富文本编辑器文件上传（支持图片和视频）
    uploadRichTextFile: publicProcedure
        .input(
            z.object({
                file: z.string(), // base64 encoded file
                filename: z.string(),
                folder: z.string().optional().default('academy'), // 默认为academy文件夹
            })
        )
        .mutation(async ({ input }) => {
            try {
                const { file, filename, folder } = input;

                // 验证 base64 格式
                if (!file.startsWith('data:')) {
                    throw new Error('Invalid file format');
                }

                // 提取 MIME 类型
                const mimeMatch = file.match(/^data:([^;]+)/);
                const mimeType = mimeMatch ? mimeMatch[1] : '';

                // 判断文件类型并获取扩展名
                let extension = getExtensionFromFilename(filename);
                if (!extension && mimeType) {
                    extension = FILE_MIME_TO_EXTENSION[mimeType] || 'bin';
                }
                if (!extension) {
                    extension = 'bin';
                }

                // 生成唯一文件名（使用UUID格式）
                const crypto = await import('crypto');
                const uuid = crypto.randomUUID();
                const newFilename = `${uuid}.${extension}`;

                // 创建上传目录 - 直接保存到 output/uploads/{folder}
                const uploadDir = join(
                    process.cwd(),
                    'output/uploads',
                    folder
                );
                if (!existsSync(uploadDir)) {
                    await mkdir(uploadDir, { recursive: true, mode: 0o777 });
                }

                // 将 base64 转换为 buffer
                const base64Data = file.replace(/^data:[^;]+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');

                // 保存文件
                const filePath = join(uploadDir, newFilename);
                await writeFile(filePath, buffer, { mode: 0o666 });

                // 返回可访问的 URL（与feedback上传格式一致）
                const url = `/api/uploads/${folder}/${newFilename}`;

                return {
                    success: true,
                    url,
                    filename: newFilename,
                    originalFilename: filename,
                    size: buffer.length,
                };
            } catch (error) {
                console.error('Rich text file upload error:', error);
                throw new Error('文件上传失败');
            }
        }),
});
