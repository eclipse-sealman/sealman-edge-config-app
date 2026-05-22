import { Button } from "@/components/ui/button";
import { useSelectedEndpointStore } from "../../../stores";

export default function Reset() {
  const resetServices = useSelectedEndpointStore((store) => store.resetServices)

  return (
    <Button id="services-reset" className="w-full sm:w-auto" variant="outline" onClick={resetServices}>Reset</Button>
  )
}
