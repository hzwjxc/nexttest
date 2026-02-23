import * as XLSX from 'xlsx';

export interface TestCaseRow {
    title: string;
    system: string;
    precondition?: string;
    testSteps: string;
    explanation?: string;
}

export interface StepData {
    id: number;
    description: string;
    expectedResult: string;
}

/**
 * 下载用例模板Excel文件
 */
export const downloadTemplate = () => {
    const templateData = [
        {
            '用例名称': '示例用例',
            '所属系统': '示例系统',
            '测试准备': '准备测试环境和测试数据',
            '测试步骤': JSON.stringify([
                { id: 1, description: '步骤1描述', expectedResult: '预期结果1' },
                { id: 2, description: '步骤2描述', expectedResult: '预期结果2' }
            ]),
            '重点关注': '关注点说明'
        }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '用例模板');

    // 设置列宽
    ws['!cols'] = [
        { wch: 30 }, // 用例名称
        { wch: 20 }, // 所属系统
        { wch: 30 }, // 测试准备
        { wch: 50 }, // 测试步骤
        { wch: 30 }  // 重点关注
    ];

    XLSX.writeFile(wb, '用例模板.xlsx');
};

/**
 * 导出用例到Excel
 */
export const exportCases = (cases: any[], filename: string = '测试用例.xlsx') => {
    const exportData = cases.map(caseItem => ({
        '用例名称': caseItem.title,
        '所属系统': caseItem.system,
        '测试准备': caseItem.precondition || '',
        '测试步骤': caseItem.testSteps,
        '重点关注': caseItem.explanation || '',
        '创建时间': new Date(caseItem.createdAt).toLocaleString('zh-CN')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '测试用例');

    // 设置列宽
    ws['!cols'] = [
        { wch: 30 }, // 用例名称
        { wch: 20 }, // 所属系统
        { wch: 30 }, // 测试准备
        { wch: 50 }, // 测试步骤
        { wch: 30 }, // 重点关注
        { wch: 20 }  // 创建时间
    ];

    XLSX.writeFile(wb, filename);
};

/**
 * 从Excel文件读取用例数据
 */
export const importCasesFromExcel = (file: File): Promise<TestCaseRow[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const cases: TestCaseRow[] = jsonData.map((row: any) => {
                    let testSteps = row['测试步骤'] || '[]';

                    // 验证并解析测试步骤
                    try {
                        JSON.parse(testSteps);
                    } catch {
                        // 如果不是有效JSON，创建默认步骤
                        testSteps = JSON.stringify([
                            { id: 1, description: testSteps, expectedResult: '' }
                        ]);
                    }

                    return {
                        title: row['用例名称'] || '',
                        system: row['所属系统'] || '',
                        precondition: row['测试准备'] || undefined,
                        testSteps: testSteps,
                        explanation: row['重点关注'] || undefined
                    };
                });

                resolve(cases);
            } catch (error) {
                reject(new Error('Excel文件解析失败'));
            }
        };

        reader.onerror = () => {
            reject(new Error('文件读取失败'));
        };

        reader.readAsBinaryString(file);
    });
};
