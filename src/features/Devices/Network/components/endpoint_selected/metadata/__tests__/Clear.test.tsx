import { cleanup, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useNetworkPageStore, useSelectedEndpointStore, useTwinConfigStore } from "@/features/Devices/Network/stores"

import Clear from "../Clear"

describe("Clear", () => {
  it("should set the name to empty string", async () => {
    const user = userEvent.setup()

    useNetworkPageStore.setState({selectedEndpointIp: "testIp"})
    useSelectedEndpointStore.setState({name: "testName"})

    const { getByTestId } = render(
        <Clear/>
    )

    await user.click(getByTestId("clear-endpoint-name"))
    expect(useSelectedEndpointStore.getState().name).toBe("")

    cleanup()
    useNetworkPageStore.setState(useNetworkPageStore.getInitialState)
    useTwinConfigStore.setState(useTwinConfigStore.getInitialState)
  })
})
