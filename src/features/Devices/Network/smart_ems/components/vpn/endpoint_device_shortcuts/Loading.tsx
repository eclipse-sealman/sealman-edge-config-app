import { WaterLoader } from "@/components/ui/water-loader";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/features/Devices/Network/components/tooltip";

export function LoadingShortcut() {
  return (
    <>
      <Tooltip content="VPN container client missing" disabled>
        <Button disabled size="icon" variant="ghost">
          <WaterLoader />
        </Button>
      </Tooltip>
    </>
  );
}
