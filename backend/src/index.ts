import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import dataSourceRoutes from './routes/dataSource';
import dataExchangeRoutes from './routes/dataExchange';
import etlRoutes from './routes/etl';
import taskRoutes from './routes/task';
import permissionRoutes from './routes/permission';
import dashboardRoutes from './routes/dashboard';
import metadataRoutes from './routes/metadata';
import dataQualityRoutes from './routes/dataQuality';
import dataModelRoutes from './routes/dataModel';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/data-source', dataSourceRoutes);
app.use('/api/data-exchange', dataExchangeRoutes);
app.use('/api/etl', etlRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/permission', permissionRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/data-quality', dataQualityRoutes);
app.use('/api/data-model', dataModelRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Data Platform API is running' });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

