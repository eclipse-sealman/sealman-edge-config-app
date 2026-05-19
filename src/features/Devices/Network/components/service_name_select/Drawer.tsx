import { useState } from "react"
import { Drawer as ShadDrawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import Name from "./Name"
import ServiceList from "./ServiceList"

export default function Drawer({ name, port }: { name: string, port: number }) {
  const [open, setOpen] = useState(false)

  return (
    <ShadDrawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <div className="w-full">
          <Name open={open} value={name} />
        </div>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">
          <ServiceList port={port} value={name} setOpen={setOpen}/>
        </div>
      </DrawerContent>
    </ShadDrawer>
  )
}
