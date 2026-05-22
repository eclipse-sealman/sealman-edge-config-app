import { Button } from "@/components/ui/button"
import { ChevronsUpDown } from "lucide-react"
import { useSelectedEndpointStore } from "../../stores"

interface props {
  open: boolean
}

export default function Name({ open }: props) {
  const name = useSelectedEndpointStore((state) => state.name)

  return (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full justify-between"
    >
      {name || "Select name..."}
      <ChevronsUpDown className="opacity-50" />
    </Button>
  )
}
