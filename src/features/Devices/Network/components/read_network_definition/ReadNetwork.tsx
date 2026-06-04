import useReadNetworkDefinition from "./useReadNetworkDefinition";
import { BtnWithLoading } from "../buttons";
import { useNetworkPageStore, useScanDefinitionStore } from "@/features/Devices/Network/stores";
import { withPermissionAndModuleRequiredTooltip } from "@/features/authorization/permissions/withPermissionAndModuleRequiredTooltip";
import { CMD_PROXY_MODULE_NAME } from "@/api/edgeConfig/moduleNames";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

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
      deviceId={deviceId}
      permissionKey={PERMISSION_KEYS.DEVICE_MODULE_EXECUTE_METHOD}
      requiredModuleName={CMD_PROXY_MODULE_NAME}
      isLoading={ isReading }
      handleOnClick={handleOnClick}
      text="Read network configuration"
      variant="outline"
    />
  )
}
