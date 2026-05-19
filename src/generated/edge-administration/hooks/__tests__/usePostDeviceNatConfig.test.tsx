import { renderHook } from "@/utils/test-utils"
import { edgeApi } from "../../api"
import { usePostDeviceNatConfig } from "../usePostDeviceNatConfig"

describe("usePostDeviceNatConfig", () => {
  it("should send a post request with the correct parameters to /{device}/smartems/config/nat", () => {
    const spy = vi.fn()
    vi.spyOn(edgeApi, "useMutation").mockReturnValueOnce({
      mutateAsync: spy
    })

    renderHook(async () => {
      const { postDeviceNatConfig } = usePostDeviceNatConfig();
      postDeviceNatConfig({
        deviceId: "deviceId",
        body: {
          nat_enabled: true,
          nat_rules: [
            {
              extIp: "1",
              intIp: "2",
              name: "3"
            }
          ]
        }
      })
    })

    expect(spy).toHaveBeenCalledWith({
      params: {
        path: {
          device: "deviceId"
        }
      },
      body: {
        nat_enabled: true,
        nat_rules: [
          {
            extIp: "1",
            intIp: "2",
            name: "3"
          }
        ]
      },
    })
  })
})
