import { renderHook } from "@/utils/test-utils";
import { edgeApi } from "../../api";
import { usePostSmartEmsSecret } from "../usePostSmartEmsSecret";

describe("usePostSmartEmsSecret", () => {
  it("should send a post request with the correct parameters", () => {
    const spy = vi.fn();
    vi.spyOn(edgeApi, "useMutation").mockReturnValueOnce({
      mutateAsync: spy,
    });

    renderHook(async () => {
      const { postDeviceSmartEmsSecret } = usePostSmartEmsSecret();

      postDeviceSmartEmsSecret({
        deviceId: "22016270",
        onSuccess: () => {},
      });
    });

    expect(spy).toHaveBeenCalledWith(
      {
        params: {
          path: {
            device: "22016270",
          },
        },
      },
      {
        onSuccess: expect.any(Function),
      }
    );
  });
});
