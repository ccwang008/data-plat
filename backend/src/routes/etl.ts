import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import prisma from '../utils/prisma';

const router = express.Router();

// 保存ETL流程
router.post('/flow', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id, name, nodes, edges } = req.body;

    if (!nodes || !edges) {
      return errorResponse(res, '缺少必要参数', 400);
    }

    const userId = req.user?.id || '';
    const flowName = name || `ETL流程-${Date.now()}`;

    let flow;
    if (id) {
      // 更新现有流程
      const existingFlow = await prisma.etlFlow.findUnique({
        where: { id },
      });

      if (!existingFlow) {
        return errorResponse(res, '流程不存在', 404);
      }

      flow = await prisma.etlFlow.update({
        where: { id },
        data: {
          name: flowName,
          nodes: nodes as any,
          edges: edges as any,
        },
      });
    } else {
      // 创建新流程
      flow = await prisma.etlFlow.create({
        data: {
          name: flowName,
          nodes: nodes as any,
          edges: edges as any,
          userId,
        },
      });
    }

    return successResponse(res, flow, '保存成功', 201);
  } catch (error: any) {
    return errorResponse(res, error.message || '保存流程失败', 500);
  }
});

// 获取ETL流程
router.get('/flow/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const flow = await prisma.etlFlow.findUnique({
      where: { id },
    });

    if (!flow) {
      return errorResponse(res, '流程不存在', 404);
    }

    return successResponse(res, flow);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取流程失败', 500);
  }
});

// 获取所有ETL流程
router.get('/flows', authenticate, async (req: AuthRequest, res) => {
  try {
    const flows = await prisma.etlFlow.findMany({
      where: {
        userId: req.user?.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, flows);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取流程列表失败', 500);
  }
});

// 删除ETL流程
router.delete('/flow/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const flow = await prisma.etlFlow.findUnique({
      where: { id },
    });
    
    if (!flow) {
      return errorResponse(res, '流程不存在', 404);
    }

    await prisma.etlFlow.delete({
      where: { id },
    });

    return successResponse(res, null, '删除成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '删除流程失败', 500);
  }
});

// 执行ETL流程
router.post('/flow/:id/execute', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const flow = await prisma.etlFlow.findUnique({
      where: { id },
    });

    if (!flow) {
      return errorResponse(res, '流程不存在', 404);
    }

    // TODO: 实际应该启动ETL执行引擎
    const executionId = `exec-${Date.now()}`;
    
    return successResponse(res, {
      executionId,
      status: 'running',
      message: 'ETL流程已启动',
    }, '执行成功', 202);
  } catch (error: any) {
    return errorResponse(res, error.message || '执行流程失败', 500);
  }
});

export default router;
