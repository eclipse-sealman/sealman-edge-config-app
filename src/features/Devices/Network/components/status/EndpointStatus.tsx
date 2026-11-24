import { useState, type ReactNode } from "react";
import { Unplug, Plug, OctagonAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Status = "offline" | "online" | "unknown"

interface props {
  value: Status
  type?: "text" | "icon"
}

const STATUS_LABEL: Record<Status, string> = { online: "Online", offline: "Offline", unknown: "Unknown" };

/** Shows the status on hover and on click (for touch and keyboard users). */
function StatusIcon({ value, children }: { value: Status; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const text = `Connection status: ${STATUS_LABEL[value]}`;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={text}
            className="nodrag nopan inline-flex cursor-pointer items-center"
            onClick={() => setOpen(true)}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function EndpointStatus({ value, type = "icon" }: props) {
  if (value==="unknown" && type == "text") {
    return <Badge variant="outline" className="text-orange-600 border-orange-600">Unknown</Badge>
  }

  if (value==="unknown" && type == "icon") {
    return (
      <StatusIcon value={value}><OctagonAlert className="w-5 h-5 text-orange-500"/></StatusIcon>
    )
  }

  if (value === "offline" && type === "text") {
    return (
      <Badge variant="outline" className="text-red-600 border-red-600">Offline</Badge>
    )
  }

  if (value === "offline" && type === "icon") {
    return (
      <StatusIcon value={value}><Unplug className="w-5 h-5 text-red-500"/></StatusIcon>
    )
  }

  if ( value === "online" && type == "text") {
    return <Badge variant="outline" className="text-green-600 border-green-600">Online</Badge>
  }

  if ( value === "online" && type == "icon") {
    return <StatusIcon value={value}><Plug className="w-5 h-5 text-green-500"/></StatusIcon>
  }

  return "no icon for status"
}
