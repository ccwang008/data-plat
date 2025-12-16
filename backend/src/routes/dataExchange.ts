import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import prisma from '../utils/prisma';

const router = express.Router();

// 获取所有交换任务
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const tasks = await prisma.dataExchangeTask.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, tasks);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取任务失败', 500);
  }
});

// 获取单个任务
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.dataExchangeTask.findUnique({
      where: { id },
    });
    
    if (!task) {
      return errorResponse(res, '任务不存在', 404);
    }

    return successResponse(res, task);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取任务失败', 500);
  }
});

// 创建交换任务
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, source, target, schedule } = req.body;

    if (!name || !source || !target || !schedule) {
      return errorResponse(res, '缺少必要参数', 400);
    }

    const newTask = await prisma.dataExchangeTask.create({
      data: {
        name,
        source,
        target,
        status: '已停止',
        schedule,
        lastRunTime: null,
        nextRunTime: null,
      },
    });

    return successResponse(res, newTask, '创建成功', 201);
  } catch (error: any) {
    return errorResponse(res, error.message || '创建任务失败', 500);
  }
});

// 更新任务状态
router.patch('/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const task = await prisma.dataExchangeTask.findUnique({
      where: { id },
    });

    if (!task) {
      return errorResponse(res, '任务不存在', 404);
    }

    const updatedTask = await prisma.dataExchangeTask.update({
      where: { id },
      data: { status },
    });

    return successResponse(res, updatedTask, '状态更新成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '更新状态失败', 500);
  }
});

// 删除任务
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.dataExchangeTask.findUnique({
      where: { id },
    });

    if (!task) {
      return errorResponse(res, '任务不存在', 404);
    }

    await prisma.dataExchangeTask.delete({
      where: { id },
    });

    return successResponse(res, null, '删除成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '删除任务失败', 500);
  }
});

export default router;
