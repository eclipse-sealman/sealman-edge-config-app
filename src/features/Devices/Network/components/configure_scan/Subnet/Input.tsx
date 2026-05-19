import { Input } from "@/components/ui/input"
import { useScanDefinitionStore } from "../../../stores"

export default function SubnetInput() {
  const setSubnetMask = useScanDefinitionStore(s => s.setSubnetMask)
  const subnetMask = useScanDefinitionStore(s => s.subnetMask)

  const handleSubnetMaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubnetMask(Number(e.target.value))
  }

  return (
    <Input
      id="subnet-input"
      value={subnetMask}
      onChange={handleSubnetMaskChange}
      type="number"
    />
  )
}
