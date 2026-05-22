import { Badge } from "@/components/ui/badge"

interface props {
  value: string
}

export default function Port({ value }: props) {
  return <Badge variant="secondary"> {value}</Badge>
}