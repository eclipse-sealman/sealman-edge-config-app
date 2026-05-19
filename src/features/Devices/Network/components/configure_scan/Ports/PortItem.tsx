import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useScanDefinitionStore } from "../../../stores";

export default function PortItem({ port, index }: { port: number ,index: number }) {
  const { removePortByIndex } = useScanDefinitionStore()

  return (
    <Badge id={`port-item-${index}`} variant="secondary">
      {port}
      <button
        id={`remove-port-item-${index}`}
        data-testid={`remove-port-item-${index}`}
        type="button"
        className="rounded ml-1 hover:text-foreground text-muted-foreground"
        onClick={() => {
          removePortByIndex(index)
        }}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
