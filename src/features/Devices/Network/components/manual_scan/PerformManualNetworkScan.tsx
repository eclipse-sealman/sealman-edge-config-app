import { toast } from "react-toastify";
import ButtonWithLoading from "../buttons/ButtonWithLoading";
import { useNetworkPageStore, useScanDefinitionStore, useScanDiscoverStore } from "@/features/Devices/Network/stores";
import usePostDeviceNetworkDiscover, { NetworkDiscover } from "@/generated/edge-administration/hooks/network/usePostDeviceNetworkDiscover";
import { useEffect } from "react";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";

const GuardedButtonWithLoading = withPermissionRequiredTooltip(ButtonWithLoading);

export default function PerformManualNetworkScan() {
  const deviceId = useNetworkPageStore(s => s.deviceId)
  const setScanning = useScanDiscoverStore(s => s.setScanning)
  const setScanResults = useScanDiscoverStore(s => s.setScanResults)
  const isScanning = useScanDiscoverStore(s => s.isScanning)
  const { mutateAsync } = usePostDeviceNetworkDiscover()
  const networkPrefix = useScanDefinitionStore(s => s.networkDefinition)
  const ports = useScanDefinitionStore(s => s.ports)
  const subnetMask = useScanDefinitionStore(s => s.subnetMask)

  // Function is there mainly to reduce cognitive load ... readNetwork is easier to understand than that shady post request 🙃
  const readNetwork = async (body: NetworkDiscover) => {
    setScanning(true)
    const data = await mutateAsync({
      body,
      deviceId
    })
    setScanning(false)
    setScanResults(data?.payload.scanResults ?? [])
  }

  const handleOnClick = async () => {
    if (!networkPrefix) {
      toast.error("You must specify the network prefix")
      return
    }

    if (ports.length === 0) {
      toast.error("You must add at least one port to scan")
      return
    }

    await readNetwork({
      networkDefinition: networkPrefix,
      ports,
      subnetMask
    })
  }

  useEffect(() => {
    return () => {
      setScanning(false)
    }
  }, [setScanning])

  return (
    <GuardedButtonWithLoading
      resourceType="device"
      resourceId={deviceId}
      permissionKey="discover_network"
      handleOnClick={handleOnClick}
      variant="outline"
      isLoading={isScanning}
      text="Perform manual scan"
    />
  )
}
