import { render } from "@/utils/test-utils"
import ReadNetwork from "../ReadNetwork"
import userEvent from "@testing-library/user-event"
import { useReadNetworkDefinitionMocked } from "../__mocks__/useReadNetworkDefinition"
import { useScanDefinitionStore } from "../../../stores"
import { CMD_PROXY_MODULE_NAME } from "@/api/edgeConfig/moduleNames"

vi.mock("../useReadNetworkDefinition");
vi.mock("@/api/edgeConfig/edgeConfigApiHooks", () => ({
  edgeConfigApiHooks: {
    useGetModules: vi.fn(() => ({
      data: [{ moduleName: CMD_PROXY_MODULE_NAME, connectionState: "Connected" }],
      isLoading: false,
      isError: false,
    })),
  },
}));
vi.mock("@/features/authorization/permissions/use-permissions", () => ({
  usePermissions: vi.fn(() => ({
    hasPermission: true,
    noPermissionsMessage: undefined,
  })),
}));

describe("ReadNetwork", () => {
  it("should call readNetwork on read network click", async () => {
    const user = userEvent.setup()

    const { getByText } = render(
       <ReadNetwork/>
    )

    await user.click(getByText("Read network configuration"))

    expect(useReadNetworkDefinitionMocked.readNetwork).toHaveBeenCalled()
  })

  it("should  update the NetworkPrefix and SubnetMask from the state after a successful network read", async () => {
    const user = userEvent.setup()

    vi.spyOn(useReadNetworkDefinitionMocked, "readNetwork").mockResolvedValueOnce({address: "1.2.3.4", mask: 10})

    const { getByText } = render( <ReadNetwork/> )

    await user.click(getByText("Read network configuration"))

    expect(useScanDefinitionStore.getState().subnetMask).toBe(10)
    expect(useScanDefinitionStore.getState().networkDefinition).toBe("1.2.3.4")
  })
})
