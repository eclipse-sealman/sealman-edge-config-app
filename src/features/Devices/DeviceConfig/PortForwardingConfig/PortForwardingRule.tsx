import { useContext, useState } from "react";
import { PortForwardingContext } from "./context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PortForwardingRule as Rule } from "./types";
import { isValidIP } from "@/lib/validateIP";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
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
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Name</Label>
        <Input
          value={rule.name}
          className={nameError ? "border-red-500" : undefined}
          onChange={(e) => onChange("name", e.target.value)}
        />
        {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Interface</Label>
        <Select
          value={rule.interface ?? ""}
          onValueChange={(value) => onChange("interface", value as Rule["interface"])}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {INTERFACE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Source Port</Label>
        <Input
          type="number"
          value={rule.srcPort}
          onChange={(e) => onChange("srcPort", e.target.value === "" ? undefined : Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Destination Address</Label>
        <Input
          value={rule.destAddr ?? ""}
          onChange={(e) => onChange("destAddr", e.target.value as typeof rule.destAddr)}
          inputMode="numeric"
          placeholder="e.g. 192.168.1.100"
          className={isInvalidDestAddr ? "border-red-500" : undefined}
          aria-invalid={isInvalidDestAddr}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Destination Port</Label>
        <Input
          type="number"
          value={rule.destPort}
          onChange={(e) => onChange("destPort", e.target.value === "" ? undefined : Number(e.target.value))}
        />
      </div>
      <div className="mt-6">
        <Button variant="destructive" onClick={() => deleteRule(index)}>
          Delete <TrashIcon />
        </Button>
      </div>
    </div>
  );
}