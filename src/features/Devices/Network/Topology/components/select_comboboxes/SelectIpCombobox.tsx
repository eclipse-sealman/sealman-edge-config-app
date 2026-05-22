import {
  Popover,
  PopoverContent,
  PopoverTrigger,
 } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGetPeriodicScanData } from "../../../layouts/endpoint_list/useGetPeriodicScanData"
import { useNetworkPageStore } from "../../../stores"
import { useTopologyStore } from "../../stores"
import { MachineNodeData } from "../../stores/Topology"

interface SelectIpComboboxProps {
  value: string
  onChange?: (ip: string) => void
}

export default function SelectIpCombobox({value, onChange }: SelectIpComboboxProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [internalIp, setInternalIp] = useState(value || "")

  const selectedIp = value !== undefined ? value : internalIp

  const deviceId = useNetworkPageStore((s) => s.deviceId);
  const { scanResults } = useGetPeriodicScanData(deviceId);

  const scannedIps = scanResults?.map((r) => r.ip) || [];

  // Check if an IP is already used in any node so we can disable the corresponding option in the combobox
  const nodes = useTopologyStore((s) => s.nodes);
  const isIpAlreadyUsed = (ip: string) => {
    return nodes.some((node) => {
      if (node.type === "machine") {
        const machineNodeData = node.data as MachineNodeData;
        return machineNodeData.endpoints && machineNodeData.endpoints.some((ep) => ep.ip === ip);
      }
      if (node.type === "isolatedEndpoint") {
        return node.data.ip === ip;
      }
      return false;
    });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      !/[0-9.]/.test(e.key) &&
      e.key !== "Backspace" &&
      e.key !== "ArrowLeft" &&
      e.key !== "ArrowRight" &&
      e.key !== "Delete" &&
      e.key !== "Tab" &&
      !(e.ctrlKey || e.metaKey)
    ) {
      e.preventDefault();
    }
  };

  const handleOnSelect = (selectedValue: string) => {
    const ip = scannedIps.find((f) => f === selectedValue) ?? ""
    if (onChange) onChange(ip)
    setInternalIp(ip)
    setOpen(false)
  }

  const handleOnCustomIp = (name: string) => {
    if (onChange) onChange(name)
    setInternalIp(name)
    setOpen(false)
  }

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedIp || "Select or Enter IP address..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <Command>
          <CommandInput placeholder="Search or input IP address..." onValueChange={v => setName(v)} onKeyDown={handleInputKeyDown}/>
          <CommandList>
            <CommandEmpty className="grid gap-2 mb-4 sm:mb-0">
              <p className="text-xs text-muted-foreground mt-4">
                <span className="text-destructive">No IP address was found. </span><br /><br />
                Would you like to use the one you provided instead?
              </p>
              <Button variant="default" onClick={() => handleOnCustomIp(name)}>
                Confirm
              </Button>
            </CommandEmpty>
            <CommandGroup className="h-full">
              {scannedIps.map((ip) => (
                <CommandItem
                  key={ip}
                  value={ip}
                  onSelect={handleOnSelect}
                  disabled={isIpAlreadyUsed(ip)}
                >
                  {ip}
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedIp === ip ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
