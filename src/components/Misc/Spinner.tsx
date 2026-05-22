import { ArrowPathIcon } from "@heroicons/react/24/outline"
import { RefAttributes, SVGProps } from "react"

interface SpinnerProps extends Omit<SVGProps<SVGSVGElement>, "ref">, RefAttributes<SVGSVGElement> {
  title?: string | undefined;
  titleId?: string | undefined;
  processing?: boolean
}

export default function Spinner({ processing, className, ...props }: SpinnerProps) {

  return (
    <ArrowPathIcon className={`${!processing && 'invisible'} h-4 w-4 animate-[spin_1.5s_linear_infinite] ${className}`} {...props}/>
  )
}