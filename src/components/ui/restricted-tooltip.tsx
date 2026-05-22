import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
} from "@radix-ui/react-tooltip";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

export function RestrictedTooltip({
  children,
  show,
  message = "This action is currently unavailable.",
}: {
  children: React.ReactNode;
  show: boolean;
  message?: string;
}) {
  return (
    <div className="relative inline-flex items-center gap-1">
      <span className={show ? "pointer-events-none" : ""}>
        {children}
      </span>
      {show && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-yellow-500 cursor-default">
                <ExclamationTriangleIcon className="w-4 h-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent
              className="z-50 max-w-xs rounded-md bg-gray-900 px-3 py-2 text-sm text-white shadow-lg"
              side="top"
              align="center"
            >
              {message}
              <TooltipArrow className="fill-gray-900" />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}