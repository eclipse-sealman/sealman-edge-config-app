import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { useState } from "react";

export default function Click() {
  const [open, setOpen] = useState(false)

  return (
    <TooltipProvider>
      <Tooltip open={open}>
        <TooltipTrigger asChild>
          <Button id="click-info-tooltip" size="icon" variant="ghost" onClick={() => setOpen(!open)}>
            <InfoCircledIcon className="w-5 h-5 text-blue-500"/>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-96">
            You can set the machine type to one of the predefined types available. <br/>
            The type will then be reflected in the list you are choosing the machine from. <br/>
            Optionally, you can provide a description for the endpoint, which would then be its display name in the list.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}