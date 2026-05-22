import { cleanup, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import RefetchPeriodicScan from "../RefetchButton"
import { toast } from "react-toastify"
import useGetNetworkTopologyMocked from "@/generated/edge-administration/hooks/__mocks__/useGetNetworkTopology"
import { useNetworkPageStore } from "@/features/Devices/Network/stores"

vi.mock("@/generated/edge-administration/hooks/useGetNetworkTopology")

describe("Refetch Button", () => {
  it("should call the refetch function on click then toast success", async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    const spySuccess = vi.spyOn(toast, "success").mockImplementation(() => "")
    useGetNetworkTopologyMocked.mockReturnValueOnce({
      refetch
    })

    const { getByTestId } = render(
        <RefetchPeriodicScan/>
    )

    await user.click(getByTestId("periodic-scan-refresh"))

    expect(refetch).toHaveBeenCalled()
    expect(spySuccess).toHaveBeenCalled()
  })

  it("should toast error on error", async () => {
    const user = userEvent.setup()
    const spyError = vi.spyOn(toast, "error").mockImplementation(() => "")
    useGetNetworkTopologyMocked.mockReturnValueOnce({
      refetch: () => {throw new Error()}
    })

    const { getByTestId } = render(
      <RefetchPeriodicScan/>
    )

    await user.click(getByTestId("periodic-scan-refresh"))

    expect(spyError).toHaveBeenCalled()
  })

  it("should set the periodicScanDateTime on click", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup()
    const fixedTime = new Date("1970-01-01T00:00:00.000Z");

    vi.setSystemTime(fixedTime);

    const { getByTestId } = render( <RefetchPeriodicScan/> )

    // 💡 As a hint for future readers:
    // we need to use the Real timers otherwise the test is timing out because of the await
    // I don't know what is the underlying reason though ... 😇
    vi.useRealTimers();

    await user.click(getByTestId("periodic-scan-refresh"))

    expect(useNetworkPageStore.getState().periodicScanDateTime?.getTime()).toBe(0)

    cleanup()
    useNetworkPageStore.setState(useNetworkPageStore.getState())
  })
})
