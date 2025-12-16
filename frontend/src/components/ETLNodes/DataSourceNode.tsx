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
        minWidth: 150,
        border: selected ? '2px solid #1890ff' : '1px solid #d9d9d9',
        borderRadius: 8,
      }}
      bodyStyle={{ padding: '12px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <DatabaseOutlined style={{ fontSize: 18, color: '#1890ff' }} />
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 14 }}>{data.label}</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            {data.type}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </Card>
  );
};

export default DataSourceNode;

