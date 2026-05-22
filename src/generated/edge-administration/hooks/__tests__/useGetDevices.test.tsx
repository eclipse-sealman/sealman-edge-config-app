import { renderHook } from "@testing-library/react";
import { edgeApi } from "../../api";
import useGetDevices from "../useGetDevices/useGetDevices";
import { getPath } from "@/generated/edge-administration";

describe("useGetDevices", () => {
  it("should fetch /devices", () => {
    const spyOn = vi.spyOn(edgeApi, "useQuery").mockReturnValueOnce({});

    renderHook(() => useGetDevices());

    expect(spyOn).toHaveBeenCalledWith(
      "get",
      getPath("/devices"),
      {},
      expect.objectContaining({
        queryKey: ["get", "/devices", "withCountryData"],
      })
    );
  });
});
