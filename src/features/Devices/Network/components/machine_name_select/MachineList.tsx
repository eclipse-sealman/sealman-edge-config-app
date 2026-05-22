import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { useSelectedEndpointStore } from "../../stores"
import { getEndpointTypes } from "../../api/networkMeta"
import useLockZoom from "../../layouts/EndpointContent/useLockZoom"

interface props {
  setOpen: (open: boolean) => void
}

// This component relies a lot on ShadCN component making it difficult to UniTest
// TODO CYPRESS: cover with cypress test
export default function MachineList({ setOpen }: props) {
  const name = useSelectedEndpointStore((state) => state.name)
  const updateName = useSelectedEndpointStore((state) => state.updateName)

  const types = getEndpointTypes()
  const machines = types?.map((t: any) => t.name) ?? []

  // TODO THOMAS: decide what to do with zooming
  useLockZoom()

  const handleOnSelect = (selectedValue: string) => {
    updateName(machines.find((f) => f === selectedValue) ?? "")

    setOpen(false)
  }

  return (
    <Command>
      <CommandInput placeholder="Search machine..." />
      <CommandList>
        <CommandEmpty>No machine found.</CommandEmpty>
        <CommandGroup className="h-full">
          {machines.map((machine) => (
            <CommandItem
              key={machine}
              value={machine}
              onSelect={handleOnSelect}
            >
              {machine}
              <Check
                className={cn(
                  "ml-auto",
                  name === machine ? "opacity-100" : "opacity-0"
                )}
              />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
