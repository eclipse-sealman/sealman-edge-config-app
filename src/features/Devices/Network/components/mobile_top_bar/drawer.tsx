import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import EndpointCommand from "./EndpointCommand";
import { useNetworkPageStore, useTwinConfigStore } from "@/features/Devices/Network/stores"
import { useState } from "react";
import { useHandleSelectedEndpoint } from "../../useHandleSelectedEndpoint";

// TODO CYPRESS: test with Cypress, too complicated to write the unit test
export default function EndpointSelector() {
  const selectedEndpointIp = useNetworkPageStore(s => s.selectedEndpointIp)
  const endpointConfigList = useTwinConfigStore(s => s.endpointConfigList)
  const { handleSelectEndpoint } = useHandleSelectedEndpoint()
  const [open, setOpen ] = useState(false)

  const renderNameOrIp = () => {
    if (!selectedEndpointIp) {
      return "Select endpoint"
    }
    const description = endpointConfigList[selectedEndpointIp]?.description
    const name = endpointConfigList[selectedEndpointIp]?.name
    return description || name || selectedEndpointIp
  }

  return (
    <Drawer open={ open } onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          { renderNameOrIp() }
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <EndpointCommand value={renderNameOrIp()} setValue={handleSelectEndpoint} setOpen={setOpen}/>
      </DrawerContent>
    </Drawer>
  )
}
