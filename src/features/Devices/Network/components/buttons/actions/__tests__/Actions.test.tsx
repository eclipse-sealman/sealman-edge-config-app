import { render } from "@testing-library/react"
import Action from "../Action"

vi.mock("../OPC_UA")
vi.mock("../VNC")

describe("Device network endpoint service actions", () => {
  it("should display OPC_UA action", () => {
    const { getByTestId } = render(<Action name="OPC-UA Server"/>)

    getByTestId("mocked-opc-ua")
  })

  it("should display VNC action", () => {
    const { getByTestId } = render(<Action name="VNC Server"/>)

    getByTestId("mocked-vnc")
  })
})
