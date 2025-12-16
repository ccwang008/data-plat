import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { successResponse } from '../utils/response';
import prisma from '../utils/prisma';

const router = express.Router();

// 获取仪表盘数据
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const [
      dataSourceCount,
      exchangeTaskCount,
      runningTaskCount,
      pendingTaskCount,
    ] = await Promise.all([
      prisma.dataSource.count(),
      prisma.dataExchangeTask.count(),
      prisma.scheduledTask.count({ where: { status: '启用' } }),
      prisma.scheduledTask.count({ where: { status: '禁用' } }),
    ]);

    const stats = {
      dataSourceCount,
      exchangeTaskCount,
      runningTaskCount,
      pendingTaskCount,
    };

    return successResponse(res, stats);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || '获取数据失败',
    });
  }
});

// 获取最近任务
router.get('/recent-tasks', authenticate, async (req: AuthRequest, res) => {
  try {
    const tasks = await prisma.scheduledTask.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        createdAt: true,
      },
    });

    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      name: task.name,
      type: task.type,
      status: task.status === '启用' ? '运行中' : '已停止',
      createTime: task.createdAt.toLocaleString('zh-CN'),
    }));

    return successResponse(res, formattedTasks);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || '获取数据失败',
    });
  }
});

export default router;
