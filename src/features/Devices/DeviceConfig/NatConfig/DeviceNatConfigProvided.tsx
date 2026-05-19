import { useParams } from "react-router-dom";
import DeviceNatConfig from "./DeviceNatConfig";
import DeviceNatConfigRulesProvider from "./provider";

export default function DeviceNatConfigProvided() {
  const { deviceId } = useParams();

  if (!deviceId) {
    return <p>Component needs a deviceId</p>
  }

  return (
    <DeviceNatConfigRulesProvider deviceId={deviceId}>
      <DeviceNatConfig />
    </DeviceNatConfigRulesProvider>
  )
}
