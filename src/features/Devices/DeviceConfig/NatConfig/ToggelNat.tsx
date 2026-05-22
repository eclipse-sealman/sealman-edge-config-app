import { useContext } from "react";
import { DeviceNatConfigRulesContext } from "./context";

export default function ToggleNat() {
  const { toggleNat, natConfig } = useContext(DeviceNatConfigRulesContext)
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="enable-config-nat" className="cursor-pointer">Enable nat configuration</label>
      <input type="checkbox" id="enable-config-nat" checked={natConfig?.nat_enabled ?? false} onChange={toggleNat} className="cursor-pointer"/>
    </div>
  )
}
