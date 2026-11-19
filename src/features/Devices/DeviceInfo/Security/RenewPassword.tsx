import { WaterLoader } from "@/components/ui/water-loader";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/page-state";
import SimpleDialog from "@/components/Modal/SimpleDialog";
import { RestrictedTooltip } from "@/components/ui/restricted-tooltip";
import { useRenewDevicePassword } from "@/generated/edge-administration/hooks/useRenewDevicePassword";
import { useState } from "react";
import { toast } from "react-toastify";
import type { components } from "@/generated/edge-administration/types";
import { getErrorMessage, isForbidden } from "@/lib/errors";

export interface RenewPasswordParams {
  deviceId: string;
  info: components["schemas"]["DeviceSecretInformation"];
  canRenew: boolean;
  noPermissionsMessage?: string;
  onRenewalStart: () => void;
}

export default function RenewPassword({ deviceId, info, canRenew, noPermissionsMessage, onRenewalStart }: RenewPasswordParams) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const { mutate, isPending, error, reset } = useRenewDevicePassword();

  const renewPassword = () => {
    if (!canRenew || isPending || info.forceRenewal) return;
    onRenewalStart();
    mutate(
      { params: { path: { device: deviceId } }, cache: "no-store" },
      {
        onSuccess: () => {
          setIsConfirmModalOpen(false);
          reset();
          toast.success(`Password renewal requested for ${deviceId}. Waiting for the device to connect.`);
        },
      },
    );
  };

  return (
    <div className="space-y-2">
      <div>
        {info.forceRenewal ? (
          <p className="text-sm">Password renewal pending. Waiting for the device to connect.</p>
        ) : (
            <RestrictedTooltip show={!canRenew} message={noPermissionsMessage}>
              <span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsConfirmModalOpen(true)}
                  disabled={!canRenew}
                >
                  Renew password
                </Button>
              </span>
            </RestrictedTooltip>
        )}
      </div>
      <SimpleDialog isOpen={isConfirmModalOpen} title={`Renew password for ${deviceId}`}>
        <>
          <p className="mt-3 text-sm">Renew the password the next time the device connects?</p>
          {error && <InlineAlert className="my-3">{isForbidden(error) ? "Not permitted to renew this device password." : `Could not request password renewal: ${getErrorMessage(error)}`}</InlineAlert>}
          <div className="mt-6 flex justify-center space-x-4">
            <Button size="sm" disabled={isPending || !canRenew || isForbidden(error)} onClick={renewPassword}>
              {isPending && <WaterLoader />}
              OK
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                setIsConfirmModalOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
          </div>
        </>
      </SimpleDialog>
    </div>
  );
}
