import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { GripHorizontal } from "lucide-react";
import DeviceGatewayCard from "@/features/Devices/Gateway/DeviceGatewayCard";
import { GATEWAY_WIDTH } from "./canvasLayout";

export interface GatewayNodeData extends Record<string, unknown> {
  deviceId: string;
}

export type GatewayNode = Node<GatewayNodeData, "gateway">;

/** The device itself as the root of the canvas; only the grip bar drags it so its form stays usable. */
export default function GatewayTile({ data }: NodeProps<GatewayNode>) {
  return (
    <div style={{ width: GATEWAY_WIDTH }}>
      <div className="gateway-drag-handle flex cursor-grab justify-center rounded-t-lg py-1 text-blue-700/60 active:cursor-grabbing">
        <GripHorizontal className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="nodrag nopan nowheel cursor-default">
        <DeviceGatewayCard deviceId={data.deviceId} />
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={false} className="opacity-0!" />
    </div>
  );
}
