import PortItem from "./PortItem"
import { useScanDefinitionStore } from "../../../stores"

export default function PortList() {
  const ports = useScanDefinitionStore(s => s.ports)

  return (
    <div className="flex flex-wrap gap-2">
      {ports.map((port, index) => (
        <PortItem key={port} port={port} index={index} />
      ))}
    </div>
  )
}
