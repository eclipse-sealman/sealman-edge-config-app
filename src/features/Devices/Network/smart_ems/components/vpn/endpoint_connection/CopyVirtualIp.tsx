import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useClipboardCopy } from "../../../hooks";

interface Props {
  readonly virtualIp?: string;
}

export function CopyVirtualIp({ virtualIp }: Props) {
  const { copy } = useClipboardCopy()

  if (!virtualIp) {
    return (
      // This should not happen, but just in case
      <p>No virtual IP found</p>
    );
  }

  return (
    <div className="space-y-4">
      <p>
        To connect your computer to this device or endpoint you must use the following virtual IP. You can copy it by
        clicking on the button.
      </p>
      <div>
        <Label htmlFor="virtual-ip">Virtual IP</Label>
        <div className="flex gap-1">
          <Input id="virtual-ip" disabled value={virtualIp} />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button variant="outline" size="icon" onClick={async () => await copy(virtualIp)}>
                  <ClipboardIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy endpoint virtual IP</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
