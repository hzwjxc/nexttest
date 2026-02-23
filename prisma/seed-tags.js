import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 标签数据配置
const TAGS_DATA = [
  {
    name: '城市',
    category: '地理位置',
    description: '用户所在城市标签',
    rules: JSON.stringify([
      '北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', 
      '西安', '重庆', '天津', '苏州', '长沙', '郑州', '青岛', '大连',
      '厦门', '福州', '济南', '合肥', '昆明', '南宁', '石家庄', '太原',
      '哈尔滨', '长春', '沈阳', '呼和浩特', '银川', '兰州', '西宁', '乌鲁木齐',
      '拉萨', '海口', '三亚'
    ])
  },
  {
    name: '等级',
    category: '用户等级',
    description: '用户活跃等级标签',
    rules: JSON.stringify([
      '新人', '初级测试员', '中级测试员', '高级测试员', '资深老手', '专家级测试员',
      '三个月内活跃', '半年内活跃', '一年内活跃', '长期活跃用户'
    ])
  },
  {
    name: '技能专长',
    category: '专业技能',
    description: '用户专业技能标签',
    rules: JSON.stringify([
      '移动端测试', 'Android测试', 'iOS测试', 'Web测试', '小程序测试',
      '接口测试', '性能测试', '安全测试', '兼容性测试', '用户体验测试',
      '功能测试', '回归测试', '探索性测试', '自动化测试', '压力测试',
      '负载测试', '稳定性测试', '安装卸载测试', '升级测试', '边界测试'
    ])
  },
  {
    name: '设备类型',
    category: '测试设备',
    description: '用户常用测试设备类型',
    rules: JSON.stringify([
      'Android手机', 'iOS手机', 'Android平板', 'iPad', 'Windows电脑',
      'Mac电脑', 'Linux电脑', '多设备测试'
    ])
  },
  {
    name: '行业经验',
    category: '业务背景',
    description: '用户行业背景和经验',
    rules: JSON.stringify([
      '银行业务', '金融产品', '互联网金融', '移动支付', '电商系统',
      '社交平台', '企业服务', '政府项目', '教育行业', '医疗健康',
      '交通出行', '旅游酒店', '游戏娱乐', '工具软件', '生活服务'
    ])
  },
  {
    name: '参与频率',
    category: '活跃度',
    description: '用户参与测试活动的频率',
    rules: JSON.stringify([
      '高频参与者', '中频参与者', '低频参与者', '偶尔参与', '新用户',
      '稳定参与者', '核心用户', '金牌测试员'
    ])
  },
  {
    name: '年龄层次',
    category: '人口统计',
    description: '用户年龄段标签',
    rules: JSON.stringify([
      '18-25岁', '26-30岁', '31-35岁', '36-40岁', '41-45岁', '46-50岁', '50岁以上'
    ])
  },
  {
    name: '教育背景',
    category: '学历水平',
    description: '用户最高学历标签',
    rules: JSON.stringify([
      '大专', '本科', '硕士', '博士', '其他'
    ])
  },
  {
    name: '职业类型',
    category: '工作性质',
    description: '用户职业类别标签',
    rules: JSON.stringify([
      'IT技术人员', '产品经理', '设计师', '运营人员', '市场人员',
      '销售人员', '客服人员', '财务人员', '人事行政', '法务人员',
      '咨询顾问', '自由职业', '学生', '其他'
    ])
  },
  {
    name: '测试类型偏好',
    category: '测试偏好',
    description: '用户偏好的测试类型',
    rules: JSON.stringify([
      '功能测试为主', '性能测试为主', '用户体验测试为主', '安全测试为主',
      '兼容性测试为主', '全流程测试', '专项测试', '综合测试'
    ])
  },
  {
    name: '工作年限',
    category: '经验水平',
    description: '用户相关工作经验年限',
    rules: JSON.stringify([
      '1年以下', '1-3年', '3-5年', '5-10年', '10年以上'
    ])
  },
  {
    name: '收入水平',
    category: '经济状况',
    description: '用户年收入水平',
    rules: JSON.stringify([
      '5万以下', '5-10万', '10-15万', '15-20万', '20-30万', '30-50万', '50万以上'
    ])
  },
  {
    name: '婚姻状况',
    category: '家庭情况',
    description: '用户婚姻状态',
    rules: JSON.stringify([
      '未婚', '已婚', '离异', '丧偶'
    ])
  },
  {
    name: '缺陷质量',
    category: '测试能力',
    description: '用户提交缺陷的质量评级',
    rules: JSON.stringify([
      '高质量缺陷提交者', '中等质量缺陷提交者', '需要提升缺陷质量',
      '优秀建议提供者', '有效建议提交者', '一般建议提交者'
    ])
  },
  {
    name: '任务完成率',
    category: '执行效率',
    description: '用户任务完成情况',
    rules: JSON.stringify([
      '高完成率用户', '中等完成率用户', '低完成率用户',
      '按时完成任务', '经常延期', '任务质量高', '任务质量一般'
    ])
  }
];

async function main() {
  console.log('=== 开始创建标签管理系统数据 ===\n');
  
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const tagData of TAGS_DATA) {
    try {
      // 检查标签组是否已存在
      const existingTag = await prisma.testingTag.findUnique({
        where: { name: tagData.name }
      });
      
      if (existingTag) {
        // 更新已存在的标签组
        const updatedTag = await prisma.testingTag.update({
          where: { id: existingTag.id },
          data: {
            category: tagData.category,
            description: tagData.description,
            rules: tagData.rules,
            isActive: true
          }
        });
        
        console.log(`🔄 更新标签组: ${updatedTag.name} (${updatedTag.category})`);
        updatedCount++;
      } else {
        // 创建新的标签组
        const newTag = await prisma.testingTag.create({
          data: {
            name: tagData.name,
            category: tagData.category,
            description: tagData.description,
            rules: tagData.rules,
            isActive: true
          }
        });
        
        console.log(`✅ 创建标签组: ${newTag.name} (${newTag.category})`);
        createdCount++;
      }
      
    } catch (error) {
      console.error(`❌ 处理标签组 ${tagData.name} 失败:`, error.message);
      errorCount++;
    }
  }
  
  // 统计信息
  console.log('\n=== 创建完成统计 ===');
  console.log(`📊 新建标签组: ${createdCount} 个`);
  console.log(`📊 更新标签组: ${updatedCount} 个`);
  console.log(`📊 跳过标签组: ${skippedCount} 个`);
  console.log(`📊 创建失败: ${errorCount} 个`);
  
  // 显示标签组分类统计
  console.log('\n=== 标签组分类统计 ===');
  const categoryStats = {};
  TAGS_DATA.forEach(tag => {
    categoryStats[tag.category] = (categoryStats[tag.category] || 0) + 1;
  });
  
  Object.entries(categoryStats).forEach(([category, count]) => {
    console.log(`${category}: ${count} 个标签组`);
  });
  
  // 显示各标签组的标签数量
  console.log('\n=== 各标签组详情 ===');
  const allTags = await prisma.testingTag.findMany({
    where: { isActive: true },
    orderBy: { category: 'asc' }
  });
  
  let totalTagValues = 0;
  allTags.forEach(tag => {
    const tagValues = tag.rules ? JSON.parse(tag.rules) : [];
    totalTagValues += tagValues.length;
    console.log(`${tag.name} (${tag.category}): ${tagValues.length} 个标签值`);
  });
  
  console.log(`\n📈 标签组总数: ${allTags.length}`);
  console.log(`📈 标签值总数: ${totalTagValues}`);
  
  console.log('\n=== 标签管理系统数据创建完成 ===');
}

main()
  .catch((e) => {
    console.error('执行出错:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });