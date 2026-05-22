import { Unplug, OctagonAlert, Plug } from "lucide-react";

interface props {
  value: "offline" | "online" | "unknown"
}

export default function EndpointStatus({ value }: props) {
  if (value==="unknown") {
    return (
      <OctagonAlert className="w-5 h-5 text-gray-500"/>
    )
  }

  if (value === "offline") {
    return (
      <Unplug className="w-5 h-5 text-red-500"/>
    )
  }

  if ( value === "online" ) {
    return <Plug className="w-5 h-5 text-green-500"/>
  }

  return "no icon for status"
}
