import { Button } from "@/components/ui/button"
import { ChevronsUpDown } from "lucide-react"

interface props {
  value: string
  open: boolean
}

export default function Name({ value, open }: props) {

  return (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full justify-between"
    >
      {value}
      <ChevronsUpDown className="opacity-50" />
    </Button>
  )
}
