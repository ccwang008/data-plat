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
        minWidth: 180,
        border: selected ? '2px solid #52c41a' : '1px solid #d9d9d9',
        borderRadius: 8,
        boxShadow: selected
          ? '0 4px 12px rgba(82, 196, 26, 0.3)'
          : '0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s',
        background: selected ? '#f6ffed' : '#fff',
      }}
      bodyStyle={{ padding: '14px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
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
          background: '#52c41a',
          border: '2px solid #fff',
          borderRadius: '50%',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 12,
          height: 12,
          background: '#52c41a',
          border: '2px solid #fff',
          borderRadius: '50%',
        }}
      />
    </Card>
  );
};

export default TransformNode;

