import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import prisma from '../utils/prisma';

const router = express.Router();

// 获取所有用户
router.get('/users', authenticate, authorize('管理员'), async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, users);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取用户列表失败', 500);
  }
});

// 创建用户
router.post('/users', authenticate, authorize('管理员'), async (req: AuthRequest, res) => {
  try {
    const { username, email, role, password } = req.body;

    if (!username || !email || !role) {
      return errorResponse(res, '缺少必要参数', 400);
    }

    // 检查用户名和邮箱是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      return errorResponse(res, '用户名或邮箱已存在', 400);
    }

    // 如果没有提供密码，使用默认密码
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : await bcrypt.hash('123456', 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        role,
        password: hashedPassword,
        status: '启用',
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return successResponse(res, newUser, '创建成功', 201);
  } catch (error: any) {
    return errorResponse(res, error.message || '创建用户失败', 500);
  }
});

// 获取所有角色
router.get('/roles', authenticate, async (req: AuthRequest, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, roles);
  } catch (error: any) {
    return errorResponse(res, error.message || '获取角色列表失败', 500);
  }
});

// 创建角色
router.post('/roles', authenticate, authorize('管理员'), async (req: AuthRequest, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name || !description || !permissions) {
      return errorResponse(res, '缺少必要参数', 400);
    }

    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return errorResponse(res, '角色名称已存在', 400);
    }

    const newRole = await prisma.role.create({
      data: {
        name,
        description,
        permissions: permissions as any,
        userCount: 0,
      },
    });

    return successResponse(res, newRole, '创建成功', 201);
  } catch (error: any) {
    return errorResponse(res, error.message || '创建角色失败', 500);
  }
});

export default router;
