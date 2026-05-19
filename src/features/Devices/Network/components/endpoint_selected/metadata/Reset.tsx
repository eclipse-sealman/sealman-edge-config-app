import { Button } from "@/components/ui/button";
import { useSelectedEndpointStore } from "../../../stores";

export default function Reset() {
  const resetName = useSelectedEndpointStore(s => s.resetNameAndDescription)

  return (
    <Button className="w-full sm:w-auto" variant="outline" onClick={resetName}>Reset</Button>
  )
}
