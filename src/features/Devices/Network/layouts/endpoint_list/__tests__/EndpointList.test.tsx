import { cleanup, render } from "@testing-library/react";
import EndpointList from "../EndpointList";
import {
  EndpointConfig,
  EndpointNames,
} from "@/api/edgeConfig/networkDiscover/networkDiscoverInterfaces";
import {
  useNetworkPageStore,
  useTwinConfigStore,
  useEndpointSearchStore,
} from "@/features/Devices/Network/stores";
import useGetNetworkTopologyMocked, {
  createMockedData,
  createMockedScanResult,
} from "@/generated/edge-administration/hooks/__mocks__/useGetNetworkTopology";

vi.mock("@/features/Devices/Network/smart_ems/layouts/VpnShortcut");

vi.mock("@/generated/edge-administration/hooks/useGetNetworkTopology");
vi.mock("@/features/Devices/Network/useHandleSelectedEndpoint");

describe("Device network endpointList", () => {
  suite("name or ip", () => {
    beforeAll(() => {
      useNetworkPageStore.setState({ deviceId: "testDevice" });
    });

    it("Should display loading status", () => {
      useGetNetworkTopologyMocked.mockReturnValueOnce({
        isLoading: true,
      });

      const { getByText } = render(<EndpointList />);

      getByText("Loading ...");
    });

    it("Should display the endpoint name", () => {
      const config: EndpointNames = {
        "192.168.0.139": {
          name: "my endpoint",
          serviceNames: {},
        },
      };

      useTwinConfigStore.setState({ endpointConfigList: config });

      const { getByText, queryByText } = render(<EndpointList />);

      getByText("my endpoint");
      expect(queryByText("192")).not.toBeInTheDocument();

      cleanup();
      useTwinConfigStore.setState(useTwinConfigStore.getInitialState());
    });

    it("should display the ip if the name is an empty string", () => {
      const config: EndpointNames = {
        "192.168.0.139": {
          name: "",
          serviceNames: {},
        },
      };

      useTwinConfigStore.setState({ endpointConfigList: config });

      const { getByText } = render(<EndpointList />);

      getByText("192.168.0.139");

      cleanup();
      useTwinConfigStore.setState(useTwinConfigStore.getInitialState());
    });
  });

  suite("Filtering", () => {
    it("should only display 192.168.0.2 since the search is 192.168.0.2", () => {
      const config: EndpointNames = {
        "192.168.0.139": {
          name: "my endpoint",
          serviceNames: {},
        },
        "192.168.0.2": {
          serviceNames: {},
        } as EndpointConfig,
      };

      useGetNetworkTopologyMocked.mockReturnValue({
        data: createMockedData({
          scanResults: [
            createMockedScanResult({ ip: "192.168.0.139" }),
            createMockedScanResult({ ip: "192.168.0.2" }),
          ],
        }),
      });

      useTwinConfigStore.setState({ endpointConfigList: config });
      useEndpointSearchStore.setState({ search: "192.168.0.2" });

      const { queryByText, getByText } = render(<EndpointList />);

      expect(queryByText("my endpoint")).not.toBeInTheDocument();
      expect(getByText("192.168.0.2"));
      useGetNetworkTopologyMocked.mockRestore();
    });

    it("should display my endpoint as we search for a name", () => {
      const config: EndpointNames = {
        "192.168.0.139": {
          name: "my endpoint",
          serviceNames: {},
        },
        "192.168.0.2": {
          serviceNames: {},
        } as EndpointConfig,
      };

      useGetNetworkTopologyMocked.mockReturnValueOnce({
        data: createMockedData({
          scanResults: [
            createMockedScanResult({ ip: "192.168.0.139" }),
            createMockedScanResult({ ip: "192.168.0.2" }),
          ],
        }),
      });

      useTwinConfigStore.setState({ endpointConfigList: config });
      useEndpointSearchStore.setState({ search: "my end" });

      const { queryByText, getByText } = render(<EndpointList />);

      expect(queryByText("192.168.0.2")).not.toBeInTheDocument();
      expect(getByText("my endpoint"));

      cleanup();
      useTwinConfigStore.setState(useTwinConfigStore.getInitialState());
      useEndpointSearchStore.setState(useEndpointSearchStore.getInitialState());
    });

    it("should display no endpoints found", () => {
      useGetNetworkTopologyMocked.mockReturnValueOnce({
        data: createMockedData({
          scanResults: [createMockedScanResult({ ip: "192.168.0.139" })],
        }),
      });
      useEndpointSearchStore.setState({ search: "not_found" });

      const { getByText, queryByText } = render(<EndpointList />);

      getByText("No endpoints found using your search");
      expect(queryByText("192.168.0.139")).not.toBeInTheDocument();
    });
  });
});
