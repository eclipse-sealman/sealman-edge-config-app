import { renderHook } from "@testing-library/react"
import { edgeApi } from "../../api"
import useGetDeviceNatConfig from "../useGetDeviceNatConfig"
import { getPath } from "@/generated/edge-administration";

describe("useGetDeviceNatConfig", () => {
  it("should fetch /{device}/smartems/config/nat", () => {
    const spyOn = vi.spyOn(edgeApi, "useQuery").mockReturnValueOnce({})

    renderHook(() => useGetDeviceNatConfig("device-id"))

    expect(spyOn).toHaveBeenCalledWith("get", getPath("/{device}/smartems/config/nat"),{
      params: {
        path: {
          device: "device-id"
        }
      }
    })
  })
})
