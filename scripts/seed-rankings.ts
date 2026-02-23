import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 模拟用户数据
const mockUsers = [
  { name: '张三', department: '广州分行', organization: '华南区域' },
  { name: '李四', department: '深圳分行', organization: '华南区域' },
  { name: '王五', department: '上海分行', organization: '华东区域' },
  { name: '赵六', department: '北京分行', organization: '华北区域' },
  { name: '钱七', department: '广州分行', organization: '华南区域' },
  { name: '孙八', department: '深圳分行', organization: '华南区域' },
  { name: '周九', department: '上海分行', organization: '华东区域' },
  { name: '吴十', department: '北京分行', organization: '华北区域' },
  { name: '郑十一', department: '广州分行', organization: '华南区域' },
  { name: '王十二', department: '深圳分行', organization: '华南区域' },
  { name: '李十三', department: '上海分行', organization: '华东区域' },
  { name: '刘十四', department: '北京分行', organization: '华北区域' },
  { name: '陈十五', department: '广州分行', organization: '华南区域' },
  { name: '杨十六', department: '深圳分行', organization: '华南区域' },
  { name: '黄十七', department: '上海分行', organization: '华东区域' },
  { name: '周十八', department: '成都分行', organization: '西南区域' },
  { name: '吴十九', department: '武汉分行', organization: '华中区域' },
  { name: '郑二十', department: '杭州分行', organization: '华东区域' },
];

// 生成随机日期
function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 生成随机积分
function getRandomPoints(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('🌱 开始生成排行榜模拟数据...');

  // 1. 创建或获取测试用户
  console.log('📝 创建测试用户...');
  const users = [];
  for (const mockUser of mockUsers) {
    const user = await prisma.user.upsert({
      where: {
        phone: `1380000${String(mockUsers.indexOf(mockUser)).padStart(4, '0')}`
      },
      update: {
        name: mockUser.name,
        department: mockUser.department,
        organization: mockUser.organization,
      },
      create: {
        name: mockUser.name,
        phone: `1380000${String(mockUsers.indexOf(mockUser)).padStart(4, '0')}`,
        department: mockUser.department,
        organization: mockUser.organization,
        password: '$2a$10$example.hash', // 示例密码哈希
        roles: ['TESTER'],
        totalPoints: 0,
        availablePoints: 0,
        experience: 0,
      },
    });
    users.push(user);
  }
  console.log(`✅ 创建了 ${users.length} 个测试用户`);

  // 2. 创建测试任务
  console.log('📝 创建测试任务...');
  const testSystem = await prisma.testSystem.findFirst();

  if (!testSystem) {
    console.log('❌ 未找到测试系统，请先运行系统初始化脚本');
    return;
  }

  const task = await prisma.testTask.upsert({
    where: { id: 'test-task-for-ranking' },
    update: {},
    create: {
      id: 'test-task-for-ranking',
      title: '排行榜测试任务',
      description: '用于生成排行榜数据的测试任务',
      system: testSystem.name,
      type: 'FUNCTIONAL',
      status: 'EXECUTING',
      testTypes: ['WEB', 'ANDROID', 'IOS'],
      personTags: [],
      startTime: new Date('2024-01-01'),
      endTime: new Date('2026-12-31'),
      maxParticipants: 100,
      currentParticipants: users.length,
      createdBy: users[0]!.id,
    },
  });
  console.log('✅ 测试任务已创建');

  // 3. 创建任务订单
  console.log('📝 创建任务订单...');
  const taskOrders = [];
  for (const user of users) {
    const order = await prisma.testTaskOrder.upsert({
      where: {
        taskId_userId: {
          taskId: task.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        taskId: task.id,
        userId: user.id,
        status: 'IN_PROGRESS',
        startedAt: new Date('2024-01-01'),
      },
    });
    taskOrders.push(order);
  }
  console.log(`✅ 创建了 ${taskOrders.length} 个任务订单`);

  // 3. 创建测试用例
  console.log('📝 创建测试用例...');
  const testCase = await prisma.testCase.upsert({
    where: { id: 'test-case-for-ranking' },
    update: {},
    create: {
      id: 'test-case-for-ranking',
      title: '排行榜测试用例',
      system: testSystem.name,
      testSteps: JSON.stringify([
        { step: '步骤1', expected: '预期结果1' },
        { step: '步骤2', expected: '预期结果2' },
      ]),
      precondition: '无特殊前置条件',
      type: 'FUNCTIONAL',
      tasks: {
        connect: [{ id: task.id }]
      }
    },
  });
  console.log('✅ 测试用例已创建');

  // 4. 计算时间范围
  console.log('\n📅 计算时间范围...');
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 上个月
  const lastMonth = currentMonth - 1;
  const lastMonthYear = lastMonth < 0 ? currentYear - 1 : currentYear;
  const lastMonthNum = lastMonth < 0 ? 11 : lastMonth;
  const lastMonthStart = new Date(lastMonthYear, lastMonthNum, 1, 0, 0, 0, 0);
  const lastMonthEnd = new Date(lastMonthYear, lastMonthNum + 1, 0, 23, 59, 59, 999);

  // 上个季度
  const currentQuarter = Math.floor(currentMonth / 3);
  const lastQuarter = currentQuarter - 1;
  let lastQuarterStart: Date;
  let lastQuarterEnd: Date;

  if (lastQuarter < 0) {
    // 去年第四季度
    lastQuarterStart = new Date(currentYear - 1, 9, 1, 0, 0, 0, 0); // 10月1日
    lastQuarterEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59, 999); // 12月31日
  } else {
    // 今年的上个季度
    const quarterStartMonth = lastQuarter * 3;
    lastQuarterStart = new Date(currentYear, quarterStartMonth, 1, 0, 0, 0, 0);
    lastQuarterEnd = new Date(currentYear, quarterStartMonth + 3, 0, 23, 59, 59, 999);
  }

  // 两个月前（用于季度数据补充）
  const twoMonthsAgo = currentMonth - 2;
  const twoMonthsAgoYear = twoMonthsAgo < 0 ? currentYear - 1 : currentYear;
  const twoMonthsAgoNum = twoMonthsAgo < 0 ? 12 + twoMonthsAgo : twoMonthsAgo;
  const twoMonthsAgoStart = new Date(twoMonthsAgoYear, twoMonthsAgoNum, 1, 0, 0, 0, 0);
  const twoMonthsAgoEnd = new Date(twoMonthsAgoYear, twoMonthsAgoNum + 1, 0, 23, 59, 59, 999);

  console.log(`📅 当前时间: ${now.toLocaleDateString()}`);
  console.log(`📅 上月范围: ${lastMonthStart.toLocaleDateString()} - ${lastMonthEnd.toLocaleDateString()}`);
  console.log(`📅 上季范围: ${lastQuarterStart.toLocaleDateString()} - ${lastQuarterEnd.toLocaleDateString()}`);

  // 5. 生成积分交易记录（上月榜和上季榜）
  console.log('\n💰 生成积分交易记录...');

  let totalPointsCreated = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i]!;

    // 上个月积分（100-500分）
    const lastMonthPoints = getRandomPoints(100, 500);
    const lastMonthTransactionCount = Math.floor(lastMonthPoints / 50); // 每次50分左右

    for (let j = 0; j < lastMonthTransactionCount; j++) {
      const points = Math.floor(lastMonthPoints / lastMonthTransactionCount);
      await prisma.pointTransaction.create({
        data: {
          userId: user.id,
          points: points,
          type: 'EARN',
          description: `完成任务获得积分 - 上月数据 ${j + 1}`,
          status: 'COMPLETED',
          createdAt: getRandomDate(lastMonthStart, lastMonthEnd),
        },
      });
      totalPointsCreated++;
    }

    // 上个季度其他月份的积分（如果上季度包含多个月）
    if (lastQuarterStart < lastMonthStart) {
      const quarterPoints = getRandomPoints(200, 800);
      const quarterTransactionCount = Math.floor(quarterPoints / 100);

      for (let j = 0; j < quarterTransactionCount; j++) {
        const points = Math.floor(quarterPoints / quarterTransactionCount);
        await prisma.pointTransaction.create({
          data: {
            userId: user.id,
            points: points,
            type: 'EARN',
            description: `完成任务获得积分 - 上季其他月份数据 ${j + 1}`,
            status: 'COMPLETED',
            createdAt: getRandomDate(lastQuarterStart, new Date(lastMonthStart.getTime() - 1)),
          },
        });
        totalPointsCreated++;
      }
    }

    // 两个月前的积分（用于补充季度数据）
    if (twoMonthsAgoStart >= lastQuarterStart) {
      const twoMonthsPoints = getRandomPoints(150, 600);
      const twoMonthsTransactionCount = Math.floor(twoMonthsPoints / 75);

      for (let j = 0; j < twoMonthsTransactionCount; j++) {
        const points = Math.floor(twoMonthsPoints / twoMonthsTransactionCount);
        await prisma.pointTransaction.create({
          data: {
            userId: user.id,
            points: points,
            type: 'EARN',
            description: `完成任务获得积分 - 两月前数据 ${j + 1}`,
            status: 'COMPLETED',
            createdAt: getRandomDate(twoMonthsAgoStart, twoMonthsAgoEnd),
          },
        });
        totalPointsCreated++;
      }
    }

    if ((i + 1) % 5 === 0) {
      console.log(`  ✓ 已为 ${i + 1}/${users.length} 个用户生成积分记录`);
    }
  }

  console.log(`✅ 生成了 ${totalPointsCreated} 条积分交易记录`);

  // 6. 生成缺陷记录（上月榜和上季榜）
  console.log('\n🐛 生成缺陷记录...');

  const severities: Array<'CRITICAL' | 'MAJOR' | 'MINOR' | 'TRIVIAL'> = ['CRITICAL', 'MAJOR', 'MINOR', 'TRIVIAL'];
  let totalDefectsCreated = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i]!;
    const order = taskOrders.find(o => o.userId === user.id)!;

    // 上个月缺陷（5-20个）
    const lastMonthDefectCount = getRandomPoints(5, 20);

    for (let j = 0; j < lastMonthDefectCount; j++) {
      await prisma.defect.create({
        data: {
          taskId: task.id,
          taskOrderId: order.id,
          testCaseId: testCase.id,
          userId: user.id,
          title: `上月测试缺陷 ${j + 1} - ${user.name}`,
          description: `这是一个测试缺陷描述，用于生成上月排行榜数据`,
          type: 'BUG',
          severity: severities[Math.floor(Math.random() * severities.length)],
          status: 'APPROVED',
          basePoints: getRandomPoints(5, 20),
          earnedPoints: getRandomPoints(5, 20),
          createdAt: getRandomDate(lastMonthStart, lastMonthEnd),
        },
      });
      totalDefectsCreated++;
    }

    // 上个季度其他月份的缺陷（如果季度包含多个月）
    if (lastQuarterStart < lastMonthStart) {
      const quarterDefectCount = getRandomPoints(10, 30);

      for (let j = 0; j < quarterDefectCount; j++) {
        await prisma.defect.create({
          data: {
            taskId: task.id,
            taskOrderId: order.id,
            testCaseId: testCase.id,
            userId: user.id,
            title: `上季其他月份测试缺陷 ${j + 1} - ${user.name}`,
            description: `这是一个测试缺陷描述，用于生成上季排行榜数据`,
            type: 'BUG',
            severity: severities[Math.floor(Math.random() * severities.length)],
            status: 'APPROVED',
            basePoints: getRandomPoints(5, 20),
            earnedPoints: getRandomPoints(5, 20),
            createdAt: getRandomDate(lastQuarterStart, new Date(lastMonthStart.getTime() - 1)),
          },
        });
        totalDefectsCreated++;
      }
    }

    // 两个月前的缺陷（用于补充季度数据）
    if (twoMonthsAgoStart >= lastQuarterStart) {
      const twoMonthsDefectCount = getRandomPoints(8, 25);

      for (let j = 0; j < twoMonthsDefectCount; j++) {
        await prisma.defect.create({
          data: {
            taskId: task.id,
            taskOrderId: order.id,
            testCaseId: testCase.id,
            userId: user.id,
            title: `两月前测试缺陷 ${j + 1} - ${user.name}`,
            description: `这是一个测试缺陷描述，用于生成季度排行榜数据`,
            type: 'BUG',
            severity: severities[Math.floor(Math.random() * severities.length)],
            status: 'APPROVED',
            basePoints: getRandomPoints(5, 20),
            earnedPoints: getRandomPoints(5, 20),
            createdAt: getRandomDate(twoMonthsAgoStart, twoMonthsAgoEnd),
          },
        });
        totalDefectsCreated++;
      }
    }

    // 添加少量无效缺陷（不计入排行榜）- 分散在上个月
    const invalidDefectCount = getRandomPoints(1, 3);
    for (let j = 0; j < invalidDefectCount; j++) {
      await prisma.defect.create({
        data: {
          taskId: task.id,
          taskOrderId: order.id,
          testCaseId: testCase.id,
          userId: user.id,
          title: `无效缺陷 ${j + 1} - ${user.name}`,
          description: `这是一个无效的缺陷，不应计入排行榜`,
          type: 'BUG',
          severity: 'INVALID',
          status: 'REJECTED',
          basePoints: 0,
          earnedPoints: 0,
          createdAt: getRandomDate(lastMonthStart, lastMonthEnd),
        },
      });
      totalDefectsCreated++;
    }

    if ((i + 1) % 5 === 0) {
      console.log(`  ✓ 已为 ${i + 1}/${users.length} 个用户生成缺陷记录`);
    }
  }

  console.log(`✅ 生成了 ${totalDefectsCreated} 条缺陷记录`);

  // 7. 统计验证
  console.log('\n📊 数据统计验证...');

  const lastMonthPointsStats = await prisma.pointTransaction.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      type: 'EARN',
    },
    _sum: { points: true },
    _count: true,
  });

  const lastQuarterPointsStats = await prisma.pointTransaction.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: lastQuarterStart, lte: lastQuarterEnd },
      type: 'EARN',
    },
    _sum: { points: true },
    _count: true,
  });

  const lastMonthDefectStats = await prisma.defect.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      severity: { not: 'INVALID' },
    },
    _count: true,
  });

  const lastQuarterDefectStats = await prisma.defect.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: lastQuarterStart, lte: lastQuarterEnd },
      severity: { not: 'INVALID' },
    },
    _count: true,
  });

  console.log(`\n上月积分排行:`);
  console.log(`  - 有积分的用户数: ${lastMonthPointsStats.length}`);
  console.log(`  - 最高积分: ${Math.max(...lastMonthPointsStats.map(s => s._sum.points ?? 0))}`);
  console.log(`  - 最低积分: ${Math.min(...lastMonthPointsStats.map(s => s._sum.points ?? 0))}`);

  console.log(`\n上季积分排行:`);
  console.log(`  - 有积分的用户数: ${lastQuarterPointsStats.length}`);
  console.log(`  - 最高积分: ${Math.max(...lastQuarterPointsStats.map(s => s._sum.points ?? 0))}`);
  console.log(`  - 最低积分: ${Math.min(...lastQuarterPointsStats.map(s => s._sum.points ?? 0))}`);

  console.log(`\n上月贡献排行:`);
  console.log(`  - 有贡献的用户数: ${lastMonthDefectStats.length}`);
  console.log(`  - 最多缺陷数: ${Math.max(...lastMonthDefectStats.map(s => s._count))}`);
  console.log(`  - 最少缺陷数: ${Math.min(...lastMonthDefectStats.map(s => s._count))}`);

  console.log(`\n上季贡献排行:`);
  console.log(`  - 有贡献的用户数: ${lastQuarterDefectStats.length}`);
  console.log(`  - 最多缺陷数: ${Math.max(...lastQuarterDefectStats.map(s => s._count))}`);
  console.log(`  - 最少缺陷数: ${Math.min(...lastQuarterDefectStats.map(s => s._count))}`);

  console.log('\n✅ 排行榜模拟数据生成完成！');
  console.log('\n💡 现在可以访问 http://localhost:3000/crowdsource/academy/rankingList 查看排行榜');
  console.log('   月榜：显示上个月的数据');
  console.log('   季榜：显示上个季度的数据');
}

main()
  .catch((e) => {
    console.error('❌ 生成数据时出错:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
