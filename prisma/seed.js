import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
    console.log('=== 开始初始化系统数据 ===\n');
    
    // 1. 创建角色数据
    await createRoles();
    
    // 2. 创建超级管理员用户
    await createSuperAdmin();
    
    console.log('\n=== 系统数据初始化完成 ===');
}

// 创建角色数据
async function createRoles() {
    console.log('1. 开始创建角色数据...');
    
    for (const roleData of ROLES_DATA) {
        try {
            // 检查角色是否已存在
            const existingRole = await prisma.role.findUnique({
                where: { code: roleData.code }
            });
            
            if (existingRole) {
                console.log(`   ⚠️  角色 ${roleData.name} 已存在，跳过创建`);
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
            
            console.log(`   ✅ 成功创建角色: ${role.name}`);
            
        } catch (error) {
            console.error(`   ❌ 创建角色 ${roleData.name} 失败:`, error.message);
        }
    }
    
    // 显示角色统计
    const roleCount = await prisma.role.count();
    console.log(`   📊 角色总数: ${roleCount}`);
}

// 创建超级管理员
async function createSuperAdmin() {
    console.log('\n2. 开始创建超级管理员...');
    
    const phone = process.env.FIRST_SUPERUSER;
    const password = process.env.FIRST_SUPERUSER_PASSWORD;
    
    if (!phone || !password) {
        console.log('   ⚠️  未设置 FIRST_SUPERUSER 或 FIRST_SUPERUSER_PASSWORD 环境变量');
        console.log('   请在 .env 文件中设置后再创建超级管理员');
        return;
    }
    
    const hashed = await bcrypt.hash(password, 10);

    const exists = await prisma.user.findFirst({
        where: { roles: { has: 'SUPER_ADMIN' } },
    });
    
    if (!exists) {
        await prisma.user.create({
            data: {
                phone,
                name: '超级管理员',
                password: hashed,
                roles: ['SUPER_ADMIN'],
                status: true,
            },
        });
        console.log(`   ✅ 超级管理员已创建: ${phone}`);
    } else {
        console.log('   ℹ️  已存在超级管理员账号');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
