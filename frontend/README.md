# 数据平台前端系统

数据管理系统的前端应用，包含数据源管理、数据交换共享、可视化ETL、数据采集、任务调度、权限管理等功能模块。

## 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型系统
- **Vite** - 构建工具
- **Ant Design 6** - UI 组件库
- **React Router** - 路由管理
- **Axios** - HTTP 客户端

## 功能模块

- 📊 **工作台** - 数据概览和任务监控
- 💾 **数据源管理** - 数据源的增删改查和连接测试
- 🔄 **数据交换共享** - 数据同步和交换任务管理
- 🎨 **可视化ETL** - 拖拽式ETL流程设计
- 📥 **数据采集** - 多源数据采集任务管理
- ⏰ **任务调度** - 定时任务和Cron调度
- 🔐 **权限管理** - 用户和角色权限管理

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
src/
├── layouts/          # 布局组件
├── pages/           # 页面组件
│   ├── Login/       # 登录页
│   ├── Dashboard/   # 工作台
│   ├── DataSource/  # 数据源管理
│   ├── DataExchange/# 数据交换
│   ├── VisualETL/   # 可视化ETL
│   ├── DataCollection/ # 数据采集
│   ├── TaskScheduler/   # 任务调度
│   └── Permission/      # 权限管理
├── router/          # 路由配置
├── utils/           # 工具函数
└── main.tsx         # 入口文件
```

## 环境变量

创建 `.env` 文件配置 API 地址：

```
VITE_API_BASE_URL=http://localhost:8080/api
```
