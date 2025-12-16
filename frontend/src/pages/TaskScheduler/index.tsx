import { useState } from 'react';
import { Table, Button, Space, Card, Tag, Modal, Form, Input, Select, message } from 'antd';
import { ScheduleOutlined, PlayCircleOutlined, PauseCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

interface ScheduledTask {
  key: string;
  name: string;
  type: string;
  cron: string;
  status: string;
  lastRunTime: string;
  nextRunTime: string;
  runCount: number;
}

const TaskScheduler = () => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([
    {
      key: '1',
      name: '每日数据同步',
      type: 'ETL',
      cron: '0 0 0 * * ?',
      status: '启用',
      lastRunTime: '2024-12-16 00:00:00',
      nextRunTime: '2024-12-17 00:00:00',
      runCount: 365,
    },
    {
      key: '2',
      name: '每小时数据统计',
      type: '统计',
      cron: '0 0 * * * ?',
      status: '启用',
      lastRunTime: '2024-12-16 10:00:00',
      nextRunTime: '2024-12-16 11:00:00',
      runCount: 8760,
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
      title: '任务类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Cron表达式',
      dataIndex: 'cron',
      key: 'cron',
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
      title: '执行次数',
      dataIndex: 'runCount',
      key: 'runCount',
    },
    {
      title: '上次执行时间',
      dataIndex: 'lastRunTime',
      key: 'lastRunTime',
    },
    {
      title: '下次执行时间',
      dataIndex: 'nextRunTime',
      key: 'nextRunTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ScheduledTask) => (
        <Space>
          {record.status === '启用' ? (
            <Button
              type="link"
              icon={<PauseCircleOutlined />}
              onClick={() => handleStatusChange(record.key, '禁用')}
            >
              禁用
            </Button>
          ) : (
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStatusChange(record.key, '启用')}
            >
              启用
            </Button>
          )}
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

  const handleStatusChange = (key: string, status: string) => {
    setTasks(
      tasks.map((item) =>
        item.key === key ? { ...item, status } : item
      )
    );
    message.success(`任务已${status === '启用' ? '启用' : '禁用'}`);
  };

  const handleDelete = (key: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个调度任务吗？',
      onOk: () => {
        setTasks(tasks.filter((item) => item.key !== key));
        message.success('删除成功');
      },
    });
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const newTask: ScheduledTask = {
        key: Date.now().toString(),
        ...values,
        status: '启用',
        lastRunTime: '-',
        nextRunTime: dayjs().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        runCount: 0,
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
          <ScheduleOutlined /> 任务调度
        </h2>
        <Button type="primary" onClick={() => setIsModalVisible(true)}>
          创建调度任务
        </Button>
      </div>
      <Card>
        <Table columns={columns} dataSource={tasks} />
      </Card>
      <Modal
        title="创建调度任务"
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
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="任务类型"
            rules={[{ required: true, message: '请选择任务类型' }]}
          >
            <Select placeholder="请选择任务类型">
              <Option value="ETL">ETL</Option>
              <Option value="统计">统计</Option>
              <Option value="采集">采集</Option>
              <Option value="交换">交换</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="cron"
            label="Cron表达式"
            rules={[{ required: true, message: '请输入Cron表达式' }]}
            extra="例如: 0 0 0 * * ? (每天0点执行)"
          >
            <Input placeholder="请输入Cron表达式" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskScheduler;

