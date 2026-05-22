import { render, cleanup } from "@testing-library/react"
import ResetScanDefinition from "../ResetButton"
import userEvent from "@testing-library/user-event"
import { useScanDefinitionStore } from "../../../stores"

describe("Reset Button", () => {
  it("should call the reset of the state on click", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()

    useScanDefinitionStore.setState({reset: spy})

    const { getByText } = render(<ResetScanDefinition />)

    await user.click(getByText("Reset"))

    expect(spy).toHaveBeenCalled()

    cleanup()
    useScanDefinitionStore.setState(useScanDefinitionStore.getInitialState)
  })
})
