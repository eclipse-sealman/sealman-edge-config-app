import { Button } from "@/components/ui/button";
import { useSelectedEndpointStore } from "../../../stores";
import { TrashIcon } from "@radix-ui/react-icons";

export default function Clear() {
  const updateName = useSelectedEndpointStore(s => s.updateName)

  const clearName = () => {
    updateName("")
  }

  return (
    <Button data-testid="clear-endpoint-name" size="icon" variant="ghost" onClick={clearName}><TrashIcon/></Button>
  )
}
