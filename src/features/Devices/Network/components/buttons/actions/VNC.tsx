import { Button } from "@/components/ui/button";
import { createSearchParams, useNavigate } from "react-router-dom";
import { useNetworkPageStore } from "@/features/Devices/Network/stores"

interface props {
  disabled?: boolean
}

export default function VNC({ disabled = true }: props) {
  const navigate = useNavigate()
  const selectedEndpointIp = useNetworkPageStore(s => s.selectedEndpointIp)

  const handleOnClick = () => {
    navigate({
      pathname: "../webvnc",
      search: `?${createSearchParams({
        endpoint: `${selectedEndpointIp}`,
      })}`,
    })
  }

  return (
    <>
      <Button variant="outline" onClick={handleOnClick} disabled={ disabled }>
        Connect
      </Button>
    </>
  )
}
