import { renderHook } from "@testing-library/react"
import { edgeApi } from "../../api"
import { getPath } from "@/generated/edge-administration";
import useGetNetworkTopology from "../useGetNetworkTopology";

describe("useGetNetworkTopology", () => {
  it("should fetch /{device}/network/topology", () => {
    const spyOn = vi.spyOn(edgeApi, "useQuery").mockReturnValueOnce({})

    renderHook(() => useGetNetworkTopology("device-id"))

    expect(spyOn).toHaveBeenCalledWith("get", getPath("/{device}/network/topology"),{
      params: {
        path: {
          device: "device-id"
        }
      }
    })
  })
})
