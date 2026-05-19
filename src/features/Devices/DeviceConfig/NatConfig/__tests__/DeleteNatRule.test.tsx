import { render } from "@/utils/test-utils"
import { DeleteNatRule } from "../DeleteNatRule"
import userEvent from "@testing-library/user-event"
import { ctx } from "../__mocks__/context"
import { DeviceNatConfigRulesContext } from "../context"

describe("DescribeNatRule", () => {
  it("Should call deleteRule from the context upon delete button click", async () => {
    const user = userEvent.setup()
    const { getByText } = render(
      <DeviceNatConfigRulesContext.Provider value={ctx}>
        <DeleteNatRule index={0}/>
      </DeviceNatConfigRulesContext.Provider>
    )

    await user.click(getByText("Delete rule"))
    expect(ctx.deleteRule).toHaveBeenCalledWith(0)
  })
})
