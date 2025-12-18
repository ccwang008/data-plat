import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import prisma from '../utils/prisma';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';

const router = express.Router();

// 获取所有任务
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const tasks = await prisma.scheduledTask.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, tasks);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取任务失败', 500);
  }
});

// 节点日志读取（简单版：全量返回，前端可做分页）
router.get('/node-instances/:id/log', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const nodeInst = await prisma.taskNodeInstance.findUnique({ where: { id } });
    if (!nodeInst) return errorResponse(res, '节点实例不存在', 404);
    if (!nodeInst.logPath) return successResponse(res, { log: nodeInst.log || null }, '无日志文件');
    try {
      const content = await fs.readFile(nodeInst.logPath, 'utf-8');
      return successResponse(res, { log: content, path: nodeInst.logPath });
    } catch (e: any) {
      return errorResponse(res, `日志读取失败: ${e?.message || e}`, 500);
    }
  } catch (error: any) {
    return errorResponse(res, error.message || '获取日志失败', 500);
  }
});

// 获取单个任务
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.scheduledTask.findUnique({
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

// 创建任务
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, type, cron } = req.body;

    if (!name || !type || !cron) {
      return errorResponse(res, '缺少必要参数', 400);
    }

    const nextRunTime = new Date(Date.now() + 3600000).toLocaleString('zh-CN');
    const newTask = await prisma.scheduledTask.create({
      data: {
        name,
        type,
        cron,
        status: '启用',
        lastRunTime: null,
        nextRunTime,
        runCount: 0,
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
    
    const task = await prisma.scheduledTask.findUnique({
      where: { id },
    });

    if (!task) {
      return errorResponse(res, '任务不存在', 404);
    }

    const updatedTask = await prisma.scheduledTask.update({
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
    const task = await prisma.scheduledTask.findUnique({
      where: { id },
    });

    if (!task) {
      return errorResponse(res, '任务不存在', 404);
    }

    await prisma.scheduledTask.delete({
      where: { id },
    });

    return successResponse(res, null, '删除成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '删除任务失败', 500);
  }
});

// -------------------- 新增：调度 DAG 流程（参考 DolphinScheduler 思路） --------------------

// 创建/更新流程定义（包含节点与边）
router.post('/flows', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      id,
      name,
      description,
      cron,
      timezone = 'Asia/Shanghai',
      status = 'paused',
      maxConcurrency = 1,
      nodes = [],
      edges = [],
      owner,
    } = req.body || {};

    if (!name) {
      return errorResponse(res, '缺少流程名称', 400);
    }

    // 基本校验
    if (!Array.isArray(nodes) || nodes.length === 0) {
      return errorResponse(res, '请至少提供一个节点', 400);
    }

    // 生成节点 ID，确保边引用正确
    const normalizedNodes = nodes.map((n: any) => ({
      id: n.id || randomUUID(),
      name: n.name || '未命名节点',
      type: n.type || 'shell',
      config: n.config || {},
      resources: n.resources || {},
      timeoutSeconds: n.timeoutSeconds ?? 0,
      retryCount: n.retryCount ?? 0,
      retryIntervalSeconds: n.retryIntervalSeconds ?? 60,
      position: n.position || {},
    }));
    const nodeIdSet = new Set(normalizedNodes.map((n: any) => n.id));

    const normalizedEdges = (edges || []).map((e: any) => ({
      id: e.id || randomUUID(),
      sourceId: e.sourceId,
      targetId: e.targetId,
      condition: e.condition || null,
    }));

    // 校验边引用的节点
    const invalidEdge = normalizedEdges.find(
      (e: any) => !nodeIdSet.has(e.sourceId) || !nodeIdSet.has(e.targetId)
    );
    if (invalidEdge) {
      return errorResponse(res, '边的 sourceId/targetId 必须指向已有节点', 400);
    }

    const flowId = id || randomUUID();
    const nowOwner = owner || (req.user as any)?.username || 'unknown';

    const result = await prisma.$transaction(async (tx) => {
      // upsert flow
      const flow = await tx.taskFlow.upsert({
        where: { id: flowId },
        update: {
          name,
          description,
          cron,
          timezone,
          status,
          maxConcurrency,
          owner: nowOwner,
        },
        create: {
          id: flowId,
          name,
          description,
          cron,
          timezone,
          status,
          maxConcurrency,
          owner: nowOwner,
        },
      });

      // 先清理旧节点和边（简单策略：全量替换）
      await tx.taskEdge.deleteMany({ where: { flowId: flow.id } });
      await tx.taskNode.deleteMany({ where: { flowId: flow.id } });

      await tx.taskNode.createMany({
        data: normalizedNodes.map((n: any) => ({
          ...n,
          flowId: flow.id,
        })),
      });

      if (normalizedEdges.length > 0) {
        await tx.taskEdge.createMany({
          data: normalizedEdges.map((e: any) => ({
            ...e,
            flowId: flow.id,
          })),
        });
      }

      return flow;
    });

    const flowWithDetail = await prisma.taskFlow.findUnique({
      where: { id: result.id },
      include: {
        nodes: true,
        edges: true,
      },
    });

    return successResponse(res, flowWithDetail, '流程保存成功', 201);
  } catch (error: any) {
    console.error('flow create error', error);
    return errorResponse(res, error.message || '创建流程失败', 500);
  }
});

// 获取流程列表
router.get('/flows', authenticate, async (_req: AuthRequest, res) => {
  try {
    const flows = await prisma.taskFlow.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return successResponse(res, flows);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取流程失败', 500);
  }
});

// 获取单个流程详情（含节点与边）
router.get('/flows/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const flow = await prisma.taskFlow.findUnique({
      where: { id },
      include: {
        nodes: true,
        edges: true,
      },
    });
    if (!flow) {
      return errorResponse(res, '流程不存在', 404);
    }
    return successResponse(res, flow);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取流程失败', 500);
  }
});

// 启动/暂停流程
router.patch('/flows/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'paused'].includes(status)) {
      return errorResponse(res, '状态仅支持 active/paused', 400);
    }
    const flow = await prisma.taskFlow.findUnique({ where: { id } });
    if (!flow) {
      return errorResponse(res, '流程不存在', 404);
    }
    const updated = await prisma.taskFlow.update({
      where: { id },
      data: { status },
    });
    return successResponse(res, updated, '状态更新成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '状态更新失败', 500);
  }
});

// 手动触发一次运行（生成实例与节点实例，暂不真正执行）
router.post('/flows/:id/run', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { triggerType = 'manual', requestId } = req.body || {};

    const flow = await prisma.taskFlow.findUnique({
      where: { id },
      include: { nodes: true },
    });
    if (!flow) {
      return errorResponse(res, '流程不存在', 404);
    }
    if (flow.nodes.length === 0) {
      return errorResponse(res, '流程没有节点，无法运行', 400);
    }

    const instanceId = randomUUID();
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.taskInstance.create({
        data: {
          id: instanceId,
          flowId: flow.id,
          status: 'pending',
          triggerType,
          requestId: requestId || null,
          startedAt: now,
        },
      });

      await tx.taskNodeInstance.createMany({
        data: flow.nodes.map((n) => ({
          id: randomUUID(),
          instanceId,
          nodeId: n.id,
          status: 'pending',
          attempt: 0,
        })),
      });
    });

    const instance = await prisma.taskInstance.findUnique({
      where: { id: instanceId },
      include: { nodeInstances: true },
    });

    return successResponse(res, instance, '已创建运行实例（尚未接入执行器）', 201);
  } catch (error: any) {
    console.error('run flow error', error);
    return errorResponse(res, error.message || '触发运行失败', 500);
  }
});

// 获取流程的实例列表
router.get('/flows/:id/instances', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const instances = await prisma.taskInstance.findMany({
      where: { flowId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return successResponse(res, instances);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取实例失败', 500);
  }
});

// 获取单个实例详情（含节点实例）
router.get('/instances/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const instance = await prisma.taskInstance.findUnique({
      where: { id },
      include: {
        nodeInstances: true,
        flow: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!instance) {
      return errorResponse(res, '实例不存在', 404);
    }
    return successResponse(res, instance);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取实例失败', 500);
  }
});

// 失败重跑：fromFailed=true 仅失败/取消的节点；false 全量重跑
router.post('/instances/:id/rerun', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { fromFailed = true } = req.body || {};
    const oldInstance = await prisma.taskInstance.findUnique({
      where: { id },
      include: { nodeInstances: true },
    });
    if (!oldInstance) return errorResponse(res, '实例不存在', 404);
    const flow = await prisma.taskFlow.findUnique({ where: { id: oldInstance.flowId } });
    if (!flow) return errorResponse(res, '流程不存在', 404);

    const newInstanceId = randomUUID();
    await prisma.$transaction(async (tx) => {
      await tx.taskInstance.create({
        data: {
          id: newInstanceId,
          flowId: flow.id,
          status: 'pending',
          triggerType: 'rerun',
          requestId: `rerun-${id}`,
        },
      });
      await tx.taskNodeInstance.createMany({
        data: oldInstance.nodeInstances.map((ni) => ({
          id: randomUUID(),
          instanceId: newInstanceId,
          nodeId: ni.nodeId,
          status: fromFailed
            ? ['failed', 'canceled'].includes(ni.status) ? 'pending' : 'skipped'
            : 'pending',
          attempt: 0,
        })),
      });
    });

    const newInstance = await prisma.taskInstance.findUnique({
      where: { id: newInstanceId },
      include: { nodeInstances: true },
    });
    return successResponse(res, newInstance, '已创建重跑实例', 201);
  } catch (error: any) {
    console.error('rerun error', error);
    return errorResponse(res, error.message || '重跑失败', 500);
  }
});

// 补数据：按 count 创建多实例（简化版）
router.post('/flows/:id/backfill', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { count = 1, triggerLabel = 'backfill' } = req.body || {};
    const flow = await prisma.taskFlow.findUnique({ where: { id }, include: { nodes: true } });
    if (!flow) return errorResponse(res, '流程不存在', 404);
    if (flow.nodes.length === 0) return errorResponse(res, '流程没有节点，无法补数据', 400);

    const created: string[] = [];
    const times = Math.max(1, Math.min(count, 50));
    for (let i = 0; i < times; i++) {
      const instanceId = randomUUID();
      await prisma.$transaction(async (tx) => {
        await tx.taskInstance.create({
          data: {
            id: instanceId,
            flowId: flow.id,
            status: 'pending',
            triggerType: triggerLabel,
            requestId: `${triggerLabel}-${Date.now()}-${i}`,
          },
        });
        await tx.taskNodeInstance.createMany({
          data: flow.nodes.map((n) => ({
            id: randomUUID(),
            instanceId,
            nodeId: n.id,
            status: 'pending',
            attempt: 0,
          })),
        });
      });
      created.push(instanceId);
    }
    return successResponse(res, { instances: created }, '补数据实例已创建');
  } catch (error: any) {
    console.error('backfill error', error);
    return errorResponse(res, error.message || '补数据失败', 500);
  }
});

// 取消实例
router.post('/instances/:id/cancel', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const instance = await prisma.taskInstance.findUnique({ where: { id } });
    if (!instance) return errorResponse(res, '实例不存在', 404);
    await prisma.taskInstance.update({
      where: { id },
      data: { status: 'canceled', finishedAt: new Date() },
    });
    await prisma.taskNodeInstance.updateMany({
      where: { instanceId: id, status: { in: ['pending', 'running'] } },
      data: { status: 'canceled', finishedAt: new Date() },
    });
    return successResponse(res, null, '实例已取消');
  } catch (error: any) {
    return errorResponse(res, error.message || '取消实例失败', 500);
  }
});

export default router;
