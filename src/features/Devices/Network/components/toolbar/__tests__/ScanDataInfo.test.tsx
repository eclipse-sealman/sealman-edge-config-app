import { cleanup, render } from "@testing-library/react";
import ScanDataInfo from "../ScanDataInfo";
import { useNetworkPageStore } from "@/features/Devices/Network/stores";

describe("Scan data info", () => {
  it("should display info if no periodic scan date time found in network page store", () => {
    const { getByText } = render(<ScanDataInfo />);

    getByText("no periodic scan has been performed yet");
  });

  it("should display the proper date time of the periodicScan based on the value from the network page store", () => {
    useNetworkPageStore.setState({ periodicScanDateTime: new Date(2020, 0, 1, 19, 30, 2) });

    const { getByText } = render(<ScanDataInfo />);

    getByText(/19:30:02.*January 01|January 01.*19:30:02/);

    cleanup();
    useNetworkPageStore.setState(useNetworkPageStore.getInitialState());
  });
});
