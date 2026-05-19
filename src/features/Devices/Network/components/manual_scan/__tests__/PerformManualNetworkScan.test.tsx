import userEvent from "@testing-library/user-event"
import PerformManualNetworkScan from "../PerformManualNetworkScan"
import { render } from "@testing-library/react"
import { mutateAsync } from "@/generated/edge-administration/hooks/network/__mocks__/usePostDeviceNetworkDiscover"
import { useScanDefinitionStore, useScanDiscoverStore } from "../../../stores"
import NetworkPageStore from "../../../stores/NetworkPageStore"

vi.mock("../useScanResults")
vi.mock("@/generated/edge-administration/hooks/network/usePostDeviceNetworkDiscover")
vi.mock("@/features/authorization/permissions/use-permissions", () => ({
  usePermissions: vi.fn(() => ({
    hasPermission: true,
    noPermissionsMessage: undefined,
  })),
}));
describe("PerformManualNetworkScan", () => {
  it("should call readNetwork if parameters are defined in the Scan definition context", async () => {
    NetworkPageStore.setState({deviceId: "foo"})
    const user = userEvent.setup()

    useScanDefinitionStore.setState({
      networkDefinition: "172.0.0.0",
      ports: [21, 443],
      subnetMask: 23,
    })

    const { getByText, unmount } = render(
      <PerformManualNetworkScan/>
    )

    await user.click(getByText("Perform manual scan"))

    expect(mutateAsync).toHaveBeenCalledWith({
      body: {
        "networkDefinition": "172.0.0.0",
        "ports": [ 21, 443,],
        "subnetMask": 23,
      },
      deviceId: "foo",
    })
    unmount()
    NetworkPageStore.setState(NetworkPageStore.getInitialState())
  })

  it("should set the scanResult of ScanDiscover store after successful network scan", async () => {
    const user = userEvent.setup()
    mutateAsync.mockResolvedValueOnce({
      payload: {
        scanResults: [
          {"ip": "1.2.3.4"}
        ]
      }
    })

    const {getByText} = render(<PerformManualNetworkScan/>)

    await user.click(getByText("Perform manual scan"))

    expect(useScanDiscoverStore.getState().scanResults).toHaveLength(1)
    expect(useScanDiscoverStore.getState().scanResults[0].ip).toBe("1.2.3.4")
  })

  it("should set the scanning state to false when component unmounts", () => {
    useScanDiscoverStore.setState({isScanning: true})

    const { unmount } = render(<PerformManualNetworkScan/>)

    unmount()
    expect(useScanDiscoverStore.getState().isScanning).toBe(false)
  })
})
