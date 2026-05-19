import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface props {
  isLoading: boolean
  handleOnClick: () => Promise<void>
  text?: string
  children?: ReactNode
  variant?:  "default" |"destructive" |"outline" |"secondary" | "ghost" | "link"
  disabled?: boolean
}

export default function ButtonWithLoading({ isLoading, handleOnClick, text, variant, children, disabled = false }: props) {
  if (isLoading) {
    return (
      <Button disabled className="w-full sm:w-auto" variant={ variant ?? "default" }>
        <Loader2 className="animate-spin" />
        Please wait
      </Button>
    )
  }

  return (
    <Button className="w-full sm:w-auto" onClick={ handleOnClick } variant={variant} disabled={disabled}>
      {children ?? text}
    </Button>
  )
}
