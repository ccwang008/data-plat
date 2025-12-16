import { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DatabaseOutlined } from '@ant-design/icons';

const { Option } = Select;

interface DataSourceItem {
  key: string;
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  status: string;
  createTime: string;
}

const DataSource = () => {
  const [dataSource, setDataSource] = useState<DataSourceItem[]>([
    {
      key: '1',
      name: 'MySQL生产库',
      type: 'MySQL',
      host: '192.168.1.100',
      port: 3306,
      database: 'production',
      status: '正常',
      createTime: '2024-12-10 10:00:00',
    },
    {
      key: '2',
      name: 'PostgreSQL测试库',
      type: 'PostgreSQL',
      host: '192.168.1.101',
      port: 5432,
      database: 'test',
      status: '正常',
      createTime: '2024-12-11 14:30:00',
    },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DataSourceItem | null>(null);
  const [form] = Form.useForm();

  const columns = [
    {
      title: '数据源名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '主机地址',
      dataIndex: 'host',
      key: 'host',
    },
    {
      title: '端口',
      dataIndex: 'port',
      key: 'port',
    },
    {
      title: '数据库',
      dataIndex: 'database',
      key: 'database',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === '正常' ? 'success' : 'error'}>{status}</Tag>
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
      render: (_: any, record: DataSourceItem) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: DataSourceItem) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (key: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个数据源吗？',
      onOk: () => {
        setDataSource(dataSource.filter((item) => item.key !== key));
        message.success('删除成功');
      },
    });
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (editingRecord) {
        // 编辑
        setDataSource(
          dataSource.map((item) =>
            item.key === editingRecord.key ? { ...item, ...values } : item
          )
        );
        message.success('更新成功');
      } else {
        // 新增
        const newItem: DataSourceItem = {
          key: Date.now().toString(),
          ...values,
          status: '正常',
          createTime: new Date().toLocaleString('zh-CN'),
        };
        setDataSource([...dataSource, newItem]);
        message.success('添加成功');
      }
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>
          <DatabaseOutlined /> 数据源管理
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增数据源
        </Button>
      </div>
      <Table columns={columns} dataSource={dataSource} />
      <Modal
        title={editingRecord ? '编辑数据源' : '新增数据源'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="数据源名称"
            rules={[{ required: true, message: '请输入数据源名称' }]}
          >
            <Input placeholder="请输入数据源名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="数据库类型"
            rules={[{ required: true, message: '请选择数据库类型' }]}
          >
            <Select placeholder="请选择数据库类型">
              <Option value="MySQL">MySQL</Option>
              <Option value="PostgreSQL">PostgreSQL</Option>
              <Option value="Oracle">Oracle</Option>
              <Option value="SQL Server">SQL Server</Option>
              <Option value="MongoDB">MongoDB</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="host"
            label="主机地址"
            rules={[{ required: true, message: '请输入主机地址' }]}
          >
            <Input placeholder="请输入主机地址" />
          </Form.Item>
          <Form.Item
            name="port"
            label="端口"
            rules={[{ required: true, message: '请输入端口' }]}
          >
            <Input type="number" placeholder="请输入端口" />
          </Form.Item>
          <Form.Item
            name="database"
            label="数据库名"
            rules={[{ required: true, message: '请输入数据库名' }]}
          >
            <Input placeholder="请输入数据库名" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataSource;

