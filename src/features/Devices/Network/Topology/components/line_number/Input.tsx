import { Input } from "@/components/ui/input"
import { useTopologyStore } from "../../stores";

export default function LineNumberInput() {
  const isEditing = useTopologyStore((state) => state.isEditing);

  const lineNumber = useTopologyStore((state) => state.lineNumber);
  const setLineNumber = useTopologyStore((state) => state.setLineNumber);

  const handleLineNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLineNumber(e.target.value)
  }

  return (
    <Input disabled={!isEditing} id="line-number-input" className="h-9 max-w-full bg-white" value={lineNumber} onChange={handleLineNumberChange}/>
  )
}
