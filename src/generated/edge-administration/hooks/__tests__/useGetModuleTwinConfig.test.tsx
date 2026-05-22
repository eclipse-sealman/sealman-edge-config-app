import { renderHook } from "@testing-library/react"
import { edgeApi } from "../../api"
import { getPath } from "@/generated/edge-administration";
import useGetModuleTwinConfig from "../useGetModuleTwinConfig";
import { NETWORK_DISCOVER_MODULE_NAME } from "@/api/edgeConfig/moduleNames";

describe("useGetModuleTwinConfig", () => {
  it(`should fetch /{device}/twin/config/${NETWORK_DISCOVER_MODULE_NAME}`, () => {
    const spyOn = vi.spyOn(edgeApi, "useQuery").mockReturnValueOnce({})

    renderHook(() => useGetModuleTwinConfig("device-id", NETWORK_DISCOVER_MODULE_NAME))

    expect(spyOn).toHaveBeenCalledWith("get", getPath("/{device}/twin/config/{module}"),{
      params: {
        path: {
          device: "device-id",
          module: NETWORK_DISCOVER_MODULE_NAME 
        }
      }
    })
  })
})
