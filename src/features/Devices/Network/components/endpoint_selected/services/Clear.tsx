import { Button } from "@/components/ui/button";
import { useSelectedEndpointStore } from "../../../stores";
import { TrashIcon } from "@radix-ui/react-icons";

interface props {
  port: number
}

export default function Clear({port}: props) {
  const updateServiceNameByPort = useSelectedEndpointStore(s => s.updateServiceNameByPort)

  const clearName = () => {
    updateServiceNameByPort(port, "")
  }

  return (
    <Button data-testid="clear-endpoint-name" size="icon" variant="ghost" onClick={clearName}><TrashIcon/></Button>
  )
}
