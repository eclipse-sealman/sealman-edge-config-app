import { useCallback, useEffect } from 'react';
import { ReactFlow, Background, Controls, BackgroundVariant, DefaultEdgeOptions, ConnectionMode, Panel } from '@xyflow/react';
 
import '@xyflow/react/dist/style.css';
import MachineNode from './layouts/node_types/Machine';
import { useMenuStore, useTopologyStore } from './stores';
import IsolatedEndpointNode from './layouts/node_types/IsolatedEndpoint';
import ContextMenu from './layouts/context_menu/ContextMenuLayout';
import { useNetworkPageStore } from '../stores';
import useGetLineByDeviceId from '@/generated/edge-administration/hooks/machine_topology/useGetLineByDeviceId';
import { lineToReactFlow } from './mapping_functions';
import ProductFlowEdge from './layouts/edge_types/ProductFlow';
import BuiltInEdge from './layouts/edge_types/BuiltIn';
import LineNumberInput from './components/line_number/Input';
import EditTopology from './components/buttons/Edit';
import SaveTopology from './components/buttons/Save';
import { Centered } from '../components';
import { Loader2 } from 'lucide-react';
 
const nodeTypes = {
  machine: MachineNode,
  isolatedEndpoint: IsolatedEndpointNode
}

const edgeTypes = {
  productFlow: ProductFlowEdge,
  builtIn: BuiltInEdge,
}

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "productFlow", // <-- Set default edge type here
  // animated: true,
  // markerEnd: {
  //   type: MarkerType.ArrowClosed,
  //   color: '#000',
  //   width: 20,
  //   height: 20,
  // }
};

export default function Topology() {
  const deviceId = useNetworkPageStore((state) => state.deviceId);

  const nodes = useTopologyStore((state) => state.nodes)
  const edges = useTopologyStore((state) => state.edges)
  const setNodes = useTopologyStore((state) => state.setNodes)
  const setEdges = useTopologyStore((state) => state.setEdges)
  const onNodesChange = useTopologyStore((state) => state.onNodesChange)
  const onEdgesChange = useTopologyStore((state) => state.onEdgesChange)
  const onConnect = useTopologyStore((state) => state.onConnect)
  const setIsNewTopology = useTopologyStore((state) => state.setIsNewTopology);
  const isEditing = useTopologyStore((state) => state.isEditing);
  const setIsEditing = useTopologyStore((state) => state.setIsEditing);
  const setLineNumber = useTopologyStore((state) => state.setLineNumber);

  const menu = useMenuStore((state) => state.menuProps);
  const setMenu = useMenuStore((state) => state.setMenuProps);

  const { data, isLoading } = useGetLineByDeviceId(deviceId);
  
  // Load topology data 
  useEffect(() => {
    const prevDeviceId = sessionStorage.getItem("prevDeviceId");

    // If still in edit mode and not changing device, do not overwrite changes
    if (
      isEditing &&
      prevDeviceId &&
      prevDeviceId == deviceId
    ) {
      return;
    }

    if (!data) {
      console.log("No topology data found, initializing new topology.");
      setNodes([]);
      setEdges([]);
      setIsNewTopology(true);
      return;
    }

    setLineNumber(data.lineNumber ?? undefined);
    const reactFlowData = lineToReactFlow(data);
    setNodes(reactFlowData.nodes);
    setEdges(reactFlowData.edges);
    setIsNewTopology(false);

    // Always update prevDeviceId in sessionStorage
    sessionStorage.setItem("prevDeviceId", deviceId);
  }, [data, deviceId, isEditing, setEdges, setNodes, setIsNewTopology, setLineNumber, setIsEditing])

  // Prompt user before leaving the page if editing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isEditing]);

  // TODO: Find a good way to handle unsaved changes in an unmounting scenario

  const onPaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
    event.preventDefault();

    // Type guard to ensure event has currentTarget as HTMLDivElement
    const currentTarget = event.currentTarget as HTMLDivElement;
    const rect = currentTarget.getBoundingClientRect();
    setMenu({
      top: event.clientY - rect.top < rect.height - 200 ? event.clientY - rect.top : undefined,
      left: event.clientX - rect.left < rect.width - 200 ? event.clientX - rect.left : undefined,
      right: event.clientX - rect.left >= rect.width - 200 ? rect.width - (event.clientX - rect.left) : undefined,
      bottom: event.clientY - rect.top >= rect.height - 200 ? rect.height - (event.clientY - rect.top) : undefined,
    });
  }, [setMenu]);
  
  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

  if (isLoading) {
    return (
      <Centered>
        <p className="text-muted-foreground flex items-center gap-4">
          <Loader2 className="animate-spin" /> Loading ...
        </p>
      </Centered>
    )
  }

  return (
    <>
      <div className="h-full min-w-48 border-2 border-gray-300 bg-white rounded-lg" style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          id="topology"
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          defaultEdgeOptions={defaultEdgeOptions}
          onConnect={onConnect}
          connectionMode={ConnectionMode.Loose}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onPaneClick={onPaneClick}
          onPaneContextMenu={onPaneContextMenu}
          defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Controls showInteractive={false} />
          {isEditing && <Background variant={BackgroundVariant.Dots} gap={12} size={1} />}
          {menu && <ContextMenu {...menu} />}
          <Panel className='w-1/5' position="top-left">
            <label className="block text-xs">Line number:</label>
            <LineNumberInput/>
          </Panel>
          <Panel position="top-right">
            {isEditing ? <SaveTopology /> : <EditTopology />}
          </Panel>
        </ReactFlow>
      </div>
    </>
  )
}