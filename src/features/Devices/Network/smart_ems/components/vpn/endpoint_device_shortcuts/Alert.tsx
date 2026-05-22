import { Button } from "@/components/ui/button";
import { Tooltip } from "@/features/Devices/Network/components/tooltip";
import { TriangleAlert } from "lucide-react";


export function NotInContainer() {
  return (
    <Tooltip content="Endpoint device not in VPN container">
      <Button
        size="icon"
        variant="ghost"
      >
        <TriangleAlert className="text-muted-foreground"/>
      </Button>
    </Tooltip>
  )
}
