import { create } from 'zustand';

// 文件信息类型
export interface FileItem {
    id: string;
    name: string;
    url: string;
    size: number;
    status: 'uploading' | 'success' | 'error';
}

// 测试用例类型
export interface TestCaseItem {
    id: number;
    sequence: number;
    system: string;
    name: string;
    focus: string;
    originalId?: string;
}

// 积分选项类型
export interface PointsOption {
    label: string;
    value: number;
    unit: string;
}

// 基本信息
export interface BasicInfo {
    taskSystem: string;
    taskName: string;
    taskDescription: string;
    testType: string;
    testRules: string;
    testData: string;
    files: FileItem[];
}

// 测试设计
export interface TestDesign {
    testCases: TestCaseItem[];
    testPoints: string;
}

// 任务发布
export interface TaskPublish {
    personTags: string[];
    selectedTagIds: string[];
    taskDate: string;
    participants: string;
    executePoints: string;
    ruleFilter: string;
    pointsOptions: PointsOption[];
    emailNotify: boolean;
    emailContent: string;
    selectedEmailTemplate: string;
    smsNotify: boolean;
    smsContent: string;
    selectedSmsTemplate: string;
    groupInvite: boolean;
    thumbnailImage: string | null; // 任务缩略图
    wechatContent: string;
    selectedWechatTemplate: string;
}

interface TaskPublishStore {
    // 当前编辑的任务ID(编辑模式)
    currentTaskId: string | null;

    // 基本信息
    basicInfo: BasicInfo;

    // 测试设计
    testDesign: TestDesign;

    // 任务发布
    taskPublish: TaskPublish;

    // Actions
    setCurrentTaskId: (id: string | null) => void;
    setBasicInfo: (info: Partial<BasicInfo>) => void;
    setTestDesign: (design: Partial<TestDesign>) => void;
    setTaskPublish: (publish: Partial<TaskPublish>) => void;
    reset: () => void;
}

const initialState = {
    currentTaskId: null,
    basicInfo: {
        taskSystem: '',
        taskName: '',
        taskDescription: '',
        testType: '手机客户端',
        testRules: '',
        testData: '',
        files: [],
    },
    testDesign: {
        testCases: [],
        testPoints: '',
    },
    taskPublish: {
        personTags: [],
        selectedTagIds: [],
        taskDate: new Date().toISOString().split('T')[0] || '',
        participants: '100',
        executePoints: '10',
        ruleFilter: '',
        pointsOptions: [
            { label: '致命', value: 40, unit: '积分' },
            { label: '严重', value: 30, unit: '积分' },
            { label: '一般', value: 20, unit: '积分' },
            { label: '轻微', value: 10, unit: '积分' },
            { label: '有效建议', value: 20, unit: '积分' },
            { label: '特别优秀', value: 30, unit: '积分' },
            { label: '无效', value: 0, unit: '积分' },
        ],
        emailNotify: true,
        emailContent: '',
        selectedEmailTemplate: '',
        smsNotify: true,
        smsContent: '',
        selectedSmsTemplate: '',
        groupInvite: false,
        thumbnailImage: null,
        wechatContent: '',
        selectedWechatTemplate: '',
    },
};

export const useTaskPublishStore = create<TaskPublishStore>()((set) => ({
    ...initialState,

    setCurrentTaskId: (id) => set({ currentTaskId: id }),

    setBasicInfo: (info) =>
        set((state) => ({
            basicInfo: { ...state.basicInfo, ...info },
        })),

    setTestDesign: (design) =>
        set((state) => ({
            testDesign: { ...state.testDesign, ...design },
        })),

    setTaskPublish: (publish) =>
        set((state) => ({
            taskPublish: { ...state.taskPublish, ...publish },
        })),

    reset: () => set(initialState),
}));
