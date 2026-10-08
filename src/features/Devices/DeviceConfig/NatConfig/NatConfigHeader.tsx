import { Heading } from "@/components/Typography/Heading";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { useContext, useMemo } from "react";
import { DeviceNatConfigRulesContext } from "./context";
import isVersionEligible from "@/utils/isVersionEligible";

interface props {
  children?: React.ReactNode
}

export default function NatConfigHeader({children}: props) {
  const { isLoading, smartEmsData } = useContext(DeviceNatConfigRulesContext)
  const elligible = useMemo(() => isVersionEligible(
    smartEmsData?.deviceFirmwareVersion ?? "", "1.6.0"),
  [smartEmsData?.deviceFirmwareVersion])

  const Header = ({ children: body }: { children: React.ReactNode }) => {
    return (
      <div>
        <Heading processing={isLoading} description="Map external IP addresses to internal ones on the Smart-EMS.">
          <WrenchScrewdriverIcon className="w-5 h-5" />
          1:1 NAT Configuration
        </Heading>
        <div className="bg-card border rounded-lg p-4">{body}</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Header><p className="text-sm text-muted-foreground">Loading...</p></Header>
    )
  }

  if (!elligible) {
    return (
      <Header><p className="text-sm text-muted-foreground">Your firmware version is not compatible for 1:1 NAT Configuration</p></Header>
    )
  }

  return (
    <Header>
      <div className="space-y-4">{children}</div>
    </Header>
  )
}
