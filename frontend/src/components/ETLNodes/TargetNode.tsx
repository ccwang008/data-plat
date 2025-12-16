import { Handle, Position } from 'reactflow';
import { Card } from 'antd';
import { CloudUploadOutlined, FileOutlined, ApiOutlined } from '@ant-design/icons';

interface TargetNodeProps {
  data: {
    label: string;
    type: string;
    config?: any;
  };
  selected?: boolean;
}

const iconMap: Record<string, any> = {
  数据库: CloudUploadOutlined,
  文件: FileOutlined,
  API: ApiOutlined,
};

const TargetNode = ({ data, selected }: TargetNodeProps) => {
  const Icon = iconMap[data.type] || CloudUploadOutlined;

  return (
    <Card
      size="small"
      style={{
        minWidth: 150,
        border: selected ? '2px solid #faad14' : '1px solid #d9d9d9',
        borderRadius: 8,
        background: selected ? '#fffbe6' : '#fff',
      }}
      bodyStyle={{ padding: '12px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon style={{ fontSize: 18, color: '#faad14' }} />
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 14 }}>{data.label}</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            {data.type}
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
    </Card>
  );
};

export default TargetNode;

