import { cleanup, render } from "@testing-library/react"
import { NetworkScanResultsTable } from "@/features/Devices/Network/layouts"
import { components } from "@/generated/edge-administration/types"
import { useScanDiscoverStore } from "../../../stores"
import { createScanResult } from "@/generated/edge-administration/hooks/network/__mocks__/usePostDeviceNetworkDiscover"

describe("NetworkScanResultsTable", () => {
  it("should display isScanning if ScanDiscover store is scanning", () => {

    useScanDiscoverStore.setState({isScanning: true})

    const { getByText } = render(<NetworkScanResultsTable />)

    getByText("Scan is in progress ...")

    cleanup()
    useScanDiscoverStore.setState(useScanDiscoverStore.getInitialState())
  })

  it("should display info message if no endpoints found", () => {
    useScanDiscoverStore.setState({scanResults: []})

    const { getByText } = render(<NetworkScanResultsTable />)

    getByText("No endpoints were found.")

    cleanup()
    useScanDiscoverStore.setState(useScanDiscoverStore.getInitialState())
  })

  it("should not display error message if scanResults returned valid data", () => {
    const validScan = {
      ip: "foo",
      ports: {}
    } as components["schemas"]["EndpointStatus"]

    useScanDiscoverStore.setState({scanResults:[validScan]})

    const { queryByText } = render(<NetworkScanResultsTable />)

    expect(queryByText("No endpoints were found.")).not.toBeInTheDocument()

    cleanup()
    useScanDiscoverStore.setState(useScanDiscoverStore.getInitialState())
  })

  it("should reset scanResults on unmount", () => {
    const validScan = {
      ip: "foo",
      ports: {},
    } as components["schemas"]["EndpointStatus"];

    useScanDiscoverStore.setState({ scanResults: [validScan] });

    const { unmount } = render(<NetworkScanResultsTable />);

    expect(useScanDiscoverStore.getState().scanResults).toEqual([validScan]);

    unmount();
    expect(useScanDiscoverStore.getState().scanResults).toEqual([]);
  });
})
