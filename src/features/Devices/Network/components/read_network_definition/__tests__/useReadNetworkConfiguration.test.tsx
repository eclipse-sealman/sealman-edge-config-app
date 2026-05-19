import { useMutationMocked } from "@/generated/edge-administration/hooks/methods/__mocks__/usePostMethodToModuleDevice"
import { CMD_PROXY_MODULE_NAME } from "@/api/edgeConfig/moduleNames"
import useReadNetworkDefinition from "../useReadNetworkDefinition"
import { act, renderHook } from "@testing-library/react"
import { toast } from "react-toastify"

vi.mock("@/generated/edge-administration/hooks/methods/usePostMethodToModuleDevice")

describe("useReadNetworkConfiguration", () => {
  suite("read network", () => {
    it(`should send a nm_show with usePostMethodToModuleDevice to ${CMD_PROXY_MODULE_NAME}`, () => {
      const { result } = renderHook(() => useReadNetworkDefinition("deviceId"))

      act(() => {
        result.current.readNetwork()
      })

      expect(useMutationMocked).toHaveBeenCalledWith({
        device: "deviceId",
        module: CMD_PROXY_MODULE_NAME,
        body: {
        "methodName": "nm_show",
        "methodPayload": {
          "version": "1.0"
          }
        }
      })
    })

    it("should toast error if nm_show is undefined after read", async () => {
      const { result } = renderHook(() => useReadNetworkDefinition("deviceId"))
      const spyError = vi.spyOn(toast, "error")

      useMutationMocked.mockRejectedValueOnce(new Error())

      const nmShow = await result.current.readNetwork()

      expect(nmShow).toBeUndefined()
      expect(spyError).toHaveBeenCalled()
    })

    it("should toast an error if lan3 is undefined in the response", async () => {
      useMutationMocked.mockResolvedValue({
        payload: {network: {lan3: {}}}
      })
      const spyToast = vi.spyOn(toast, "warning").mockImplementationOnce(() => "")

      const { result }  = renderHook(() => useReadNetworkDefinition("testID"))
      await result.current.readNetwork()

      expect(spyToast).toHaveBeenCalledWith("Is lan3 cable correctly attached to the device?")
    })

    it("should toast success when LAN3 values are read and parsed", async () => {
      useMutationMocked.mockResolvedValue({
        payload: {
          network: {
            lan3: {
              current_ip: "192.168.1.20",
              current_subnet: "24"
            }
          }
        }
      })
      const spySuccess = vi.spyOn(toast, "success")

      const { result } = renderHook(() => useReadNetworkDefinition("testID"))
      const network = await result.current.readNetwork()

      expect(network).toEqual({ address: "192.168.1.0", mask: 24 })
      expect(spySuccess).toHaveBeenCalledWith("LAN3 values have been loaded in the form.")
    })
  })
})
