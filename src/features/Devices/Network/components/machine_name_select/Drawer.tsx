import { useState } from "react"
import { Drawer as ShadDrawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import MachineList from "./MachineList"
import MachineNameButton from "./Name"

export default function Drawer() {
  const [open, setOpen] = useState(false)

  return (
    <ShadDrawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <div className="w-full">
          <MachineNameButton open={ open } />
        </div>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">
          <MachineList setOpen={setOpen} />
        </div>
      </DrawerContent>
    </ShadDrawer>
  )
}
