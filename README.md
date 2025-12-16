# Data Platform

数据平台管理系统

## 项目简介

这是一个完整的数据管理平台系统，包含前端和后端（待开发），提供数据源管理、数据交换共享、可视化ETL、数据采集、任务调度、权限管理等功能。

## 技术栈

### 前端
- React 19 + TypeScript
- Vite
- Ant Design 6
- React Router
- React Flow (可视化ETL设计器)
- Axios

### 后端
- Node.js + Express
- TypeScript
- Prisma ORM (支持 PostgreSQL/MySQL)
- JWT 认证
- bcryptjs 密码加密

## 项目结构

```
data-plat/
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── layouts/   # 布局组件
│   │   ├── pages/     # 页面组件
│   │   ├── router/    # 路由配置
│   │   └── utils/      # 工具函数
│   └── package.json
├── backend/           # 后端项目
│   ├── src/
│   │   ├── routes/    # API路由
│   │   ├── middleware/# 中间件
│   │   └── utils/     # 工具函数
│   └── package.json
└── README.md
```

## 功能模块

- 📊 **工作台** - 数据概览和任务监控
- 💾 **数据源管理** - 数据源的增删改查和连接测试
- 🔄 **数据交换共享** - 数据同步和交换任务管理
- 🎨 **可视化ETL** - 基于React Flow的拖拽式ETL流程设计器
- 📥 **数据采集** - 多源数据采集任务管理
- ⏰ **任务调度** - 定时任务和Cron调度
- 🔐 **权限管理** - 用户和角色权限管理
- 📋 **数据治理**
  - 📄 **元数据管理** - 元数据的增删改查、批量导入、统计分析
  - ✅ **数据质检** - 数据质量规则管理、质检执行、结果查看
  - 🎨 **数据建模** - 数据模型设计、关系管理、版本控制

## 快速开始

### 1. 配置数据库

首先需要安装并配置数据库（PostgreSQL 或 MySQL）。

**PostgreSQL:**
```bash
# macOS
brew install postgresql
brew services start postgresql

# 创建数据库
createdb data_platform
```

**MySQL:**
```bash
# macOS
brew install mysql
brew services start mysql

# 创建数据库
mysql -u root -e "CREATE DATABASE data_platform;"
```

### 2. 配置后端

编辑 `backend/.env` 文件，设置数据库连接：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/data_platform?schema=public"
# 或 MySQL
# DATABASE_URL="mysql://user:password@localhost:3306/data_platform"
```

### 3. 初始化数据库

```bash
cd backend
npm install

# 运行数据库迁移
npm run db:migrate

# 初始化默认数据（创建默认用户）
npm run db:seed
```

### 4. 启动后端服务

```bash
npm run dev
```

后端服务运行在 http://localhost:3000

### 5. 启动前端服务

```bash
cd frontend
npm install
npm run dev
```

前端服务运行在 http://localhost:5173

### 6. 登录系统

访问 http://localhost:5173，使用以下账号登录：

**管理员账号：**
- 用户名：`admin`
- 密码：`admin123`

**普通用户：**
- 用户名：`user1`
- 密码：`user123`

## 开发计划

- [x] 前端框架搭建
- [x] 基础页面和路由
- [x] ETL流程设计器集成（React Flow）
- [x] 后端API开发
- [x] 数据库集成（MySQL/PostgreSQL）
- [x] 数据治理模块（元数据管理、数据质检、数据建模）
- [ ] 数据源连接功能
- [ ] 任务调度引擎
- [ ] 权限系统完善

## License

MIT
