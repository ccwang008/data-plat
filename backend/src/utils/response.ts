import { Response } from 'express';

export const successResponse = (res: Response, data: any, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res: Response, message = '操作失败', statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

