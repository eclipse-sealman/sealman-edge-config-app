import { Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/features/Devices/Network/components/tooltip";

export function Wait() {
  return (
    <>
      <Tooltip content="Connect not available yet" disabled>
        <Button disabled size="icon" variant="ghost">
          <Hourglass />
        </Button>
      </Tooltip>
    </>
  );
}
