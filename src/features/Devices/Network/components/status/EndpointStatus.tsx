import { Unplug, Plug, OctagonAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge"

interface props {
  value: "offline" | "online" | "unknown"
  type?: "text" | "icon"
}

export default function EndpointStatus({ value, type = "icon" }: props) {
  if (value==="unknown" && type == "text") {
    return <Badge variant="outline" className="text-orange-600 border-orange-600">Unknown</Badge>
  }

  if (value==="unknown" && type == "icon") {
    return (
      <OctagonAlert className="w-5 h-5 text-orange-500"/>
    )
  }

  if (value === "offline" && type === "text") {
    return (
      <Badge variant="outline" className="text-red-600 border-red-600">Offline</Badge>
    )
  }

  if (value === "offline" && type === "icon") {
    return (
      <Unplug className="w-5 h-5 text-red-500"/>
    )
  }

  if ( value === "online" && type == "text") {
    return <Badge variant="outline" className="text-green-600 border-green-600">Online</Badge>
  }

  if ( value === "online" && type == "icon") {
    return <Plug className="w-5 h-5 text-green-500"/>
  }

  return "no icon for status"
}
