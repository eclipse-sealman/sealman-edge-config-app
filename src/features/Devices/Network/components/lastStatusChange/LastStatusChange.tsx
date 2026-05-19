import { Badge } from "@/components/ui/badge";

interface props {
  date: string | undefined;
  variant?: "default" | "secondary" | "destructive" | "outline"
}

export default function LastStatusChange({ date, variant }: props) {
  return (
    <Badge variant={variant}>{date? new Date(date).toLocaleString(): ""}</Badge>
  )
}
