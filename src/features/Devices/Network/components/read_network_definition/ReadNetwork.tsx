import useReadNetworkDefinition from "./useReadNetworkDefinition";
import { BtnWithLoading } from "../buttons";
import { useNetworkPageStore, useScanDefinitionStore } from "@/features/Devices/Network/stores";
import { withPermissionAndModuleRequiredTooltip } from "@/features/authorization/permissions/withPermissionAndModuleRequiredTooltip";
import { CMD_PROXY_MODULE_NAME } from "@/api/edgeConfig/moduleNames";

const GuardedBtnWithLoading = withPermissionAndModuleRequiredTooltip(BtnWithLoading);

export default function ReadNetwork() {
  const deviceId = useNetworkPageStore(s => s.deviceId)
  const setNetworkPrefix = useScanDefinitionStore(s => s.setNetworkPrefix)
  const setSubnetMask = useScanDefinitionStore(s => s.setSubnetMask)
  const { readNetwork, isReading } = useReadNetworkDefinition(deviceId)


  const handleOnClick = async () => {
    const network = await readNetwork()
    if (!network) {
      return
    }
    setNetworkPrefix(network.address)
    setSubnetMask(network.mask)
  }

  return (
    <GuardedBtnWithLoading
      resourceType="device"
      resourceId={deviceId}
      permissionKey="execute_module_method"
      requiredModuleName={CMD_PROXY_MODULE_NAME}
      isLoading={ isReading }
      handleOnClick={handleOnClick}
      text="Read network configuration"
      variant="outline"
    />
  )
}
