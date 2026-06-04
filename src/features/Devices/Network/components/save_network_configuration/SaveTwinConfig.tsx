import ButtonWithLoading from "../buttons/ButtonWithLoading";
import { toast } from "react-toastify";
import { usePostModuleNetDiscover } from "@/generated/edge-administration/hooks/usePostModuleNetDiscover";
import { Status, useNetworkPageStore, useScanDefinitionStore, useSelectedEndpointStore, useTwinConfigStore } from "@/features/Devices/Network/stores";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

interface props {
  saveText?: string
  onSuccess?: () => void
}

const GuardedButtonWithLoading = withPermissionRequiredTooltip(ButtonWithLoading);

// TODO: This button is definitely not behaving as intended. There is no distinction between the save button in the endpoint card and the services card
export default function SaveTwinConfig({ onSuccess = () => {}, saveText = "Save network configuration" }: props) {
  const deviceId = useNetworkPageStore(s => s.deviceId)
  const { PostNetDiscoverModule } = usePostModuleNetDiscover();
  const twinConfig = useTwinConfigStore(s => s.twinConfig)
  const status = useTwinConfigStore(s => s.status)
  const setStatus = useTwinConfigStore(s => s.setStatus)
  const networkPrefix = useScanDefinitionStore(s => s.networkDefinition)
  const subnetMask = useScanDefinitionStore(s => s.subnetMask)
  const ports = useScanDefinitionStore(s => s.ports)
  const services = useSelectedEndpointStore((s) => s.services)
  const machineType = useSelectedEndpointStore((s) => s.name)
  const endpointDescription = useSelectedEndpointStore(s => s.description)
  const ip = useNetworkPageStore((s) => s.selectedEndpointIp)

  const handleOnClick = async () => {
    if (!networkPrefix) {
      console.error("Network prefix is null")
      toast.error("The network prefix can't be empty")
      return
    }

    const postData = structuredClone(twinConfig)

    const previousStatus = status

    postData.scanDefinition = {
      networkDefinition: networkPrefix,
      ports,
      subnetMask
    }

    // TODO: It looks like this is a check for whether the save button was pressed inside a card belonging to a selected endpoint, but what if the user had selected an endpoint then opened the config sheet?
    if (ip) {
      postData.endpointNames[ip] = {
        ...postData.endpointNames[ip],
        name: machineType,
        description: endpointDescription || undefined,
        serviceNames: services
      }
    }

    try {
      setStatus(Status.IsSaving)
      await PostNetDiscoverModule({
        body: postData,
        deviceId,
      })
      toast.success("Your network preferences have been saved")
      onSuccess()
    } catch (err) {
      console.error("SaveNetworkConfiguration", err)
      toast.error("Something went wrong")
    }
    setStatus(previousStatus)
  }

  return (
    <div id="save-btn" className="w-full sm:w-auto">
      <GuardedButtonWithLoading
        permissionKey={PERMISSION_KEYS.DEVICE_MODULE_TWIN_CONFIG_WRITE}
        resourceType="device"
        deviceId={deviceId}
        handleOnClick={handleOnClick}
        isLoading={status === Status.IsSaving}
        text={saveText}
      />
    </div>
  )
}
