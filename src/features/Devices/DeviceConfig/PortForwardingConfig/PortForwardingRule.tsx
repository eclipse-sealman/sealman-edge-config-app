import { useContext, useState } from "react";
import { PortForwardingContext } from "./context";
import { Input } from "@/components/Input/FormElements";
import type { PortForwardingRule as Rule } from "./types";
import { isValidIP } from "@/lib/validateIP";
import { TrashIcon } from "@heroicons/react/24/outline";
import Button, { ButtonColor } from "@/components/Input/Button";
import { parseRuleName } from "@/utils/parseRuleName";



const INTERFACE_OPTIONS = [
  { label: "LAN1", value: "lan1" },
  { label: "LAN2", value: "lan2" },
  { label: "LAN3", value: "lan3" },
] as const;

export default function PortForwardingRule({
  index,
  rule,
}: {
  index: number;
  rule: Rule;
}) {
  const ctx = useContext(PortForwardingContext);
  const [nameError, setNameError] = useState<string | null>(null);
  
const isInvalidDestAddr = !!rule.destAddr && !isValidIP(String(rule.destAddr).trim());


  if (!ctx) return null;

  const { updateRule, deleteRule } = ctx;

  const onChange = <K extends keyof Rule>(key: K, value: Rule[K]) => {
    if (key === "name") {
      const { value: parsed, error } = parseRuleName(value as string);
      setNameError(error);
      updateRule(index, { ...rule, name: error ? (value as string) : parsed });
    } else {
      updateRule(index, { ...rule, [key]: value });
    }
  };

  return (
    <div className="flex gap-4 mb-2 items-center">
      <div className="flex flex-col">
        <label className="text-xs font-medium mb-1">Name</label>
        <Input
          value={rule.name}
          className={nameError ? "border border-red-500" : undefined}
          onChange={(e) => onChange("name", e.target.value)}
        />
        {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
      </div>

      
 <div className="flex flex-col">
        <label className="text-xs font-medium mb-1">Interface</label>
        <select
          className="border rounded px-5"
          value={rule.interface ?? ""}
          onChange={(e) =>
            onChange("interface", e.target.value as Rule["interface"])
          }
        >
          <option value="" disabled>
            Select
          </option>
          {INTERFACE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>


      <div className="flex flex-col">
        <label className="text-xs font-medium mb-1">Source Port</label>
        <Input
          type="number"
          value={rule.srcPort}
          onChange={(e) => onChange("srcPort", e.target.value === "" ? undefined : Number(e.target.value))}
        />
      </div>
  
 
<div className="flex flex-col">
  <label className="text-xs font-medium mb-1">Destination Address</label>
  <Input
    value={rule.destAddr ?? ""}
    onChange={(e) => onChange("destAddr", e.target.value as typeof rule.destAddr)}
    inputMode="numeric"
    placeholder="e.g. 192.168.1.100"
    className={isInvalidDestAddr ? "border-red-500 focus:ring-red-400" : undefined}
    aria-invalid={isInvalidDestAddr} 
  />
</div>



      <div className="flex flex-col">
        <label className="text-xs font-medium mb-1">Destination Port</label>
        <Input
          type="number"
          value={rule.destPort}
          onChange={(e) => onChange("destPort", e.target.value === "" ? undefined : Number(e.target.value))}
        />
      </div>
      <div className="mt-5">

      <Button color={ButtonColor.Red } className="whitespace-nowrap" onClick={() => deleteRule(index)}>
         <span className="mr-2">Delete</span> <TrashIcon className="w-7 h-7 cursor-pointer"/>
      </Button>

      </div>
    </div>
  );
}