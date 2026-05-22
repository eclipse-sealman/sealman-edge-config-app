import { Node, Edge, MarkerType } from "@xyflow/react";
import { LineData } from "../../../../generated/edge-administration/hooks/machine_topology/useGetLineByDeviceId";
import { MachineNode, ReactFlowData } from "./stores/Topology";

export function lineToReactFlow(line: LineData): ReactFlowData {
  const nodes: Node[] = [];

  // Machines → nodes
  for (const machine of line.machines ?? []) {
    nodes.push({
      id: machine.id,
      data: {
        id: machine.id,
        name: machine.name,
        machineNumber: machine.machineNumber,
        endpoints: (machine.endpoints ?? []).map((ep) => ({
          ...ep,
        })),
      },
      type: "machine",
      position: machine.topologyData.position,
      measured: machine.topologyData.measured,
      selected: false,
      dragging: false,
    });
  }

  // Isolated endpoints → nodes
  for (const ep of line.isolatedEndpoints ?? []) {
    nodes.push({
      id: ep.id,
      data: {
        id: ep.id,
        name: ep.name,
        ip: ep.ip,
      },
      type: "isolatedEndpoint",
      position: ep.topologyData.position,
      measured: ep.topologyData.measured,
      selected: false,
      dragging: false,
    });
  }

  // Connections → edges
  const edges: Edge[] = (line.connections ?? []).map((c) => ({
    id: c.id || `edge-${c.source}-${c.target}`,
    source: c.source,
    target: c.target,
    sourceHandle: c.sourceHandle,
    targetHandle: c.targetHandle,
    type: c.type ?? undefined,
    animated: c.type == "productFlow", // Animate only productFlow edges
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#000",
      width: 20,
      height: 20,
    },
  }));

  return { nodes, edges };
}

export function reactFlowToLine(flow: ReactFlowData): Partial<LineData> {
  const machines = flow.nodes
    .filter((node) => node.type === "machine")
    .map((node) => {
      const machineNode = node as MachineNode;
      return {
        id: machineNode.id,
        name: typeof machineNode.data.name === "string" ? machineNode.data.name : "",
        machineNumber: machineNode.data.machineNumber,
        endpoints: (machineNode.data.endpoints ?? []).map((ep) => ({
          name: typeof ep.name === "string" ? ep.name : "",
          ip: typeof ep.ip === "string" ? ep.ip : "",
        })),
        topologyData: {
          nodeType: typeof machineNode.type === "string" ? machineNode.type : "",
          position: {
            x: typeof machineNode.position?.x === "number" ? machineNode.position.x : 0,
            y: typeof machineNode.position?.y === "number" ? machineNode.position.y : 0,
          },
          measured: {
            width: typeof machineNode.measured?.width === "number" ? machineNode.measured.width : 0,
            height: typeof machineNode.measured?.height === "number" ? machineNode.measured.height : 0,
          },
        },
      };
    });

  const isolatedEndpoints = flow.nodes
    .filter((node) => node.type === "isolatedEndpoint")
    .map((node) => ({
      id: node.id,
      name: typeof node.data.name === "string" ? node.data.name : "",
      ip: typeof node.data.ip === "string" ? node.data.ip : "",
      builtIn: "",
      topologyData: {
        nodeType: typeof node.type === "string" ? node.type : "",
        position: {
          x: typeof node.position?.x === "number" ? node.position.x : 0,
          y: typeof node.position?.y === "number" ? node.position.y : 0,
        },
        measured: {
          width: typeof node.measured?.width === "number" ? node.measured.width : 0,
          height: typeof node.measured?.height === "number" ? node.measured.height : 0,
        },
      },
    }));

  const connections = flow.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || "",
    targetHandle: edge.targetHandle || "",
    type: edge.type,
  }));

  return {
    machines,
    isolatedEndpoints,
    connections,
  };
}