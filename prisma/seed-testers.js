import { PrismaClient, TestingLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 测试用户数据
const TESTERS_DATA = [
  // 超级管理员（已有，但为了完整性包含在这里）
  {
    name: '张伟',
    phone: '13800138001',
    email: 'zhangwei@example.com',
    password: 'Test123456',
    roles: ['SUPER_ADMIN'],
    oaId: 'OA001',
    organization: '总行',
    department: '信息技术部',
    subDepartment: '系统开发处',
    position: '系统架构师',
    education: '硕士',
    maritalStatus: '已婚',
    annualIncome: '20-30万',
    specialties: ['移动应用测试', '性能测试', '自动化测试'],
    testingLevel: TestingLevel.LEVEL_3,
    totalPoints: 12000,
    availablePoints: 3200,
    experience: 1200,
    activityCount: 45,
    isLiaison: false,
    notificationEnabled: true,
    privacyAgreed: true,
    status: true
  },
  // 众测管理员
  {
    name: '李娜',
    phone: '13800138002',
    email: 'lina@example.com',
    password: 'Test123456',
    roles: ['TEST_ADMIN'],
    oaId: 'OA002',
    organization: '总行',
    department: '产品创新部',
    subDepartment: '用户体验处',
    position: '产品经理',
    education: '本科',
    maritalStatus: '未婚',
    annualIncome: '15-20万',
    specialties: ['功能测试', '用户体验测试', '兼容性测试'],
    testingLevel: TestingLevel.LEVEL_2,
    totalPoints: 8500,
    availablePoints: 1800,
    experience: 850,
    activityCount: 32,
    isLiaison: false,
    notificationEnabled: true,
    privacyAgreed: true,
    status: true
  },
  // 分行众测联络员
  {
    name: '王强',
    phone: '13800138003',
    email: 'wangqiang@example.com',
    password: 'Test123456',
    roles: ['LIAISON', 'TESTER'],
    oaId: 'OA003',
    organization: '北京分行',
    department: '电子银行部',
    subDepartment: '移动金融处',
    position: '高级测试工程师',
    education: '本科',
    maritalStatus: '已婚',
    annualIncome: '12-15万',
    specialties: ['移动端测试', '安全测试', '回归测试'],
    testingLevel: TestingLevel.LEVEL_2,
    totalPoints: 6800,
    availablePoints: 1200,
    experience: 680,
    activityCount: 28,
    isLiaison: true,
    liaisionBranch: '北京分行',
    notificationEnabled: true,
    privacyAgreed: true,
    status: true
  },
  // 分行众测联络员（上海）
  {
    name: '陈敏',
    phone: '13800138004',
    email: 'chenmin@example.com',
    password: 'Test123456',
    roles: ['LIAISON', 'TESTER'],
    oaId: 'OA004',
    organization: '上海分行',
    department: '网络金融部',
    subDepartment: '互联网金融处',
    position: '测试主管',
    education: '硕士',
    maritalStatus: '已婚',
    annualIncome: '15-20万',
    specialties: ['Web测试', '接口测试', '压力测试'],
    testingLevel: TestingLevel.LEVEL_3,
    totalPoints: 9200,
    availablePoints: 2100,
    experience: 920,
    activityCount: 35,
    isLiaison: true,
    liaisionBranch: '上海分行',
    notificationEnabled: true,
    privacyAgreed: true,
    status: true
  },
  // 普通众测测试人员 - 技术背景
  {
    name: '刘洋',
    phone: '13800138005',
    email: 'liuyang@example.com',
    password: 'Test123456',
    roles: ['TESTER'],
    oaId: 'OA005',
    organization: '广州分行',
    department: '金融科技部',
    subDepartment: '技术创新处',
    position: '软件工程师',
    education: '本科',
    maritalStatus: '未婚',
    annualIncome: '10-15万',
    specialties: ['Android测试', '功能测试', '探索性测试'],
    testingLevel: TestingLevel.LEVEL_1,
    totalPoints: 2800,
    availablePoints: 800,
    experience: 280,
    activityCount: 15,
    isLiaison: false,
    notificationEnabled: true,
    privacyAgreed: true,
    status: true
  },
  {
    name: '赵磊',
    phone: '13800138006',
    email: 'zhaolei@example.com',
    password: 'Test123456',
    roles: ['TESTER'],
    oaId: 'OA006',
    organization: '深圳分行',
    department: '数字银行部',
    subDepartment: '产品研发处',
    position: '前端开发工程师',
    education: '本科',
    maritalStatus: '未婚',
    annualIncome: '12-15万',
    specialties: ['iOS测试', 'UI测试', '兼容性测试'],
    testingLevel: TestingLevel.LEVEL_2,
    totalPoints: 5600,
    availablePoints: 1500,
    experience: 560,
    activityCount: 22,
    isLiaison: false,
    notificationEnabled: true,
    privacyAgreed: true,
    status: true
  },
  {
    name: '孙丽',
    phone: '13800138007',
    email: 'sunli@example.com',
    password: 'Test123456',
    roles: ['TESTER'],
    oaId: 'OA007',
    organization: '杭州分行',
    department: '智能金融部',
    subDepartment: '数据分析处',
    position: '数据分析师',
    education: '硕士',
    maritalStatus: '已婚',
    annualIncome: '15-20万',
    specialties: ['大数据测试', '性能测试', '数据验证'],
    testingLevel: TestingLevel.LEVEL_2,
    totalPoints: 7200,
    availablePoints: 1900,
    experience: 720,
    activityCount: 26,
    isLiaison: false,
    notificationEnabled: true,
    privacyAgreed: true,
    status: true
  },
  // 普通众测测试人员 - 业务背景
  {
    name: '周杰',
    phone: '13800138008',
    email: 'zhoujie@example.com',
    password: 'Test123456',
    roles: ['TESTER'],
    oaId: 'OA008',
    organization: '成都分行',
    department: '零售业务部',
    subDepartment: '个人金融处',
    position: '客户经理',
    education: '本科',
    maritalStatus: '已婚',
    annualIncome: '8-12万',
    specialties: ['业务流程测试', '用户体验测试', '场景测试'],
    testingLevel: TestingLevel.LEVEL_1,
    totalPoints: 1800,
    availablePoints: 500,
    experience: 180,
    activityCount: 12,
    isLiaison: false,
    notificationEnabled: true,
    privacyAgreed: true,
    status: true
  },
  {
    name: '吴芳',
    phone: '13800138009',
    email: 'wufang@example.com',
    password: 'Test123456',
    roles: ['TESTER'],
    oaId: 'OA009',
    organization: '武汉分行',
    department: '公司业务部',
    subDepartment: '企业金融处',
    position: '对公客户经理',
    education: '本科',
    maritalStatus: '未婚',
    annualIncome: '10-15万',
    specialties: ['业务逻辑测试', '流程测试', '边界测试'],
    testingLevel: TestingLevel.LEVEL_1,
    totalPoints: 2200,
    availablePoints: 700,
    experience: 220,
    activityCount: 14,
    isLiaison: false,
    notificationEnabled: true,
    privacyAgreed: true,
    status: true
  },
  {
    name: '郑涛',
    phone: '13800138010',
    email: 'zhengtao@example.com',
    password: 'Test123456',
    roles: ['TESTER'],
    oaId: 'OA010',
    organization: '西安分行',
    department: '风险管理部',
    subDepartment: '合规管理处',
    position: '风险分析师',
    education: '硕士',
    maritalStatus: '已婚',
    annualIncome: '12-15万',
    specialties: ['安全测试', '合规测试', '风险评估'],
    testingLevel: TestingLevel.LEVEL_2,
    totalPoints: 4800,
    availablePoints: 1200,
    experience: 480,
    activityCount: 18,
    isLiaison: false,
    notificationEnabled: true,
    privacyAgreed: true,
    status: true
  },
  // 部门经理（积分审批）
  {
    name: '马军',
    phone: '13800138011',
    email: 'majun@example.com',
    password: 'Test123456',
    roles: ['DEPT_MANAGER'],
    oaId: 'OA011',
    organization: '总行',
    department: '财务会计部',
    subDepartment: '预算管理处',
    position: '处长',
    education: '硕士',
    maritalStatus: '已婚',
    annualIncome: '25-30万',
    specialties: ['预算审核', '成本控制', '财务分析'],
    testingLevel: TestingLevel.LEVEL_3,
    totalPoints: 3500,
    availablePoints: 800,
    experience: 350,
    activityCount: 8,
    isLiaison: false,
    notificationEnabled: true,
    privacyAgreed: true,
    status: true
  },
  // 总经理（积分审批）
  {
    name: '林晓',
    phone: '13800138012',
    email: 'linxiao@example.com',
    password: 'Test123456',
    roles: ['GENERAL_MANAGER'],
    oaId: 'OA012',
    organization: '总行',
    department: '战略发展部',
    subDepartment: '规划管理处',
    position: '副总经理',
    education: '博士',
    maritalStatus: '已婚',
    annualIncome: '35-50万',
    specialties: ['战略规划', '预算审批', '决策分析'],
    testingLevel: TestingLevel.LEVEL_3,
    totalPoints: 2800,
    availablePoints: 600,
    experience: 280,
    activityCount: 5,
    isLiaison: false,
    notificationEnabled: true,
    privacyAgreed: true,
    status: true
  },
  // 更多普通测试人员
  {
    name: '何静',
    phone: '13800138013',
    email: 'hejing@example.com',
    password: 'Test123456',
    roles: ['TESTER'],
    oaId: 'OA013',
    organization: '南京分行',
    department: '运营管理部',
    subDepartment: '客户服务处',
    position: '客服专员',
    education: '大专',
    maritalStatus: '未婚',
    annualIncome: '6-8万',
    specialties: ['易用性测试', '客户服务测试', '反馈收集'],
    testingLevel: TestingLevel.LEVEL_1,
    totalPoints: 1200,
    availablePoints: 300,
    experience: 120,
    activityCount: 8,
    isLiaison: false,
    notificationEnabled: true,
    privacyAgreed: true,
    status: true
  },
  {
    name: '邓超',
    phone: '13800138014',
    email: 'dengchao@example.com',
    password: 'Test123456',
    roles: ['TESTER'],
    oaId: 'OA014',
    organization: '重庆分行',
    department: '信贷管理部',
    subDepartment: '风险评估处',
    position: '信贷分析师',
    education: '本科',
    maritalStatus: '已婚',
    annualIncome: '10-12万',
    specialties: ['信贷流程测试', '风险点测试', '合规测试'],
    testingLevel: TestingLevel.LEVEL_1,
    totalPoints: 1600,
    availablePoints: 400,
    experience: 160,
    activityCount: 10,
    isLiaison: false,
    notificationEnabled: true,
    privacyAgreed: true,
    status: true
  },
  {
    name: '韩梅',
    phone: '13800138015',
    email: 'hanmei@example.com',
    password: 'Test123456',
    roles: ['TESTER'],
    oaId: 'OA015',
    organization: '天津分行',
    department: '国际业务部',
    subDepartment: '外汇交易处',
    position: '外汇交易员',
    education: '硕士',
    maritalStatus: '未婚',
    annualIncome: '12-15万',
    specialties: ['国际化测试', '多语言测试', '汇率系统测试'],
    testingLevel: TestingLevel.LEVEL_2,
    totalPoints: 3800,
    availablePoints: 900,
    experience: 380,
    activityCount: 16,
    isLiaison: false,
    notificationEnabled: true,
    privacyAgreed: true,
    status: true
  }
];

async function main() {
  console.log('=== 开始创建众测人员测试数据 ===\n');
  
  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const testerData of TESTERS_DATA) {
    try {
      // 检查用户是否已存在（通过手机号或OA ID）
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: testerData.phone },
            { oaId: testerData.oaId }
          ]
        }
      });
      
      if (existingUser) {
        console.log(`⚠️  用户 ${testerData.name} 已存在，跳过创建`);
        skippedCount++;
        continue;
      }
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(testerData.password, 10);
      
      // 创建用户
      const user = await prisma.user.create({
        data: {
          name: testerData.name,
          phone: testerData.phone,
          email: testerData.email,
          password: hashedPassword,
          roles: testerData.roles,
          oaId: testerData.oaId,
          organization: testerData.organization,
          department: testerData.department,
          subDepartment: testerData.subDepartment,
          specialties: testerData.specialties,
          testingLevel: testerData.testingLevel,
          totalPoints: testerData.totalPoints,
          availablePoints: testerData.availablePoints,
          experience: testerData.experience,
          activityCount: testerData.activityCount,
          isLiaison: testerData.isLiaison,
          liaisionBranch: testerData.liaisionBranch,
          notificationEnabled: testerData.notificationEnabled,
          privacyAgreed: testerData.privacyAgreed,
          privacyAgreedAt: testerData.privacyAgreed ? new Date() : null,
          status: testerData.status,
          phoneVerified: new Date(),
          emailVerified: new Date()
        }
      });
      
      console.log(`✅ 成功创建用户: ${user.name} (${user.phone}) - ${testerData.roles.join(', ')}`);
      createdCount++;
      
    } catch (error) {
      console.error(`❌ 创建用户 ${testerData.name} 失败:`, error.message);
      errorCount++;
    }
  }
  
  // 统计信息
  console.log('\n=== 创建完成统计 ===');
  console.log(`📊 成功创建: ${createdCount} 个用户`);
  console.log(`📊 跳过已存在: ${skippedCount} 个用户`);
  console.log(`📊 创建失败: ${errorCount} 个用户`);
  
  // 显示各角色统计
  console.log('\n=== 角色分布统计 ===');
  const roleStats = {};
  TESTERS_DATA.forEach(tester => {
    tester.roles.forEach(role => {
      roleStats[role] = (roleStats[role] || 0) + 1;
    });
  });
  
  Object.entries(roleStats).forEach(([role, count]) => {
    console.log(`${role}: ${count} 人`);
  });
  
  // 显示总用户数
  const totalUsers = await prisma.user.count({
    where: { isDeleted: false }
  });
  console.log(`\n📈 数据库中总用户数: ${totalUsers}`);
  
  console.log('\n=== 众测人员测试数据创建完成 ===');
}

main()
  .catch((e) => {
    console.error('执行出错:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
