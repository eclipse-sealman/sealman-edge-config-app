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
import { useMenuStore, useTopologyStore } from "../../stores"
import EndpointTypesCombobox from "../../components/select_comboboxes/EndpointTypesCombobox"
import { ENDPOINT_TYPES } from "../../endpoint_and_machine_types"
import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import SelectIpCombobox from "../../components/select_comboboxes/SelectIpCombobox"

export function AddIsolatedEndpoint() {
  const selectedIsolatedEndpointType = useMenuStore((state) => state.selectedIsolatedEndpointType)
  const setSelectedIsolatedEndpointType = useMenuStore((state) => state.setSelectedIsolatedEndpointType)
  const nodes = useTopologyStore((state) => state.nodes)
  const setNodes = useTopologyStore((state) => state.setNodes)
  const setMenuProps = useMenuStore((state) => state.setMenuProps);

  const [inputIp, setInputIp] = useState("")

  // Set initial inputIp if endpoint type has a default IP, only once when type changes
  useEffect(() => {
    const endpointType = ENDPOINT_TYPES.find((f) => f.name === selectedIsolatedEndpointType);
    if (endpointType) {
      setInputIp(endpointType.ip);
    }
  }, [selectedIsolatedEndpointType]);

  const handleConfirm = () => {
    // Find the maximum ID in the current nodes
    const maxId = nodes.reduce((max, node) => Math.max(max, parseInt(node.id, 10)), 0);
    const nextId = (maxId + 1).toString();

    const newIsolatedEndpoint = {
      id: nextId,
      data: { 
        ...ENDPOINT_TYPES.find((f) => f.name === selectedIsolatedEndpointType),
        id: nextId,
        ip: ENDPOINT_TYPES.find((f) => f.name === selectedIsolatedEndpointType)?.ip || inputIp || "",
        name: selectedIsolatedEndpointType
      },
      type: 'isolatedEndpoint',
      position: { x: Math.random() * 800, y: Math.random() * 400 }
    };

    const updatedNodes = [...nodes, newIsolatedEndpoint];
    setNodes(updatedNodes);
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setMenuProps(null)
      setSelectedIsolatedEndpointType("")
      setInputIp("")
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger className="flex w-full justify-start items-center gap-2" asChild>
        <Button variant="ghost"><Plus />Add Isolated Endpoint</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Isolated Endpoint</DialogTitle>
          <DialogDescription>
            Choose an endpoint type to add, or specify an ip address.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex space-x-4 w-full items-center">
            <div className="w-2/6">
              <p className="text-sm text-muted-foreground">Endpoint type</p>
            </div>
            <div className="w-full">
              <EndpointTypesCombobox/>
            </div>
          </div>
          { 
            // Only show IP input if endpoint type is selected
            selectedIsolatedEndpointType && 
            <div className="flex space-x-4 w-full items-center">
              <div className="w-2/6">
                <p className="text-sm text-muted-foreground">IP Address</p>
              </div>
              <div className="w-full">
                <SelectIpCombobox value={inputIp} onChange={setInputIp} />
              </div> 
            </div> 
          }
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
