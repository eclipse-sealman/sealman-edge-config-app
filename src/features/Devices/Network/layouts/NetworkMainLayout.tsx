import { MobileTopBar } from "@/features/Devices/Network/components";
import MainContentContainer from "./MainContentContainer";

export default function NetworkMainLayout() {
  return (
    <div className="flex flex-col sm:flex-row h-full gap-4 bg-background">
      <div className="sm:hidden">
        <MobileTopBar/>
      </div>

      <div className="w-full h-full overflow-y-auto bg-background" id="network-machine-content">
        <MainContentContainer />
      </div>
    </div>
  )
}
