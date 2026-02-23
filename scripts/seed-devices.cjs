const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDevices() {
  try {
    console.log('开始插入设备数据...');
    
    // 清空现有设备数据
    await prisma.device.deleteMany({});
    console.log('已清空现有设备数据');
    
    // 插入示例设备数据
    const devices = [
      {
        brand: '华为',
        brandZh: '华为',
        model: 'P60',
        modelAlias: 'Mate 50 Pro',
        systemVersion: '17.4.2',
        resolution: '2700 x 1224',
        cpuModel: '麒麟9000S',
        cpuCores: 8,
        memory: '12GB',
        sdkVersion: '33',
        cpuFrequency: '3.1GHz',
      },
      {
        brand: '苹果',
        brandZh: 'Apple',
        model: 'iPhone 15 Pro',
        modelAlias: 'A3107',
        systemVersion: '17.4',
        resolution: '2556 x 1179',
        cpuModel: 'A17 Pro',
        cpuCores: 6,
        memory: '8GB',
        sdkVersion: '34',
        cpuFrequency: '3.78GHz',
      },
      {
        brand: '小米',
        brandZh: '小米',
        model: '14 Ultra',
        modelAlias: 'Xiaomi 14U',
        systemVersion: '14.0',
        resolution: '3200 x 1440',
        cpuModel: '骁龙8 Gen3',
        cpuCores: 8,
        memory: '16GB',
        sdkVersion: '34',
        cpuFrequency: '3.3GHz',
      },
      {
        brand: '三星',
        brandZh: 'Samsung',
        model: 'Galaxy S24 Ultra',
        modelAlias: 'SM-S9280',
        systemVersion: '14.0',
        resolution: '3120 x 1440',
        cpuModel: '骁龙8 Gen3',
        cpuCores: 8,
        memory: '12GB',
        sdkVersion: '34',
        cpuFrequency: '3.39GHz',
      },
      {
        brand: 'OPPO',
        brandZh: 'OPPO',
        model: 'Find X7 Ultra',
        modelAlias: 'PEEM00',
        systemVersion: '14.0',
        resolution: '3168 x 1440',
        cpuModel: '天玑9300',
        cpuCores: 8,
        memory: '16GB',
        sdkVersion: '34',
        cpuFrequency: '3.25GHz',
      },
      {
        brand: 'vivo',
        brandZh: 'vivo',
        model: 'X100 Pro',
        modelAlias: 'V2303A',
        systemVersion: '14.0',
        resolution: '3120 x 1440',
        cpuModel: '天玑9300',
        cpuCores: 8,
        memory: '16GB',
        sdkVersion: '34',
        cpuFrequency: '3.25GHz',
      },
      {
        brand: '荣耀',
        brandZh: '荣耀',
        model: 'Magic6 Pro',
        modelAlias: 'ELN-AN00',
        systemVersion: '14.0',
        resolution: '2800 x 1280',
        cpuModel: '骁龙8 Gen3',
        cpuCores: 8,
        memory: '16GB',
        sdkVersion: '34',
        cpuFrequency: '3.3GHz',
      },
      {
        brand: '一加',
        brandZh: 'OnePlus',
        model: '12',
        modelAlias: 'CPH2581',
        systemVersion: '14.0',
        resolution: '3216 x 1440',
        cpuModel: '骁龙8 Gen3',
        cpuCores: 8,
        memory: '16GB',
        sdkVersion: '34',
        cpuFrequency: '3.3GHz',
      },
      {
        brand: '魅族',
        brandZh: 'Meizu',
        model: '21 Pro',
        modelAlias: 'M2182',
        systemVersion: '11.0',
        resolution: '2340 x 1080',
        cpuModel: '骁龙8 Gen3',
        cpuCores: 8,
        memory: '12GB',
        sdkVersion: '34',
        cpuFrequency: '3.3GHz',
      },
      {
        brand: '努比亚',
        brandZh: 'Nubia',
        model: '红魔9 Pro',
        modelAlias: 'NX729J',
        systemVersion: '14.0',
        resolution: '2480 x 1116',
        cpuModel: '骁龙8 Gen3',
        cpuCores: 8,
        memory: '16GB',
        sdkVersion: '34',
        cpuFrequency: '3.3GHz',
      }
    ];

    // 批量插入设备数据
    for (const device of devices) {
      await prisma.device.create({
        data: device
      });
    }

    console.log(`成功插入 ${devices.length} 条设备数据`);
    
    // 验证插入结果
    const count = await prisma.device.count();
    console.log(`当前设备总数: ${count}`);
    
  } catch (error) {
    console.error('插入设备数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDevices();