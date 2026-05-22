import { renderHook } from "@/utils/test-utils"
import { edgeApi } from "../../api"
import { usePostModuleNetDiscover } from "../usePostModuleNetDiscover"
import { createNetworkDiscoverModuleConfigV1 } from "../__mocks__/usePostModuleNetDiscover"
import { NETWORK_DISCOVER_MODULE_NAME } from "@/api/edgeConfig/moduleNames";

describe("usePostModuleTwinConfig", () => {
  it(`should send a post request with the correct parameters to /{device}/twin/config/${NETWORK_DISCOVER_MODULE_NAME}`, () => {
    const spy = vi.fn()
    vi.spyOn(edgeApi, "useMutation").mockReturnValueOnce({
      mutateAsync: spy
    })

    renderHook(async () => {
      const { PostNetDiscoverModule } = usePostModuleNetDiscover();
      PostNetDiscoverModule({
        deviceId: "deviceId",
        body: createNetworkDiscoverModuleConfigV1()
      })
    })

    expect(spy).toHaveBeenCalledWith({
      params: {
        path: {
          device: "deviceId",
        }
      },
      body: createNetworkDiscoverModuleConfigV1(),
    })
  })
})
