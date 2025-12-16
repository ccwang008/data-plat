import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { successResponse, errorResponse } from '../utils/response';
import prisma from '../utils/prisma';

const router = express.Router();

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorResponse(res, '用户名和密码不能为空', 400);
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return errorResponse(res, '用户名或密码错误', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return errorResponse(res, '用户名或密码错误', 401);
    }

    if (user.status !== '启用') {
      return errorResponse(res, '账户已被禁用', 403);
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      secret,
      { expiresIn } as jwt.SignOptions
    );

    return successResponse(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    }, '登录成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '登录失败', 500);
  }
});

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return errorResponse(res, '未提供认证令牌', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return errorResponse(res, '用户不存在', 404);
    }

    return successResponse(res, user);
  } catch (error: any) {
    return errorResponse(res, '无效的认证令牌', 401);
  }
});

export default router;
