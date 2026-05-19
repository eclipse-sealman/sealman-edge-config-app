import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/features/Devices/Network/components/tooltip";

export function LoadingShortcut() {
  return (
    <>
      <Tooltip content="VPN container client missing" disabled>
        <Button disabled size="icon" variant="ghost">
          <Loader2 className="animate-spin" />
        </Button>
      </Tooltip>
    </>
  );
}
