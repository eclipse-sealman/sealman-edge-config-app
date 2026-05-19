import { edgeApi } from "@/generated/edge-administration/api"
import { renderHook } from "@testing-library/react"
import usePostDeviceNetworkDiscover from "../usePostDeviceNetworkDiscover"

describe("usePostDeviceNetworkDiscover", () => {
  it("should call mutateAsync with the correct parameters", async () => {
    const spy = vi.fn()
    vi.spyOn(edgeApi, "useMutation").mockReturnValueOnce({
      mutateAsync: spy
    })

    const { result } = renderHook(() => usePostDeviceNetworkDiscover())

    await result.current.mutateAsync({
      deviceId: "my device",
      body: {
        networkDefinition: "network",
        ports: [1,2,3],
        subnetMask: 10
      }
    })

    expect(spy).toHaveBeenCalledWith({
      body: {
        networkDefinition: "network",
        ports: [1,2,3],
        subnetMask: 10
      },
      params: {
        path: {
          device: "my device"
        }
      }
    })
  })
})
