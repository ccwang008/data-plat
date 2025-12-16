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
        minWidth: 180,
        border: selected ? '2px solid #faad14' : '1px solid #d9d9d9',
        borderRadius: 8,
        boxShadow: selected
          ? '0 4px 12px rgba(250, 173, 20, 0.3)'
          : '0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s',
        background: selected ? '#fffbe6' : '#fff',
      }}
      bodyStyle={{ padding: '14px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon style={{ fontSize: 18, color: '#fff' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 'bold',
              fontSize: 14,
              color: '#262626',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.label}
          </div>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
            {data.type}
          </div>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 12,
          height: 12,
          background: '#faad14',
          border: '2px solid #fff',
          borderRadius: '50%',
        }}
      />
    </Card>
  );
};

export default TargetNode;

