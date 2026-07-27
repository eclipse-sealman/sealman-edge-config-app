import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useDisplayTopologyStore, useNetworkPageStore } from "../stores"
import Topology from "../Topology/Topology"
import EdgeDeviceContentContainer from "./edge_device/EdgeDeviceContentContainer"
import { EndpointContentContainer } from "./EndpointContent"
import { SetupCard } from "./set_up_network_scan"
import { OverviewContentContainer } from "./overview"

export default function MainContentContainer() {
  const displayTopology = useDisplayTopologyStore(s => s.displayTopology)
  const displayEdgeDevice = useNetworkPageStore(s => s.displayEdgeDevice)
  const selectedEndpointIp = useNetworkPageStore((s) => s.selectedEndpointIp);
  const displayNetworkScanSetup = useNetworkPageStore(s => s.displayNetworkScanSetup)
  const displayOverview = useNetworkPageStore(s => s.displayOverview)
  const setDisplayOverview = useNetworkPageStore(s => s.setDisplayOverview)

  // Read URL param synchronously (not deferred) so we don't depend on Zustand being synced yet.
  // useSearchParams() in RR v7 lags behind the browser URL during startTransition; reading
  // searchParams.get() here is fine because this component re-renders whenever the router
  // state commits, at which point we get the correct value.
  const [searchParams] = useSearchParams()
  const hasEndpointIpParam = !!searchParams.get("endpointIp")

  const showDefault = !selectedEndpointIp && !hasEndpointIpParam && !displayEdgeDevice && !displayNetworkScanSetup && !displayTopology && !displayOverview

  useEffect(() => {
    if (showDefault) {
      setDisplayOverview(true)
    }
  }, [showDefault, setDisplayOverview])

  if (selectedEndpointIp || hasEndpointIpParam) return <EndpointContentContainer />
  if (displayOverview) return <OverviewContentContainer />
  if (displayEdgeDevice) return <EdgeDeviceContentContainer />
  if (displayNetworkScanSetup) return <SetupCard />
  if (displayTopology) return <Topology />

  return <OverviewContentContainer />
}

