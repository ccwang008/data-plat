import { Handle, Position } from 'reactflow';
import { Card } from 'antd';
import { ApartmentOutlined, FilterOutlined, MergeCellsOutlined, FunctionOutlined } from '@ant-design/icons';

interface TransformNodeProps {
  data: {
    label: string;
    type: string;
    config?: any;
  };
  selected?: boolean;
}

const iconMap: Record<string, any> = {
  字段映射: ApartmentOutlined,
  数据清洗: FilterOutlined,
  数据过滤: FilterOutlined,
  数据聚合: MergeCellsOutlined,
  数据转换: FunctionOutlined,
};

const TransformNode = ({ data, selected }: TransformNodeProps) => {
  const Icon = iconMap[data.type] || ApartmentOutlined;

  return (
    <Card
      size="small"
      style={{
        minWidth: 150,
        border: selected ? '2px solid #52c41a' : '1px solid #d9d9d9',
        borderRadius: 8,
        background: selected ? '#f6ffed' : '#fff',
      }}
      bodyStyle={{ padding: '12px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon style={{ fontSize: 18, color: '#52c41a' }} />
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 14 }}>{data.label}</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            {data.type}
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </Card>
  );
};

export default TransformNode;

