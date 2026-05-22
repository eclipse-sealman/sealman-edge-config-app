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

  const Header = ({ msg }: {msg?: string}) => {
    return (
      <>
        <Heading processing={isLoading}>
          <WrenchScrewdriverIcon className="w-7 h-7 mr-1" />
          <span className="mr-4">1:1 NAT Configuration</span>
        </Heading>
        <p className="m-4">
          {msg}
        </p>
      </>
    )
  }

  if (isLoading) {
    return (
      <Header msg="Loading..."/>
    )
  }

  // TODO: If error is needed
  // if (status === "error") {
  //   return (
  //     <Header msg="Something went wrong please contact support"/>
  //   )
  // }

  if (!elligible) {
    return (
      <Header msg="Your firmware version is not compatible for 1:1 NAT Configuration" />
    )
  }

  return (
    <>
      <Header />
      {children}
    </>
  )
}
