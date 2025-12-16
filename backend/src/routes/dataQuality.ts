import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import prisma from '../utils/prisma';

const router = express.Router();

// 获取所有质检规则
router.get('/rules', authenticate, async (req: AuthRequest, res) => {
  try {
    const { type, dataSource, status } = req.query;
    
    const where: any = {};
    if (type) where.type = type as string;
    if (dataSource) where.dataSource = dataSource as string;
    if (status) where.status = status as string;

    const rules = await prisma.dataQualityRule.findMany({
      where,
      include: {
        results: {
          take: 1,
          orderBy: { runTime: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, rules);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取质检规则失败', 500);
  }
});

// 获取单个规则
router.get('/rules/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const rule = await prisma.dataQualityRule.findUnique({
      where: { id },
      include: {
        results: {
          orderBy: { runTime: 'desc' },
          take: 10,
        },
      },
    });

    if (!rule) {
      return errorResponse(res, '规则不存在', 404);
    }

    return successResponse(res, rule);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取规则失败', 500);
  }
});

// 创建质检规则
router.post('/rules', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      name,
      type,
      dataSource,
      tableName,
      columnName,
      rule,
      threshold,
    } = req.body;

    if (!name || !type || !dataSource || !tableName || !rule) {
      return errorResponse(res, '缺少必要参数', 400);
    }

    const qualityRule = await prisma.dataQualityRule.create({
      data: {
        name,
        type,
        dataSource,
        tableName,
        columnName,
        rule,
        threshold: threshold ? parseFloat(threshold) : null,
        status: '启用',
      },
    });

    return successResponse(res, qualityRule, '创建成功', 201);
  } catch (error: any) {
    return errorResponse(res, error.message || '创建规则失败', 500);
  }
});

// 更新规则
router.put('/rules/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const rule = await prisma.dataQualityRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return errorResponse(res, '规则不存在', 404);
    }

    const updated = await prisma.dataQualityRule.update({
      where: { id },
      data: req.body,
    });

    return successResponse(res, updated, '更新成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '更新规则失败', 500);
  }
});

// 删除规则
router.delete('/rules/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const rule = await prisma.dataQualityRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return errorResponse(res, '规则不存在', 404);
    }

    await prisma.dataQualityRule.delete({
      where: { id },
    });

    return successResponse(res, null, '删除成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '删除规则失败', 500);
  }
});

// 执行质检
router.post('/rules/:id/execute', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const rule = await prisma.dataQualityRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return errorResponse(res, '规则不存在', 404);
    }

    // TODO: 实际执行数据质检逻辑
    // 这里模拟质检结果
    const totalRows = 10000;
    const passRows = Math.floor(totalRows * 0.95);
    const failRows = totalRows - passRows;
    const passRate = (passRows / totalRows) * 100;

    const result = await prisma.dataQualityResult.create({
      data: {
        ruleId: id,
        totalRows,
        passRows,
        failRows,
        passRate,
        details: {
          failRecords: Array.from({ length: Math.min(failRows, 10) }, (_, i) => ({
            row: i + 1,
            value: `示例值${i}`,
            reason: '不符合规则要求',
          })),
        },
      },
    });

    // 更新规则的最后运行时间和通过率
    await prisma.dataQualityRule.update({
      where: { id },
      data: {
        lastRunTime: new Date(),
        passRate,
      },
    });

    return successResponse(res, result, '质检执行成功', 201);
  } catch (error: any) {
    return errorResponse(res, error.message || '执行质检失败', 500);
  }
});

// 获取质检结果
router.get('/results', authenticate, async (req: AuthRequest, res) => {
  try {
    const { ruleId, startDate, endDate } = req.query;
    
    const where: any = {};
    if (ruleId) where.ruleId = ruleId as string;
    if (startDate || endDate) {
      where.runTime = {};
      if (startDate) where.runTime.gte = new Date(startDate as string);
      if (endDate) where.runTime.lte = new Date(endDate as string);
    }

    const results = await prisma.dataQualityResult.findMany({
      where,
      include: {
        rule: true,
      },
      orderBy: { runTime: 'desc' },
      take: 100,
    });

    return successResponse(res, results);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取质检结果失败', 500);
  }
});

// 获取质检统计
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const [totalRules, activeRules, totalResults, avgPassRate] = await Promise.all([
      prisma.dataQualityRule.count(),
      prisma.dataQualityRule.count({ where: { status: '启用' } }),
      prisma.dataQualityResult.count(),
      prisma.dataQualityResult.aggregate({
        _avg: { passRate: true },
      }),
    ]);

    return successResponse(res, {
      totalRules,
      activeRules,
      totalResults,
      avgPassRate: avgPassRate._avg.passRate || 0,
    });
  } catch (error: any) {
    return errorResponse(res, error.message || '获取统计失败', 500);
  }
});

export default router;

