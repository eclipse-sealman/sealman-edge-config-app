import { Input } from "@/components/Input/FormElements";
import { components } from "@/generated/edge-administration/types";
import { useState, useContext } from "react";
import { DeviceNatConfigRulesContext } from "./context";
import { DeleteNatRule } from "./DeleteNatRule";
import { parseRuleName } from "@/utils/parseRuleName";

export default function NatRule({ index, rule }: {index: number, rule: components["schemas"]["NatRule"]}) {
  const { updateRule }  = useContext(DeviceNatConfigRulesContext)
  const [nameError, setNameError] = useState<string | null>(null)

  const handleOnChange = ({name, value}: {name: keyof components["schemas"]["NatRule"], value: string}) => {
    if (name === "name") {
      const { value: parsed, error } = parseRuleName(value)
      setNameError(error)
      updateRule({
        index,
        rule: {
          ...rule,
          name: error ? value : parsed,
        }
      })
    } else {
      updateRule({
        index,
        rule: {
          ...rule,
          [name]: value
        }
      })
    }
  }

  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
      <div className="block sm:hidden border-t border-gray-300 my-2 w-full"></div>
      <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-2 w-full">
        <label htmlFor={`name-${index}`} className="lg:w-2/5">Name:</label>
        <div className="w-full">
          <Input
            id={`name-${index}`}
            value={rule.name}
            className={`w-full${nameError ? " border border-red-500" : ""}`}
            onChange={e => handleOnChange({
              name: "name",
              value: (e.target as HTMLInputElement).value
            })}
          />
          {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
        </div>
      </div>
      <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-2 w-full">
        <label htmlFor={`extIp-${index}`} className="lg:w-2/5">External IP:</label>
        <Input id={`extIp-${index}`} value={rule.extIp} className="w-full" onChange={e => handleOnChange({
          name: "extIp",
          value: (e.target as HTMLInputElement).value
        })}/>
      </div>
      <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-2 w-full">
        <label htmlFor={`intIp-${index}`} className="lg:w-2/5">Internal IP:</label>
        <Input id={`intIp-${index}`} value={rule.intIp} className="w-full" onChange={e => handleOnChange({
          name: "intIp",
          value: (e.target as HTMLInputElement).value
        })}/>
      </div>
      <DeleteNatRule index={index}/>
    </div>
  )
}
