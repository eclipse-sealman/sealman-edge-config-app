import { DeviceNatConfigRulesContext } from "./context"
import useDeviceNatConfigContext from "./useContext"

interface props {
  deviceId: string
  children: React.ReactNode
}

export default function DeviceNatconfigRulesProvider({
  deviceId,
  children,
}: props) {
  const providerValue = useDeviceNatConfigContext(deviceId)

  return (
    <DeviceNatConfigRulesContext.Provider value={providerValue}>
      {children}
    </DeviceNatConfigRulesContext.Provider>
  )
}
