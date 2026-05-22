import { useSearchParams } from "react-router-dom";
import { useDisplayTopologyStore, useNetworkPageStore } from "./stores";
import { useEffect, useRef } from "react";
interface useHandleSelectedEndpoint {
  handleSelectEndpoint: (ip: string) => void
}

export function useHandleSelectedEndpoint(): useHandleSelectedEndpoint {
  const displayTopology = useDisplayTopologyStore(s => s.displayTopology)
  const displayEdgeDevice = useNetworkPageStore(s => s.displayEdgeDevice)
  const setDisplayEdgeDevice = useNetworkPageStore(s => s.setDisplayEdgeDevice)
  const setDisplayTopology = useDisplayTopologyStore(s => s.setDisplayTopology)

  const [searchParams, setSearchParams] = useSearchParams();

  const setSelectedEndpointIp = useNetworkPageStore(s => s.setSelectedEndpointIp)

  const endpointIpParam = searchParams.get("endpointIp")

  useEffect(() => {
    if (endpointIpParam) {
      setDisplayEdgeDevice(false)
      setDisplayTopology(false)
      setSelectedEndpointIp(endpointIpParam)
    }
  }, [endpointIpParam, setSelectedEndpointIp, setDisplayEdgeDevice, setDisplayTopology])

  const isFirstRun = useRef(true)
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    if (displayTopology || displayEdgeDevice) {
      setSelectedEndpointIp(undefined)
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.delete("endpointIp")
        return next
      }, { replace: true })
    }
  }, [displayTopology, displayEdgeDevice, setSelectedEndpointIp, setSearchParams])

  return {
    handleSelectEndpoint: (ip) => {
      setSelectedEndpointIp(ip)
      setSearchParams({ endpointIp: ip }, { replace: false });
      setDisplayEdgeDevice(false)
      setDisplayTopology(false)
    }
  }
}
