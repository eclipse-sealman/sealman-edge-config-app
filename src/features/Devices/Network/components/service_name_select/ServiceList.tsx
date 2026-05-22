import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useSelectedEndpointStore } from "../../stores"
import useLockZoom from "../../layouts/EndpointContent/useLockZoom"

interface props {
  port: number
  value: string
  setOpen: (open: boolean) => void
}

const serviceOptions = [
  "OPC-UA Server",
  // "VNC Server"
];


// TODO @JC: this component is not atomic ⚛️😬
export default function ServiceList({ setOpen, value, port }: props) {
  const { updateServiceNameByPort } = useSelectedEndpointStore()
  const [name, setName] = useState("")

  // TODO THOMAS: decide what to do with zooming
  useLockZoom()

  const handleOnSelect = (selectedValue: string) => {
    updateServiceNameByPort(port, selectedValue)

    setOpen(false)
  }

  return (
    <Command>
      <CommandInput id="service-input" placeholder="Search service..." onValueChange={v => {
        setName(v)
        return v
      }}/>
      <CommandList>
        <CommandEmpty className="grid gap-2 mb-4 sm:mb-0">
          <p className="text-xs text-muted-foreground mt-4">
            <span className="text-destructive">No preconfigured service was found. </span><br /><br />
            However, you can still name it using the name you provided.
          </p>
          <Button variant="default" onClick={() => {
            handleOnSelect(name)
          }}>Name service</Button>
        </CommandEmpty>
        <CommandGroup className="h-full">
          {serviceOptions.map((service) => (
            <CommandItem
              key={service}
              value={service}
              onSelect={handleOnSelect}
            >
              {service}
              <Check
                className={cn(
                  "ml-auto",
                  value === service ? "opacity-100" : "opacity-0"
                )}
              />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
