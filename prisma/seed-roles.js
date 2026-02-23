import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 角色配置数据
const ROLES_DATA = [
  {
    code: 'SUPER_ADMIN',
    name: '超级管理员',
    description: '只有一个，主要负责帐号管理（密码修改、停用/启用等）、系统参数配置、系统维护等。',
    permissions: [
      'workspace',
      'task-hall',
      'task-publish',
      'task-review',
      'points-review',
      'usage-management',
      'defect-management',
      'academy',
      'report',
      'user-center',
      'admin',
      'mini-program'
    ],
    status: true
  },
  {
    code: 'TEST_ADMIN',
    name: '众测管理员',
    description: '由超级管理员添加，可发布任务，任务流程处理管理平台的众测活动。',
    permissions: [
      'workspace',
      'task-hall',
      'task-publish',
      'task-review',
      'defect-management',
      'academy',
      'report'
    ],
    status: true
  },
  {
    code: 'LIAISON',
    name: '分行众测联络员',
    description: '本身为众测测试人员，由超级管理员标记，同一分行只能标记一个众测测试人员为分行众测联络员，可通过时间、活动等多个数据筛选维度查看。',
    permissions: [
      'workspace',
      'task-hall',
      'defect-management',
      'academy',
      'report'
    ],
    status: true
  },
  {
    code: 'TESTER',
    name: '众测测试人员',
    description: '自行注册，参与众测活动的测试执行的人员，通过小程序或PC WEB登录，通过众测管理员审核后，可领取任务、提交缺陷、领取奖励等。',
    permissions: [
      'workspace',
      'task-hall',
      'defect-management',
      'academy',
      'user-center',
      'mini-program'
    ],
    status: true
  },
  {
    code: 'DEPT_MANAGER',
    name: '活动积分审批岗-部门经理',
    description: '由超级管理员添加、系统默认配置，负责积分预算初审、奖励金发放审核。',
    permissions: [
      'workspace',
      'points-review',
      'report'
    ],
    status: true
  },
  {
    code: 'GENERAL_MANAGER',
    name: '活动积分审批岗-总经理',
    description: '由超级管理员添加、系统默认配置，负责积分预算终审。',
    permissions: [
      'workspace',
      'points-review',
      'report'
    ],
    status: true
  }
];

async function main() {
  console.log('开始创建角色数据...');
  
  for (const roleData of ROLES_DATA) {
    try {
      // 检查角色是否已存在
      const existingRole = await prisma.role.findUnique({
        where: { code: roleData.code }
      });
      
      if (existingRole) {
        console.log(`角色 ${roleData.name} 已存在，跳过创建`);
        continue;
      }
      
      // 创建角色
      const role = await prisma.role.create({
        data: {
          code: roleData.code,
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
          status: roleData.status
        }
      });
      
      console.log(`✅ 成功创建角色: ${role.name} (${role.code})`);
      
    } catch (error) {
      console.error(`❌ 创建角色 ${roleData.name} 失败:`, error.message);
    }
  }
  
  // 验证创建结果
  console.log('\n验证角色创建结果:');
  const allRoles = await prisma.role.findMany({
    orderBy: { code: 'asc' }
  });
  
  console.log(`总共创建了 ${allRoles.length} 个角色:`);
  allRoles.forEach(role => {
    console.log(`- ${role.name} (${role.code}): ${role.description}`);
  });
  
  console.log('\n角色种子数据创建完成！');
}

main()
  .catch((e) => {
    console.error('执行出错:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });