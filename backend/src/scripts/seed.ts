import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  // 创建默认用户
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: '管理员',
      status: '启用',
    },
  });

  const user = await prisma.user.upsert({
    where: { username: 'user1' },
    update: {},
    create: {
      username: 'user1',
      email: 'user1@example.com',
      password: userPassword,
      role: '普通用户',
      status: '启用',
    },
  });

  // 创建默认角色
  const adminRole = await prisma.role.upsert({
    where: { name: '管理员' },
    update: {},
    create: {
      name: '管理员',
      description: '拥有所有权限',
      permissions: ['数据源管理', '数据交换', 'ETL', '数据采集', '任务调度', '权限管理'],
      userCount: 1,
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: '普通用户' },
    update: {},
    create: {
      name: '普通用户',
      description: '基础数据查看权限',
      permissions: ['数据源查看', '数据交换查看'],
      userCount: 5,
    },
  });

  console.log('数据库初始化完成！');
  console.log('默认用户：');
  console.log('  管理员: admin / admin123');
  console.log('  普通用户: user1 / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

