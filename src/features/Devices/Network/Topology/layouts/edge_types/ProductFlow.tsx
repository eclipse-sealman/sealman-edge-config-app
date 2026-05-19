import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { ConnectionTypeSelect } from '../../components/ConnectionTypeSelect';
 
export default function ProductFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
 
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style}/>
      <EdgeLabelRenderer>
        <div
          className="button-edge__label nodrag nopan"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            transformOrigin: 'center',
          }}
        >
          <ConnectionTypeSelect edgeId={id} value='productFlow'/>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}