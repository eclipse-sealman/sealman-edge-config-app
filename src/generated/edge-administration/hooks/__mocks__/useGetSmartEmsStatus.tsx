import { UseQueryResult } from "@tanstack/react-query"
import { components } from "../../types"

const data: components["schemas"]["SemsFirmwareStatus"] = {
  "deviceFirmwareVersion": "1.4.0",
  "deviceEnabled": false,
  "deviceTemplate": "dolore quis cillum laborum",
  "deviceLastSeen": "cillum id",
  "deviceHardwareVersion": "occaecat",
  "firmwareUpdateScheduled": true,
  "configUpdateScheduled": false,
  "edgeCommandStatus": [
    {
      "cmdName": "ad",
      "status": "expired",
      "created": "adipisicing consectetur velit mollit dolor",
      "updated": "sed"
    },
  ]
}

const useGetSmartEmsStatusMocked = vi.fn(() => {
  return {
    data
  } as Partial<UseQueryResult<typeof data>>
})

export default useGetSmartEmsStatusMocked
