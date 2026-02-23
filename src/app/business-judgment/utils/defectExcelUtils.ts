import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

export interface DefectRow {
    defectNo: string;
    title: string;
    description: string;
    points: number;
    type: 'BUG' | 'SUGGESTION';
    caseName: string;
    relatedSteps: string;
    attachments: string;
    reviewComment: string;
    deviceModel: string;
    system: string;
    submitter: string;
    submitTime: string;
    taskId: string;
    testCaseId: string;
}

/**
 * 下载缺陷导入模板Excel文件 - 与批量导出格式一致
 */
export const downloadDefectTemplate = async () => {
    const workbook = new ExcelJS.Workbook();

    // 创建主工作表
    const worksheet = workbook.addWorksheet('缺陷导入模板');

    // 设置列 - 与批量导出格式一致
    worksheet.columns = [
        { header: '缺陷编号', key: 'defectNo', width: 15 },
        { header: '标题', key: 'title', width: 30 },
        { header: '描述', key: 'description', width: 50 },
        { header: '积分', key: 'points', width: 10 },
        { header: '类型', key: 'type', width: 12 },
        { header: '用例', key: 'caseName', width: 25 },
        { header: '关联步骤', key: 'relatedSteps', width: 20 },
        { header: '附件', key: 'attachments', width: 30 },
        { header: '审核意见', key: 'reviewComment', width: 30 },
        { header: '机型', key: 'deviceModel', width: 20 },
        { header: '系统', key: 'system', width: 20 },
        { header: '提交人', key: 'submitter', width: 15 },
        { header: '提交时间', key: 'submitTime', width: 20 },
        { header: '任务ID', key: 'taskId', width: 20 },
        { header: '用例ID', key: 'testCaseId', width: 20 }
    ];

    // 添加示例数据
    worksheet.addRow({
        defectNo: 'O1234567890',
        title: '登录页面显示空白',
        description: '在登录页面输入账号后，页面显示空白，无法继续操作',
        points: 300,
        type: '缺陷',
        caseName: '黄金积存-个人网银使用例',
        relatedSteps: '步骤1; 步骤2',
        attachments: 'http://example.com/image1.png; http://example.com/image2.png',
        reviewComment: '确认为缺陷',
        deviceModel: 'Redmi M2006C3LC',
        system: 'Android 11(720 x1600)',
        submitter: '张三',
        submitTime: '2024-09-12 10:30:00',
        taskId: 'task_123456',
        testCaseId: 'case_123456'
    });

    // 为类型列（E列）添加数据验证（下拉列表）
    for (let i = 2; i <= 1000; i++) {
        const cell = worksheet.getCell(`E${i}`);
        cell.dataValidation = {
            type: 'list',
            allowBlank: false,
            formulae: ['"缺陷,建议"'],
            showErrorMessage: true,
            errorStyle: 'error',
            errorTitle: '输入错误',
            error: '类型只能是 缺陷 或 建议',
            showInputMessage: true,
            promptTitle: '请选择类型',
            prompt: '请从下拉列表中选择 缺陷 或 建议'
        };
    }

    // 设置标题行样式
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // 为类型列标题添加特殊样式（黄色背景）
    const typeHeaderCell = worksheet.getCell('E1');
    typeHeaderCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' }
    };
    typeHeaderCell.font = { bold: true };

    // 添加注释到类型列标题
    typeHeaderCell.note = {
        texts: [
            { text: '类型只能填写：缺陷 或 建议\n\n' },
            { text: '缺陷 - 功能缺陷或错误\n' },
            { text: '建议 - 优化建议\n\n' },
            { text: '点击单元格会显示下拉箭头，请从下拉列表中选择' }
        ]
    };

    // 创建填写说明工作表
    const instructionSheet = workbook.addWorksheet('填写说明');
    instructionSheet.columns = [
        { header: '字段名', key: 'field', width: 15 },
        { header: '说明', key: 'description', width: 40 },
        { header: '示例', key: 'example', width: 30 }
    ];

    instructionSheet.addRows([
        { field: '缺陷编号', description: '缺陷的唯一编号（导出时自动生成，导入时可选）', example: 'O1234567890' },
        { field: '标题', description: '必填，缺陷的简短标题', example: '登录页面显示空白' },
        { field: '描述', description: '必填，详细描述缺陷的现象和复现步骤', example: '在登录页面输入账号后，页面显示空白' },
        { field: '积分', description: '缺陷的积分值（导出时自动生成，导入时可选）', example: '300' },
        { field: '类型', description: '必填，只能填写 缺陷 或 建议（点击单元格会显示下拉选择）', example: '缺陷' },
        { field: '用例', description: '测试用例的名称', example: '黄金积存-个人网银使用例' },
        { field: '关联步骤', description: '关联的测试步骤，多个步骤用分号分隔', example: '步骤1; 步骤2' },
        { field: '附件', description: '附件URL，多个附件用分号分隔', example: 'http://example.com/image1.png; http://example.com/image2.png' },
        { field: '审核意见', description: '审核意见或备注', example: '确认为缺陷' },
        { field: '机型', description: '设备机型', example: 'Redmi M2006C3LC' },
        { field: '系统', description: '操作系统版本', example: 'Android 11(720 x1600)' },
        { field: '提交人', description: '缺陷提交人', example: '张三' },
        { field: '提交时间', description: '缺陷提交时间', example: '2024-09-12 10:30:00' },
        { field: '任务ID', description: '必填，测试任务的ID', example: 'task_123456' },
        { field: '用例ID', description: '必填，测试用例的ID', example: 'case_123456' }
    ]);

    // 设置说明表标题行样式
    const instructionHeaderRow = instructionSheet.getRow(1);
    instructionHeaderRow.font = { bold: true };
    instructionHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // 生成Excel文件并下载
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '缺陷导入模板.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * 从Excel文件读取缺陷数据 - 支持导出格式的直接导入
 */
export const importDefectsFromExcel = (file: File): Promise<DefectRow[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const defects: DefectRow[] = jsonData.map((row: any) => {
                    const typeValue = row['类型'];
                    // 将中文类型转换为英文枚举值
                    let type: 'BUG' | 'SUGGESTION' = 'BUG';
                    if (typeValue === '建议') {
                        type = 'SUGGESTION';
                    } else if (typeValue === '缺陷') {
                        type = 'BUG';
                    }

                    return {
                        defectNo: row['缺陷编号'] || '',
                        title: row['标题'] || '',
                        description: row['描述'] || '',
                        points: row['积分'] || 0,
                        type: type,
                        caseName: row['用例'] || '',
                        relatedSteps: row['关联步骤'] || '',
                        attachments: row['附件'] || '',
                        reviewComment: row['审核意见'] || '',
                        deviceModel: row['机型'] || '',
                        system: row['系统'] || '',
                        submitter: row['提交人'] || '',
                        submitTime: row['提交时间'] || '',
                        taskId: row['任务ID'] || '',
                        testCaseId: row['用例ID'] || ''
                    };
                });

                // 验证必填字段
                const invalidRows = defects.filter(
                    (defect) =>
                        !defect.title ||
                        !defect.description ||
                        !defect.taskId ||
                        !defect.testCaseId
                );

                if (invalidRows.length > 0) {
                    reject(new Error(`存在 ${invalidRows.length} 条数据缺少必填字段（标题、描述、任务ID、用例ID）`));
                    return;
                }

                resolve(defects);
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
