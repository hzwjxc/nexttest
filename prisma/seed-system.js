import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 测试系统数据
const TEST_SYSTEMS = [
  {
    name: '核心银行系统',
    description: '银行核心业务处理系统'
  },
  {
    name: '网上银行系统',
    description: '个人和企业网上银行服务系统'
  },
  {
    name: '手机银行系统',
    description: '移动端银行应用程序'
  },
  {
    name: '呼叫中心系统',
    description: '客户服务中心管理系统'
  },
  {
    name: '信贷管理系统',
    description: '贷款和信贷业务管理系统'
  },
  {
    name: '理财销售系统',
    description: '理财产品销售和管理系统'
  },
  {
    name: '支付清算系统',
    description: '支付和清算处理系统'
  },
  {
    name: '风险管理系统',
    description: '业务风险识别和控制系统'
  },
  {
    name: '客户关系管理系统',
    description: '客户信息和服务管理系统'
  },
  {
    name: '财务管理系统',
    description: '财务管理与会计核算系统'
  },
  {
    name: '人力资源系统',
    description: '员工管理和人事系统'
  },
  {
    name: '办公自动化系统',
    description: '内部办公和协作系统'
  }
];

// 测试用例数据
const TEST_CASES = [
  {
    title: '用户登录功能测试',
    system: '网上银行系统',
    precondition: '用户已注册并激活账户',
    testSteps: JSON.stringify([
      { description: '打开网上银行登录页面', expectedResult: '显示登录表单' },
      { description: '输入正确的用户名和密码', expectedResult: '输入框显示相应内容' },
      { description: '点击登录按钮', expectedResult: '成功跳转到用户主页' }
    ]),
    explanation: '验证用户能够正常登录网上银行系统'
  },
  {
    title: '转账功能测试',
    system: '手机银行系统',
    precondition: '用户已登录且账户余额充足',
    testSteps: JSON.stringify([
      { description: '进入转账功能页面', expectedResult: '显示转账选项' },
      { description: '选择转账类型并填写收款人信息', expectedResult: '表单验证通过' },
      { description: '输入转账金额并确认', expectedResult: '显示转账确认页面' },
      { description: '输入交易密码完成转账', expectedResult: '转账成功提示' }
    ]),
    explanation: '验证手机银行转账功能的完整流程'
  },
  {
    title: '理财产品购买测试',
    system: '理财销售系统',
    precondition: '用户已登录且风险评估已完成',
    testSteps: JSON.stringify([
      { description: '浏览理财产品列表', expectedResult: '显示可购买产品' },
      { description: '选择目标理财产品查看详情', expectedResult: '显示产品详细信息' },
      { description: '点击购买并输入购买金额', expectedResult: '进入购买确认页面' },
      { description: '确认购买信息并签署协议', expectedResult: '购买成功' }
    ]),
    explanation: '验证理财产品购买流程的正确性'
  },
  {
    title: '信用卡申请测试',
    system: '信贷管理系统',
    precondition: '用户已登录个人网银',
    testSteps: JSON.stringify([
      { description: '进入信用卡申请页面', expectedResult: '显示申请表单' },
      { description: '填写个人基本信息', expectedResult: '信息校验通过' },
      { description: '上传身份证等必要材料', expectedResult: '文件上传成功' },
      { description: '提交申请并等待审核', expectedResult: '显示申请提交成功' }
    ]),
    explanation: '验证信用卡在线申请流程'
  },
  {
    title: '客服热线接入测试',
    system: '呼叫中心系统',
    precondition: '拨打银行客服热线',
    testSteps: JSON.stringify([
      { description: '拨打客服电话955XX', expectedResult: '听到欢迎语音' },
      { description: '按照语音提示选择服务类型', expectedResult: '进入相应服务队列' },
      { description: '等待人工客服接听', expectedResult: '成功接入人工服务' },
      { description: '与客服人员进行问题咨询', expectedResult: '问题得到有效解答' }
    ]),
    explanation: '验证客服热线的服务质量和响应速度'
  },
  {
    title: 'ATM取款功能测试',
    system: '核心银行系统',
    precondition: '持有银行卡且账户余额充足',
    testSteps: JSON.stringify([
      { description: '插入银行卡到ATM机', expectedResult: '读卡成功，进入密码输入界面' },
      { description: '输入正确密码', expectedResult: '进入主菜单界面' },
      { description: '选择取款功能并输入金额', expectedResult: '显示取款确认信息' },
      { description: '确认取款并取走现金和卡片', expectedResult: '取款成功，打印凭条' }
    ]),
    explanation: '验证ATM取款功能的完整性和安全性'
  },
  {
    title: '企业网银批量付款测试',
    system: '网上银行系统',
    precondition: '企业账户已开通网银且余额充足',
    testSteps: JSON.stringify([
      { description: '企业操作员登录企业网银', expectedResult: '成功进入企业网银主页' },
      { description: '进入批量付款功能模块', expectedResult: '显示批量付款操作界面' },
      { description: '导入付款清单文件', expectedResult: '文件解析成功，显示付款明细' },
      { description: '审核付款信息并提交', expectedResult: '付款指令成功提交' },
      { description: '授权人员进行最终授权', expectedResult: '批量付款执行成功' }
    ]),
    explanation: '验证企业网银批量付款功能的准确性和效率'
  },
  {
    title: '贷款申请进度查询测试',
    system: '信贷管理系统',
    precondition: '已提交贷款申请',
    testSteps: JSON.stringify([
      { description: '登录个人网银或手机银行', expectedResult: '成功登录' },
      { description: '进入贷款申请查询页面', expectedResult: '显示贷款申请列表' },
      { description: '选择目标贷款申请查看详情', expectedResult: '显示申请详细进度' },
      { description: '查看各环节处理状态和时间节点', expectedResult: '信息显示完整准确' }
    ]),
    explanation: '验证贷款申请进度查询功能的及时性和准确性'
  }
];

async function main() {
  console.log('=== 开始创建众测系统管理种子数据 ===\n');
  
  // 1. 创建测试系统
  await createTestSystems();
  
  // 2. 创建测试用例
  await createTestCases();
  
  console.log('\n=== 众测系统管理种子数据创建完成 ===');
}

async function createTestSystems() {
  console.log('1. 开始创建测试系统...');
  
  let createdCount = 0;
  let skippedCount = 0;
  
  for (const systemData of TEST_SYSTEMS) {
    try {
      // 检查系统是否已存在
      const existingSystem = await prisma.testSystem.findUnique({
        where: { name: systemData.name }
      });
      
      if (existingSystem) {
        console.log(`   ⚠️  系统 ${systemData.name} 已存在，跳过创建`);
        skippedCount++;
        continue;
      }
      
      // 创建系统
      const system = await prisma.testSystem.create({
        data: {
          name: systemData.name,
          isActive: true
        }
      });
      
      console.log(`   ✅ 成功创建系统: ${system.name}`);
      createdCount++;
      
    } catch (error) {
      console.error(`   ❌ 创建系统 ${systemData.name} 失败:`, error.message);
    }
  }
  
  console.log(`   📊 测试系统创建完成: 新增 ${createdCount} 个, 跳过 ${skippedCount} 个`);
}

async function createTestCases() {
  console.log('\n2. 开始创建测试用例...');
  
  let createdCount = 0;
  let skippedCount = 0;
  
  // 获取所有系统名称用于验证
  const allSystems = await prisma.testSystem.findMany({
    select: { name: true }
  });
  
  const systemNames = allSystems.map(sys => sys.name);
  
  for (const caseData of TEST_CASES) {
    try {
      // 验证所属系统是否存在
      if (!systemNames.includes(caseData.system)) {
        console.log(`   ⚠️  跳过用例 "${caseData.title}" - 所属系统 "${caseData.system}" 不存在`);
        skippedCount++;
        continue;
      }
      
      // 检查用例是否已存在
      const existingCase = await prisma.testCase.findFirst({
        where: { 
          title: caseData.title,
          system: caseData.system
        }
      });
      
      if (existingCase) {
        console.log(`   ⚠️  用例 ${caseData.title} 已存在，跳过创建`);
        skippedCount++;
        continue;
      }
      
      // 创建测试用例
      const testCase = await prisma.testCase.create({
        data: {
          title: caseData.title,
          system: caseData.system,
          precondition: caseData.precondition,
          testSteps: caseData.testSteps,
          explanation: caseData.explanation,
          isActive: true
        }
      });
      
      console.log(`   ✅ 成功创建用例: ${testCase.title} (${testCase.system})`);
      createdCount++;
      
    } catch (error) {
      console.error(`   ❌ 创建用例 ${caseData.title} 失败:`, error.message);
    }
  }
  
  console.log(`   📊 测试用例创建完成: 新增 ${createdCount} 个, 跳过 ${skippedCount} 个`);
}

main()
  .catch((e) => {
    console.error('执行出错:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });