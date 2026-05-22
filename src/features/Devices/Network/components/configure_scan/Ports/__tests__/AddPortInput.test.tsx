import { cleanup, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import AddPortInput from "../AddPortInput"
import { toast } from "react-toastify"
import { useScanDefinitionStore } from "@/features/Devices/Network/stores"

describe("Add port input", () => {
  afterEach(() => {
    cleanup()
    useScanDefinitionStore.setState(useScanDefinitionStore.getInitialState)
  })

  it("should add new port", async () => {
    const user = userEvent.setup()

    const { getByPlaceholderText } = render(
      <AddPortInput />
    )

    const subject = getByPlaceholderText("Add port(s) (e.g., 80 or 80,443,...)")
    await user.type(subject, "1")
    await user.keyboard("{Enter}")

    expect(useScanDefinitionStore.getState().ports).toMatchObject([21, 22, 80, 443, 4840, 5900, 8080,1])
  })

  it("should add new ports", async () => {
    const user = userEvent.setup()

    const { getByPlaceholderText } = render(
      <AddPortInput />
    )

    const subject = getByPlaceholderText("Add port(s) (e.g., 80 or 80,443,...)")
    await user.type(subject, "1,2,3")
    await user.keyboard("{Enter}")

    expect(useScanDefinitionStore.getState().ports).toMatchObject([21, 22, 80, 443, 4840, 5900, 8080, 1, 2, 3])
  })

  it("should add ports when clicking the add button", async () => {
    const user = userEvent.setup()

    const { getByPlaceholderText, getByRole } = render(
      <AddPortInput />
    )

    const subject = getByPlaceholderText("Add port(s) (e.g., 80 or 80,443,...)")
    await user.type(subject, "1883")
    await user.click(getByRole("button", { name: "Add" }))

    expect(useScanDefinitionStore.getState().ports).toMatchObject([21, 22, 80, 443, 4840, 5900, 8080, 1883])
    expect(subject).toHaveValue("")
  })

  it("should toast error for existing port and add new ports in the same input", async () => {
    const user = userEvent.setup()
    const spyError = vi.spyOn(toast, "error").mockImplementation(() => "")

    const { getByPlaceholderText } = render(
      <AddPortInput />
    )

    const subject = getByPlaceholderText("Add port(s) (e.g., 80 or 80,443,...)")
    await user.type(subject, "21, 1")
    await user.keyboard("{Enter}")

    expect(spyError).toHaveBeenCalled()
    expect(useScanDefinitionStore.getState().ports).toMatchObject([21, 22, 80, 443, 4840, 5900, 8080, 1])
  })

  it("should omit unaccepted characters", async () => {
    const user = userEvent.setup()

    const { getByPlaceholderText } = render(
      <AddPortInput />
    )

    const subject = getByPlaceholderText("Add port(s) (e.g., 80 or 80,443,...)")
    await user.type(subject, "1a.,2")

    expect(subject).toHaveValue("1,2");
  })
})
