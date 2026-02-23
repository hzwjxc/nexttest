export enum ROLES {
    SUPER_ADMIN = 'SUPER_ADMIN',
    TEST_ADMIN = 'TEST_ADMIN',
    LIAISON = 'LIAISON',
    TESTER = 'TESTER',
    DEPT_MANAGER = 'DEPT_MANAGER',
    GENERAL_MANAGER = 'GENERAL_MANAGER',
}
export const ROLES_TEXT = {
    SUPER_ADMIN: '超级管理员',
    TEST_ADMIN: '众测管理员',
    LIAISON: '分行众测联络员',
    TESTER: '众测测试人员',
    DEPT_MANAGER: '部门经理',
    GENERAL_MANAGER: '总经理',
} as const;
