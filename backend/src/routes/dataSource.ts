import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import prisma from '../utils/prisma';

const router = express.Router();

// 获取所有数据源
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const dataSources = await prisma.dataSource.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, dataSources);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取数据源失败', 500);
  }
});

// 获取单个数据源
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
    });
    
    if (!dataSource) {
      return errorResponse(res, '数据源不存在', 404);
    }

    return successResponse(res, dataSource);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取数据源失败', 500);
  }
});

// 创建数据源
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      name,
      category = 'db',
      type,
      host,
      port,
      database,
      username,
      password,
      filePath,
      fileFormat,
      apiUrl,
      apiMethod,
      headers,
      body,
      config,
    } = req.body;

    if (!name || !type) {
      return errorResponse(res, '缺少必要参数: name 或 type', 400);
    }

    if (category === 'db') {
      if (!host || !port || !database) {
        return errorResponse(res, '数据库源需提供 host/port/database', 400);
      }
    } else if (category === 'file') {
      if (!filePath || !fileFormat) {
        return errorResponse(res, '文件源需提供 filePath/fileFormat', 400);
      }
    } else if (category === 'api') {
      if (!apiUrl || !apiMethod) {
        return errorResponse(res, 'API 源需提供 apiUrl/apiMethod', 400);
      }
    } else {
      return errorResponse(res, 'category 仅支持 db/file/api', 400);
    }

    const newDataSource = await prisma.dataSource.create({
      data: {
        name,
        category,
        type,
        host: host || null,
        port: port ? parseInt(port) : null,
        database: database || null,
        username: username ?? null,
        password: password ?? null,
        filePath: filePath || null,
        fileFormat: fileFormat || null,
        apiUrl: apiUrl || null,
        apiMethod: apiMethod || null,
        headers: headers || null,
        body: body || null,
        config: config || null,
        status: '正常',
      },
    });

    return successResponse(res, newDataSource, '创建成功', 201);
  } catch (error: any) {
    return errorResponse(res, error.message || '创建数据源失败', 500);
  }
});

// 更新数据源
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      type,
      host,
      port,
      database,
      username,
      password,
      status,
      filePath,
      fileFormat,
      apiUrl,
      apiMethod,
      headers,
      body,
      config,
    } = req.body;

    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
    });

    if (!dataSource) {
      return errorResponse(res, '数据源不存在', 404);
    }

    const updatedDataSource = await prisma.dataSource.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(type && { type }),
        ...(host !== undefined && { host }),
        ...(port !== undefined && { port: port ? parseInt(port) : null }),
        ...(database !== undefined && { database }),
        ...(username !== undefined && { username }),
        ...(password !== undefined && { password }),
        ...(status && { status }),
        ...(filePath !== undefined && { filePath }),
        ...(fileFormat !== undefined && { fileFormat }),
        ...(apiUrl !== undefined && { apiUrl }),
        ...(apiMethod !== undefined && { apiMethod }),
        ...(headers !== undefined && { headers }),
        ...(body !== undefined && { body }),
        ...(config !== undefined && { config }),
      },
    });

    return successResponse(res, updatedDataSource, '更新成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '更新数据源失败', 500);
  }
});

// 删除数据源
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
    });

    if (!dataSource) {
      return errorResponse(res, '数据源不存在', 404);
    }

    await prisma.dataSource.delete({
      where: { id },
    });

    return successResponse(res, null, '删除成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '删除数据源失败', 500);
  }
});

// 测试数据源连接
router.post('/:id/test', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
    });

    if (!dataSource) {
      return errorResponse(res, '数据源不存在', 404);
    }

    // TODO: 实现真实的数据库连接测试
    // 模拟连接测试
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return successResponse(res, {
      connected: true,
      message: '连接成功',
    });
  } catch (error: any) {
    return errorResponse(res, error.message || '连接测试失败', 500);
  }
});

export default router;
