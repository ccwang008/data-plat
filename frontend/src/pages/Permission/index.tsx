import { useState } from 'react';
import { Table, Button, Space, Card, Tag, Modal, Form, Input, Select, Tree, message } from 'antd';
import { SafetyOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';

const { Option } = Select;

interface User {
  key: string;
  username: string;
  role: string;
  email: string;
  status: string;
  createTime: string;
}

interface Role {
  key: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

const Permission = () => {
  const [activeTab, setActiveTab] = useState<'user' | 'role'>('user');

  const [users] = useState<User[]>([
    {
      key: '1',
      username: 'admin',
      role: '管理员',
      email: 'admin@example.com',
      status: '启用',
      createTime: '2024-01-01 10:00:00',
    },
    {
      key: '2',
      username: 'user1',
      role: '普通用户',
      email: 'user1@example.com',
      status: '启用',
      createTime: '2024-01-15 14:30:00',
    },
  ]);

  const [roles] = useState<Role[]>([
    {
      key: '1',
      name: '管理员',
      description: '拥有所有权限',
      permissions: ['数据源管理', '数据交换', 'ETL', '数据采集', '任务调度', '权限管理'],
      userCount: 1,
    },
    {
      key: '2',
      name: '普通用户',
      description: '基础数据查看权限',
      permissions: ['数据源查看', '数据交换查看'],
      userCount: 5,
    },
  ]);

  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [userForm] = Form.useForm();
  const [roleForm] = Form.useForm();

  const permissionTreeData: DataNode[] = [
    {
      title: '数据源管理',
      key: '数据源管理',
      children: [
        { title: '查看', key: '数据源查看' },
        { title: '新增', key: '数据源新增' },
        { title: '编辑', key: '数据源编辑' },
        { title: '删除', key: '数据源删除' },
      ],
    },
    {
      title: '数据交换',
      key: '数据交换',
      children: [
        { title: '查看', key: '数据交换查看' },
        { title: '创建', key: '数据交换创建' },
        { title: '执行', key: '数据交换执行' },
      ],
    },
    {
      title: 'ETL',
      key: 'ETL',
      children: [
        { title: '查看', key: 'ETL查看' },
        { title: '设计', key: 'ETL设计' },
        { title: '执行', key: 'ETL执行' },
      ],
    },
    {
      title: '数据采集',
      key: '数据采集',
      children: [
        { title: '查看', key: '数据采集查看' },
        { title: '创建', key: '数据采集创建' },
        { title: '管理', key: '数据采集管理' },
      ],
    },
    {
      title: '任务调度',
      key: '任务调度',
      children: [
        { title: '查看', key: '任务调度查看' },
        { title: '创建', key: '任务调度创建' },
        { title: '管理', key: '任务调度管理' },
      ],
    },
    {
      title: '权限管理',
      key: '权限管理',
      children: [
        { title: '查看', key: '权限管理查看' },
        { title: '编辑', key: '权限管理编辑' },
      ],
    },
  ];

  const userColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === '启用' ? 'success' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" icon={<EditOutlined />}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const roleColumns = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '权限数量',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => permissions.length,
    },
    {
      title: '用户数',
      dataIndex: 'userCount',
      key: 'userCount',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" icon={<EditOutlined />}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>
          <SafetyOutlined /> 权限管理
        </h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            if (activeTab === 'user') {
              setIsUserModalVisible(true);
            } else {
              setIsRoleModalVisible(true);
            }
          }}
        >
          {activeTab === 'user' ? '新增用户' : '新增角色'}
        </Button>
      </div>
      <Card
        tabList={[
          { key: 'user', tab: '用户管理' },
          { key: 'role', tab: '角色管理' },
        ]}
        activeTabKey={activeTab}
        onTabChange={(key) => setActiveTab(key as 'user' | 'role')}
      >
        {activeTab === 'user' ? (
          <Table columns={userColumns} dataSource={users} />
        ) : (
          <Table columns={roleColumns} dataSource={roles} />
        )}
      </Card>

      <Modal
        title="新增用户"
        open={isUserModalVisible}
        onOk={() => {
          userForm.validateFields().then(() => {
            message.success('创建成功');
            setIsUserModalVisible(false);
            userForm.resetFields();
          });
        }}
        onCancel={() => {
          setIsUserModalVisible(false);
          userForm.resetFields();
        }}
      >
        <Form form={userForm} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {roles.map((role) => (
                <Option key={role.key} value={role.name}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增角色"
        open={isRoleModalVisible}
        onOk={() => {
          roleForm.validateFields().then(() => {
            message.success('创建成功');
            setIsRoleModalVisible(false);
            roleForm.resetFields();
          });
        }}
        onCancel={() => {
          setIsRoleModalVisible(false);
          roleForm.resetFields();
        }}
        width={600}
      >
        <Form form={roleForm} layout="vertical">
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea placeholder="请输入角色描述" rows={3} />
          </Form.Item>
          <Form.Item
            name="permissions"
            label="权限"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Tree
              checkable
              treeData={permissionTreeData}
              defaultExpandAll
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Permission;

