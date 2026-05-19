import { useContext } from "react"
import { DeviceNatConfigRulesContext } from "./context"
import { TrashIcon } from "@heroicons/react/24/outline";
import Button, { ButtonColor } from "@/components/Input/Button";


export function DeleteNatRule({index}: {index: number}) {
  const { deleteRule }  = useContext(DeviceNatConfigRulesContext)

  const handleOnClick = () => {
    deleteRule(index)
  }

  return (
    <Button color={ButtonColor.Red } className="whitespace-nowrap" onClick={handleOnClick}>
      <span className="mr-2">Delete rule</span> <TrashIcon className="w-7 h-7 cursor-pointer"/>
    </Button>
  )
}
