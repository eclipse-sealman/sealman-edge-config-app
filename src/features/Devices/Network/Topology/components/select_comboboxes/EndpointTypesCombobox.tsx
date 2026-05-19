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
import { useMenuStore } from "../../stores"
import { ENDPOINT_TYPES } from "../../endpoint_and_machine_types"

export default function EndpointTypesCombobox() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")

  const selectedIsolatedEndpointType = useMenuStore((state) => state.selectedIsolatedEndpointType)
  const setSelectedIsolatedEndpointType = useMenuStore((state) => state.setSelectedIsolatedEndpointType)

  const handleOnSelect = (selectedValue: string) => {
    setSelectedIsolatedEndpointType(ENDPOINT_TYPES.find((f) => f.name === selectedValue)?.name ?? "")

    setOpen(false)
  }

  const handleOnCustomName = (name: string) => {
    setSelectedIsolatedEndpointType(name)

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
        {selectedIsolatedEndpointType || "Select endpoint type..."}
        <ChevronsUpDown className="opacity-50" />
      </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <Command>
          <CommandInput placeholder="Search endpoint..." onValueChange={v => {
            setName(v)
          }} />
          <CommandList>
            <CommandEmpty className="grid gap-2 mb-4 sm:mb-0">
              <p className="text-xs text-muted-foreground mt-4">
                <span className="text-destructive">No endpoint type was found. </span><br /><br />
                Would you like to use the name you provided instead?
              </p>
              <Button variant="default" onClick={() => {
                handleOnCustomName(name)
              }}>Confirm</Button>
            </CommandEmpty>
            <CommandGroup className="h-full">
              {ENDPOINT_TYPES.map((endpointType) => (
                <CommandItem
                  key={endpointType.name}
                  value={endpointType.name}
                  onSelect={handleOnSelect}
                >
                  {endpointType.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedIsolatedEndpointType === endpointType.name ? "opacity-100" : "opacity-0"
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