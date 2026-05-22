import { Button } from "@/components/ui/button"
import useGetNetworkTopology from "@/generated/edge-administration/hooks/useGetNetworkTopology"
import { ReloadIcon } from "@radix-ui/react-icons"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { toast } from "react-toastify"
import { useNetworkPageStore } from "@/features/Devices/Network/stores"

export default function RefetchPeriodicScan() {
  const deviceId = useNetworkPageStore(s => s.deviceId)
  const { refetch, isFetching } = useGetNetworkTopology(deviceId)
  const setPeriodicScanDateTime = useNetworkPageStore(s => s.setPeriodicScanDateTime)

  useEffect(() => {
    setPeriodicScanDateTime(new Date())
  }, [isFetching, setPeriodicScanDateTime])

  const handleOnClick = async () => {
    try {
      await refetch()
      toast.success("Success: network scan refetched")
    } catch (err) {
      console.error("ERROR", err)
      toast.error("Error: network scan could not be refetched")
    }
  }

  if (isFetching) {
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
