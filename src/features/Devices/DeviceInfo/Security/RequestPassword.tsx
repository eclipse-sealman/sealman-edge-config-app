import { Button } from "@/components/ui/button";
import { useState } from "react";
import PasswordValue from "./PasswordValue";
import usePostDeviceRequestPassword from "@/generated/edge-administration/hooks/usePostDeviceRequestPassword";
import SimpleDialog from "@/components/Modal/SimpleDialog";
import { RestrictedTooltip } from "@/components/ui/restricted-tooltip";
import { InlineAlert, LoadingState } from "@/components/ui/page-state";
import { getErrorMessage, isForbidden } from "@/lib/errors";

export interface RequestPasswordParams {
  deviceId: string;
  canRead: boolean;
  noPermissionsMessage?: string;
}

export default function RequestPassword({ deviceId, canRead, noPermissionsMessage }: RequestPasswordParams) {
  const { password, request, reset, isPending, error } = usePostDeviceRequestPassword(deviceId);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);

  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
    reset();
  };

  const reveal = () => {
    if (!canRead) return;
    setIsRequestModalOpen(true);
    request();
  };

  return (
    <div>
      <RestrictedTooltip show={!canRead} message={noPermissionsMessage}>
        <span><Button disabled={!canRead} size="sm" variant="outline" onClick={reveal}>Show password value</Button></span>
      </RestrictedTooltip>
      {isRequestModalOpen && canRead && (
        <SimpleDialog isOpen onClose={closeRequestModal} title={`Password for device ${deviceId}`}>
          {isPending && <LoadingState label="Requesting password..." />}
          {error && <InlineAlert className="my-3">{isForbidden(error) ? "Not permitted to view this device password." : `Could not get the password: ${getErrorMessage(error)}`}</InlineAlert>}
          {error && !isForbidden(error) && <Button size="sm" onClick={request}>Try again</Button>}
          {password && !error && <PasswordValue password={password} />}
        </SimpleDialog>
      )}
    </div>
  );
}
