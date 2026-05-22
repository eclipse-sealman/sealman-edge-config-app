import { CircleOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/features/Devices/Network/components/tooltip";

export function NoVpnContainerClient() {
  return (
    <>
      <Tooltip content="VPN container client missing" disabled>
        <Button disabled size="icon" variant="ghost">
          <CircleOff />
        </Button>
      </Tooltip>
    </>
  );
}
