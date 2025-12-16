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
  ProjectOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import request from '../../utils/request';

const { Option } = Select;
const { TextArea } = Input;

interface DataModelItem {
  id: string;
  name: string;
  type: string;
  description?: string;
  version: string;
  status: string;
  content: any;
  tags?: string[];
  owner?: string;
  relations?: any[];
  createdAt: string;
}

const DataModel = () => {
  const [models, setModels] = useState<DataModelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRelationVisible, setIsRelationVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DataModelItem | null>(null);
  const [selectedModel, setSelectedModel] = useState<DataModelItem | null>(null);
  const [form] = Form.useForm();
  const [relationForm] = Form.useForm();
  const [stats, setStats] = useState<any>({});

  const [filters, setFilters] = useState({
    type: '',
    status: '',
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
      if (filters.status) params.status = filters.status;
      if (filters.keyword) params.keyword = filters.keyword;

      const data: any = await request.get('/data-model', { params });
      setModels(data || []);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await request.get('/data-model/stats/overview');
      setStats(data);
    } catch (error) {
      // 忽略统计错误
    }
  };

  const columns = [
    {
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          概念模型: 'blue',
          逻辑模型: 'green',
          物理模型: 'orange',
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          草稿: 'default',
          已发布: 'success',
          已归档: 'processing',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
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
      title: '关系数',
      key: 'relations',
      width: 80,
      render: (_: any, record: DataModelItem) => record.relations?.length || 0,
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right' as const,
      render: (_: any, record: DataModelItem) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<LinkOutlined />}
            onClick={() => handleAddRelation(record)}
          >
            关系
          </Button>
          {record.status === '草稿' && (
            <Button
              type="link"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handlePublish(record.id)}
            >
              发布
            </Button>
          )}
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

  const handleEdit = (record: DataModelItem) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      content: JSON.stringify(record.content, null, 2),
      tags: record.tags,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个数据模型吗？',
      onOk: async () => {
        try {
          await request.delete(`/data-model/${id}`);
          message.success('删除成功');
          loadData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handlePublish = async (id: string) => {
    try {
      await request.post(`/data-model/${id}/publish`);
      message.success('发布成功');
      loadData();
    } catch (error) {
      message.error('发布失败');
    }
  };

  const handleAddRelation = (model: DataModelItem) => {
    setSelectedModel(model);
    relationForm.resetFields();
    setIsRelationVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const content = JSON.parse(values.content || '{}');
      const submitData = {
        ...values,
        content,
      };

      if (editingRecord) {
        await request.put(`/data-model/${editingRecord.id}`, submitData);
        message.success('更新成功');
      } else {
        await request.post('/data-model', submitData);
        message.success('创建成功');
      }
      setIsModalVisible(false);
      loadData();
      loadStats();
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      if (error.message?.includes('JSON')) {
        message.error('内容必须是有效的JSON格式');
      } else {
        message.error(error.message || '操作失败');
      }
    }
  };

  const handleRelationSubmit = async () => {
    try {
      const values = await relationForm.validateFields();
      if (!selectedModel) return;

      await request.post(`/data-model/${selectedModel.id}/relations`, values);
      message.success('创建关系成功');
      setIsRelationVisible(false);
      loadData();
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error(error.message || '创建关系失败');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>
          <ProjectOutlined /> 数据建模
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建模型
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="总模型数" value={stats.total || 0} />
          </Card>
        </Col>
        <Col span={16}>
          <Card>
            <Space>
              <Select
                placeholder="类型"
                style={{ width: 120 }}
                allowClear
                value={filters.type}
                onChange={(value) => setFilters({ ...filters, type: value || '' })}
              >
                <Option value="概念模型">概念模型</Option>
                <Option value="逻辑模型">逻辑模型</Option>
                <Option value="物理模型">物理模型</Option>
              </Select>
              <Select
                placeholder="状态"
                style={{ width: 120 }}
                allowClear
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value || '' })}
              >
                <Option value="草稿">草稿</Option>
                <Option value="已发布">已发布</Option>
                <Option value="已归档">已归档</Option>
              </Select>
              <Input
                placeholder="搜索名称或描述"
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
          dataSource={models}
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
        title={editingRecord ? '编辑数据模型' : '新建数据模型'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="模型名称"
                rules={[{ required: true, message: '请输入模型名称' }]}
              >
                <Input placeholder="请输入模型名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="类型"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select placeholder="请选择类型">
                  <Option value="概念模型">概念模型</Option>
                  <Option value="逻辑模型">逻辑模型</Option>
                  <Option value="物理模型">物理模型</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="version" label="版本" initialValue="1.0">
                <Input placeholder="版本号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tags" label="标签">
                <Select
                  mode="tags"
                  placeholder="输入标签后按回车"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item
            name="content"
            label="模型内容（JSON）"
            rules={[{ required: true, message: '请输入模型内容' }]}
            extra="JSON格式，包含表结构、字段定义等"
          >
            <TextArea
              rows={10}
              placeholder='{"tables": [{"name": "users", "columns": [...]}]}'
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="添加表关系"
        open={isRelationVisible}
        onClose={() => {
          setIsRelationVisible(false);
          setSelectedModel(null);
        }}
        width={500}
      >
        <Form form={relationForm} layout="vertical">
          <Form.Item
            name="sourceTable"
            label="源表"
            rules={[{ required: true, message: '请输入源表名' }]}
          >
            <Input placeholder="请输入源表名" />
          </Form.Item>
          <Form.Item
            name="targetTable"
            label="目标表"
            rules={[{ required: true, message: '请输入目标表名' }]}
          >
            <Input placeholder="请输入目标表名" />
          </Form.Item>
          <Form.Item
            name="relationType"
            label="关系类型"
            rules={[{ required: true, message: '请选择关系类型' }]}
          >
            <Select placeholder="请选择关系类型">
              <Option value="一对一">一对一</Option>
              <Option value="一对多">一对多</Option>
              <Option value="多对多">多对多</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入关系描述" />
          </Form.Item>
        </Form>
        <div style={{ marginTop: 16 }}>
          <Button type="primary" onClick={handleRelationSubmit}>
            创建关系
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default DataModel;

