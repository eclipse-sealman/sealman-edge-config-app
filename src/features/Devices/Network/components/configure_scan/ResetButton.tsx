import { Button } from "@/components/ui/button"
import { useScanDefinitionStore } from "../../stores";

export default function ResetScanDefinition() {
  const reset = useScanDefinitionStore(s => s.reset)

  const handleOnClick = async () => {
    reset()
  }

  return (
    <Button id="reset-network-definition" variant="secondary" onClick={handleOnClick} className="w-full sm:w-auto">
      Reset
    </Button>
  )
}
