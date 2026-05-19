import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"
import { Input } from "../../../../../../components/ui/input"
import SelectIpCombobox from "../../components/select_comboboxes/SelectIpCombobox"

interface EditMachineEndpointProps {
  ip: string
  name: string
  trigger: React.ReactNode
  saveEndpoint: (ip: string, newIp: string, newName: string) => void
}

export function EditMachineEndpoint({
  ip,
  name,
  trigger,
  saveEndpoint
}: EditMachineEndpointProps) {
  const [newIp, setNewIp] = useState(ip)
  const [newName, setNewName] = useState(name)
  
  const handleConfirm = () => {
    saveEndpoint(ip, newIp, newName);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        { trigger }
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Machine Endpoint</DialogTitle>
          <DialogDescription>
            Change the name and IP address of the machine endpoint.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex space-x-4 w-full items-center">
            <div className="w-2/6">
              <p className="text-sm text-muted-foreground">Endpoint name</p>
            </div>
            <div className="w-full">
              <Input
                placeholder="Enter endpoint name"
                onChange={e => setNewName(e.target.value)}
                value={newName || ""}
              />
            </div>
          </div>
          <div className="flex space-x-4 w-full items-center">
            <div className="w-2/6">
              <p className="text-sm text-muted-foreground">Endpoint IP</p>
            </div>
            <div className="w-full">
              <SelectIpCombobox value={newIp} onChange={setNewIp} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="submit" onClick={handleConfirm}>Save</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
