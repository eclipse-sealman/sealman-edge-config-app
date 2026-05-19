import { useNetworkPageStore } from "@/features/Devices/Network/stores"

export default function ScanDataInfo() {
  const periodicScanDateTime = useNetworkPageStore(s => s.periodicScanDateTime)

  if (!periodicScanDateTime) {
    return (
      <p className="text-sm text-gray-500">no periodic scan has been performed yet</p>
    )
  }

  const date = periodicScanDateTime.toLocaleString("en-US", {
    day:"2-digit",
    month: "long",
  })
  const time = periodicScanDateTime.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false
  })

  return (
    <div className="text-sm text-muted-foreground">
      <p className="">
        <span className="text-xs">Results from:</span> <br /> { date }, { time }
      </p>
    </div>
  );
}
