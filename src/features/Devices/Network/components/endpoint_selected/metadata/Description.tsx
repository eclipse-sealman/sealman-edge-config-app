import { Input } from "@/components/ui/input";
import { useSelectedEndpointStore } from "@/features/Devices/Network/stores"

export default function EndpointDescription() {
  const description = useSelectedEndpointStore(s => s.description)
  const updateDescription = useSelectedEndpointStore(s => s.updateDescription)

  return (
    <>
      <Input
        placeholder="optional custom name"
        onChange={e => updateDescription(e.target.value)}
        value={description || ""}
      />
    </>
  )
}
