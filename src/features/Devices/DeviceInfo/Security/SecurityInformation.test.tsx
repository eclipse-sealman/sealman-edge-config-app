import { render } from "@/utils/test-utils";
import SecurityInformation from "./SecurityInformation";
import { useParams } from "react-router-dom";
import { Mock } from "vitest";

vi.mock("react-router-dom", () => ({
  ...vi.importActual("react-router-dom"),
  useParams: vi.fn(),
}));
vi.mock("@/features/authorization/permissions/use-permissions", () => ({
  usePermissions: vi.fn(() => ({
    hasPermission: true,
    noPermissionsMessage: undefined,
  })),
}));

describe("Security Information", () => {
  it("should render text Security", () => {
    (useParams as Mock).mockReturnValue({ deviceId: "22016270" });
    const { getByText } = render(<SecurityInformation />);
    getByText("Security");
  });

  it("should not render if deviceId is not provided", () => {
    (useParams as Mock).mockReturnValue({ deviceId: "" });
    const { container } = render(<SecurityInformation />);
    expect(container.firstChild).toBeNull();
  });
});
