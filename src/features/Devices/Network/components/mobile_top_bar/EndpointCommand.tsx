import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import useGetNetworkTopology from "@/generated/edge-administration/hooks/useGetNetworkTopology";
import { useNetworkPageStore, useTwinConfigStore } from "@/features/Devices/Network/stores";
import useLockZoom from "../../layouts/EndpointContent/useLockZoom";

interface props {
  value?: string
  setValue: (name: string) => void
  setOpen: (open: boolean) => void
}

export default function EndpointCommand({
  value,
  setValue,
  setOpen
}: props) {
  // TODO: use the new useGetPeriodicScanData hook here as well
  const deviceId = useNetworkPageStore(s => s.deviceId)
  const { data } = useGetNetworkTopology(deviceId)
  const endpointConfigList = useTwinConfigStore(s => s.endpointConfigList)
  const scannedEndpoints = data?.scanResults ?? []

  // TODO THOMAS: decide what to do with zooming
  useLockZoom()

  const renderNameOrIp = (ip: string) => {
    const description = endpointConfigList[ip]?.description
    const name = endpointConfigList[ip]?.name
    return description || name || ip
  }

  return (
    <Command>
      <CommandInput placeholder="Search an endpoint" />
      <CommandList>
        {scannedEndpoints.map(endpoint => (
          <CommandItem
            key={endpoint.ip}
            value={renderNameOrIp(endpoint.ip)}
            onSelect={() => {
              setValue(endpoint.ip)
              setOpen(false)
            }}
          >
            {renderNameOrIp(endpoint.ip) ?? endpoint.ip}
            <Check
              className={cn(
                "ml-auto",
                value === (renderNameOrIp(endpoint.ip) ?? endpoint.ip) ? "opacity-100" : "opacity-0"
              )}
            />
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  )
}
