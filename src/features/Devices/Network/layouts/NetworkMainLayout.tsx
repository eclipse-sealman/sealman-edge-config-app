import { OverviewContentContainer } from "./overview"

// Only "Endpoints & Services" remains; Edge Device and Topology views are no longer reachable from the UI.
export default function NetworkMainLayout() {
  return (
    <div className="h-full overflow-y-auto bg-background" id="network-machine-content">
      <OverviewContentContainer />
    </div>
  )
}
