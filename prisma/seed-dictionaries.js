import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 数据字典配置数据
const DICTIONARIES_DATA = [
  {
    code: 'DEFECT_SEVERITY',
    name: '缺陷严重等级',
    category: 'DEFECT',
    description: '缺陷的严重程度分类',
    valueType: 'LIST',
    items: [
      {
        code: 'CRITICAL',
        label: '致命',
        value: '40',
        description: '系统崩溃、数据丢失等严重问题',
        sort: 1
      },
      {
        code: 'MAJOR',
        label: '严重',
        value: '30',
        description: '主要功能不可用',
        sort: 2
      },
      {
        code: 'MINOR',
        label: '一般',
        value: '20',
        description: '功能有缺陷但可用',
        sort: 3
      },
      {
        code: 'TRIVIAL',
        label: '轻微',
        value: '10',
        description: '界面、文案等小问题',
        sort: 4
      },
      {
        code: 'INVALID',
        label: '无效',
        value: '0',
        description: '不是缺陷',
        sort: 5
      }
    ]
  },
  {
    code: 'SUGGESTION_LEVEL',
    name: '建议等级',
    category: 'SUGGESTION',
    description: '用户建议的质量等级',
    valueType: 'LIST',
    items: [
      {
        code: 'EXCELLENT_SPECIAL',
        label: '特别优秀',
        value: '50',
        description: '非常有价值的建议',
        sort: 1
      },
      {
        code: 'EXCELLENT',
        label: '优秀',
        value: '40',
        description: '有价值的建议',
        sort: 2
      },
      {
        code: 'VALID',
        label: '有效',
        value: '20',
        description: '有效的建议',
        sort: 3
      },
      {
        code: 'INVALID',
        label: '无效',
        value: '0',
        description: '不是有效建议',
        sort: 4
      }
    ]
  },
  {
    code: 'TEST_TASK_TYPE',
    name: '测试任务类型',
    category: 'TASK',
    description: '众测任务的类型分类',
    valueType: 'LIST',
    items: [
      {
        code: 'FUNCTIONAL',
        label: '功能测试类',
        value: '功能测试',
        description: '测试系统功能是否正常',
        sort: 1
      },
      {
        code: 'UX_SURVEY',
        label: '问卷调查类',
        value: '用户体验调研',
        description: '收集用户对产品的体验反馈',
        sort: 2
      },
      {
        code: 'INVITATION_REWARD',
        label: '邀请有奖类',
        value: '邀请奖励活动',
        description: '通过邀请好友参与获得奖励',
        sort: 3
      }
    ]
  },
  {
    code: 'TEST_DEVICE_TYPE',
    name: '测试设备类型',
    category: 'DEVICE',
    description: '测试使用的设备类型',
    valueType: 'LIST',
    items: [
      {
        code: 'ANDROID_PHONE',
        label: 'Android手机',
        value: '安卓手机',
        description: 'Android系统智能手机',
        sort: 1
      },
      {
        code: 'IOS_PHONE',
        label: 'iOS手机',
        value: '苹果手机',
        description: 'iOS系统智能手机',
        sort: 2
      },
      {
        code: 'ANDROID_TABLET',
        label: 'Android平板',
        value: '安卓平板',
        description: 'Android系统平板电脑',
        sort: 3
      },
      {
        code: 'IPAD',
        label: 'iPad',
        value: 'iPad',
        description: '苹果平板电脑',
        sort: 4
      },
      {
        code: 'WINDOWS_PC',
        label: 'Windows电脑',
        value: 'Windows电脑',
        description: 'Windows系统个人电脑',
        sort: 5
      },
      {
        code: 'MAC_PC',
        label: 'Mac电脑',
        value: 'Mac电脑',
        description: '苹果Mac个人电脑',
        sort: 6
      },
      {
        code: 'MULTI_DEVICE',
        label: '多设备测试',
        value: '多设备',
        description: '需要多种设备配合测试',
        sort: 7
      }
    ]
  },
  {
    code: 'USER_TESTING_LEVEL',
    name: '用户测试等级',
    category: 'USER',
    description: '用户的测试经验和能力等级',
    valueType: 'LIST',
    items: [
      {
        code: 'LEVEL_1',
        label: '注册新人',
        value: '新人',
        description: '刚注册的新用户，经验值0-499',
        sort: 1
      },
      {
        code: 'LEVEL_2',
        label: '资深老手',
        value: '资深老手',
        description: '有一定经验的测试用户，经验值500-799',
        sort: 2
      },
      {
        code: 'LEVEL_3',
        label: '资深老手2',
        value: '高级测试员',
        description: '经验丰富测试用户，经验值800+',
        sort: 3
      }
    ]
  },
  {
    code: 'TASK_STATUS',
    name: '任务状态',
    category: 'TASK',
    description: '任务的当前状态',
    valueType: 'LIST',
    items: [
      {
        code: 'SAVED',
        label: '已保存',
        value: '草稿',
        description: '任务已保存但未提交',
        sort: 1
      },
      {
        code: 'PREPARING',
        label: '准备中',
        value: '准备中',
        description: '任务正在准备阶段',
        sort: 2
      },
      {
        code: 'PENDING_PUBLISH',
        label: '待发布',
        value: '待发布',
        description: '等待发布到平台',
        sort: 3
      },
      {
        code: 'EXECUTING',
        label: '执行中',
        value: '进行中',
        description: '任务正在进行中',
        sort: 4
      },
      {
        code: 'EXECUTION_ENDED',
        label: '执行结束',
        value: '已结束',
        description: '任务执行完毕',
        sort: 5
      },
      {
        code: 'COMPLETED',
        label: '已完成',
        value: '已完成',
        description: '任务全部完成',
        sort: 6
      }
    ]
  },
  {
    code: 'DEFECT_CATEGORY',
    name: '缺陷分类',
    category: 'DEFECT',
    description: '缺陷所属的业务分类',
    valueType: 'LIST',
    items: [
      {
        code: 'FUNCTIONAL',
        label: '功能问题',
        value: '功能缺陷',
        description: '系统功能不符合预期',
        sort: 1
      },
      {
        code: 'PERFORMANCE',
        label: '性能问题',
        value: '性能缺陷',
        description: '系统响应速度、资源占用等问题',
        sort: 2
      },
      {
        code: 'SECURITY',
        label: '安全性问题',
        value: '安全缺陷',
        description: '系统安全漏洞或风险',
        sort: 3
      },
      {
        code: 'UX',
        label: '用户体验',
        value: '体验问题',
        description: '用户界面和交互体验问题',
        sort: 4
      },
      {
        code: 'COMPATIBILITY',
        label: '兼容性问题',
        value: '兼容性缺陷',
        description: '不同设备、浏览器兼容性问题',
        sort: 5
      }
    ]
  },
  {
    code: 'WITHDRAWAL_STATUS',
    name: '提现状态',
    category: 'FINANCE',
    description: '用户积分提现的状态',
    valueType: 'LIST',
    items: [
      {
        code: 'PENDING',
        label: '待处理',
        value: '待审核',
        description: '提现申请已提交，等待处理',
        sort: 1
      },
      {
        code: 'PROCESSING',
        label: '处理中',
        value: '处理中',
        description: '正在处理提现请求',
        sort: 2
      },
      {
        code: 'COMPLETED',
        label: '已完成',
        value: '已到账',
        description: '提现成功完成',
        sort: 3
      },
      {
        code: 'FAILED',
        label: '失败',
        value: '提现失败',
        description: '提现处理失败',
        sort: 4
      },
      {
        code: 'CANCELLED',
        label: '已取消',
        value: '已取消',
        description: '提现申请被取消',
        sort: 5
      }
    ]
  },
  {
    code: 'REWARD_STATUS',
    name: '奖励状态',
    category: 'REWARD',
    description: '用户奖励的发放状态',
    valueType: 'LIST',
    items: [
      {
        code: 'PENDING',
        label: '待审批',
        value: '待审批',
        description: '奖励等待审批',
        sort: 1
      },
      {
        code: 'APPROVED',
        label: '已批准',
        value: '已批准',
        description: '奖励已获批准',
        sort: 2
      },
      {
        code: 'REJECTED',
        label: '已驳回',
        value: '已驳回',
        description: '奖励申请被驳回',
        sort: 3
      },
      {
        code: 'ISSUED',
        label: '已发放',
        value: '已发放',
        description: '奖励已发放给用户',
        sort: 4
      }
    ]
  },
  {
    code: 'SYSTEM_TYPE',
    name: '系统类型',
    category: 'SYSTEM',
    description: '银行系统的业务类型',
    valueType: 'LIST',
    items: [
      {
        code: 'MOBILE_BANKING',
        label: '手机银行',
        value: '手机银行系统',
        description: '移动端银行服务系统',
        sort: 1
      },
      {
        code: 'ONLINE_BANKING',
        label: '网上银行',
        value: '网上银行系统',
        description: 'PC端网上银行系统',
        sort: 2
      },
      {
        code: 'WECHAT_MINIPROGRAM',
        label: '微信小程序',
        value: '微信银行小程序',
        description: '微信平台银行服务',
        sort: 3
      },
      {
        code: 'PAYMENT_SYSTEM',
        label: '支付系统',
        value: '支付清算系统',
        description: '银行支付结算系统',
        sort: 4
      },
      {
        code: 'CREDIT_CARD',
        label: '信用卡系统',
        value: '信用卡业务系统',
        description: '信用卡相关业务系统',
        sort: 5
      },
      {
        code: 'LOAN_SYSTEM',
        label: '贷款系统',
        value: '贷款业务系统',
        description: '个人/企业贷款系统',
        sort: 6
      }
    ]
  }
];

async function main() {
  console.log('=== 开始创建数据字典管理系统数据 ===\n');
  
  let createdDictCount = 0;
  let updatedDictCount = 0;
  let createdItemCount = 0;
  let updatedItemCount = 0;
  let errorCount = 0;
  
  for (const dictData of DICTIONARIES_DATA) {
    try {
      // 检查数据字典是否已存在
      let existingDict = await prisma.dataDictionary.findUnique({
        where: { code: dictData.code },
        include: { items: true }
      });
      
      if (existingDict) {
        // 更新已存在的字典
        const updatedDict = await prisma.dataDictionary.update({
          where: { id: existingDict.id },
          data: {
            name: dictData.name,
            category: dictData.category,
            description: dictData.description,
            valueType: dictData.valueType,
            isActive: true
          }
        });
        
        console.log(`🔄 更新数据字典: ${updatedDict.name} (${updatedDict.code})`);
        updatedDictCount++;
        
        // 更新或创建字典项
        for (const itemData of dictData.items) {
          const existingItem = existingDict.items.find(item => item.code === itemData.code);
          
          if (existingItem) {
            // 更新已存在的字典项
            await prisma.dataDictionaryItem.update({
              where: { id: existingItem.id },
              data: {
                label: itemData.label,
                value: itemData.value,
                description: itemData.description,
                sort: itemData.sort,
                isActive: true
              }
            });
            updatedItemCount++;
          } else {
            // 创建新的字典项
            await prisma.dataDictionaryItem.create({
              data: {
                dictionaryId: updatedDict.id,
                code: itemData.code,
                label: itemData.label,
                value: itemData.value,
                description: itemData.description,
                sort: itemData.sort,
                isActive: true
              }
            });
            createdItemCount++;
          }
        }
        
      } else {
        // 创建新的数据字典
        const newDict = await prisma.dataDictionary.create({
          data: {
            code: dictData.code,
            name: dictData.name,
            category: dictData.category,
            description: dictData.description,
            valueType: dictData.valueType,
            isActive: true,
            items: {
              create: dictData.items.map(item => ({
                code: item.code,
                label: item.label,
                value: item.value,
                description: item.description,
                sort: item.sort,
                isActive: true
              }))
            }
          },
          include: { items: true }
        });
        
        console.log(`✅ 创建数据字典: ${newDict.name} (${newDict.code}) - ${newDict.items.length}个字典项`);
        createdDictCount++;
        createdItemCount += newDict.items.length;
      }
      
    } catch (error) {
      console.error(`❌ 处理数据字典 ${dictData.code} 失败:`, error.message);
      errorCount++;
    }
  }
  
  // 统计信息
  console.log('\n=== 创建完成统计 ===');
  console.log(`📊 新建数据字典: ${createdDictCount} 个`);
  console.log(`📊 更新数据字典: ${updatedDictCount} 个`);
  console.log(`📊 新建字典项: ${createdItemCount} 个`);
  console.log(`📊 更新字典项: ${updatedItemCount} 个`);
  console.log(`📊 创建失败: ${errorCount} 个`);
  
  // 显示分类统计
  console.log('\n=== 数据字典分类统计 ===');
  const categoryStats = {};
  DICTIONARIES_DATA.forEach(dict => {
    categoryStats[dict.category] = (categoryStats[dict.category] || 0) + 1;
  });
  
  Object.entries(categoryStats).forEach(([category, count]) => {
    console.log(`${category}: ${count} 个数据字典`);
  });
  
  // 显示各字典详情
  console.log('\n=== 各数据字典详情 ===');
  const allDicts = await prisma.dataDictionary.findMany({
    where: { isActive: true },
    include: { items: { where: { isActive: true }, orderBy: { sort: 'asc' } } },
    orderBy: { category: 'asc' }
  });
  
  let totalItems = 0;
  allDicts.forEach(dict => {
    totalItems += dict.items.length;
    console.log(`${dict.name} (${dict.code}): ${dict.items.length} 个字典项`);
    dict.items.forEach(item => {
      console.log(`  - ${item.label} (${item.code}): ${item.value}`);
    });
  });
  
  console.log(`\n📈 数据字典总数: ${allDicts.length}`);
  console.log(`📈 字典项总数: ${totalItems}`);
  
  console.log('\n=== 数据字典管理系统数据创建完成 ===');
}

main()
  .catch((e) => {
    console.error('执行出错:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });