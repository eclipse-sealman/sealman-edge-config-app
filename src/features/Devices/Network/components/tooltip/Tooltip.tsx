import { ReactNode } from "react";
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface props {
  content: ReactNode;
  children: ReactNode;
  disabled?: boolean;
}

export function Tooltip({ children, content, disabled = false }: props) {
  return (
    <div className="">
      <TooltipProvider>
        <ShadTooltip>
          <TooltipTrigger>
            <div className={disabled ? "cursor-not-allowed" : ""}>{children}</div>
          </TooltipTrigger>
          <TooltipContent>{content}</TooltipContent>
        </ShadTooltip>
      </TooltipProvider>
    </div>
  );
}
