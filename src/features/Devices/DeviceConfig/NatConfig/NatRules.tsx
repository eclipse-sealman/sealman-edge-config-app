import React, { useContext } from "react";
import { DeviceNatConfigRulesContext } from "./context";
import NatRule from "./NatRule";
import Button from "@/components/Input/Button";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function NatRules() {
  const { natConfig, addNatRule } = useContext(DeviceNatConfigRulesContext)

  const handleOnClick = () => {
    addNatRule({extIp: "10.0.0.1", intIp: "127.0.0.1", name:"new_rule_name"})
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="font-semibold">Rules</span>
        <Button onClick={handleOnClick}><PlusIcon className="mr-2 w-5 h-5"/>Add a rule</Button>
      </div>
      {natConfig?.nat_rules?.map((r, i) => (
        <React.Fragment key={i}>
          <NatRule index={i} rule={r}/>
        </React.Fragment>
      ))}
    </>
  )
}
