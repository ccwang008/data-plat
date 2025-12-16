import { Handle, Position } from 'reactflow';
import { Card } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';

interface DataSourceNodeProps {
  data: {
    label: string;
    type: string;
    config?: any;
  };
  selected?: boolean;
}

const DataSourceNode = ({ data, selected }: DataSourceNodeProps) => {
  return (
    <Card
      size="small"
      style={{
        minWidth: 180,
        border: selected ? '2px solid #1890ff' : '1px solid #d9d9d9',
        borderRadius: 8,
        boxShadow: selected
          ? '0 4px 12px rgba(24, 144, 255, 0.3)'
          : '0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s',
        background: selected ? '#e6f7ff' : '#fff',
      }}
      bodyStyle={{ padding: '14px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <DatabaseOutlined style={{ fontSize: 18, color: '#fff' }} />
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
        type="source"
        position={Position.Right}
        style={{
          width: 12,
          height: 12,
          background: '#1890ff',
          border: '2px solid #fff',
          borderRadius: '50%',
        }}
      />
    </Card>
  );
};

export default DataSourceNode;

