import { render } from "@testing-library/react"
import SubnetInput from "../Input"
import userEvent from "@testing-library/user-event"
import { useScanDefinitionStore } from "@/features/Devices/Network/stores"

describe("SubnetInput", () => {
  it("should display the subnet and call the update function on change", async () => {
    const user = userEvent.setup()

    const { getByDisplayValue } = render( <SubnetInput /> )

    const subject = getByDisplayValue("0")
    await user.type(subject, "24")
    expect(useScanDefinitionStore.getState().subnetMask).toBe(24)
  })
})
