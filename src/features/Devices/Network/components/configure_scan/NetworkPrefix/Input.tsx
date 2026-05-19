import { Input } from "@/components/ui/input"
import { useScanDefinitionStore } from "../../../stores"

export default function NetworkPrefixInput() {
  const setNetworkPrefix = useScanDefinitionStore(s => s.setNetworkPrefix)
  const networkPrefix = useScanDefinitionStore(s => s.networkDefinition)

  const handleNetworkPrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNetworkPrefix(e.target.value)
  }

  return (
    <Input id="network-prefix-input" value={networkPrefix} onChange={handleNetworkPrefixChange}/>
  )
}
