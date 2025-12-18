# 数据平台后端API

数据管理系统的后端服务，提供RESTful API接口。

## 技术栈

- Node.js + Express
- TypeScript
- Prisma ORM (支持 PostgreSQL/MySQL)
- JWT 认证
- bcryptjs 密码加密

## 新增：调度/任务流（最小可用，参考 DolphinScheduler 思路）

已加入 DAG 定义与实例模型，方便后续扩展执行器、补数据、告警。

### 数据模型（新增）
- TaskFlow / TaskNode / TaskEdge
- TaskInstance / TaskNodeInstance

### 新增 API（最小集）
- `POST /api/task/flows` 保存流程（含节点、边，全量替换）
- `GET  /api/task/flows` 流程列表
- `GET  /api/task/flows/:id` 流程详情（含节点、边）
- `PATCH /api/task/flows/:id/status` 启用/暂停（active/paused）
- `POST /api/task/flows/:id/run` 生成一次运行实例与节点实例（占位，未接入执行器）
- `GET  /api/task/flows/:id/instances` 实例列表
- `GET  /api/task/instances/:id` 实例详情（含节点实例）

### 使用提示
1. 先迁移数据库并启动服务：
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run dev
   ```
2. 保存流程示例：
   ```json
   {
     "name": "示例流程",
     "cron": "0 0 * * *",
     "status": "paused",
     "nodes": [
       { "id": "n1", "name": "Shell1", "type": "shell", "config": { "command": "echo hello" } },
       { "id": "n2", "name": "HTTP", "type": "http", "config": { "url": "https://example.com" } }
     ],
     "edges": [
       { "sourceId": "n1", "targetId": "n2" }
     ]
   }
   ```
   未提供节点 id 时会自动生成 UUID，但 `edges` 的 sourceId/targetId 必须指向有效节点。
3. 手动触发（仅创建实例，占位）：
   ```
   POST /api/task/flows/:id/run
   ```
4. 查询：
   ```
   GET /api/task/flows/:id/instances
   GET /api/task/instances/:id
   ```

### 后续可扩展
- 节点执行器（按依赖拓扑并发调度，支持超时/重试）
- 补数据/失败重跑
- 告警/日志收集
- 前端调度配置与实例可视化

## 数据库设置

### 1. 配置数据库连接

编辑 `.env` 文件，设置 `DATABASE_URL`：

```env
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/data_platform?schema=public"

# MySQL
DATABASE_URL="mysql://user:password@localhost:3306/data_platform"
```

### 2. 运行数据库迁移

```bash
# 创建数据库迁移
npm run db:migrate

# 生成 Prisma Client
npm run db:generate

# 初始化默认数据
npm run db:seed
```

### 3. 查看数据库（可选）

```bash
# 打开 Prisma Studio 可视化查看数据库
npm run db:studio
```

## 项目结构

```
backend/
├── src/
│   ├── index.ts              # 入口文件
│   ├── middleware/           # 中间件
│   │   └── auth.ts           # 认证中间件
│   ├── routes/               # 路由
│   │   ├── auth.ts           # 认证路由
│   │   ├── dashboard.ts      # 仪表盘
│   │   ├── dataSource.ts     # 数据源管理
│   │   ├── dataExchange.ts   # 数据交换
│   │   ├── etl.ts            # ETL流程
│   │   ├── task.ts           # 任务调度
│   │   └── permission.ts    # 权限管理
│   ├── utils/                # 工具函数
│   │   ├── prisma.ts         # Prisma Client
│   │   └── response.ts       # 响应工具
│   └── scripts/              # 脚本
│       └── seed.ts           # 数据库初始化脚本
├── prisma/
│   └── schema.prisma         # 数据库模型定义
└── package.json
```

## 数据模型

- **User** - 用户表
- **DataSource** - 数据源表
- **DataExchangeTask** - 数据交换任务表
- **EtlFlow** - ETL流程表
- **ScheduledTask** - 任务调度表
- **Role** - 角色表
- **DataCollectionTask** - 数据采集任务表

## API接口

### 认证相关
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 仪表盘
- `GET /api/dashboard/stats` - 获取统计数据
- `GET /api/dashboard/recent-tasks` - 获取最近任务

### 数据源管理
- `GET /api/data-source` - 获取所有数据源
- `GET /api/data-source/:id` - 获取单个数据源
- `POST /api/data-source` - 创建数据源
- `PUT /api/data-source/:id` - 更新数据源
- `DELETE /api/data-source/:id` - 删除数据源
- `POST /api/data-source/:id/test` - 测试数据源连接

### 数据交换
- `GET /api/data-exchange` - 获取所有交换任务
- `GET /api/data-exchange/:id` - 获取单个任务
- `POST /api/data-exchange` - 创建交换任务
- `PATCH /api/data-exchange/:id/status` - 更新任务状态
- `DELETE /api/data-exchange/:id` - 删除任务

### ETL流程
- `POST /api/etl/flow` - 保存ETL流程
- `GET /api/etl/flow/:id` - 获取ETL流程
- `GET /api/etl/flows` - 获取所有ETL流程
- `DELETE /api/etl/flow/:id` - 删除ETL流程
- `POST /api/etl/flow/:id/execute` - 执行ETL流程

### 任务调度
- `GET /api/task` - 获取所有任务
- `GET /api/task/:id` - 获取单个任务
- `POST /api/task` - 创建任务
- `PATCH /api/task/:id/status` - 更新任务状态
- `DELETE /api/task/:id` - 删除任务

### 权限管理
- `GET /api/permission/users` - 获取所有用户（需管理员权限）
- `POST /api/permission/users` - 创建用户（需管理员权限）
- `GET /api/permission/roles` - 获取所有角色
- `POST /api/permission/roles` - 创建角色（需管理员权限）

## 开发

```bash
# 安装依赖
npm install

# 配置数据库并运行迁移
npm run db:migrate
npm run db:seed

# 启动开发服务器
npm run dev

# 构建
npm run build

# 启动生产服务器
npm start
```

## 环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://user:password@localhost:5432/data_platform?schema=public
CORS_ORIGIN=http://localhost:5173
```

## 默认用户

运行 `npm run db:seed` 后会创建：

- 管理员：`admin` / `admin123`
- 普通用户：`user1` / `user123`

## 认证

所有需要认证的接口都需要在请求头中携带JWT token：

```
Authorization: Bearer <token>
```

## 响应格式

成功响应：
```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

错误响应：
```json
{
  "success": false,
  "message": "错误信息"
}
```
