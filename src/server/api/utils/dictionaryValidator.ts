import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';

/**
 * 获取数据字典的所有有效值
 * @param db Prisma客户端
 * @param dictionaryCode 字典编码 (如 'DEFECT_SEVERITY', 'SUGGESTION_LEVEL')
 * @returns 字典项数组
 */
export async function getDictionaryItems(
    db: PrismaClient,
    dictionaryCode: string
) {
    const dictionary = await db.dataDictionary.findUnique({
        where: { code: dictionaryCode },
        include: {
            items: { where: { isActive: true }, orderBy: { sort: 'asc' } },
        },
    });

    if (!dictionary) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `字典 ${dictionaryCode} 不存在`,
        });
    }

    return dictionary.items;
}

/**
 * 验证值是否在数据字典中
 * @param db Prisma客户端
 * @param dictionaryCode 字典编码
 * @param value 要验证的值
 * @param fieldName 字段名称（用于错误提示）
 * @returns 如果有效返回true，否则抛出错误
 */
export async function validateDictionaryValue(
    db: PrismaClient,
    dictionaryCode: string,
    value: string | undefined | null,
    fieldName: string
): Promise<boolean> {
    if (!value) {
        return true; // 空值视为有效
    }

    const items = await getDictionaryItems(db, dictionaryCode);
    const validValues = items.map((item) => item.code || item.label);

    if (!validValues.includes(value)) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `无效的${fieldName}: ${value}。有效值为: ${validValues.join(', ')}`,
        });
    }

    return true;
}

/**
 * 获取数据字典的值映射（用于前端选择）
 * @param db Prisma客户端
 * @param dictionaryCode 字典编码
 * @returns 字典项映射对象
 */
export async function getDictionaryMap(
    db: PrismaClient,
    dictionaryCode: string
) {
    const items = await getDictionaryItems(db, dictionaryCode);
    return items.reduce(
        (acc, item) => {
            const key = item.code || item.label;
            acc[key] = {
                label: item.label,
                value: item.value,
                description: item.description,
            };
            return acc;
        },
        {} as Record<
            string,
            {
                label: string;
                value?: string | null;
                description?: string | null;
            }
        >
    );
}
