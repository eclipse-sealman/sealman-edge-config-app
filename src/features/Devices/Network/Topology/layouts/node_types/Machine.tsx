import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { EditIcon, PlusIcon, UndoIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTopologyStore } from '../../stores';
import { EndpointType } from '../../endpoint_and_machine_types';
import { MachineNodeData } from '../../stores/Topology';
import EndpointStatus from '../../components/statuses/EndpointStatus';
import { Button } from '@/components/ui/button';
import { TrashIcon } from '@radix-ui/react-icons';
import { EditMachineEndpoint } from '../edit_machine_endpoint/EditMachineEndpointDialog';
import { toast } from 'react-toastify';
import { useNetworkPageStore } from '../../../stores';
import { useGetPeriodicScanData } from '../../../layouts/endpoint_list/useGetPeriodicScanData';
import useGetModuleTwinConfig from '@/generated/edge-administration/hooks/useGetModuleTwinConfig';
import { NetworkDiscoverTwinConfig } from '@/api/edgeConfig/networkDiscover/networkDiscoverInterfaces';
import { NETWORK_DISCOVER_MODULE_NAME } from '@/api/edgeConfig/moduleNames';
import SelectIpCombobox from '../../components/select_comboboxes/SelectIpCombobox';
import { useRedirectToNetworkScan } from '../../hooks/useRedirectToNetworkScan';

export interface MachineNodeProps {
  data: MachineNodeData
}

const handleStyle: React.CSSProperties = {
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

export default function MachineNode({ data }: MachineNodeProps) {
  const isEditing = useTopologyStore((state) => state.isEditing);

  const addEndpointToMachineNode = useTopologyStore((state) => state.addEndpointToMachineNode);
  const editEndpointInMachineNode = useTopologyStore((state) => state.editEndpointInMachineNode);
  const removeEndpointFromMachineNode = useTopologyStore((state) => state.removeEndpointFromMachineNode);
  const setNodeName = useTopologyStore((state) => state.setNodeName);
  const setMachineNumber = useTopologyStore((state) => state.setMachineNumber);
  const [isAddingEndpoint, setIsAddingEndpoint] = useState(false);

  const deviceId = useNetworkPageStore((state) => state.deviceId);

  const { scanResults } = useGetPeriodicScanData(deviceId)
  const { data: networkScanConfig } = useGetModuleTwinConfig(deviceId, NETWORK_DISCOVER_MODULE_NAME)

  const findEndpointStatusByIp = (ip: string) => {
    const endpoint = scanResults?.find((ep) => ep.ip === ip);
    return endpoint ? endpoint.status : "unknown";
  };

  const redirectToNetworkScan = useRedirectToNetworkScan();

  const handleIpSelected = (ip: string) => {
    const typedNetworkScanConfig = networkScanConfig as unknown as NetworkDiscoverTwinConfig
    const newEndpoint: EndpointType = {
      ip,
      name: typedNetworkScanConfig?.endpointNames?.[ip]?.name || "",
    };
    if (data.endpoints?.some((ep) => ep.ip === ip)) {
      toast.error(`Endpoint with IP ${ip} already exists.`);
    }
    else {
      addEndpointToMachineNode(data.id, newEndpoint);
    }

    setIsAddingEndpoint(false);
  };

  const onMachineNameInputChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditing) return;
    setNodeName(data.id, evt.target.value);
  }

  const onMachineNumberInputChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditing) return;
    setMachineNumber(data.id, evt.target.value);
  }

  const saveEndpoint = (ip: string, newIp:string, newName: string) => {
    if (newIp === ip && newName === data.name) {
      return;
    }
    editEndpointInMachineNode(data.id, ip, newIp, newName);
  }
 
  return (
    <div className="h-full min-w-48 border-2 border-gray-300 bg-white rounded-lg shadow-md p-4">
      <div>
        <label className="block text-xs">Machine name:</label>
        <Input disabled={!isEditing} defaultValue={data.name} onChange={onMachineNameInputChange} className="h-9 nodrag max-w-full"/>
      </div>
      <div>
        <label className="block text-xs">Machine number:</label>
        <Input disabled={!isEditing} defaultValue={data.machineNumber} onChange={onMachineNumberInputChange} className="h-9 nodrag max-w-full"/>
      </div>
      <div className="mt-2">
        {
          data.endpoints?.map((v) => (
            <div data-testid={ v.ip } key={v.ip} className={ `flex items-center justify-between p-2`} >
              <div className="flex items-center space-x-2 hover:bg-muted hover:cursor-pointer" onClick={() => redirectToNetworkScan(v.ip)}> 
                <EndpointStatus value={findEndpointStatusByIp(v.ip)} />
                <div>
                  <p>{ v.description ?? v.name ?? "" }</p>
                  <p className="text-sm text-muted-foreground">{ v.ip }</p>
                </div>
              </div>
              {isEditing && <div>
                <EditMachineEndpoint 
                  ip={v.ip} 
                  name={v.name} 
                  trigger={
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="hover:bg-gray-200" 
                      disabled={!isEditing}>
                      <EditIcon className="text-gray-500" />
                    </Button>
                  } 
                  saveEndpoint={saveEndpoint}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-red-200" 
                  disabled={!isEditing}
                  onClick={() => removeEndpointFromMachineNode(data.id, v.ip)}>
                  <TrashIcon className="text-red-500" />
                </Button>
              </div>}
            </div>
          ))
        }
      </div>
      {
        isEditing && (isAddingEndpoint ? (
          <div className="flex items-center space-x-2 justify-between p-2">
            <SelectIpCombobox value="" onChange={handleIpSelected}/>
            <Button variant="ghost" size="icon" className="hover:bg-red-200" onClick={() => setIsAddingEndpoint(false)}>
              <UndoIcon className="text-gray-500" />
            </Button>
          </div>
        ) : (
          <div className="p-2 flex items-center space-x-2 hover:bg-muted hover:cursor-pointer" onClick={() => setIsAddingEndpoint(isEditing && true) 
          /*This will only allow adding endpoints when in edit mode*/}>
            <PlusIcon className="w-5 h-5 text-gray-500" />
            <p>Add Endpoint</p>
          </div>
        ))
      }
      <Handle style={isEditing?handleStyle:handleStyleHidden} type="source" position={Position.Left} id="ls" />
      <Handle style={isEditing?handleStyle:handleStyleHidden} type="source" position={Position.Right} id="rs" />
      <Handle style={isEditing?handleStyle:handleStyleHidden} type="source" position={Position.Top} id="ts" />
      <Handle style={isEditing?handleStyle:handleStyleHidden} type="source" position={Position.Bottom} id="bs" />
    </div>
  );
}
