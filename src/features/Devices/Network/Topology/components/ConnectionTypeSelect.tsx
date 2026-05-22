
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select"
import { GearIcon } from "@radix-ui/react-icons"
import { useTopologyStore } from "../stores"

interface ConnectionTypeSelectProps {
  edgeId: string
  value: string
}

export function ConnectionTypeSelect({ edgeId, value }: ConnectionTypeSelectProps) {
  const isEditing = useTopologyStore((state) => state.isEditing);
  const changeConnectionTypeByEdgeId = useTopologyStore((state) => state.changeConnectionTypeByEdgeId)

  return (
    isEditing && <Select value={value} onValueChange={(value => {
      changeConnectionTypeByEdgeId(edgeId, value)
    })}>
      <SelectTrigger>
        <GearIcon/>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Connection Types</SelectLabel>
          <SelectItem value="productFlow">Product Flow</SelectItem>
          <SelectItem value="builtIn">Built-In</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
