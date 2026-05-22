import { UseQueryResult } from "@tanstack/react-query"
import { components } from "../../types"

const data: components["schemas"]["NatConfig"] = {
  "nat_enabled": false,
  "nat_rules": [
    {
      "name": "n",
      "extIp": "8.251.05.27",
      "intIp": "241.9.226.209"
    },
    {
      "name": "dZR0I8l",
      "extIp": "255.75.228.254",
      "intIp": "253.192.132.51"
    },
  ]
}

const useGetDeviceNatConfigMocked = vi.fn(() => {
  return {
    data
  } as Partial<UseQueryResult<typeof data>>
})

export default useGetDeviceNatConfigMocked
