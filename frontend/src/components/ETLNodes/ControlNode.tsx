import { Handle, Position } from 'reactflow';
import { Card } from 'antd';
import { BranchesOutlined, SyncOutlined, ThunderboltOutlined } from '@ant-design/icons';

interface ControlNodeProps {
  data: {
    label: string;
    type: string;
    config?: any;
  };
  selected?: boolean;
}

const iconMap: Record<string, any> = {
  条件分支: BranchesOutlined,
  循环: SyncOutlined,
  并行: ThunderboltOutlined,
};

const ControlNode = ({ data, selected }: ControlNodeProps) => {
  const Icon = iconMap[data.type] || BranchesOutlined;

  return (
    <Card
      size="small"
      style={{
        minWidth: 150,
        border: selected ? '2px solid #722ed1' : '1px solid #d9d9d9',
        borderRadius: 8,
        background: selected ? '#f9f0ff' : '#fff',
      }}
      bodyStyle={{ padding: '12px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon style={{ fontSize: 18, color: '#722ed1' }} />
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 14 }}>{data.label}</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            {data.type}
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
      {data.type === '条件分支' && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          style={{ background: '#ff4d4f', bottom: -8 }}
        />
      )}
    </Card>
  );
};

export default ControlNode;

