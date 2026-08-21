import { Button } from "@/components/ui/button"
import useGetNetworkTopology from "@/generated/edge-administration/hooks/useGetNetworkTopology"
import { ReloadIcon } from "@radix-ui/react-icons"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { useNetworkPageStore } from "@/features/Devices/Network/stores"

export default function RefetchPeriodicScan() {
  const deviceId = useNetworkPageStore(s => s.deviceId)
  const { refetch, isFetching } = useGetNetworkTopology(deviceId)
  const setPeriodicScanDateTime = useNetworkPageStore(s => s.setPeriodicScanDateTime)
  // Tracked locally rather than relying on the query's own `isFetching` - that flag also flips
  // true for the query's own continuous background polling (see useGetNetworkTopology), which
  // would otherwise make this button flicker to its loading state every few seconds even though
  // the user never clicked it.
  const [isManuallyRefetching, setIsManuallyRefetching] = useState(false)

  useEffect(() => {
    setPeriodicScanDateTime(new Date())
  }, [isFetching, setPeriodicScanDateTime])

  const handleOnClick = async () => {
    setIsManuallyRefetching(true)
    try {
      await refetch()
      toast.success("Success: network scan refetched")
    } catch (err) {
      console.error("ERROR", err)
      toast.error("Error: network scan could not be refetched")
    } finally {
      setIsManuallyRefetching(false)
    }
  }

  if (isManuallyRefetching) {
    return (
      <Button id="periodic-scan-refresh" variant="outline" size="icon" disabled>
        <Loader2 className="animate-spin" />
      </Button>
    )
  }

  return (
    <Button
        id="periodic-scan-refresh"
        data-testid="periodic-scan-refresh"
        variant="outline"
        size="icon"
        onClick={handleOnClick}
    >
      <ReloadIcon />
    </Button>
  )
}
