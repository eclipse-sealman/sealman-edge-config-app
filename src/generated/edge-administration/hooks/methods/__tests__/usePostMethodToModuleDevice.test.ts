import { edgeApi } from "@/generated/edge-administration/api"
import { renderHook } from "@testing-library/react"
import usePostMethodToModuleDevice from "../usePostMethodToModuleDevice"

describe("usePostMethodToModuleDevice", () => {
  it("should send a post request with deviceId module name and body given as parameters",async () => {
    const spy = vi.fn()
    vi.spyOn(edgeApi,"useMutation").mockReturnValueOnce({
      mutateAsync: spy
    })

    const { result } = renderHook(() => usePostMethodToModuleDevice())

    await result.current.mutateAsync(
      {
        device: "myDevice",
        module: "myModule",
        body: {
          methodName: "foo",
          methodPayload: {
            bar: ""
          }
        }
      }
    )

    expect(spy).toHaveBeenCalledWith({
      params: {
        path: {
          device: "myDevice",
          module: "myModule"
        },
      },
      body: {
        methodName: "foo",
        methodPayload: {
          bar: ""
        }
      }
    })
  })
})
