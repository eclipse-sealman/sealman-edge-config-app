import { Handle, Position } from '@xyflow/react';
import { EndpointNodeData } from '../../stores/Topology';
import { Input } from '@/components/ui/input';
import { useTopologyStore } from '../../stores';
import EndpointStatus from '../../components/statuses/EndpointStatus';
import { useGetPeriodicScanData } from '../../../layouts/endpoint_list/useGetPeriodicScanData';
import { useNetworkPageStore } from '../../../stores';
import SelectIpCombobox from '../../components/select_comboboxes/SelectIpCombobox';
import { useRedirectToNetworkScan } from '../../hooks/useRedirectToNetworkScan';

export interface EndpointNodeProps {
  data: EndpointNodeData
}

const handleStyle = {
  width: 10,
  height: 10,
  backgroundColor: '#FFFFFF', // Circle color
  borderRadius: '50%', // Makes it a circle
  border: '1px solid #000', // Optional border for better visibility
}

const handleStyleHidden: React.CSSProperties = {
  width: 0,
  height: 0,
  opacity: 0,
  pointerEvents: 'none' as React.CSSProperties['pointerEvents']
}

export default function IsolatedEndpointNode({ data }: EndpointNodeProps) {
  const isEditing = useTopologyStore((state) => state.isEditing);
  const setIsolatedEndpointIp = useTopologyStore((state) => state.setIsolatedEndpointIp)
  const setNodeName = useTopologyStore((state) => state.setNodeName)

  const deviceId = useNetworkPageStore((state) => state.deviceId);

  const { scanResults } = useGetPeriodicScanData(deviceId)

  const findEndpointStatusByIp = (ip: string) => {
    const endpoint = scanResults?.find((ep) => ep.ip === ip);
    return endpoint ? endpoint.status : "unknown";
  };

  const redirectToNetworkScan = useRedirectToNetworkScan();

  const onIpChange = (ip: string) => {
    setIsolatedEndpointIp(data.id, ip);
  }

  const onNameChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setNodeName(data.id, evt.target.value);
  }

  return (
    <div className="h-full min-w-48 border-2 border-gray-300 bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-center">
        <div
          className="hover:bg-muted hover:cursor-pointer rounded w-8 h-8 flex items-center justify-center transition"
          onClick={() => redirectToNetworkScan(data.ip)}
        >
          <EndpointStatus value={findEndpointStatusByIp(data.ip)} />
        </div>
      </div>
      <div>
        <label className="block text-xs">Isolated endpoint ip:</label>
        {
          isEditing
          ?
          <SelectIpCombobox value={data.ip} onChange={onIpChange} /> 
          :
          <Input disabled={true} value={data.ip} className="nodrag max-w-full"/>
        }
        <label className="block text-xs">Isolated endpoint name:</label>
        <Input disabled={!isEditing} defaultValue={data.name} onChange={onNameChange} className="nodrag max-w-full"/>  
      </div>
      <Handle style={isEditing?handleStyle:handleStyleHidden} type="source" position={Position.Top} id="ts" />
      <Handle style={isEditing?handleStyle:handleStyleHidden} type="source" position={Position.Bottom} id="bs" />
    </div>
  );
}
