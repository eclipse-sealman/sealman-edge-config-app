import { MobileTopBar } from "@/features/Devices/Network/components";
import { EndpointSidebar } from "@/features/Devices/Network/layouts";
import { useDisplayTopologyStore, useNetworkPageStore } from "../stores";
import MainContentContainer from "./MainContentContainer";
import { SidebarNavButton } from "../components/sidebar/SidebarNavButton";

export default function NetworkMainLayout() {
  const displayTopology = useDisplayTopologyStore(s => s.displayTopology)
  const setDisplayTopology = useDisplayTopologyStore(s => s.setDisplayTopology)
  const displayEdgeDevice = useNetworkPageStore(s => s.displayEdgeDevice)
  const setDisplayEdgeDevice = useNetworkPageStore(s => s.setDisplayEdgeDevice)
  const displayOverview = useNetworkPageStore(s => s.displayOverview)
  const setDisplayOverview = useNetworkPageStore(s => s.setDisplayOverview)

  function handleOverviewClick(): void {
    setDisplayOverview(!displayOverview)
    setDisplayEdgeDevice(false)
    setDisplayTopology(false)
  }

  function handleTopologyClick(): void {
    setDisplayTopology(!displayTopology)
    setDisplayEdgeDevice(false)
    setDisplayOverview(false)
  }

  function handleEdgeDeviceClick(): void {
    setDisplayEdgeDevice(!displayEdgeDevice)
    setDisplayTopology(false)
    setDisplayOverview(false)
  }

  return (
    <div className="flex flex-col sm:flex-row h-full gap-4 bg-background">
      <div className="sm:hidden">
        <MobileTopBar/>
      </div>

        <div id="network-list-container" className="hidden sm:block sm:w-1/4 h-full overflow-y-auto">
          <SidebarNavButton
            label="Endpoints & Services"
            active={displayOverview}
            onClick={() => handleOverviewClick()}
          />
          <SidebarNavButton
            label="Edge Device"
            active={displayEdgeDevice}
            onClick={() => handleEdgeDeviceClick()}
          />
          <SidebarNavButton
            label="Topology"
            active={displayTopology}
            onClick={() => handleTopologyClick()}
          />

          {/* This panel (search, endpoint list, scan settings) is only relevant alongside the
              Topology canvas - Endpoints & Services already shows everything it needs on its own. */}
          {displayTopology && <EndpointSidebar />}

        </div>

      <div className="w-full sm:w-3/4 h-full overflow-y-auto bg-background" id="network-machine-content">
        <MainContentContainer />
      </div>
    </div>
  )
}
