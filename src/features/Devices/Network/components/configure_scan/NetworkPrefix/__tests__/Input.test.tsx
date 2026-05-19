import { cleanup, render } from "@testing-library/react"
import NetworkPrefixInput from "../Input"
import userEvent from "@testing-library/user-event"
import { useScanDefinitionStore } from "@/features/Devices/Network/stores"

// vi.mock("@/features/Devices/Network/stores/ScanDefinition")

describe("NetworkPrefixInput", () => {
  it("should display the network prefix and call the update function on change", async () => {
    const user = userEvent.setup()


    useScanDefinitionStore.setState({networkDefinition: "172.0.0.0"})

    const { getByDisplayValue } = render(
        <NetworkPrefixInput />
    )

    const subject = getByDisplayValue("172.0.0.0")
    await user.type(subject, "1")
    getByDisplayValue("172.0.0.01")

    cleanup()
    useScanDefinitionStore.setState(useScanDefinitionStore.getInitialState)
  })
})
