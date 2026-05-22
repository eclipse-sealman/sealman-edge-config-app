import { cleanup, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import PortItem from "../PortItem"
import { useScanDefinitionStore } from "@/features/Devices/Network/stores"

describe("Remove port item button", () => {
  it("should call the remove the ports at the specified index from the state", async () => {
    const user = userEvent.setup()


    const { getByTestId } = render(<PortItem port={ 1 } index={0} /> )

    await user.click(getByTestId("remove-port-item-0"))

    expect(useScanDefinitionStore.getState().ports).toMatchObject([22, 80, 443, 4840, 5900, 8080])

    cleanup()
    useScanDefinitionStore.setState(useScanDefinitionStore.getInitialState)
  })
})
