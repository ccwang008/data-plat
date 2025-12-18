import prisma from '../utils/prisma';
import { executeNode } from './executor';
import { sendAlert } from './alert';

type FlowWithGraph = Awaited<ReturnType<typeof loadFlowWithGraph>>;

const SCHEDULER_INTERVAL_MS = 3000;
let schedulerStarted = false;
let running = false;

const loadFlowWithGraph = async (flowId: string) => {
  return prisma.taskFlow.findUnique({
    where: { id: flowId },
    include: {
      nodes: true,
      edges: true,
    },
  });
};

const depsReady = (nodeId: string, edges: any[], nodeInstances: any[]) => {
  const incoming = edges.filter((e) => e.targetId === nodeId);
  if (incoming.length === 0) return true;
  const nodeStatus = new Map(nodeInstances.map((n) => [n.nodeId, n.status]));
  return incoming.every((e) => nodeStatus.get(e.sourceId) === 'success');
};

const canRetryNow = (nodeInstance: any) => {
  if (!nodeInstance.nextRetryAt) return true;
  return new Date(nodeInstance.nextRetryAt).getTime() <= Date.now();
};

const updateInstanceStatus = async (instanceId: string) => {
  const instance = await prisma.taskInstance.findUnique({
    where: { id: instanceId },
    include: { nodeInstances: true },
  });
  if (!instance) return;
  const { nodeInstances } = instance;

  const allSuccess = nodeInstances.every((n) => n.status === 'success');
  const hasRunning = nodeInstances.some((n) => n.status === 'running');
  const hasPending = nodeInstances.some((n) => n.status === 'pending');
  const hasFailed = nodeInstances.some((n) => n.status === 'failed' || n.status === 'canceled');

  if (allSuccess) {
    await prisma.taskInstance.update({
      where: { id: instanceId },
      data: { status: 'success', finishedAt: new Date() },
    });
    return;
  }

  if (!hasRunning && !hasPending && hasFailed) {
    await prisma.taskInstance.update({
      where: { id: instanceId },
      data: { status: 'failed', finishedAt: new Date() },
    });
  }
};

const runNodeInstance = async (nodeInstance: any, nodeDef: any, flow: FlowWithGraph) => {
  // 标记运行中
  await prisma.taskNodeInstance.update({
    where: { id: nodeInstance.id },
    data: {
      status: 'running',
      startedAt: new Date(),
      attempt: nodeInstance.attempt + 1,
    },
  });

  const timeoutSeconds = nodeDef.timeoutSeconds ?? 0;
  const result = await executeNode(nodeDef.type, nodeDef.config, timeoutSeconds);

  const success = result.success;
  const retryCount = nodeDef.retryCount ?? 0;
  const attempts = nodeInstance.attempt + 1;
  const shouldRetry = !success && attempts <= retryCount;

  if (success) {
    await prisma.taskNodeInstance.update({
      where: { id: nodeInstance.id },
      data: {
        status: 'success',
        finishedAt: new Date(),
        message: result.output?.slice(0, 2000) || 'success',
        log: { output: result.output },
        logPath: result.logPath,
        nextRetryAt: null,
        alertSent: false,
      },
    });
  } else if (shouldRetry) {
    const retryInterval = (nodeDef.retryIntervalSeconds ?? 60) * 1000;
    await prisma.taskNodeInstance.update({
      where: { id: nodeInstance.id },
      data: {
        status: 'pending',
        message: result.error?.slice(0, 500) || 'retrying',
        nextRetryAt: new Date(Date.now() + retryInterval),
        logPath: result.logPath,
      },
    });
  } else {
    await prisma.taskNodeInstance.update({
      where: { id: nodeInstance.id },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        message: result.error?.slice(0, 500) || 'failed',
        log: { error: result.error },
        logPath: result.logPath,
      },
    });
    // 告警（简单版：流程级 webhook）
    if (flow.alertChannels) {
      const title = `TaskNode Failed: ${nodeDef.name || nodeDef.id}`;
      const content = `flow=${flow.name} node=${nodeDef.name || nodeDef.id} error=${result.error || 'failed'}`;
      sendAlert(flow.alertChannels as any, title, content).catch((e) => console.error('alert error', e));
    }
  }

  await updateInstanceStatus(nodeInstance.instanceId);
};

const processInstance = async (instance: any) => {
  const flow = await loadFlowWithGraph(instance.flowId);
  if (!flow) return;

  // 如果实例处于 pending，置为 running
  if (instance.status === 'pending') {
    await prisma.taskInstance.update({
      where: { id: instance.id },
      data: { status: 'running', startedAt: new Date() },
    });
  }

  const nodeInstances = await prisma.taskNodeInstance.findMany({
    where: { instanceId: instance.id },
  });

  const nodeMap = new Map(flow.nodes.map((n) => [n.id, n]));

  // 找到可运行的节点：pending 且依赖完成，且满足重试时间
  const runnable = nodeInstances.filter((ni) => {
    if (ni.status !== 'pending') return false;
    const nodeDef = nodeMap.get(ni.nodeId);
    if (!nodeDef) return false;
    if (!depsReady(ni.nodeId, flow.edges, nodeInstances)) return false;
    return canRetryNow(ni);
  });

  // 按流程最大并发限制
  const maxParallel = flow.maxConcurrency ?? 1;
  const runningCount = nodeInstances.filter((n) => n.status === 'running').length;
  const slots = Math.max(0, maxParallel - runningCount);
  const toRun = runnable.slice(0, slots);

  for (const ni of toRun) {
    const nodeDef = nodeMap.get(ni.nodeId);
    if (!nodeDef) continue;
    // fire and forget
    runNodeInstance(ni, nodeDef, flow);
  }
};

const scanAndRun = async () => {
  if (running) return;
  running = true;
  try {
    const instances = await prisma.taskInstance.findMany({
      where: { status: { in: ['pending', 'running'] } },
      orderBy: { createdAt: 'asc' },
      take: 5,
    });
    for (const inst of instances) {
      await processInstance(inst);
    }
  } catch (error) {
    console.error('scheduler error', error);
  } finally {
    running = false;
  }
};

export const startScheduler = () => {
  if (schedulerStarted) return;
  schedulerStarted = true;
  setInterval(scanAndRun, SCHEDULER_INTERVAL_MS);
  console.log('🕒 Scheduler started');
};


