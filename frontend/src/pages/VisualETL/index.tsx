import { useState, useCallback, useRef, useEffect } from 'react';
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
  InputNumber,
  Tooltip,
  Divider,
  Menu,
} from 'antd';
import {
  ApartmentOutlined,
  SaveOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  SettingOutlined,
  ClearOutlined,
  CopyOutlined,
  UndoOutlined,
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignBottomOutlined,
  ScissorOutlined,
  FileTextOutlined,
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
  ConnectionMode,
  MarkerType,
} from 'reactflow';
import type { Node, Edge, Connection } from 'reactflow';
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
  { type: 'API', label: 'API数据源', category: 'dataSource', nodeType: 'dataSource' },
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
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [configDrawerVisible, setConfigDrawerVisible] = useState(false);
  const [configForm] = Form.useForm();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [copiedNodes, setCopiedNodes] = useState<Node[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node?: Node } | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  // 撤销/重做历史记录
  const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const historyIndexRef = useRef(-1);

  // 保存历史记录
  const saveHistory = useCallback((nodes: Node[], edges: Edge[]) => {
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      historyIndexRef.current++;
    }
    historyRef.current = newHistory;
  }, []);

  // 初始化时保存初始状态
  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) {
      saveHistory([], []);
    }
  }, []);

  // 节点和边变化时保存历史
  useEffect(() => {
    if (historyIndexRef.current >= 0) {
      const currentState = { nodes, edges };
      const lastState = historyRef.current[historyIndexRef.current];
      if (JSON.stringify(currentState) !== JSON.stringify(lastState)) {
        saveHistory(nodes, edges);
      }
    }
  }, [nodes, edges, saveHistory]);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

      // 删除选中节点
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodes.length > 0) {
        event.preventDefault();
        handleDeleteSelectedNodes();
      }

      // 复制 (Ctrl+C / Cmd+C)
      if (ctrlKey && event.key === 'c' && selectedNodes.length > 0) {
        event.preventDefault();
        setCopiedNodes(selectedNodes);
        message.success(`已复制 ${selectedNodes.length} 个节点`);
      }

      // 粘贴 (Ctrl+V / Cmd+V)
      if (ctrlKey && event.key === 'v' && copiedNodes.length > 0) {
        event.preventDefault();
        handlePasteNodes();
      }

      // 剪切 (Ctrl+X / Cmd+X)
      if (ctrlKey && event.key === 'x' && selectedNodes.length > 0) {
        event.preventDefault();
        setCopiedNodes(selectedNodes);
        handleDeleteSelectedNodes();
        message.success(`已剪切 ${selectedNodes.length} 个节点`);
      }

      // 撤销 (Ctrl+Z / Cmd+Z)
      if (ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      }

      // 重做 (Ctrl+Shift+Z / Cmd+Shift+Z 或 Ctrl+Y / Cmd+Y)
      if ((ctrlKey && event.shiftKey && event.key === 'z') || (ctrlKey && event.key === 'y')) {
        event.preventDefault();
        handleRedo();
      }

      // 全选 (Ctrl+A / Cmd+A)
      if (ctrlKey && event.key === 'a') {
        event.preventDefault();
        setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
        setSelectedNodes(nodes);
        message.info('已全选所有节点');
      }

      // 搜索 (Ctrl+F / Cmd+F)
      if (ctrlKey && event.key === 'f') {
        event.preventDefault();
        setSearchVisible(true);
      }

      // ESC 关闭搜索和右键菜单
      if (event.key === 'Escape') {
        setSearchVisible(false);
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, copiedNodes, nodes, setNodes]);

  // 更新选中节点列表
  useEffect(() => {
    const selected = nodes.filter((n) => n.selected);
    setSelectedNodes(selected);
    if (selected.length === 1) {
      setSelectedNode(selected[0]);
    } else {
      setSelectedNode(null);
    }
  }, [nodes]);

  // 连接验证函数
  const isValidConnection = useCallback((connection: Connection) => {
    // 获取源节点和目标节点
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    // 不能连接到自己
    if (sourceNode.id === targetNode.id) {
      message.warning('不能将节点连接到自身');
      return false;
    }

    // 检查是否已经存在相同的连接
    const existingEdge = edges.find(
      (e) => e.source === connection.source && e.target === connection.target
    );
    if (existingEdge) {
      message.warning('该连接已存在');
      return false;
    }

    // 验证连接类型：数据源只能作为起点，目标节点只能作为终点
    const sourceType = sourceNode.type;
    const targetType = targetNode.type;

    // 数据源节点只能作为起点
    if (sourceType === 'dataSource' && targetType === 'dataSource') {
      message.warning('数据源节点不能连接到数据源节点');
      return false;
    }

    // 目标节点不能作为起点
    if (sourceType === 'target') {
      message.warning('目标节点不能作为起点');
      return false;
    }

    // 数据源不能连接到目标节点（需要通过转换节点）
    if (sourceType === 'dataSource' && targetType === 'target') {
      message.warning('数据源需要通过转换节点连接到目标节点');
      return false;
    }

    return true;
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (isValidConnection(params)) {
        setEdges((eds) =>
          addEdge(
            {
              ...params,
              type: 'smoothstep',
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
              style: { strokeWidth: 2, stroke: '#1890ff' },
            },
            eds
          )
        );
      }
    },
    [setEdges, isValidConnection]
  );

  const onDragStart = (event: React.DragEvent, nodeTemplate: NodeTemplate) => {
    try {
      // 设置拖拽数据
      const data = JSON.stringify(nodeTemplate);
      event.dataTransfer.setData('application/reactflow', data);
      event.dataTransfer.effectAllowed = 'move';
      
      // 添加拖拽时的视觉反馈
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.style.opacity = '0.5';
      }
    } catch (error) {
      console.error('Error starting drag:', error);
      message.error('拖拽失败，请重试');
    }
  };

  const onDragEnd = (event: React.DragEvent) => {
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.style.opacity = '1';
      event.currentTarget.style.transform = '';
    }
    // 恢复画布样式
    if (reactFlowWrapper.current) {
      reactFlowWrapper.current.style.cursor = 'default';
      reactFlowWrapper.current.style.backgroundColor = '';
    }
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // 检查是否有有效的拖拽数据
    const hasData = event.dataTransfer.types.includes('application/reactflow');
    if (hasData) {
      event.dataTransfer.dropEffect = 'move';
      // 添加悬停效果
      if (reactFlowWrapper.current) {
        reactFlowWrapper.current.style.cursor = 'crosshair';
        reactFlowWrapper.current.style.backgroundColor = '#f0f9ff';
      }
    } else {
      event.dataTransfer.dropEffect = 'none';
    }
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        console.warn('ReactFlow wrapper or instance not available');
        return;
      }

      // 恢复鼠标样式
      if (reactFlowWrapper.current) {
        reactFlowWrapper.current.style.cursor = 'default';
        reactFlowWrapper.current.style.backgroundColor = '';
      }

      try {
        // 获取拖拽数据
        const data = event.dataTransfer.getData('application/reactflow');
        if (!data) {
          console.warn('No drag data found');
          return;
        }

        const nodeTemplate = JSON.parse(data) as NodeTemplate;
        if (!nodeTemplate || !nodeTemplate.nodeType) {
          console.warn('Invalid node template:', nodeTemplate);
          return;
        }

        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        // 网格对齐（对齐到20像素网格）
        const snapToGrid = 20;
        const snappedPosition = {
          x: Math.round(position.x / snapToGrid) * snapToGrid,
          y: Math.round(position.y / snapToGrid) * snapToGrid,
        };

        const newNode: Node = {
          id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: nodeTemplate.nodeType,
          position: snappedPosition,
          data: {
            label: nodeTemplate.label,
            type: nodeTemplate.type,
          },
          selected: false,
        };

        setNodes((nds) => nds.concat(newNode));
        message.success(`已添加节点: ${nodeTemplate.label}`);
      } catch (error) {
        console.error('Error dropping node:', error);
        message.error('添加节点失败，请重试');
      }
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
      ...(node.data.config || {}),
    });
  };

  // 双击节点快速打开配置
  const handleNodeDoubleClick = (_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    configForm.setFieldsValue({
      label: node.data.label,
      type: node.data.type,
      ...(node.data.config || {}),
    });
    setConfigDrawerVisible(true);
  };

  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  // 撤销功能
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const state = historyRef.current[historyIndexRef.current];
      setNodes(state.nodes);
      setEdges(state.edges);
      message.success('已撤销');
    } else {
      message.info('没有可撤销的操作');
    }
  }, [setNodes, setEdges]);

  // 重做功能
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const state = historyRef.current[historyIndexRef.current];
      setNodes(state.nodes);
      setEdges(state.edges);
      message.success('已重做');
    } else {
      message.info('没有可重做的操作');
    }
  }, [setNodes, setEdges]);

  // 复制节点
  const handleCopyNode = useCallback(() => {
    if (selectedNode) {
      setCopiedNodes([selectedNode]);
      message.success('节点已复制');
    }
  }, [selectedNode]);

  // 粘贴节点
  const handlePasteNodes = useCallback(() => {
    if (copiedNodes.length === 0) return;

    const newNodes = copiedNodes.map((node, index) => ({
      ...node,
      id: `node-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      position: {
        x: node.position.x + 200 + (index % 3) * 50,
        y: node.position.y + 100 + Math.floor(index / 3) * 100,
      },
      selected: false,
    }));

    setNodes((nds) => [...nds, ...newNodes]);
    message.success(`已粘贴 ${newNodes.length} 个节点`);
  }, [copiedNodes, setNodes]);

  // 删除选中的节点
  const handleDeleteSelectedNodes = useCallback(() => {
    if (selectedNodes.length === 0) return;

    const nodeIds = selectedNodes.map((n) => n.id);
    setNodes((nds) => nds.filter((node) => !nodeIds.includes(node.id)));
    setEdges((eds) =>
      eds.filter(
        (edge) => !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)
      )
    );
    setSelectedNodes([]);
    setSelectedNode(null);
    message.success(`已删除 ${nodeIds.length} 个节点`);
  }, [selectedNodes, setNodes, setEdges]);

  // 缩放控制
  const handleZoomIn = useCallback(() => {
    reactFlowInstance?.zoomIn();
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance?.zoomOut();
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
  }, [reactFlowInstance]);

  // 导出流程
  const handleExport = useCallback(() => {
    const flowData = {
      nodes,
      edges,
      version: '1.0',
      exportedAt: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(flowData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `etl-flow-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('流程已导出');
  }, [nodes, edges]);

  // 导入流程
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const flowData = JSON.parse(event.target?.result as string);
            setNodes(flowData.nodes || []);
            setEdges(flowData.edges || []);
            message.success('流程已导入');
            setTimeout(() => {
              reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
            }, 100);
          } catch (error) {
            message.error('导入失败：文件格式不正确');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [setNodes, setEdges, reactFlowInstance]);

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

  // 节点对齐功能
  const handleAlignNodes = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedNodes.length < 2) {
      message.warning('请选择至少 2 个节点进行对齐');
      return;
    }

    const updatedNodes = [...nodes];
    
    if (alignment === 'left') {
      const minX = Math.min(...selectedNodes.map((n) => n.position.x));
      selectedNodes.forEach((node) => {
        const index = updatedNodes.findIndex((n) => n.id === node.id);
        if (index !== -1) {
          updatedNodes[index].position.x = minX;
        }
      });
    } else if (alignment === 'right') {
      const maxX = Math.max(...selectedNodes.map((n) => n.position.x + (n.width || 180)));
      selectedNodes.forEach((node) => {
        const index = updatedNodes.findIndex((n) => n.id === node.id);
        if (index !== -1) {
          updatedNodes[index].position.x = maxX - (node.width || 180);
        }
      });
    } else if (alignment === 'center') {
      const avgX = selectedNodes.reduce((sum, n) => sum + n.position.x + (n.width || 180) / 2, 0) / selectedNodes.length;
      selectedNodes.forEach((node) => {
        const index = updatedNodes.findIndex((n) => n.id === node.id);
        if (index !== -1) {
          updatedNodes[index].position.x = avgX - (node.width || 180) / 2;
        }
      });
    } else if (alignment === 'top') {
      const minY = Math.min(...selectedNodes.map((n) => n.position.y));
      selectedNodes.forEach((node) => {
        const index = updatedNodes.findIndex((n) => n.id === node.id);
        if (index !== -1) {
          updatedNodes[index].position.y = minY;
        }
      });
    } else if (alignment === 'bottom') {
      const maxY = Math.max(...selectedNodes.map((n) => n.position.y + (n.height || 80)));
      selectedNodes.forEach((node) => {
        const index = updatedNodes.findIndex((n) => n.id === node.id);
        if (index !== -1) {
          updatedNodes[index].position.y = maxY - (node.height || 80);
        }
      });
    } else if (alignment === 'middle') {
      const avgY = selectedNodes.reduce((sum, n) => sum + n.position.y + (n.height || 80) / 2, 0) / selectedNodes.length;
      selectedNodes.forEach((node) => {
        const index = updatedNodes.findIndex((n) => n.id === node.id);
        if (index !== -1) {
          updatedNodes[index].position.y = avgY - (node.height || 80) / 2;
        }
      });
    }

    setNodes(updatedNodes);
    message.success('节点已对齐');
  }, [selectedNodes, nodes, setNodes]);

  // 右键菜单处理
  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      node,
    });
    setSelectedNode(node);
    setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })));
  }, [setNodes]);

  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  // 关闭右键菜单
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // 搜索节点
  const handleSearchNodes = useCallback((value: string) => {
    setSearchValue(value);
    if (!value.trim()) {
      setNodes((nds) => nds.map((n) => ({ ...n, style: { ...n.style } })));
      return;
    }

    const filteredNodes = nodes.filter((node) =>
      node.data.label.toLowerCase().includes(value.toLowerCase()) ||
      node.data.type.toLowerCase().includes(value.toLowerCase())
    );

    if (filteredNodes.length > 0) {
      // 高亮匹配的节点
      setNodes((nds) =>
        nds.map((n) => {
          const isMatch = filteredNodes.some((fn) => fn.id === n.id);
          return {
            ...n,
            style: {
              ...n.style,
              opacity: isMatch ? 1 : 0.3,
              border: isMatch ? '2px solid #1890ff' : n.style?.border,
            },
          };
        })
      );

      // 定位到第一个匹配的节点
      const firstMatch = filteredNodes[0];
      reactFlowInstance?.setCenter(firstMatch.position.x, firstMatch.position.y, { zoom: 1, duration: 400 });
      message.info(`找到 ${filteredNodes.length} 个匹配的节点`);
    } else {
      message.warning('未找到匹配的节点');
    }
  }, [nodes, setNodes, reactFlowInstance]);

  // 清除搜索
  const handleClearSearch = useCallback(() => {
    setSearchValue('');
    setSearchVisible(false);
    setNodes((nds) => nds.map((n) => ({ ...n, style: { ...n.style, opacity: 1 } })));
  }, [setNodes]);

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
          <Tooltip title="撤销 (Ctrl+Z / Cmd+Z)">
            <Button
              icon={<UndoOutlined />}
              onClick={handleUndo}
              disabled={historyIndexRef.current <= 0}
            >
              撤销
            </Button>
          </Tooltip>
          <Tooltip title="重做 (Ctrl+Shift+Z / Cmd+Shift+Z)">
            <Button
              icon={<RedoOutlined />}
              onClick={handleRedo}
              disabled={historyIndexRef.current >= historyRef.current.length - 1}
            >
              重做
            </Button>
          </Tooltip>
          <Divider type="vertical" />
          <Button icon={<UploadOutlined />} onClick={handleImport}>
            导入
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
          <Button onClick={handleLoad}>加载</Button>
          <Button icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
            保存
          </Button>
          <Divider type="vertical" />
          <Tooltip title="搜索节点 (Ctrl+F / Cmd+F)">
            <Button
              icon={<SearchOutlined />}
              onClick={() => setSearchVisible(!searchVisible)}
              type={searchVisible ? 'primary' : 'default'}
            >
              搜索
            </Button>
          </Tooltip>
          <Divider type="vertical" />
          <Tooltip title="放大">
            <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} />
          </Tooltip>
          <Tooltip title="缩小">
            <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
          </Tooltip>
          <Tooltip title="适应画布">
            <Button icon={<FullscreenOutlined />} onClick={handleFitView} />
          </Tooltip>
          <Divider type="vertical" />
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
          <Card 
            title="算子库" 
            size="small" 
            style={{ marginBottom: 16 }}
            extra={
              <Tooltip title="从左侧拖拽算子到右侧画布">
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>💡 拖拽使用</span>
              </Tooltip>
            }
          >
            <div style={{ 
              padding: '8px', 
              marginBottom: '12px', 
              background: '#f0f9ff', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#1890ff',
              border: '1px dashed #91d5ff'
            }}>
              💡 提示：拖拽算子到画布，双击节点可快速配置
            </div>
          </Card>
          <Card title="数据源" size="small" style={{ marginBottom: 16 }}>
            {getNodesByCategory('dataSource').map((template) => (
              <div
                key={template.type}
                draggable
                onDragStart={(e) => onDragStart(e, template)}
                style={{
                  padding: '10px 8px',
                  margin: '6px 0',
                  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                  color: '#fff',
                  borderRadius: 6,
                  cursor: 'grab',
                  textAlign: 'center',
                  fontWeight: 500,
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  userSelect: 'none',
                }}
                onDragEnd={onDragEnd}
                onMouseEnter={(e) => {
                  if (e.currentTarget instanceof HTMLElement) {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.4)';
                    e.currentTarget.style.cursor = 'grabbing';
                  }
                }}
                onMouseLeave={(e) => {
                  if (e.currentTarget instanceof HTMLElement) {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    e.currentTarget.style.cursor = 'grab';
                  }
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
                  padding: '10px 8px',
                  margin: '6px 0',
                  background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                  color: '#fff',
                  borderRadius: 6,
                  cursor: 'grab',
                  textAlign: 'center',
                  fontWeight: 500,
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  userSelect: 'none',
                }}
                onDragEnd={onDragEnd}
                onMouseEnter={(e) => {
                  if (e.currentTarget instanceof HTMLElement) {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(82, 196, 26, 0.4)';
                    e.currentTarget.style.cursor = 'grabbing';
                  }
                }}
                onMouseLeave={(e) => {
                  if (e.currentTarget instanceof HTMLElement) {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    e.currentTarget.style.cursor = 'grab';
                  }
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
                  padding: '10px 8px',
                  margin: '6px 0',
                  background: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
                  color: '#fff',
                  borderRadius: 6,
                  cursor: 'grab',
                  textAlign: 'center',
                  fontWeight: 500,
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  userSelect: 'none',
                }}
                onDragEnd={onDragEnd}
                onMouseEnter={(e) => {
                  if (e.currentTarget instanceof HTMLElement) {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(250, 173, 20, 0.4)';
                    e.currentTarget.style.cursor = 'grabbing';
                  }
                }}
                onMouseLeave={(e) => {
                  if (e.currentTarget instanceof HTMLElement) {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    e.currentTarget.style.cursor = 'grab';
                  }
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
                  padding: '10px 8px',
                  margin: '6px 0',
                  background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                  color: '#fff',
                  borderRadius: 6,
                  cursor: 'grab',
                  textAlign: 'center',
                  fontWeight: 500,
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  userSelect: 'none',
                }}
                onDragEnd={onDragEnd}
                onMouseEnter={(e) => {
                  if (e.currentTarget instanceof HTMLElement) {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(114, 46, 209, 0.4)';
                    e.currentTarget.style.cursor = 'grabbing';
                  }
                }}
                onMouseLeave={(e) => {
                  if (e.currentTarget instanceof HTMLElement) {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    e.currentTarget.style.cursor = 'grab';
                  }
                }}
              >
                {template.label}
              </div>
            ))}
          </Card>
        </Col>
        <Col span={20}>
          <Card 
            style={{ height: 'calc(100vh - 250px)', minHeight: 600 }}
            bodyStyle={{ padding: 0, height: '100%' }}
          >
            <div
              ref={reactFlowWrapper}
              style={{ 
                width: '100%', 
                height: '100%', 
                position: 'relative',
                overflow: 'hidden'
              }}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={(e) => {
                // 恢复样式
                if (reactFlowWrapper.current && !reactFlowWrapper.current.contains(e.relatedTarget as HTMLElement)) {
                  reactFlowWrapper.current.style.cursor = 'default';
                  reactFlowWrapper.current.style.backgroundColor = '';
                }
              }}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                onNodeContextMenu={handleNodeContextMenu}
                onPaneContextMenu={handlePaneContextMenu}
                onPaneClick={handleCloseContextMenu}
                nodeTypes={nodeTypes}
                fitView
                onInit={setReactFlowInstance}
                connectionMode={ConnectionMode.Loose}
                snapToGrid={true}
                snapGrid={[20, 20]}
                nodesDraggable={true}
                nodesConnectable={true}
                elementsSelectable={true}
                selectNodesOnDrag={false}
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: true,
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                  },
                }}
                deleteKeyCode={['Backspace', 'Delete']}
                multiSelectionKeyCode={['Meta', 'Control']}
                selectionKeyCode={['Meta', 'Control']}
              >
                <Controls />
                <MiniMap
                  nodeColor={(node) => {
                    if (node.type === 'dataSource') return '#1890ff';
                    if (node.type === 'transform') return '#52c41a';
                    if (node.type === 'target') return '#faad14';
                    if (node.type === 'control') return '#722ed1';
                    return '#d9d9d9';
                  }}
                  maskColor="rgba(0, 0, 0, 0.1)"
                  style={{
                    backgroundColor: '#fafafa',
                    border: '1px solid #d9d9d9',
                  }}
                />
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={20}
                  size={1}
                  color="#e0e0e0"
                  style={{ backgroundColor: '#fafafa' }}
                />
                <Panel position="top-right">
                  {selectedNode && (
                    <Space direction="vertical" size="small">
                      <Space>
                        <Tooltip title="配置节点">
                          <Button
                            size="small"
                            type="primary"
                            icon={<SettingOutlined />}
                            onClick={() => setConfigDrawerVisible(true)}
                          >
                            配置
                          </Button>
                        </Tooltip>
                        <Tooltip title="复制节点">
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={handleCopyNode}
                          >
                            复制
                          </Button>
                        </Tooltip>
                        <Tooltip title="删除节点">
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleDeleteNode}
                          >
                            删除
                          </Button>
                        </Tooltip>
                      </Space>
                    </Space>
                  )}
                  {selectedNodes.length > 1 && (
                    <Card
                      size="small"
                      style={{
                        background: '#fff',
                        marginTop: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                      title={`已选中 ${selectedNodes.length} 个节点`}
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div>
                          <strong>水平对齐：</strong>
                          <Space size="small" style={{ marginTop: 4 }}>
                            <Button size="small" icon={<AlignLeftOutlined />} onClick={() => handleAlignNodes('left')}>
                              左对齐
                            </Button>
                            <Button size="small" icon={<AlignCenterOutlined />} onClick={() => handleAlignNodes('center')}>
                              居中
                            </Button>
                            <Button size="small" icon={<AlignRightOutlined />} onClick={() => handleAlignNodes('right')}>
                              右对齐
                            </Button>
                          </Space>
                        </div>
                        <div>
                          <strong>垂直对齐：</strong>
                          <Space size="small" style={{ marginTop: 4 }}>
                            <Button size="small" icon={<VerticalAlignTopOutlined />} onClick={() => handleAlignNodes('top')}>
                              顶部
                            </Button>
                            <Button size="small" icon={<VerticalAlignMiddleOutlined />} onClick={() => handleAlignNodes('middle')}>
                              居中
                            </Button>
                            <Button size="small" icon={<VerticalAlignBottomOutlined />} onClick={() => handleAlignNodes('bottom')}>
                              底部
                            </Button>
                          </Space>
                        </div>
                        <Divider style={{ margin: '8px 0' }} />
                        <Space>
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => {
                              setCopiedNodes(selectedNodes);
                              message.success(`已复制 ${selectedNodes.length} 个节点`);
                            }}
                          >
                            复制全部
                          </Button>
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleDeleteSelectedNodes}
                          >
                            删除全部
                          </Button>
                        </Space>
                      </Space>
                    </Card>
                  )}
                  {searchVisible && (
                    <Card
                      size="small"
                      style={{
                        background: '#fff',
                        marginTop: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        minWidth: 250,
                      }}
                      title="搜索节点"
                      extra={
                        <Button size="small" type="text" onClick={handleClearSearch}>
                          ✕
                        </Button>
                      }
                    >
                      <Input
                        placeholder="输入节点名称或类型..."
                        value={searchValue}
                        onChange={(e) => handleSearchNodes(e.target.value)}
                        prefix={<SearchOutlined />}
                        allowClear
                        autoFocus
                      />
                    </Card>
                  )}
                </Panel>
              </ReactFlow>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000,
            background: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            minWidth: 160,
          }}
          onClick={handleCloseContextMenu}
        >
          {contextMenu.node ? (
            <Menu
              onClick={({ key }) => {
                const node = contextMenu.node!;
                switch (key) {
                  case 'config':
                    setConfigDrawerVisible(true);
                    break;
                  case 'copy':
                    setCopiedNodes([node]);
                    message.success('节点已复制');
                    break;
                  case 'cut':
                    setCopiedNodes([node]);
                    handleDeleteNode();
                    break;
                  case 'delete':
                    handleDeleteNode();
                    break;
                  case 'duplicate':
                    const newNode: Node = {
                      ...node,
                      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      position: {
                        x: node.position.x + 200,
                        y: node.position.y + 100,
                      },
                      selected: false,
                    };
                    setNodes((nds) => nds.concat(newNode));
                    message.success('节点已复制');
                    break;
                  default:
                    break;
                }
                setContextMenu(null);
              }}
              items={[
                {
                  key: 'config',
                  label: '配置节点',
                  icon: <SettingOutlined />,
                },
                {
                  key: 'duplicate',
                  label: '复制节点',
                  icon: <CopyOutlined />,
                },
                {
                  key: 'copy',
                  label: '复制到剪贴板',
                  icon: <CopyOutlined />,
                },
                {
                  key: 'cut',
                  label: '剪切',
                  icon: <ScissorOutlined />,
                },
                {
                  type: 'divider',
                },
                {
                  key: 'delete',
                  label: '删除节点',
                  icon: <DeleteOutlined />,
                  danger: true,
                },
              ]}
            />
          ) : (
            <Menu
              onClick={({ key }) => {
                switch (key) {
                  case 'paste':
                    handlePasteNodes();
                    break;
                  case 'selectAll':
                    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
                    message.info('已全选所有节点');
                    break;
                  default:
                    break;
                }
                setContextMenu(null);
              }}
              items={[
                {
                  key: 'paste',
                  label: '粘贴',
                  icon: <FileTextOutlined />,
                  disabled: copiedNodes.length === 0,
                },
                {
                  key: 'selectAll',
                  label: '全选',
                  icon: <ApartmentOutlined />,
                },
              ]}
            />
          )}
        </div>
      )}

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
                <Input placeholder="例如: localhost 或 192.168.1.100" />
              </Form.Item>
              <Form.Item name="port" label="端口">
                <InputNumber placeholder="例如: 3306, 5432" style={{ width: '100%' }} />
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
              <Form.Item name="table" label="表名">
                <Input placeholder="可选: 指定表名" />
              </Form.Item>
              <Form.Item name="query" label="查询语句">
                <Input.TextArea
                  rows={3}
                  placeholder="可选: 自定义SQL查询语句"
                />
              </Form.Item>
              <Divider>API 数据源（可选）</Divider>
              <Form.Item name={['api', 'url']} label="API 地址">
                <Input placeholder="例如: https://api.example.com/data" />
              </Form.Item>
              <Form.Item name={['api', 'method']} label="请求方法">
                <Select
                  placeholder="选择请求方法"
                  options={[
                    { value: 'GET', label: 'GET' },
                    { value: 'POST', label: 'POST' },
                    { value: 'PUT', label: 'PUT' },
                    { value: 'DELETE', label: 'DELETE' },
                  ]}
                />
              </Form.Item>
              <Form.Item name={['api', 'headers']} label="请求头(JSON)">
                <Input.TextArea rows={3} placeholder='例如: {"Authorization":"Bearer token"}' />
              </Form.Item>
              <Form.Item name={['api', 'body']} label="请求体(JSON)">
                <Input.TextArea rows={4} placeholder='POST/PUT 时填写，例如: {"param":"value"}' />
              </Form.Item>
            </>
          )}
          {selectedNode?.type === 'transform' && (
            <>
              {selectedNode.data.type === '字段映射' && (
                <Form.Item name="mapping" label="字段映射">
                  <Input.TextArea
                    rows={6}
                    placeholder="每行一个映射，格式: source_field -> target_field&#10;例如:&#10;name -> username&#10;age -> user_age&#10;email -> user_email"
                  />
                </Form.Item>
              )}
              {selectedNode.data.type === '数据过滤' && (
                <>
                  <Form.Item name="filter" label="过滤条件">
                    <Input.TextArea
                      rows={4}
                      placeholder="SQL WHERE 条件，例如: age > 18 AND status = 'active'"
                    />
                  </Form.Item>
                  <Form.Item name="filterType" label="过滤类型">
                    <Select placeholder="选择过滤类型">
                      <Option value="include">包含</Option>
                      <Option value="exclude">排除</Option>
                    </Select>
                  </Form.Item>
                </>
              )}
              {selectedNode.data.type === '数据清洗' && (
                <>
                  <Form.Item name="removeNull" label="移除空值" valuePropName="checked">
                    <Select placeholder="选择处理方式">
                      <Option value="remove">移除包含空值的行</Option>
                      <Option value="fill">填充默认值</Option>
                      <Option value="keep">保留</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="trimWhitespace" label="去除空白" valuePropName="checked">
                    <Select placeholder="选择是否去除">
                      <Option value={true}>是</Option>
                      <Option value={false}>否</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="removeDuplicates" label="去重" valuePropName="checked">
                    <Select placeholder="选择是否去重">
                      <Option value={true}>是</Option>
                      <Option value={false}>否</Option>
                    </Select>
                  </Form.Item>
                </>
              )}
              {selectedNode.data.type === '数据聚合' && (
                <>
                  <Form.Item name="groupBy" label="分组字段">
                    <Input placeholder="逗号分隔，例如: department,status" />
                  </Form.Item>
                  <Form.Item name="aggregations" label="聚合函数">
                    <Input.TextArea
                      rows={4}
                      placeholder="每行一个聚合，格式: function(column) as alias&#10;例如:&#10;COUNT(*) as total&#10;SUM(amount) as total_amount&#10;AVG(score) as avg_score"
                    />
                  </Form.Item>
                </>
              )}
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
