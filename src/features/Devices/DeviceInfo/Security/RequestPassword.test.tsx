import RequestPassword from "./RequestPassword";
import { render } from "@/utils/test-utils";
import  usePostDeviceRequestPassword from "@/generated/edge-administration/hooks/usePostDeviceRequestPassword";
import useGetSmartEmsSecretInfo from "@/generated/edge-administration/hooks/useGetSmartEmsSecretInfo";
import { fireEvent, waitFor } from "@testing-library/react";
import { Mock } from "vitest";

vi.mock("@/generated/edge-administration/hooks/usePostDeviceRequestPassword");
vi.mock("@/generated/edge-administration/hooks/useGetSmartEmsSecretInfo");
vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
  },
}));
vi.mock("@/features/authorization/permissions/use-permissions", () => ({
  usePermissions: vi.fn(() => ({
    hasPermission: true,
    noPermissionsMessage: undefined,
  })),
}));

const mockUsePostDeviceRequestPassword = usePostDeviceRequestPassword as Mock;
const mockUseGetSmartEmsSecretInfo = useGetSmartEmsSecretInfo as Mock;
const deviceId = "22016270";

describe("Request Password", () => {
  beforeEach(() => {
    mockUsePostDeviceRequestPassword.mockReturnValue({
      isError: false,
      isPending: false,
      data: {
        id: 1,
        secretValue: "test-password",
      },
    });
    mockUseGetSmartEmsSecretInfo.mockReturnValue({
      data: {
        id: "test-id",
      },
      isLoading: false,
      isError: false,
    });
  });

  it("should render button Show password value", () => {
    const { getByText } = render(<RequestPassword deviceId={deviceId}/>);
    getByText("Show password value");
  });

  it("should open modal on button click", () => {
    const { getByText, getByRole } = render(<RequestPassword deviceId={deviceId} />);
    fireEvent.click(getByText("Show password value"));
    getByRole("dialog");
    getByText(`Password for device ${deviceId}`);
  });

  it("should display password value if requested", async () => {
    const { getByText } = render(<RequestPassword deviceId={deviceId} />);
    fireEvent.click(getByText("Show password value"));

    await waitFor(() => {
      const passwordInput = document.querySelector('input[name="password-value"]') as HTMLInputElement;
      expect(passwordInput?.value).toBe("test-password");
    });
  });

});
