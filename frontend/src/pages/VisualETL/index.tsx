import { useState, useCallback, useRef } from 'react';
import {
  Card,
  Button,
  Space,
  Row,
  Col,
  message,
  Modal,
  Form,
  Input,
  Select,
  Drawer,
} from 'antd';
import {
  ApartmentOutlined,
  SaveOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  SettingOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import type { Node, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from '../../components/ETLNodes';

const { Option } = Select;

interface NodeTemplate {
  type: string;
  label: string;
  category: string;
  nodeType: string;
}

const nodeTemplates: NodeTemplate[] = [
  // 数据源
  { type: 'MySQL', label: 'MySQL数据源', category: 'dataSource', nodeType: 'dataSource' },
  { type: 'PostgreSQL', label: 'PostgreSQL数据源', category: 'dataSource', nodeType: 'dataSource' },
  { type: '文件', label: '文件数据源', category: 'dataSource', nodeType: 'dataSource' },
  // 转换组件
  { type: '字段映射', label: '字段映射', category: 'transform', nodeType: 'transform' },
  { type: '数据清洗', label: '数据清洗', category: 'transform', nodeType: 'transform' },
  { type: '数据过滤', label: '数据过滤', category: 'transform', nodeType: 'transform' },
  { type: '数据聚合', label: '数据聚合', category: 'transform', nodeType: 'transform' },
  // 目标组件
  { type: '数据库', label: '数据库目标', category: 'target', nodeType: 'target' },
  { type: '文件', label: '文件目标', category: 'target', nodeType: 'target' },
  { type: 'API', label: 'API目标', category: 'target', nodeType: 'target' },
  // 流程控制
  { type: '条件分支', label: '条件分支', category: 'control', nodeType: 'control' },
  { type: '循环', label: '循环', category: 'control', nodeType: 'control' },
  { type: '并行', label: '并行', category: 'control', nodeType: 'control' },
];

const VisualETL = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [saving, setSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [configDrawerVisible, setConfigDrawerVisible] = useState(false);
  const [configForm] = Form.useForm();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onDragStart = (event: React.DragEvent, nodeTemplate: NodeTemplate) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeTemplate));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeTemplate = JSON.parse(
        event.dataTransfer.getData('application/reactflow')
      ) as NodeTemplate;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: nodeTemplate.nodeType,
        position,
        data: {
          label: nodeTemplate.label,
          type: nodeTemplate.type,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const handleSave = () => {
    setSaving(true);
    const flowData = {
      nodes,
      edges,
    };
    // TODO: 保存到后端
    setTimeout(() => {
      localStorage.setItem('etl-flow', JSON.stringify(flowData));
      setSaving(false);
      message.success('保存成功');
    }, 1000);
  };

  const handleLoad = () => {
    const saved = localStorage.getItem('etl-flow');
    if (saved) {
      const flowData = JSON.parse(saved);
      setNodes(flowData.nodes || []);
      setEdges(flowData.edges || []);
      message.success('加载成功');
    } else {
      message.info('没有保存的流程');
    }
  };

  const handleClear = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空画布吗？此操作不可恢复。',
      onOk: () => {
        setNodes([]);
        setEdges([]);
        message.success('已清空画布');
      },
    });
  };

  const handleRun = () => {
    if (nodes.length === 0) {
      message.warning('请先添加节点');
      return;
    }
    message.info('ETL流程执行功能开发中...');
  };

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    configForm.setFieldsValue({
      label: node.data.label,
      type: node.data.type,
      ...node.data.config,
    });
  };

  const handleConfigSave = () => {
    configForm.validateFields().then((values) => {
      if (selectedNode) {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === selectedNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    label: values.label,
                    config: values,
                  },
                }
              : node
          )
        );
        message.success('配置已保存');
        setConfigDrawerVisible(false);
      }
    });
  };

  const handleDeleteNode = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            edge.source !== selectedNode.id && edge.target !== selectedNode.id
        )
      );
      setSelectedNode(null);
      setConfigDrawerVisible(false);
      message.success('节点已删除');
    }
  };

  const getNodesByCategory = (category: string) => {
    return nodeTemplates.filter((t) => t.category === category);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>
          <ApartmentOutlined /> 可视化ETL
        </h2>
        <Space>
          <Button onClick={handleLoad}>加载</Button>
          <Button icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
            保存
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空
          </Button>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleRun}>
            执行
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={4}>
          <Card title="数据源" size="small" style={{ marginBottom: 16 }}>
            {getNodesByCategory('dataSource').map((template) => (
              <div
                key={template.type}
                draggable
                onDragStart={(e) => onDragStart(e, template)}
                style={{
                  padding: '8px',
                  margin: '4px 0',
                  background: '#f0f0f0',
                  borderRadius: 4,
                  cursor: 'grab',
                  textAlign: 'center',
                }}
              >
                {template.label}
              </div>
            ))}
          </Card>
          <Card title="转换组件" size="small" style={{ marginBottom: 16 }}>
            {getNodesByCategory('transform').map((template) => (
              <div
                key={template.type}
                draggable
                onDragStart={(e) => onDragStart(e, template)}
                style={{
                  padding: '8px',
                  margin: '4px 0',
                  background: '#f0f0f0',
                  borderRadius: 4,
                  cursor: 'grab',
                  textAlign: 'center',
                }}
              >
                {template.label}
              </div>
            ))}
          </Card>
          <Card title="目标组件" size="small" style={{ marginBottom: 16 }}>
            {getNodesByCategory('target').map((template) => (
              <div
                key={template.type}
                draggable
                onDragStart={(e) => onDragStart(e, template)}
                style={{
                  padding: '8px',
                  margin: '4px 0',
                  background: '#f0f0f0',
                  borderRadius: 4,
                  cursor: 'grab',
                  textAlign: 'center',
                }}
              >
                {template.label}
              </div>
            ))}
          </Card>
          <Card title="流程控制" size="small">
            {getNodesByCategory('control').map((template) => (
              <div
                key={template.type}
                draggable
                onDragStart={(e) => onDragStart(e, template)}
                style={{
                  padding: '8px',
                  margin: '4px 0',
                  background: '#f0f0f0',
                  borderRadius: 4,
                  cursor: 'grab',
                  textAlign: 'center',
                }}
              >
                {template.label}
              </div>
            ))}
          </Card>
        </Col>
        <Col span={20}>
          <Card style={{ height: 'calc(100vh - 250px)', minHeight: 600 }}>
            <div
              ref={reactFlowWrapper}
              style={{ width: '100%', height: '100%' }}
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                nodeTypes={nodeTypes}
                fitView
                onInit={setReactFlowInstance}
              >
                <Controls />
                <MiniMap />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                <Panel position="top-right">
                  {selectedNode && (
                    <Space>
                      <Button
                        size="small"
                        icon={<SettingOutlined />}
                        onClick={() => setConfigDrawerVisible(true)}
                      >
                        配置
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleDeleteNode}
                      >
                        删除
                      </Button>
                    </Space>
                  )}
                </Panel>
              </ReactFlow>
            </div>
          </Card>
        </Col>
      </Row>

      <Drawer
        title="节点配置"
        open={configDrawerVisible}
        onClose={() => setConfigDrawerVisible(false)}
        width={400}
        extra={
          <Space>
            <Button onClick={() => setConfigDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleConfigSave}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={configForm} layout="vertical">
          <Form.Item
            name="label"
            label="节点名称"
            rules={[{ required: true, message: '请输入节点名称' }]}
          >
            <Input placeholder="请输入节点名称" />
          </Form.Item>
          <Form.Item name="type" label="节点类型">
            <Input disabled />
          </Form.Item>
          {selectedNode?.type === 'dataSource' && (
            <>
              <Form.Item name="host" label="主机地址">
                <Input placeholder="请输入主机地址" />
              </Form.Item>
              <Form.Item name="port" label="端口">
                <Input type="number" placeholder="请输入端口" />
              </Form.Item>
              <Form.Item name="database" label="数据库名">
                <Input placeholder="请输入数据库名" />
              </Form.Item>
              <Form.Item name="username" label="用户名">
                <Input placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item name="password" label="密码">
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            </>
          )}
          {selectedNode?.type === 'transform' && (
            <>
              <Form.Item name="mapping" label="字段映射">
                <Input.TextArea
                  rows={4}
                  placeholder="格式: source_field -> target_field"
                />
              </Form.Item>
              <Form.Item name="filter" label="过滤条件">
                <Input placeholder="例如: age > 18" />
              </Form.Item>
            </>
          )}
          {selectedNode?.type === 'target' && (
            <>
              <Form.Item name="target" label="目标地址">
                <Input placeholder="请输入目标地址" />
              </Form.Item>
              <Form.Item name="format" label="输出格式">
                <Select placeholder="请选择输出格式">
                  <Option value="json">JSON</Option>
                  <Option value="csv">CSV</Option>
                  <Option value="parquet">Parquet</Option>
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Drawer>
    </div>
  );
};

export default VisualETL;
