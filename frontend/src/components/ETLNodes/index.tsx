import DataSourceNode from './DataSourceNode';
import TransformNode from './TransformNode';
import TargetNode from './TargetNode';
import ControlNode from './ControlNode';

export const nodeTypes = {
  dataSource: DataSourceNode,
  transform: TransformNode,
  target: TargetNode,
  control: ControlNode,
};

export { DataSourceNode, TransformNode, TargetNode, ControlNode };

