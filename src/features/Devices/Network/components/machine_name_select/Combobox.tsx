import {
  Popover,
  PopoverContent,
  PopoverTrigger,
 } from "@/components/ui/popover"
 import MachineList from "./MachineList"
 import MachineNameButton from "./Name"
 import { useState } from "react"
 
 export default function Combobox() {
  const [open, setOpen] = useState(false)
 
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="w-full">
          <MachineNameButton open={ open } />
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="end">
        <MachineList setOpen={setOpen} />
      </PopoverContent>
    </Popover>
  )
 }
 