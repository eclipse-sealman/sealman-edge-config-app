import { renderHook } from "@testing-library/react"
import { edgeApi } from "../../api"
import { getPath } from "@/generated/edge-administration";
import useGetSmartEmsStatus from "../useGetSmartEmsStatus";

describe("getSmartEmsStatus", () => {
  it("should fetch /{device}/smartems/status", () => {
    const spyOn = vi.spyOn(edgeApi, "useQuery").mockReturnValueOnce({})

    renderHook(() => useGetSmartEmsStatus("device-id", {
      refetchInterval: 3000,
    }))

    expect(spyOn).toHaveBeenCalledWith("get", getPath("/{device}/smartems/status"),{
      params: {
        path: {
          device: "device-id"
        }
      },
      refetchInterval: 3000
    })
  })
})
