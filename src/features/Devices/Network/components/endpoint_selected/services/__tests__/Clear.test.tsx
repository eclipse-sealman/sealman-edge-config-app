import { cleanup, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useNetworkPageStore, useSelectedEndpointStore, useTwinConfigStore } from "@/features/Devices/Network/stores"
import Clear from "../Clear"

describe("Clear", () => {
  it("should set the name to empty string", async () => {
    const user = userEvent.setup()

    useNetworkPageStore.setState({selectedEndpointIp: "testIp"})
    useSelectedEndpointStore.setState({
      services: {
        21: "testName"
      }
    })

    const { getByTestId } = render(
        <Clear port={21}/>
    )

    await user.click(getByTestId("clear-endpoint-name"))
    expect(useSelectedEndpointStore.getState().services[21]).toBe("")

    cleanup()
    useNetworkPageStore.setState(useNetworkPageStore.getInitialState)
    useTwinConfigStore.setState(useTwinConfigStore.getInitialState)
  })
})
