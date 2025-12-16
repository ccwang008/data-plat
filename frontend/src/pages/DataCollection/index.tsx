import { useState } from 'react';
import { Table, Button, Space, Card, Tag, Modal, Form, Input, Select, message } from 'antd';
import { CloudUploadOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

interface CollectionTask {
  key: string;
  name: string;
  type: string;
  source: string;
  status: string;
  schedule: string;
  lastRunTime: string;
  records: number;
}

const DataCollection = () => {
  const [tasks, setTasks] = useState<CollectionTask[]>([
    {
      key: '1',
      name: '用户行为数据采集',
      type: 'API',
      source: 'https://api.example.com/events',
      status: '运行中',
      schedule: '实时',
      lastRunTime: '2024-12-16 10:30:00',
      records: 12580,
    },
    {
      key: '2',
      name: '日志文件采集',
      type: '文件',
      source: '/var/log/app.log',
      status: '已停止',
      schedule: '每5分钟',
      lastRunTime: '2024-12-16 10:25:00',
      records: 3420,
    },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '采集类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="cyan">{type}</Tag>,
    },
    {
      title: '数据源',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === '运行中' ? 'success' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: '采集频率',
      dataIndex: 'schedule',
      key: 'schedule',
    },
    {
      title: '已采集记录数',
      dataIndex: 'records',
      key: 'records',
      render: (records: number) => records.toLocaleString(),
    },
    {
      title: '上次运行时间',
      dataIndex: 'lastRunTime',
      key: 'lastRunTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: CollectionTask) => (
        <Space>
          {record.status === '运行中' ? (
            <Button
              type="link"
              icon={<PauseCircleOutlined />}
              onClick={() => handleStatusChange(record.key, '已停止')}
            >
              停止
            </Button>
          ) : (
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStatusChange(record.key, '运行中')}
            >
              启动
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleStatusChange = (key: string, status: string) => {
    setTasks(
      tasks.map((item) =>
        item.key === key ? { ...item, status } : item
      )
    );
    message.success(`任务已${status === '运行中' ? '启动' : '停止'}`);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const newTask: CollectionTask = {
        key: Date.now().toString(),
        ...values,
        status: '已停止',
        lastRunTime: '-',
        records: 0,
      };
      setTasks([...tasks, newTask]);
      message.success('创建成功');
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>
          <CloudUploadOutlined /> 数据采集
        </h2>
        <Button type="primary" onClick={() => setIsModalVisible(true)}>
          创建采集任务
        </Button>
      </div>
      <Card>
        <Table columns={columns} dataSource={tasks} />
      </Card>
      <Modal
        title="创建数据采集任务"
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
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="采集类型"
            rules={[{ required: true, message: '请选择采集类型' }]}
          >
            <Select placeholder="请选择采集类型">
              <Option value="API">API</Option>
              <Option value="文件">文件</Option>
              <Option value="数据库">数据库</Option>
              <Option value="消息队列">消息队列</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="source"
            label="数据源"
            rules={[{ required: true, message: '请输入数据源' }]}
          >
            <Input placeholder="请输入数据源地址或路径" />
          </Form.Item>
          <Form.Item
            name="schedule"
            label="采集频率"
            rules={[{ required: true, message: '请选择采集频率' }]}
          >
            <Select placeholder="请选择采集频率">
              <Option value="实时">实时</Option>
              <Option value="每5分钟">每5分钟</Option>
              <Option value="每小时">每小时</Option>
              <Option value="每天">每天</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataCollection;

