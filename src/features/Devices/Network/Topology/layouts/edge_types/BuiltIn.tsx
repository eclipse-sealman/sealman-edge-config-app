import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { ConnectionTypeSelect } from '../../components/ConnectionTypeSelect';
 
export default function BuiltInEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
 
  return (
    <>
      <BaseEdge path={edgePath} style={style}/>
      <EdgeLabelRenderer>
        <div
          className="button-edge__label nodrag nopan"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            transformOrigin: 'center',
            padding: 10,
          }}
        >
          <ConnectionTypeSelect edgeId={id} value='builtIn'/>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}