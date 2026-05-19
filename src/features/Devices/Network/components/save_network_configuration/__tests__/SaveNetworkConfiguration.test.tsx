import { cleanup, waitFor, act } from "@testing-library/react"
import { render } from "@/utils/test-utils"
import SaveTwinConfig from "../SaveTwinConfig"
import userEvent from "@testing-library/user-event"
import { toast } from "react-toastify"
import { createScanDefinition } from "@/generated/edge-administration/hooks/__mocks__/usePostModuleNetDiscover"
import { Status, useNetworkPageStore, useScanDefinitionStore, useSelectedEndpointStore, useTwinConfigStore } from "@/features/Devices/Network/stores";
import { defaultTwinConfigPorts } from "../../../stores/ScanDefinition"

const postNetDiscoverModuleMocked = vi.hoisted(() => vi.fn())

vi.mock("@/generated/edge-administration/hooks/usePostModuleNetDiscover", () => ({
  usePostModuleNetDiscover: vi.fn(() => ({
    PostNetDiscoverModule: postNetDiscoverModuleMocked,
    isPending: false,
  }))
}))
vi.mock("@/features/authorization/permissions/use-permissions", () => ({
  usePermissions: vi.fn(() => ({
    hasPermission: true,
    noPermissionsMessage: undefined,
  })),
}));

afterEach(() => {
  cleanup()
  postNetDiscoverModuleMocked.mockReset()
  useTwinConfigStore.setState(useTwinConfigStore.getInitialState())
  useScanDefinitionStore.setState(useScanDefinitionStore.getInitialState())
  useNetworkPageStore.setState(useNetworkPageStore.getInitialState())
  useSelectedEndpointStore.setState(useSelectedEndpointStore.getInitialState())
})

describe("SaveNetworkConfiguration", () => {
  suite("save text", () => {
    it("should display the text given as a prop", () => {
      const { getByText } = render(<SaveTwinConfig saveText="my saving text"/>)

      getByText("my saving text")
    })

    it("should display the default text if non is given", () => {
      const { getByText } = render(<SaveTwinConfig/>)

      getByText("Save network configuration")
    })
  })

  suite("status", () => {
    it("should set the twinConfigStatus to isSaving when send postTwinConfig", async () => {
      const user = userEvent.setup()
      useScanDefinitionStore.setState({networkDefinition: "not_empty"})
      // Use a manually-controlled promise so act() cannot flush it via timers
      let resolvePost!: () => void
      postNetDiscoverModuleMocked.mockImplementationOnce(
        () => new Promise<void>(resolve => { resolvePost = resolve })
      )

      const { getByText } = render(
        <SaveTwinConfig onSuccess={() => {}}/>
      )

      await user.click(getByText("Save network configuration"))

      await waitFor(() => {
        expect(useTwinConfigStore.getState().status).toBe(Status.IsSaving)
      })

      await act(() => { resolvePost() })
    })
  })


  suite("save network definition", ( ) => {
    it("should not call saveScanDefinition if networkPrefix is undefined", async () => {
      const user = userEvent.setup()
      const handleOnSuccess = vi.fn()

      const { getByText } = render(
         <SaveTwinConfig onSuccess={handleOnSuccess}/>
      )

      await user.click(getByText("Save network configuration"))

      expect(postNetDiscoverModuleMocked).not.toHaveBeenCalled()
      expect(handleOnSuccess).not.toHaveBeenCalled()
      postNetDiscoverModuleMocked.mockClear()
    })

    it("should save the networkDefinition configuration on click", async () => {
      const user = userEvent.setup()
      useScanDefinitionStore.setState(createScanDefinition({
        networkDefinition: "172.0.0.0",
        ports: [21, 443],
        subnetMask: 23
      }))

      const { getByText } = render(
        <SaveTwinConfig/>
      )

      await user.click(getByText("Save network configuration"))

      await waitFor(() => expect(postNetDiscoverModuleMocked).toHaveBeenCalledWith({
       body: {
         endpointNames: {},
         scanDefinition: {
          networkDefinition: "172.0.0.0",
          ports: [21, 443],
          subnetMask: 23
        },
        scheduledCron: "* * * * *",
       },
       deviceId: ""
      }))

      postNetDiscoverModuleMocked.mockClear()
    })

    it("should call onSuccess after successful post", async () => {
      const user = userEvent.setup()
      const handleOnSuccess = vi.fn()

      useScanDefinitionStore.setState({networkDefinition: "test-prefix"})

      const { getByText } = render(<SaveTwinConfig onSuccess={handleOnSuccess}/>)

      await user.click(getByText("Save network configuration"))

      await waitFor(() => {
        expect(handleOnSuccess).toHaveBeenCalled()
      })

    })
  })

  suite("Save selected endpoint twin config", () => {
    it("should post the twinConfig with the new machine type and the correct service names for the selected endpoint", async () => {
      const user = userEvent.setup()

      useScanDefinitionStore.setState({networkDefinition: "123.0.0.0"})
      useNetworkPageStore.setState({selectedEndpointIp: "foo"})
      useSelectedEndpointStore.setState({name: "my new machine type"})
      useSelectedEndpointStore.setState({services: {
        "service1": "name"
      }})
      useSelectedEndpointStore.setState({description: "testDescription"})

      const { getByText, unmount } = render(<SaveTwinConfig/>)

      await user.click(getByText("Save network configuration"))

      await waitFor(() => expect(postNetDiscoverModuleMocked).toHaveBeenCalledWith({
        body: {
          endpointNames: {
            foo: {
              name: "my new machine type",
              description: "testDescription",
              serviceNames: {
                "service1": "name"
              }
            }
          },
          scanDefinition: {
            networkDefinition: "123.0.0.0",
            ports: defaultTwinConfigPorts,
            subnetMask: 0,
          },
          scheduledCron: "* * * * *"
        },
        deviceId: ""
      }))
    })
  })

  suite("toasts", () => {
    it("should show an success toast if save was successful", async () => {
      const spySuccess = vi.spyOn(toast, "success").mockImplementation(() => "")
      const user = userEvent.setup()
      useScanDefinitionStore.setState({networkDefinition: "not_empty"})


      const { getByText } = render( <SaveTwinConfig/> )

      await user.click(getByText("Save network configuration"))

      await waitFor(() => expect(spySuccess).toHaveBeenCalled())
    })

    it("should show an error toast if saveScanDefinition failed", async () => {
      const spyError = vi.spyOn(toast, "error").mockImplementation(() => "")
      const user = userEvent.setup()

      useScanDefinitionStore.setState({networkDefinition: "not_empty"})
      postNetDiscoverModuleMocked.mockRejectedValueOnce(new Error())

      const { getByText } = render( <SaveTwinConfig/> )

      await user.click(getByText("Save network configuration"))

      await waitFor(() => expect(spyError).toHaveBeenCalled())
    })
  })
})
