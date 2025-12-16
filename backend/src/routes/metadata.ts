import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import prisma from '../utils/prisma';

const router = express.Router();

// 获取所有元数据
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { type, database, tableName, keyword } = req.query;
    
    const where: any = {};
    if (type) where.type = type as string;
    if (database) where.database = database as string;
    if (tableName) where.tableName = { contains: tableName as string };
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { description: { contains: keyword as string } },
      ];
    }

    const metadata = await prisma.metadata.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, metadata);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取元数据失败', 500);
  }
});

// 获取单个元数据
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const metadata = await prisma.metadata.findUnique({
      where: { id },
    });

    if (!metadata) {
      return errorResponse(res, '元数据不存在', 404);
    }

    return successResponse(res, metadata);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取元数据失败', 500);
  }
});

// 创建元数据
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      name,
      type,
      database,
      schema,
      tableName,
      columnName,
      dataType,
      description,
      tags,
      owner,
    } = req.body;

    if (!name || !type) {
      return errorResponse(res, '缺少必要参数', 400);
    }

    const metadata = await prisma.metadata.create({
      data: {
        name,
        type,
        database,
        schema,
        tableName,
        columnName,
        dataType,
        description,
        tags: tags ? (tags as any) : null,
        owner: owner || req.user?.username,
        status: '启用',
      },
    });

    return successResponse(res, metadata, '创建成功', 201);
  } catch (error: any) {
    return errorResponse(res, error.message || '创建元数据失败', 500);
  }
});

// 更新元数据
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const metadata = await prisma.metadata.findUnique({
      where: { id },
    });

    if (!metadata) {
      return errorResponse(res, '元数据不存在', 404);
    }

    const updated = await prisma.metadata.update({
      where: { id },
      data: req.body,
    });

    return successResponse(res, updated, '更新成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '更新元数据失败', 500);
  }
});

// 删除元数据
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const metadata = await prisma.metadata.findUnique({
      where: { id },
    });

    if (!metadata) {
      return errorResponse(res, '元数据不存在', 404);
    }

    await prisma.metadata.delete({
      where: { id },
    });

    return successResponse(res, null, '删除成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '删除元数据失败', 500);
  }
});

// 批量导入元数据
router.post('/batch', authenticate, async (req: AuthRequest, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(res, '请提供有效的元数据列表', 400);
    }

    const results = await prisma.metadata.createMany({
      data: items.map((item: any) => ({
        ...item,
        owner: item.owner || req.user?.username,
        status: item.status || '启用',
      })),
      skipDuplicates: true,
    });

    return successResponse(res, { count: results.count }, '批量导入成功', 201);
  } catch (error: any) {
    return errorResponse(res, error.message || '批量导入失败', 500);
  }
});

// 获取元数据统计
router.get('/stats/overview', authenticate, async (req: AuthRequest, res) => {
  try {
    const [total, byType, byDatabase] = await Promise.all([
      prisma.metadata.count(),
      prisma.metadata.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.metadata.groupBy({
        by: ['database'],
        _count: true,
        where: {
          database: { not: null },
        },
      }),
    ]);

    return successResponse(res, {
      total,
      byType: byType.map((item) => ({
        type: item.type,
        count: item._count,
      })),
      byDatabase: byDatabase.map((item) => ({
        database: item.database,
        count: item._count,
      })),
    });
  } catch (error: any) {
    return errorResponse(res, error.message || '获取统计失败', 500);
  }
});

export default router;

