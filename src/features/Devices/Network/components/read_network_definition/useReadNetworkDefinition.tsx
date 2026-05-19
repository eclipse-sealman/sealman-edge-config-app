import usePostMethodToModuleDevice from "@/generated/edge-administration/hooks/methods/usePostMethodToModuleDevice"
import { CMD_PROXY_MODULE_NAME } from "@/api/edgeConfig/moduleNames"
import { getNetworkAddress } from "@/utils/IPCalculator"
import { toast } from "react-toastify"

type NMShow = {
  payload: Payload
}
type Payload = {
  network: {
    lan3: Lan
  }
}
type Lan = {
  current_ip?: string | null
  current_subnet?: string | null
  ip?: string[] | null
  subnet?: string[] | null
}
type Network = {
  address: string
  mask: number
}

export interface ReadNetworkDefinition {
  readNetwork: () => Promise<Network|undefined>
  isReading: boolean,
}


export default function useReadNetworkDefinition(deviceId: string): ReadNetworkDefinition {
  const { mutateAsync, isPending } = usePostMethodToModuleDevice()

  const readNetwork = async () => {
    const body = {
      "methodName": "nm_show",
      "methodPayload": {
        "version": "1.0"
      }
    }

    let nmShow: NMShow | undefined
    let lan3: Lan;


    try {
      nmShow = await mutateAsync({
        body,
        device: deviceId,
        module: CMD_PROXY_MODULE_NAME
      // TODO API SPEC: response body not defined in api
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    } catch(err) {
      toast.error("Read unsuccessful, is this device online?")
    }

    if (!nmShow) {
      return;
    }

    try {
      lan3 = nmShow.payload.network.lan3
    } catch (err) {
      toast.error("Error while trying to read network from LAN3.")
      return
    }

    const ipAddress = lan3.current_ip ?? lan3.ip?.[0]
    const subnet = lan3.current_subnet ?? lan3.subnet?.[0]

    if (!ipAddress) {
      toast.warning("Is lan3 cable correctly attached to the device?")
      return
    }

    try {
      if (!subnet) {
        throw new Error("Missing subnet for lan3")
      }

      const mask = Number.parseInt(subnet)
      const address = getNetworkAddress(ipAddress, mask)
      toast.success("LAN3 values have been loaded in the form.")
      return {address, mask}
    } catch (err) {
      toast.error("Failed to parse network prefix, please enter it manually.")
    }
  }

  return {
    readNetwork,
    isReading: isPending,
  }
}
