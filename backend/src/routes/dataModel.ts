import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import prisma from '../utils/prisma';

const router = express.Router();

// 获取所有数据模型
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { type, status, keyword } = req.query;
    
    const where: any = {};
    if (type) where.type = type as string;
    if (status) where.status = status as string;
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { description: { contains: keyword as string } },
      ];
    }

    const models = await prisma.dataModel.findMany({
      where,
      include: {
        relations: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, models);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取数据模型失败', 500);
  }
});

// 获取单个数据模型
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const model = await prisma.dataModel.findUnique({
      where: { id },
      include: {
        relations: true,
      },
    });

    if (!model) {
      return errorResponse(res, '数据模型不存在', 404);
    }

    return successResponse(res, model);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取数据模型失败', 500);
  }
});

// 创建数据模型
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      name,
      type,
      description,
      version,
      content,
      tags,
      owner,
    } = req.body;

    if (!name || !type || !content) {
      return errorResponse(res, '缺少必要参数', 400);
    }

    const dataModel = await prisma.dataModel.create({
      data: {
        name,
        type,
        description,
        version: version || '1.0',
        content: content as any,
        tags: tags ? (tags as any) : null,
        owner: owner || req.user?.username,
        status: '草稿',
      },
    });

    return successResponse(res, dataModel, '创建成功', 201);
  } catch (error: any) {
    return errorResponse(res, error.message || '创建数据模型失败', 500);
  }
});

// 更新数据模型
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const model = await prisma.dataModel.findUnique({
      where: { id },
    });

    if (!model) {
      return errorResponse(res, '数据模型不存在', 404);
    }

    const updated = await prisma.dataModel.update({
      where: { id },
      data: req.body,
    });

    return successResponse(res, updated, '更新成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '更新数据模型失败', 500);
  }
});

// 删除数据模型
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const model = await prisma.dataModel.findUnique({
      where: { id },
    });

    if (!model) {
      return errorResponse(res, '数据模型不存在', 404);
    }

    await prisma.dataModel.delete({
      where: { id },
    });

    return successResponse(res, null, '删除成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '删除数据模型失败', 500);
  }
});

// 发布数据模型
router.post('/:id/publish', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const model = await prisma.dataModel.findUnique({
      where: { id },
    });

    if (!model) {
      return errorResponse(res, '数据模型不存在', 404);
    }

    const updated = await prisma.dataModel.update({
      where: { id },
      data: { status: '已发布' },
    });

    return successResponse(res, updated, '发布成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '发布失败', 500);
  }
});

// 创建模型关系
router.post('/:id/relations', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { sourceTable, targetTable, relationType, description } = req.body;

    if (!sourceTable || !targetTable || !relationType) {
      return errorResponse(res, '缺少必要参数', 400);
    }

    const model = await prisma.dataModel.findUnique({
      where: { id },
    });

    if (!model) {
      return errorResponse(res, '数据模型不存在', 404);
    }

    const relation = await prisma.dataModelRelation.create({
      data: {
        modelId: id,
        sourceTable,
        targetTable,
        relationType,
        description,
      },
    });

    return successResponse(res, relation, '创建关系成功', 201);
  } catch (error: any) {
    return errorResponse(res, error.message || '创建关系失败', 500);
  }
});

// 删除模型关系
router.delete('/relations/:relationId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { relationId } = req.params;
    const relation = await prisma.dataModelRelation.findUnique({
      where: { id: relationId },
    });

    if (!relation) {
      return errorResponse(res, '关系不存在', 404);
    }

    await prisma.dataModelRelation.delete({
      where: { id: relationId },
    });

    return successResponse(res, null, '删除关系成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '删除关系失败', 500);
  }
});

// 获取模型统计
router.get('/stats/overview', authenticate, async (req: AuthRequest, res) => {
  try {
    const [total, byType, byStatus] = await Promise.all([
      prisma.dataModel.count(),
      prisma.dataModel.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.dataModel.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return successResponse(res, {
      total,
      byType: byType.map((item) => ({
        type: item.type,
        count: item._count,
      })),
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
    });
  } catch (error: any) {
    return errorResponse(res, error.message || '获取统计失败', 500);
  }
});

export default router;

