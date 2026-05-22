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
import MachineTypesCombobox from "../../components/select_comboboxes/MachineTypesCombobox"
import { useMenuStore, useTopologyStore } from "../../stores"
import { MACHINE_TYPES } from "../../endpoint_and_machine_types"
import SelectedMachineInfo from "./SelectedMachineInfo"
import { Plus } from "lucide-react"

export function AddMachine() {
  const selectedMachineType = useMenuStore((state) => state.selectedMachineType)
  const setSelectedMachineType = useMenuStore((state) => state.setSelectedMachineType)
  const nodes = useTopologyStore((state) => state.nodes)
  const setNodes = useTopologyStore((state) => state.setNodes)
  const setMenuProps = useMenuStore((state) => state.setMenuProps);

  const handleConfirm = () => {
    if (!selectedMachineType) {
      return
    }

    // Find the maximum ID in the current nodes
    const maxId = nodes.reduce((max, node) => Math.max(max, parseInt(node.id, 10)), 0);
    const nextId = (maxId + 1).toString();

    const newMachine = {
      id: nextId,
      data: { 
        id: nextId,
        name: selectedMachineType,
        endpoints: MACHINE_TYPES.find((f) => f.name === selectedMachineType)?.endpoints ?? undefined,
      },
      type: 'machine',
      position: { x: Math.random() * 400, y: Math.random() * 200}
    };

    const updatedNodes = [...nodes, newMachine];
    setNodes(updatedNodes);
  }

  const handleOpenChange = (isOpen: boolean) => {
    // TODO: if I move setMenuProps here, it prevents the dialog from opening.. Why?
    if (!isOpen) {
      setMenuProps(null)
      setSelectedMachineType("")
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger className="flex w-full justify-start items-center gap-2" asChild>
        <Button variant="ghost"><Plus /> Add Machine</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Machine</DialogTitle>
          <DialogDescription>
            Choose a machine type to add, or create a new machine from scratch.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex space-x-4 w-full items-center">
            <div className="w-2/6">
              <p className="text-sm text-muted-foreground">Machine type</p>
            </div>
            <div className="w-full">
              <MachineTypesCombobox/>
            </div>
          </div>
          <SelectedMachineInfo />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="submit" onClick={handleConfirm}>Confirm</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
