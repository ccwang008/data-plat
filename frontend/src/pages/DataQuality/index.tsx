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
  Progress,
  Drawer,
} from 'antd';
import {
  CheckCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import request from '../../utils/request';

const { Option } = Select;
const { TextArea } = Input;

interface QualityRule {
  id: string;
  name: string;
  type: string;
  dataSource: string;
  tableName: string;
  columnName?: string;
  rule: string;
  threshold?: number;
  status: string;
  passRate?: number;
  lastRunTime?: string;
  results?: any[];
}

const DataQuality = () => {
  const [rules, setRules] = useState<QualityRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<QualityRule | null>(null);
  const [selectedRule, setSelectedRule] = useState<QualityRule | null>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState<any>({});

  const [filters, setFilters] = useState({
    type: '',
    dataSource: '',
    status: '',
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
      if (filters.dataSource) params.dataSource = filters.dataSource;
      if (filters.status) params.status = filters.status;

      const data: any = await request.get('/data-quality/rules', { params });
      setRules(data || []);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await request.get('/data-quality/stats');
      setStats(data);
    } catch (error) {
      // 忽略统计错误
    }
  };

  const columns = [
    {
      title: '规则名称',
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
          完整性: 'blue',
          准确性: 'green',
          一致性: 'orange',
          及时性: 'purple',
          唯一性: 'red',
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: '数据源',
      dataIndex: 'dataSource',
      key: 'dataSource',
      width: 150,
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
      title: '规则',
      dataIndex: 'rule',
      key: 'rule',
      ellipsis: true,
    },
    {
      title: '通过率',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 120,
      render: (rate: number) => {
        if (!rate) return '-';
        const status = rate >= 95 ? 'success' : rate >= 80 ? 'active' : 'exception';
        return <Progress percent={rate} size="small" status={status} />;
      },
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
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: QualityRule) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleExecute(record.id)}
          >
            执行
          </Button>
          <Button
            type="link"
            size="small"
            icon={<BarChartOutlined />}
            onClick={() => handleViewResults(record)}
          >
            结果
          </Button>
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

  const handleEdit = (record: QualityRule) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条质检规则吗？',
      onOk: async () => {
        try {
          await request.delete(`/data-quality/rules/${id}`);
          message.success('删除成功');
          loadData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleExecute = async (id: string) => {
    try {
      message.loading({ content: '执行中...', key: 'execute' });
      await request.post(`/data-quality/rules/${id}/execute`);
      message.success({ content: '执行成功', key: 'execute' });
      loadData();
      loadStats();
    } catch (error) {
      message.error({ content: '执行失败', key: 'execute' });
    }
  };

  const handleViewResults = (record: QualityRule) => {
    setSelectedRule(record);
    setIsResultVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await request.put(`/data-quality/rules/${editingRecord.id}`, values);
        message.success('更新成功');
      } else {
        await request.post('/data-quality/rules', values);
        message.success('创建成功');
      }
      setIsModalVisible(false);
      loadData();
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error(error.message || '操作失败');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>
          <CheckCircleOutlined /> 数据质检
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增规则
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总规则数" value={stats.totalRules || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="启用规则" value={stats.activeRules || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="总执行次数" value={stats.totalResults || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均通过率"
              value={stats.avgPassRate || 0}
              precision={2}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="类型"
            style={{ width: 120 }}
            allowClear
            value={filters.type}
            onChange={(value) => setFilters({ ...filters, type: value || '' })}
          >
            <Option value="完整性">完整性</Option>
            <Option value="准确性">准确性</Option>
            <Option value="一致性">一致性</Option>
            <Option value="及时性">及时性</Option>
            <Option value="唯一性">唯一性</Option>
          </Select>
          <Input
            placeholder="数据源"
            style={{ width: 150 }}
            value={filters.dataSource}
            onChange={(e) => setFilters({ ...filters, dataSource: e.target.value })}
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value || '' })}
          >
            <Option value="启用">启用</Option>
            <Option value="禁用">禁用</Option>
          </Select>
        </Space>
        <Table
          columns={columns}
          dataSource={rules}
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
        title={editingRecord ? '编辑质检规则' : '新增质检规则'}
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
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="类型"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select placeholder="请选择类型">
                  <Option value="完整性">完整性</Option>
                  <Option value="准确性">准确性</Option>
                  <Option value="一致性">一致性</Option>
                  <Option value="及时性">及时性</Option>
                  <Option value="唯一性">唯一性</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dataSource"
                label="数据源"
                rules={[{ required: true, message: '请输入数据源' }]}
              >
                <Input placeholder="请输入数据源" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tableName"
                label="表名"
                rules={[{ required: true, message: '请输入表名' }]}
              >
                <Input placeholder="请输入表名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="columnName" label="字段名">
                <Input placeholder="请输入字段名（可选）" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="rule"
            label="规则表达式"
            rules={[{ required: true, message: '请输入规则表达式' }]}
            extra="例如: NOT NULL, > 0, LENGTH > 10"
          >
            <TextArea rows={3} placeholder="请输入规则表达式" />
          </Form.Item>
          <Form.Item name="threshold" label="阈值">
            <Input type="number" placeholder="请输入阈值（0-100）" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="质检结果"
        open={isResultVisible}
        onClose={() => {
          setIsResultVisible(false);
          setSelectedRule(null);
        }}
        width={800}
      >
        {selectedRule && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="规则名称" value={selectedRule.name} />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="通过率"
                    value={selectedRule.passRate || 0}
                    precision={2}
                    suffix="%"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="最后执行时间"
                    value={selectedRule.lastRunTime || '-'}
                  />
                </Col>
              </Row>
            </Card>
            {selectedRule.results && selectedRule.results.length > 0 && (
              <Table
                dataSource={selectedRule.results}
                rowKey="id"
                columns={[
                  { title: '总行数', dataIndex: 'totalRows' },
                  { title: '通过数', dataIndex: 'passRows' },
                  { title: '失败数', dataIndex: 'failRows' },
                  {
                    title: '通过率',
                    dataIndex: 'passRate',
                    render: (rate: number) => `${rate.toFixed(2)}%`,
                  },
                  { title: '执行时间', dataIndex: 'runTime' },
                ]}
                pagination={false}
              />
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default DataQuality;

