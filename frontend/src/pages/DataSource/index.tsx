import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  InputNumber,
  Divider,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DatabaseOutlined } from '@ant-design/icons';

const { Option } = Select;

interface DataSourceItem {
  key: string;
  name: string;
  category: 'db' | 'file' | 'api';
  type: string;
  host?: string;
  port?: number | null;
  database?: string;
  username?: string;
  password?: string;
  filePath?: string;
  fileFormat?: string;
  apiUrl?: string;
  apiMethod?: string;
  headers?: string;
  body?: string;
  status: string;
  createTime: string;
}

const DataSource = () => {
  const [dataSource, setDataSource] = useState<DataSourceItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DataSourceItem | null>(null);
  const [category, setCategory] = useState<'db' | 'file' | 'api'>('db');
  const [form] = Form.useForm();

  useEffect(() => {
    setDataSource([
      {
        key: '1',
        name: 'MySQL生产库',
        category: 'db',
        type: 'MySQL',
        host: '192.168.1.100',
        port: 3306,
        database: 'production',
        status: '正常',
        createTime: '2024-12-10 10:00:00',
      },
      {
        key: '2',
        name: 'CSV文件',
        category: 'file',
        type: 'CSV',
        filePath: '/data/files/sales.csv',
        fileFormat: 'csv',
        status: '正常',
        createTime: '2024-12-11 09:20:00',
      },
      {
        key: '3',
        name: '业务API',
        category: 'api',
        type: 'REST',
        apiUrl: 'https://api.example.com/orders',
        apiMethod: 'GET',
        headers: '{"Authorization":"Bearer ***"}',
        status: '正常',
        createTime: '2024-12-12 08:10:00',
      },
    ]);
  }, []);

  const detailRender = useMemo(() => {
    return (record: DataSourceItem) => {
      if (record.category === 'db') {
        return `${record.host || ''}:${record.port || ''}/${record.database || ''}`;
      }
      if (record.category === 'file') {
        return `${record.filePath || ''} (${record.fileFormat || 'file'})`;
      }
      if (record.category === 'api') {
        return `${record.apiMethod || ''} ${record.apiUrl || ''}`;
      }
      return '';
    };
  }, []);

  const columns = [
    {
      title: '数据源名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (c: string) => {
        const map: Record<string, string> = { db: '数据库', file: '文件', api: 'API' };
        return <Tag color="purple">{map[c] || c}</Tag>;
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '详情',
      key: 'detail',
      render: (_: any, record: DataSourceItem) => detailRender(record),
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
    setCategory('db');
    form.setFieldsValue({ category: 'db' });
    setIsModalVisible(true);
  };

  const handleEdit = (record: DataSourceItem) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setCategory(record.category);
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
            name="category"
            label="数据源分类"
            initialValue="db"
            rules={[{ required: true, message: '请选择数据源分类' }]}
          >
            <Select
              onChange={(v) => {
                setCategory(v);
              }}
              options={[
                { value: 'db', label: '数据库' },
                { value: 'file', label: '文件' },
                { value: 'api', label: 'API' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            {category === 'db' && (
              <Select placeholder="请选择数据库类型">
                <Option value="MySQL">MySQL</Option>
                <Option value="PostgreSQL">PostgreSQL</Option>
                <Option value="Oracle">Oracle</Option>
                <Option value="SQL Server">SQL Server</Option>
                <Option value="MongoDB">MongoDB</Option>
              </Select>
            )}
            {category === 'file' && (
              <Select placeholder="请选择文件类型">
                <Option value="CSV">CSV</Option>
                <Option value="JSON">JSON</Option>
                <Option value="Parquet">Parquet</Option>
                <Option value="Excel">Excel</Option>
              </Select>
            )}
            {category === 'api' && (
              <Select placeholder="请选择 API 类型">
                <Option value="REST">REST</Option>
                <Option value="GraphQL">GraphQL</Option>
              </Select>
            )}
          </Form.Item>
          {category === 'db' && (
            <>
              <Divider>数据库配置</Divider>
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
                <InputNumber placeholder="请输入端口" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="database"
                label="数据库名"
                rules={[{ required: true, message: '请输入数据库名' }]}
              >
                <Input placeholder="请输入数据库名" />
              </Form.Item>
              <Form.Item name="username" label="用户名">
                <Input placeholder="可选" />
              </Form.Item>
              <Form.Item name="password" label="密码">
                <Input.Password placeholder="可选" />
              </Form.Item>
            </>
          )}
          {category === 'file' && (
            <>
              <Divider>文件配置</Divider>
              <Form.Item
                name="filePath"
                label="文件路径"
                rules={[{ required: true, message: '请输入文件路径' }]}
              >
                <Input placeholder="例如: /data/files/data.csv 或 s3://bucket/key" />
              </Form.Item>
              <Form.Item
                name="fileFormat"
                label="文件格式"
                rules={[{ required: true, message: '请选择文件格式' }]}
              >
                <Select placeholder="请选择文件格式">
                  <Option value="csv">CSV</Option>
                  <Option value="json">JSON</Option>
                  <Option value="parquet">Parquet</Option>
                  <Option value="excel">Excel</Option>
                </Select>
              </Form.Item>
            </>
          )}
          {category === 'api' && (
            <>
              <Divider>API 配置</Divider>
              <Form.Item
                name="apiUrl"
                label="API 地址"
                rules={[{ required: true, message: '请输入 API 地址' }]}
              >
                <Input placeholder="例如: https://api.example.com/data" />
              </Form.Item>
              <Form.Item
                name="apiMethod"
                label="请求方法"
                rules={[{ required: true, message: '请选择请求方法' }]}
              >
                <Select placeholder="请选择请求方法">
                  <Option value="GET">GET</Option>
                  <Option value="POST">POST</Option>
                  <Option value="PUT">PUT</Option>
                  <Option value="DELETE">DELETE</Option>
                </Select>
              </Form.Item>
              <Form.Item name="headers" label="请求头(JSON)">
                <Input.TextArea rows={3} placeholder='例如: {"Authorization":"Bearer token"}' />
              </Form.Item>
              <Form.Item name="body" label="请求体(JSON)">
                <Input.TextArea rows={4} placeholder='POST/PUT 时填写: {"param":"value"}' />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default DataSource;

