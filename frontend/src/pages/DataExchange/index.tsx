import { useState } from 'react';
import { Table, Button, Space, Card, Tag, Modal, Form, Input, Select, message } from 'antd';
import { SwapOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

interface ExchangeTask {
  key: string;
  name: string;
  source: string;
  target: string;
  status: string;
  schedule: string;
  lastRunTime: string;
  nextRunTime: string;
}

const DataExchange = () => {
  const [tasks, setTasks] = useState<ExchangeTask[]>([
    {
      key: '1',
      name: '订单数据同步',
      source: 'MySQL生产库',
      target: '数据仓库',
      status: '运行中',
      schedule: '每天 00:00',
      lastRunTime: '2024-12-16 00:00:00',
      nextRunTime: '2024-12-17 00:00:00',
    },
    {
      key: '2',
      name: '用户数据交换',
      source: 'PostgreSQL测试库',
      target: 'MySQL生产库',
      status: '已停止',
      schedule: '每小时',
      lastRunTime: '2024-12-15 23:00:00',
      nextRunTime: '2024-12-16 00:00:00',
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
      title: '源数据源',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: '目标数据源',
      dataIndex: 'target',
      key: 'target',
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
      title: '调度策略',
      dataIndex: 'schedule',
      key: 'schedule',
    },
    {
      title: '上次运行时间',
      dataIndex: 'lastRunTime',
      key: 'lastRunTime',
    },
    {
      title: '下次运行时间',
      dataIndex: 'nextRunTime',
      key: 'nextRunTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ExchangeTask) => (
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
      const newTask: ExchangeTask = {
        key: Date.now().toString(),
        ...values,
        status: '已停止',
        lastRunTime: '-',
        nextRunTime: '-',
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
          <SwapOutlined /> 数据交换共享
        </h2>
        <Button type="primary" onClick={() => setIsModalVisible(true)}>
          创建交换任务
        </Button>
      </div>
      <Card>
        <Table columns={columns} dataSource={tasks} />
      </Card>
      <Modal
        title="创建数据交换任务"
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
            name="source"
            label="源数据源"
            rules={[{ required: true, message: '请选择源数据源' }]}
          >
            <Select placeholder="请选择源数据源">
              <Option value="MySQL生产库">MySQL生产库</Option>
              <Option value="PostgreSQL测试库">PostgreSQL测试库</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="target"
            label="目标数据源"
            rules={[{ required: true, message: '请选择目标数据源' }]}
          >
            <Select placeholder="请选择目标数据源">
              <Option value="数据仓库">数据仓库</Option>
              <Option value="MySQL生产库">MySQL生产库</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="schedule"
            label="调度策略"
            rules={[{ required: true, message: '请选择调度策略' }]}
          >
            <Select placeholder="请选择调度策略">
              <Option value="每天 00:00">每天 00:00</Option>
              <Option value="每小时">每小时</Option>
              <Option value="每30分钟">每30分钟</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataExchange;

