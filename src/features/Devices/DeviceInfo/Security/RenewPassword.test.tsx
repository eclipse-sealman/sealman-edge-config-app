import RenewPassword from "./RenewPassword";
import { render } from "@/utils/test-utils";
import { Mock } from "vitest";
import { usePostSmartEmsSecret } from "@/generated/edge-administration/hooks/usePostSmartEmsSecret";
import useGetSmartEmsSecretInfo from "@/generated/edge-administration/hooks/useGetSmartEmsSecretInfo";
import { fireEvent, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";

vi.mock("@/generated/edge-administration/hooks/useGetSmartEmsSecretInfo");
vi.mock("@/generated/edge-administration/hooks/usePostSmartEmsSecret");
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

const mockUsePostSmartEmsSecret = usePostSmartEmsSecret as Mock;
const mockUseGetSmartEmsSecretInfo = useGetSmartEmsSecretInfo as Mock;

describe("Renew Password", () => {
  beforeEach(() => {
    mockUsePostSmartEmsSecret.mockReturnValue({
      postDeviceSmartEmsSecret: vi.fn(),
      isError: false,
      isPending: false,
      reset: vi.fn(),
    });

    mockUseGetSmartEmsSecretInfo.mockReturnValue({
      data: {
        deviceTypeHasAuthSecret: true,
        id: 1,
        forceRenewal: false,
        secretCreatedAt: "2021-09-01T00:00:00Z",
        secretUpdatedAt: null,
      },
    });
  });

  it("should render text if deviceTypeHasAuthSecret is false", () => {
    mockUseGetSmartEmsSecretInfo.mockReturnValueOnce({
      data: {
        deviceTypeHasAuthSecret: false,
        secretCreatedAt: null,
        secretUpdatedAt: null,
      },
    });
    const { getByText } = render(<RenewPassword deviceId="22016270" />);
    getByText("Password not configured for this Device Type.");
  });

  it("should render button Force password renew if deviceTypeHasAuthSecret is true", () => {
    const { getByText } = render(<RenewPassword deviceId="22016270" />);
    getByText("Force password renew");
  });

  it("should open modal on button click", () => {
    const { getByText, getByRole } = render(<RenewPassword deviceId="22016270" />);
    fireEvent.click(getByText("Force password renew"));
    getByRole("dialog");
    getByText("Force password renew for device 22016270");
  });

  it("should call postDeviceSmartEmsSecret on confirm, and success message", async () => {
    const postDeviceSmartEmsSecret = vi.fn((params) => params.onSuccess());
    mockUsePostSmartEmsSecret.mockReturnValue({
      postDeviceSmartEmsSecret,
      isError: false,
      isPending: false,
      reset: vi.fn(),
    });

    const { getByText } = render(<RenewPassword deviceId="22016270" />);
    fireEvent.click(getByText("Force password renew"));
    fireEvent.click(getByText("OK"));

    await waitFor(() => {
      expect(postDeviceSmartEmsSecret).toHaveBeenCalledWith({
        deviceId: "22016270",
        onSuccess: expect.any(Function),
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Success: Password for device 22016270 has been successfully renewed.");
    });
  });
});
