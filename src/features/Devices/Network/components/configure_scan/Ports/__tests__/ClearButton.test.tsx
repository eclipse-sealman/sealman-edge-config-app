import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ClearPortsButton from "../ClearButton"
import { useScanDefinitionStore } from "@/features/Devices/Network/stores"

describe("Clear all ports Button", () => {
  it("should clear all the ports in the state on click", async () => {
    const user = userEvent.setup()

    const { getByText } = render(
        <ClearPortsButton />
    )

    await user.click(getByText("Clear all ports"))

    expect(useScanDefinitionStore.getState().ports).toHaveLength(0)
  })
})
