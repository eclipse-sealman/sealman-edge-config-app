import { DeviceNatConfigRulesContext } from "../context"
import { render } from "@/utils/test-utils"
import NatConfigHeader from "../NatConfigHeader"
import { ctx } from "../__mocks__/context"
import isVersionEligibleMocked from "@/utils/__mocks__/isVersionEligible";

vi.mock( "react-router-dom", () => ( {
  useNavigate : vi.fn(),
  useParams: vi.fn(() => ({
    deviceId: "id-1"
  }))
} ) );
vi.mock("@/utils/isVersionEligible.ts")

describe("Device Nat config header", () => {
  it("should display loading message", () => {
    const { getByText, queryByText } = render(
      <DeviceNatConfigRulesContext.Provider value={{
        ...ctx,
        isLoading: true
      }}>
        <NatConfigHeader>
          <p>I'm a ghost 👻</p>
        </NatConfigHeader>
      </DeviceNatConfigRulesContext.Provider>
    )

    getByText("Loading...")
    expect(queryByText("I'm a ghost 👻")).not.toBeInTheDocument()
  })

  //TODO: skipped as error are not propagated correctly from the api client, they need to be specified in the open api spec first
  it.skip("should display error message", () => {
    const { getByText, queryByText } = render(
      <DeviceNatConfigRulesContext.Provider value={{
        ...ctx,
      }}>
        <NatConfigHeader>
          <p>I'm a ghost 👻</p>
        </NatConfigHeader>
      </DeviceNatConfigRulesContext.Provider>
    )

    getByText("Something went wrong please contact support")
    expect(queryByText("I'm a ghost 👻")).not.toBeInTheDocument()
  })

  it("should display error message if fimrware version is not elligible, children should not be mounted", () => {
    isVersionEligibleMocked.mockReturnValueOnce(false)

    const { getByText, queryByText } = render(
      <DeviceNatConfigRulesContext.Provider value={{
        ...ctx,
        isLoading: false
      }}>
        <NatConfigHeader>
          <p>I'm a ghost 👻</p>
        </NatConfigHeader>
      </DeviceNatConfigRulesContext.Provider>
    )

    getByText("Your firmware version is not compatible for 1:1 NAT Configuration")
    expect(queryByText("I'm a ghost 👻")).not.toBeInTheDocument()
  })

  it("should display the children if everything is fine", () => {
    isVersionEligibleMocked.mockReturnValueOnce(true)
    const { getByText } = render(
      <DeviceNatConfigRulesContext.Provider value={{
        ...ctx,
        isLoading: false
      }}>
        <NatConfigHeader>
          <p>MUST BE DISPLAYED</p>
        </NatConfigHeader>
      </DeviceNatConfigRulesContext.Provider>
    )

    getByText("MUST BE DISPLAYED")
  })
})
