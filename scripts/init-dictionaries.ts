import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initDictionaries() {
  try {
    console.log('开始初始化数据字典...');

    // 1. 创建或更新缺陷等级字典
    let defectSeverityDict = await prisma.dataDictionary.findUnique({
      where: { code: 'DEFECT_SEVERITY' },
    });

    if (!defectSeverityDict) {
      defectSeverityDict = await prisma.dataDictionary.create({
        data: {
          code: 'DEFECT_SEVERITY',
          name: '缺陷等级',
          category: 'DEFECT',
          description: '缺陷的严重程度等级',
          valueType: 'LIST',
          isActive: true,
          items: {
            create: [
              {
                code: 'CRITICAL',
                label: '致命',
                value: '40',
                description: '系统崩溃、数据丢失等严重问题',
                sort: 1,
                isActive: true,
              },
              {
                code: 'MAJOR',
                label: '严重',
                value: '30',
                description: '主要功能不可用',
                sort: 2,
                isActive: true,
              },
              {
                code: 'MINOR',
                label: '一般',
                value: '20',
                description: '功能有缺陷但可用',
                sort: 3,
                isActive: true,
              },
              {
                code: 'TRIVIAL',
                label: '轻微',
                value: '10',
                description: '界面、文案等小问题',
                sort: 4,
                isActive: true,
              },
              {
                code: 'INVALID',
                label: '无效',
                value: '0',
                description: '不是缺陷',
                sort: 5,
                isActive: true,
              },
            ],
          },
        },
        include: { items: true },
      });
      console.log('✓ 缺陷等级字典创建成功');
    } else {
      console.log('✓ 缺陷等级字典已存在');
    }

    // 2. 创建或更新建议等级字典
    let suggestionLevelDict = await prisma.dataDictionary.findUnique({
      where: { code: 'SUGGESTION_LEVEL' },
    });

    if (!suggestionLevelDict) {
      suggestionLevelDict = await prisma.dataDictionary.create({
        data: {
          code: 'SUGGESTION_LEVEL',
          name: '建议等级',
          category: 'SUGGESTION',
          description: '建议的质量等级',
          valueType: 'LIST',
          isActive: true,
          items: {
            create: [
              {
                code: 'EXCELLENT_SPECIAL',
                label: '特别优秀',
                value: '50',
                description: '非常有价值的建议',
                sort: 1,
                isActive: true,
              },
              {
                code: 'EXCELLENT',
                label: '优秀',
                value: '40',
                description: '有价值的建议',
                sort: 2,
                isActive: true,
              },
              {
                code: 'VALID',
                label: '有效',
                value: '20',
                description: '有效的建议',
                sort: 3,
                isActive: true,
              },
              {
                code: 'INVALID',
                label: '无效',
                value: '0',
                description: '不是有效建议',
                sort: 4,
                isActive: true,
              },
            ],
          },
        },
        include: { items: true },
      });
      console.log('✓ 建议等级字典创建成功');
    } else {
      console.log('✓ 建议等级字典已存在');
    }

    console.log('\n数据字典初始化完成！');
    console.log('\n缺陷等级字典项:');
    console.table(
      defectSeverityDict.items.map((item) => ({
        编码: item.code,
        标签: item.label,
        值: item.value,
        排序: item.sort,
      }))
    );

    console.log('\n建议等级字典项:');
    if (suggestionLevelDict.items && suggestionLevelDict.items.length > 0) {
      console.table(
        suggestionLevelDict.items.map((item) => ({
          编码: item.code,
          标签: item.label,
          值: item.value,
          排序: item.sort,
        }))
      );
    }
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initDictionaries();
