import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Name from "./Name";
import { useState } from "react";
import ServiceList from "./ServiceList";

export default function Combobox({ name, port }: { name: string, port: number }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={ open } onOpenChange={setOpen} >
      <PopoverTrigger asChild>
        <div className="w-full">
          <Name open={open} value={name}/>
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <ServiceList setOpen={setOpen} value={name} port={port} />
      </PopoverContent>
    </Popover>
  )
}
