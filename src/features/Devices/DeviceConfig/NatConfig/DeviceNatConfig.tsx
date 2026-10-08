import NatConfigHeader from "./NatConfigHeader";
import NatRules from "./NatRules";
import SaveNat from "./SaveNatConfig";


export default function DeviceNatConfig() {

  return (
    <NatConfigHeader>
      <NatRules />
      <SaveNat />
    </NatConfigHeader>
  )
}
