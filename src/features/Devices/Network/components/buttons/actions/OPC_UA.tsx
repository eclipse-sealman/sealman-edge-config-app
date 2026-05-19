import { Button } from "@/components/ui/button";
import { createSearchParams, useNavigate } from "react-router-dom";
import { useNetworkPageStore } from "@/features/Devices/Network/stores"

interface props {
  disabled?: boolean;
}

export default function OPC_UA({disabled=true}: props) {
  const navigate = useNavigate();
  const selectedEndpointIp = useNetworkPageStore(s => s.selectedEndpointIp)

  const handleOnClick = () => {
    navigate({
      pathname: "../opcua",
      search: `?${createSearchParams({
        endpoint: `opc.tcp://${selectedEndpointIp}:4840`,
      })}`,
    })
  }

  return (
    <Button variant="outline" onClick={handleOnClick} disabled={ disabled } >
      Browse
    </Button>
  )
}
