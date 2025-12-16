import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Card,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Statistic,
  Drawer,
} from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import request from '../../utils/request';

const { Option } = Select;
const { TextArea } = Input;

interface MetadataItem {
  id: string;
  name: string;
  type: string;
  database?: string;
  schema?: string;
  tableName?: string;
  columnName?: string;
  dataType?: string;
  description?: string;
  tags?: string[];
  owner?: string;
  status: string;
  createdAt: string;
}

const Metadata = () => {
  const [metadata, setMetadata] = useState<MetadataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isImportVisible, setIsImportVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MetadataItem | null>(null);
  const [form] = Form.useForm();
  const [importForm] = Form.useForm();
  const [stats, setStats] = useState<any>({});

  const [filters, setFilters] = useState({
    type: '',
    database: '',
    keyword: '',
  });

  useEffect(() => {
    loadData();
    loadStats();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.type) params.type = filters.type;
      if (filters.database) params.database = filters.database;
      if (filters.keyword) params.keyword = filters.keyword;

      const data: any = await request.get('/metadata', { params });
      setMetadata(data || []);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await request.get('/metadata/stats/overview');
      setStats(data);
    } catch (error) {
      // 忽略统计错误
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          表: 'blue',
          字段: 'green',
          视图: 'orange',
          函数: 'purple',
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: '数据库',
      dataIndex: 'database',
      key: 'database',
      width: 120,
    },
    {
      title: '表名',
      dataIndex: 'tableName',
      key: 'tableName',
      width: 150,
    },
    {
      title: '字段名',
      dataIndex: 'columnName',
      key: 'columnName',
      width: 120,
    },
    {
      title: '数据类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 100,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[]) =>
        tags?.map((tag, index) => <Tag key={index}>{tag}</Tag>),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === '启用' ? 'success' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: MetadataItem) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
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

  const handleEdit = (record: MetadataItem) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条元数据吗？',
      onOk: async () => {
        try {
          await request.delete(`/metadata/${id}`);
          message.success('删除成功');
          loadData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await request.put(`/metadata/${editingRecord.id}`, values);
        message.success('更新成功');
      } else {
        await request.post('/metadata', values);
        message.success('创建成功');
      }
      setIsModalVisible(false);
      loadData();
      loadStats();
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error(error.message || '操作失败');
    }
  };

  const handleImport = async () => {
    try {
      const values = await importForm.validateFields();
      const items = JSON.parse(values.items);
      await request.post('/metadata/batch', { items });
      message.success('批量导入成功');
      setIsImportVisible(false);
      importForm.resetFields();
      loadData();
      loadStats();
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error(error.message || '导入失败');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>
          <FileTextOutlined /> 元数据管理
        </h2>
        <Space>
          <Button icon={<ImportOutlined />} onClick={() => setIsImportVisible(true)}>
            批量导入
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增元数据
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总数量" value={stats.total || 0} />
          </Card>
        </Col>
        <Col span={18}>
          <Card>
            <Space>
              <Select
                placeholder="类型"
                style={{ width: 120 }}
                allowClear
                value={filters.type}
                onChange={(value) => setFilters({ ...filters, type: value || '' })}
              >
                <Option value="表">表</Option>
                <Option value="字段">字段</Option>
                <Option value="视图">视图</Option>
                <Option value="函数">函数</Option>
              </Select>
              <Input
                placeholder="数据库"
                style={{ width: 150 }}
                value={filters.database}
                onChange={(e) => setFilters({ ...filters, database: e.target.value })}
              />
              <Input
                placeholder="搜索名称或描述"
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={metadata}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑元数据' : '新增元数据'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="类型"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select placeholder="请选择类型">
                  <Option value="表">表</Option>
                  <Option value="字段">字段</Option>
                  <Option value="视图">视图</Option>
                  <Option value="函数">函数</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="database" label="数据库">
                <Input placeholder="请输入数据库名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="schema" label="Schema">
                <Input placeholder="请输入Schema" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tableName" label="表名">
                <Input placeholder="请输入表名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="columnName" label="字段名">
                <Input placeholder="请输入字段名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dataType" label="数据类型">
                <Input placeholder="如: VARCHAR, INT" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select
              mode="tags"
              placeholder="输入标签后按回车"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="批量导入元数据"
        open={isImportVisible}
        onClose={() => {
          setIsImportVisible(false);
          importForm.resetFields();
        }}
        width={600}
      >
        <Form form={importForm} layout="vertical">
          <Form.Item
            name="items"
            label="元数据JSON"
            rules={[{ required: true, message: '请输入JSON数据' }]}
            extra='格式: [{"name":"表名","type":"表","database":"db1",...}, ...]'
          >
            <TextArea rows={10} placeholder="请输入JSON格式的元数据数组" />
          </Form.Item>
        </Form>
        <div style={{ marginTop: 16 }}>
          <Button type="primary" onClick={handleImport}>
            导入
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default Metadata;

