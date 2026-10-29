import { useContext } from "react"
import { DeviceNatConfigRulesContext } from "./context"
import { TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";


export function DeleteNatRule({index}: {index: number}) {
  const { deleteRule }  = useContext(DeviceNatConfigRulesContext)

  const handleOnClick = () => {
    deleteRule(index)
  }

  return (
    <Button variant="destructive" onClick={handleOnClick}>
      Delete rule <TrashIcon />
    </Button>
  )
}
