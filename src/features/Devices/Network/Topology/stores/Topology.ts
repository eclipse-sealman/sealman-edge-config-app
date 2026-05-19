import { create } from "zustand"
import { addEdge, Edge, Connection, Node, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges, MarkerType } from '@xyflow/react';
import { EndpointType } from "../endpoint_and_machine_types";

export interface EndpointData {
  name: string;
  ip: string;
  services?: Record<string, string>
  status?: "offline" | "online" | "unknown"
  description?: string;
}

export interface EndpointNodeData extends EndpointData {
  id: string;
}

export interface MachineNodeData {
  id: string;
  name: string;
  machineNumber?: string;
  endpoints?: EndpointData[];
  [key: string]: unknown; // Add index signature to satisfy Record<string, unknown>
}

export interface MachineNode extends Node {
  data: MachineNodeData;
}

export interface ReactFlowData {
  nodes: (Node | MachineNode)[];
  edges: Edge[];
};

export interface TopologyData extends ReactFlowData {
  lineNumber?: string;
}

interface TopologyStore {
  nodes: Node[],
  edges: Edge[],
  setNodes: (nodes: Node[]) => void,
  setEdges: (edges: Edge[]) => void,
  onConnect: (connection: Connection) => void,
  onNodesChange: (changes: NodeChange[]) => void,
  onEdgesChange: (changes: EdgeChange[]) => void,
  setNodeName: (nodeId: string, name: string) => void,
  setIsolatedEndpointIp: (nodeId: string, ip: string) => void,
  addEndpointToMachineNode: (nodeId: string, endpoint: EndpointType) => void
  editEndpointInMachineNode: (nodeId: string, endpointIp: string, newIp:string, name: string) => void,
  removeEndpointFromMachineNode: (nodeId: string, endpointIp: string) => void,
  changeConnectionTypeByEdgeId: (edgeId: string, type: string) => void,
  isNewTopology: boolean,
  setIsNewTopology: (isNew: boolean) => void,
  isEditing: boolean,
  setIsEditing: (isEditing: boolean) => void,
  dataBeforeEditing: TopologyData | null,
  abortEditing: () => void,
  lineNumber?: string,
  setLineNumber: (lineNumber?: string) => void,
  setMachineNumber: (nodeId: string, machineNumber: string) => void,
}

export default create<TopologyStore>((set, get) => ({
  nodes: [],
  edges: [],
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  onConnect: (connection) => {
    if (!get().isEditing) return;
    set((state) => ({
      edges: addEdge(
        { 
          ...connection,
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#000',
            width: 20,
            height: 20,
          }
        },
        state.edges
      ),
    }));
  },
  onNodesChange: (changes) => {
    if (!get().isEditing) return;
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    })
  },
  onEdgesChange: (changes) => {
    if (!get().isEditing) return;
    set({
      edges: applyEdgeChanges(changes, get().edges),
    })
  },
  setNodeName: (nodeId, name) => {
    if (!get().isEditing) return;
    set((state) => {
      const nodeIndex = state.nodes.findIndex((node) => node.id === nodeId);
      if (nodeIndex === -1) return state;

      const updatedNode = {
        ...state.nodes[nodeIndex],
        data: {
          ...state.nodes[nodeIndex].data,
          name: name,
        },
      };

      const updatedNodes = [...state.nodes];
      updatedNodes[nodeIndex] = updatedNode;

      return { nodes: updatedNodes };
    });
  },
  setIsolatedEndpointIp: (nodeId, ip) => {
    set((state) => {
      const nodeIndex = state.nodes.findIndex((node) => node.id === nodeId);
      if (nodeIndex === -1) return state;

      const updatedNode = {
        ...state.nodes[nodeIndex],
        data: {
          ...state.nodes[nodeIndex].data,
          ip: ip,
        },
      };

      const updatedNodes = [...state.nodes];
      updatedNodes[nodeIndex] = updatedNode;

      return { nodes: updatedNodes };
    });
  },
  addEndpointToMachineNode: (nodeId, endpoint) => {
    set((state) => {
      const nodeIndex = state.nodes.findIndex((node) => node.id === nodeId);
      if (nodeIndex === -1) return state;

      const machineNode = state.nodes[nodeIndex] as MachineNode;

      const updatedNode = {
        ...machineNode,
        data: {
          ...state.nodes[nodeIndex].data,
          endpoints: [...(machineNode.data.endpoints || []), endpoint],
        },
      };

      const updatedNodes = [...state.nodes];
      updatedNodes[nodeIndex] = updatedNode;

      return { nodes: updatedNodes };
    });
  },
  editEndpointInMachineNode: (nodeId, endpointIp, newIp, name) => {
    set((state) => {
      const nodeIndex = state.nodes.findIndex((node) => node.id === nodeId);
      if (nodeIndex === -1) return state;

      const machineNode = state.nodes[nodeIndex] as MachineNode;

      const updatedEndpoints = machineNode.data.endpoints?.map((ep) => {
        if (ep.ip === endpointIp) {
          return {
            ...ep,
            ip: newIp,
            name: name,
          };
        }
        return ep;
      }) || [];

      const updatedNode = {
        ...machineNode,
        data: {
          ...machineNode.data,
          endpoints: updatedEndpoints,
        },
      };

      const updatedNodes = [...state.nodes];
      updatedNodes[nodeIndex] = updatedNode;

      return { nodes: updatedNodes };
    });
  },
  removeEndpointFromMachineNode: (nodeId, endpointIp) => {
    if (!get().isEditing) return;
    set((state) => {
      const nodeIndex = state.nodes.findIndex((node) => node.id === nodeId);
      if (nodeIndex === -1) return state;
      
      const machineNode = state.nodes[nodeIndex] as MachineNode;

      const updatedEndpoints = machineNode.data.endpoints?.filter((ep) => ep.ip !== endpointIp) || [];

      const updatedNode = {
        ...machineNode,
        data: {
          ...machineNode.data,
          endpoints: updatedEndpoints,
        },
      };

      const updatedNodes = [...state.nodes];
      updatedNodes[nodeIndex] = updatedNode;

      return { nodes: updatedNodes };
    });
  },
  changeConnectionTypeByEdgeId(edgeId, type) {
    set((state) => {
      const edgeIndex = state.edges.findIndex((edge) => edge.id === edgeId);
      if (edgeIndex === -1) return state;

      const updatedEdge = {
        ...state.edges[edgeIndex],
        data: {
          ...state.edges[edgeIndex].data,
          type: type,
        },
        type: type,
        animated: type === 'productFlow'
      };

      const updatedEdges = [...state.edges];
      updatedEdges[edgeIndex] = updatedEdge;

      return { edges: updatedEdges };
    });
  },
  isNewTopology: true,
  setIsNewTopology: (isNew) => set({ isNewTopology: isNew }),
  isEditing: false,
  setIsEditing: (isEditing) =>  {
    if (isEditing) {
      const { nodes, edges } = get()
      // Deep copy nodes and edges to avoid mutation
      const nodesCopy = structuredClone(nodes)
      const edgesCopy = structuredClone(edges)
      set({
        isEditing,
        dataBeforeEditing: { 
          lineNumber: get().lineNumber,
          nodes: nodesCopy, 
          edges: edgesCopy 
        }
      });
    } else {
      set({ isEditing });
    }
  },
  dataBeforeEditing: null,
  abortEditing: () => {
    const { lineNumber, nodes, edges } = get().dataBeforeEditing || {};
    set({
      isEditing: false,
      dataBeforeEditing: null,
      lineNumber: lineNumber,
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
    });
  },
  lineNumber: undefined,
  setLineNumber: (lineNumber) => set({ lineNumber }),
  setMachineNumber: (nodeId, machineNumber) => {
    if (!get().isEditing) return;
    set((state) => {
      const nodeIndex = state.nodes.findIndex((node) => node.id === nodeId);
      if (nodeIndex === -1) return state;

      const updatedNode = {
        ...state.nodes[nodeIndex],
        data: {
          ...state.nodes[nodeIndex].data,
          machineNumber: machineNumber,
        },
      };

      const updatedNodes = [...state.nodes];
      updatedNodes[nodeIndex] = updatedNode;

      return { nodes: updatedNodes };
    });
  }
}))
