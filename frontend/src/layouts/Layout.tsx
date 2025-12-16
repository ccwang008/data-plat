import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Typography,
} from 'antd';
import {
  DashboardOutlined,
  DatabaseOutlined,
  SwapOutlined,
  ApartmentOutlined,
  CloudUploadOutlined,
  ScheduleOutlined,
  SafetyOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

const menuItems: MenuProps['items'] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '工作台',
  },
  {
    key: '/data-source',
    icon: <DatabaseOutlined />,
    label: '数据源管理',
  },
  {
    key: '/data-exchange',
    icon: <SwapOutlined />,
    label: '数据交换共享',
  },
  {
    key: '/visual-etl',
    icon: <ApartmentOutlined />,
    label: '可视化ETL',
  },
  {
    key: '/data-collection',
    icon: <CloudUploadOutlined />,
    label: '数据采集',
  },
  {
    key: '/task-scheduler',
    icon: <ScheduleOutlined />,
    label: '任务调度',
  },
  {
    key: '/permission',
    icon: <SafetyOutlined />,
    label: '权限管理',
  },
  {
    key: 'data-governance',
    icon: <FileTextOutlined />,
    label: '数据治理',
    children: [
      {
        key: '/metadata',
        icon: <FileTextOutlined />,
        label: '元数据管理',
      },
      {
        key: '/data-quality',
        icon: <CheckCircleOutlined />,
        label: '数据质检',
      },
      {
        key: '/data-model',
        icon: <ProjectOutlined />,
        label: '数据建模',
      },
    ],
  },
];

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key && !key.startsWith('data-governance')) {
      navigate(key);
    }
  };

  const handleLogout = () => {
    // TODO: 实现登出逻辑
    localStorage.removeItem('token');
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={200}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            margin: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'DP' : '数据平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout style={{ marginLeft: collapsed ? 80 : 200 }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{ fontSize: 20, cursor: 'pointer' }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <Space>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <Text>管理员</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#fff',
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;

