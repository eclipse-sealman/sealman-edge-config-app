import { render } from "@/utils/test-utils"
import SaveNat from "../SaveNatConfig"
import userEvent from "@testing-library/user-event"
import { expect } from "vitest"
import { ctx } from "../__mocks__/context"
import { DeviceNatConfigRulesContext } from "../context"
import { toast } from "react-toastify";
vi.mock("@/features/authorization/permissions/use-permissions", () => ({
  usePermissions: vi.fn(() => ({
    hasPermission: true,
    noPermissionsMessage: undefined,
  })),
}));
describe("Save Nat config", () => {
  it("Should call saveNat from provider upon click", async () => {
    const user = userEvent.setup()
    const { getByText }  = render(
      <DeviceNatConfigRulesContext.Provider value={ctx}>
        <SaveNat />
      </DeviceNatConfigRulesContext.Provider>
    )

    await user.click(getByText("Save"))
    expect(ctx.postConfig).toHaveBeenCalled()
  })

  it("Should toast success if save went okay", async () => {
    const user = userEvent.setup()
    const spySuccess = vi.spyOn(toast, "success").mockImplementation(() => "")
    vi.spyOn(ctx, "postConfig").mockResolvedValueOnce()

    const { getByText }  = render(
      <DeviceNatConfigRulesContext.Provider value={ctx}>
        <SaveNat />
      </DeviceNatConfigRulesContext.Provider>
    )

    await user.click(getByText("Save"))
    expect(spySuccess).toHaveBeenCalled()
  })

  it("Should toast error if save went wrong", async () => {
    const user = userEvent.setup()
    const spyError = vi.spyOn(toast, "error").mockImplementation(() => "")
    vi.spyOn(ctx, "postConfig").mockRejectedValueOnce(new Error())

    const { getByText }  = render(
      <DeviceNatConfigRulesContext.Provider value={ctx}>
        <SaveNat />
      </DeviceNatConfigRulesContext.Provider>
    )

    await user.click(getByText("Save"))
    expect(spyError).toHaveBeenCalled()
  })
})
