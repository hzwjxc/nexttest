import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDictionary() {
    try {
        // 查询缺陷等级字典 (DEFECT_SEVERITY)
        const testLevel = await prisma.dataDictionary.findUnique({
            where: { code: 'DEFECT_SEVERITY' },
            include: {
                items: { where: { isActive: true }, orderBy: { sort: 'asc' } },
            },
        });

        console.log('=== 缺陷等级字典 (DEFECT_SEVERITY) ===');
        if (testLevel) {
            console.log('字典名称:', testLevel.name);
            console.log('字典编码:', testLevel.code);
            console.log('字典项数量:', testLevel.items.length);
            console.log('\n字典项列表:');
            testLevel.items.forEach((item, index) => {
                console.log(
                    `${index + 1}. ${item.label} (code: ${item.code}, value: ${item.value})`
                );
            });
        } else {
            console.log('未找到 DEFECT_SEVERITY 字典');
        }

        // 查询建议等级字典
        const suggestionLevel = await prisma.dataDictionary.findUnique({
            where: { code: 'SUGGESTION_LEVEL' },
            include: {
                items: { where: { isActive: true }, orderBy: { sort: 'asc' } },
            },
        });

        console.log('\n=== 建议等级字典 ===');
        if (suggestionLevel) {
            console.log('字典名称:', suggestionLevel.name);
            console.log('字典编码:', suggestionLevel.code);
            console.log('字典项数量:', suggestionLevel.items.length);
            console.log('\n字典项列表:');
            suggestionLevel.items.forEach((item, index) => {
                console.log(
                    `${index + 1}. ${item.label} (code: ${item.code}, value: ${item.value})`
                );
            });
        } else {
            console.log('未找到 SUGGESTION_LEVEL 字典');
        }

        // 查询所有字典
        const allDicts = await prisma.dataDictionary.findMany({
            where: { isActive: true },
            select: { code: true, name: true },
        });

        console.log('\n=== 所有可用字典 ===');
        allDicts.forEach((dict) => {
            console.log(`- ${dict.code}: ${dict.name}`);
        });
    } catch (error) {
        console.error('查询失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDictionary();
