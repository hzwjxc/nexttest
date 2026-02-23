// 测试日期筛选逻辑
const startDate = '2026-01-26';
const endDate = '2026-01-26';

// 当前后端的转换逻辑
const startDateTime = new Date(startDate + 'T00:00:00+08:00');
const endDateTime = new Date(endDate + 'T23:59:59.999+08:00');

console.log('筛选条件: 2026-01-26 至 2026-01-26');
console.log('='.repeat(80));
console.log('开始时间（东八区）:', startDate + 'T00:00:00+08:00');
console.log('开始时间（UTC）:', startDateTime.toISOString());
console.log('');
console.log('结束时间（东八区）:', endDate + 'T23:59:59.999+08:00');
console.log('结束时间（UTC）:', endDateTime.toISOString());
console.log('');

// 测试数据
const testData = [
  {
    title: '任务名称1',
    createdAt: '2026-01-26T16:42:08.631Z',
  },
  {
    title: '111',
    createdAt: '2026-01-27T08:51:55.060Z',
  },
];

console.log('测试数据:');
console.log('='.repeat(80));
testData.forEach((task) => {
  const taskDate = new Date(task.createdAt);
  const inRange = taskDate >= startDateTime && taskDate <= endDateTime;
  console.log(`${task.title}:`);
  console.log(`  UTC时间: ${task.createdAt}`);
  console.log(`  是否在范围内: ${inRange ? '✓ 是' : '✗ 否'}`);
  console.log('');
});
