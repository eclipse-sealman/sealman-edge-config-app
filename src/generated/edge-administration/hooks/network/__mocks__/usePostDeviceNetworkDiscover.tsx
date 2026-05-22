import { ScanResult } from "@/api/edgeConfig/networkDiscover/networkDiscoverInterfaces"

export const mutateAsync = vi.fn()

export const createScanResult = (p?: Partial<ScanResult>): ScanResult => ({
  ip: "",
  ports: {},
  status: "offline",
  lastStatusChange: "",
  ...p
})

export default function mocked() {
  return  {
    mutateAsync,
    isPending: false
  }
}
