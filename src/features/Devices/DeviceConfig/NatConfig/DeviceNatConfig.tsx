import NatConfigHeader from "./NatConfigHeader";
import NatRules from "./NatRules";
import SaveNat from "./SaveNatConfig";
import ToggleNat from "./ToggelNat";


export default function DeviceNatConfig() {

  return (
    <>
      <NatConfigHeader>
        <ToggleNat />
        <NatRules />
        <SaveNat />
      </NatConfigHeader>
      <div className="mb-8"/>
    </>
  )
}
