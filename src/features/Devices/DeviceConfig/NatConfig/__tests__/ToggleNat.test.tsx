import { render } from "@/utils/test-utils"
import ToggleNat from "../ToggelNat"
import { DeviceNatConfigRulesContext } from "../context"
import { ctx } from "../__mocks__/context"
import userEvent from "@testing-library/user-event"

describe("Toggle Nat", () => {
  it("should toggle nat configuration", async () => {
    const user = userEvent.setup()

    const { getByLabelText } = render(
      <DeviceNatConfigRulesContext.Provider value={ctx}>
        <ToggleNat />
      </DeviceNatConfigRulesContext.Provider>
    )

    await user.click(getByLabelText("Enable nat configuration"))
    expect(ctx.toggleNat).toHaveBeenCalled()
  })
})
