import { Row, Col, Card, Statistic, Table, Tag } from 'antd';
import {
  DatabaseOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const Dashboard = () => {
  const statistics = [
    {
      title: '数据源总数',
      value: 12,
      prefix: <DatabaseOutlined />,
      color: '#1890ff',
    },
    {
      title: '交换任务',
      value: 45,
      prefix: <SwapOutlined />,
      color: '#52c41a',
    },
    {
      title: '运行中任务',
      value: 8,
      prefix: <CheckCircleOutlined />,
      color: '#faad14',
    },
    {
      title: '待执行任务',
      value: 3,
      prefix: <ClockCircleOutlined />,
      color: '#ff4d4f',
    },
  ];

  const recentTasksColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          ETL: 'blue',
          采集: 'green',
          交换: 'orange',
        };
        return <Tag color={colorMap[type]}>{type}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          运行中: 'processing',
          成功: 'success',
          失败: 'error',
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
  ];

  const recentTasksData = [
    {
      key: '1',
      name: '数据同步任务-001',
      type: 'ETL',
      status: '运行中',
      createTime: '2024-12-16 10:30:00',
    },
    {
      key: '2',
      name: '数据采集-用户行为',
      type: '采集',
      status: '成功',
      createTime: '2024-12-16 09:15:00',
    },
    {
      key: '3',
      name: '数据交换-订单数据',
      type: '交换',
      status: '成功',
      createTime: '2024-12-16 08:00:00',
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>工作台</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {statistics.map((stat, index) => (
          <Col span={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.prefix}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>
      <Card title="最近任务">
        <Table
          columns={recentTasksColumns}
          dataSource={recentTasksData}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default Dashboard;

