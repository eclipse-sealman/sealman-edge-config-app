import React, { useContext } from "react";
import { DeviceNatConfigRulesContext } from "./context";
import NatRule from "./NatRule";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function NatRules() {
  const { natConfig, addNatRule } = useContext(DeviceNatConfigRulesContext)

  const handleOnClick = () => {
    addNatRule({extIp: "10.0.0.1", intIp: "127.0.0.1", name:"new_rule_name"})
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <h1 className="font-bold">Rules</h1>
        <Button onClick={handleOnClick}><PlusIcon />Add a rule</Button>
      </div>
      {natConfig?.nat_rules?.map((r, i) => (
        <React.Fragment key={i}>
          <NatRule index={i} rule={r}/>
        </React.Fragment>
      ))}
    </>
  )
}
