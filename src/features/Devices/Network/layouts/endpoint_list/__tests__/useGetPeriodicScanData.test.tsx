import useGetNetworkTopologyMocked, { createMockedData, createMockedScanResult } from "@/generated/edge-administration/hooks/__mocks__/useGetNetworkTopology"
import { renderHook } from "@testing-library/react"
import { useGetPeriodicScanData } from "../useGetPeriodicScanData"

vi.mock("@/generated/edge-administration/hooks/useGetNetworkTopology")

describe("useGetPeriodicScanData", () => {
  it("should refetch every 2 seconds for 10 seconds if data is null", async () => {
    vi.useFakeTimers()

    const refetchMocked = vi.fn()

    useGetNetworkTopologyMocked.mockReturnValueOnce({
      data: null,
      refetch: refetchMocked
    })

    const { result } = renderHook(() => useGetPeriodicScanData("testId"))

    vi.advanceTimersByTime(11000)

    expect(refetchMocked).toHaveBeenCalledTimes(9)
    expect(result.current.isLoading).toBe(true)

    vi.useRealTimers()
    useGetNetworkTopologyMocked.mockRestore()
  })

  it("should return scan result", async () => {
    useGetNetworkTopologyMocked
      .mockReturnValue({
        data: createMockedData(
          {
            scanResults: [
              createMockedScanResult({
                ip: "testIp"
              })]
          }
        ),
      })

    const { result } = renderHook(() => useGetPeriodicScanData("testId"))

    const scanResults = result.current.scanResults

    expect(scanResults![0].ip).toBe("testIp")
    expect(result.current.isLoading).toBe(false)

    useGetNetworkTopologyMocked.mockRestore()
  })
})
