import { MobileTopBar } from "@/features/Devices/Network/components";
import { EndpointSidebar } from "@/features/Devices/Network/layouts";
import { Status, useDisplayTopologyStore, useNetworkPageStore, useTwinConfigStore } from "../stores";
import MainContentContainer from "./MainContentContainer";
import { SidebarNavButton } from "../components/sidebar/SidebarNavButton";

export default function NetworkMainLayout() {
  const displayTopology = useDisplayTopologyStore(s => s.displayTopology)
  const setDisplayTopology = useDisplayTopologyStore(s => s.setDisplayTopology)
  const displayEdgeDevice = useNetworkPageStore(s => s.displayEdgeDevice)
  const setDisplayEdgeDevice = useNetworkPageStore(s => s.setDisplayEdgeDevice)
  const displayNetworkScanSetup = useNetworkPageStore(s => s.displayNetworkScanSetup)
  const setDisplayNetworkScanSetup = useNetworkPageStore(s => s.setDisplayNetworkScanSetup)
  const displayOverview = useNetworkPageStore(s => s.displayOverview)
  const setDisplayOverview = useNetworkPageStore(s => s.setDisplayOverview)

  const status = useTwinConfigStore(s => s.status)

  function handleOverviewClick(): void {
    setDisplayOverview(!displayOverview)
    setDisplayEdgeDevice(false)
    setDisplayTopology(false)
    setDisplayNetworkScanSetup(false)
  }

  // @ts-ignore TS6133: kept for future re-enable of Topology Viewer
  function handleTopologyClick(): void {
    setDisplayTopology(!displayTopology)
    setDisplayEdgeDevice(false)
    setDisplayNetworkScanSetup(false)
    setDisplayOverview(false)
  }

  function handleEdgeDeviceClick(): void {
    setDisplayEdgeDevice(!displayEdgeDevice)
    setDisplayTopology(false)
    setDisplayNetworkScanSetup(false)
    setDisplayOverview(false)
  }


  function handleNetworkScanConfigClick(): void {
    setDisplayNetworkScanSetup(!displayNetworkScanSetup)
    setDisplayEdgeDevice(false)
    setDisplayTopology(false)
    setDisplayOverview(false)
  }

  return (
    <div className="flex flex-col sm:flex-row h-full gap-4">
      <div className="sm:hidden">
        <MobileTopBar/>
      </div>

        <div id="network-list-container" className="hidden sm:block sm:w-1/4 h-full">
          <SidebarNavButton
            label="Overview"
            active={displayOverview}
            onClick={() => handleOverviewClick()}
          />
          <SidebarNavButton
            label="Edge Device"
            active={displayEdgeDevice}
            onClick={() => handleEdgeDeviceClick()}
          />
          {/* <SidebarNavButton
            label="Topology Viewer"
            active={displayTopology}
            onClick={() => handleTopologyClick()}
          /> */}

          {status == Status.Default ? <SidebarNavButton label="Configure Network Scan" active={displayNetworkScanSetup} onClick={handleNetworkScanConfigClick} /> : <EndpointSidebar />}

        </div>

      <div className="w-full sm:w-3/4 h-[calc(100%-56px)]" id="network-machine-content">
        <MainContentContainer />
      </div>
    </div>
  )
}