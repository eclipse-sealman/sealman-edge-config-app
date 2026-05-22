import { Button } from "@/components/ui/button";
import { useScanDefinitionStore } from "../../../stores";

export default function ClearPortsButton() {
  const clearAllPorts = useScanDefinitionStore(s => s.clearAllPorts)

  const handleClick = () => {
    clearAllPorts()
  };

  return (
    <Button id="scan-definition-dialog-open" size="sm" variant="ghost" onClick={handleClick}>
      Clear all ports
    </Button>
  )
}
