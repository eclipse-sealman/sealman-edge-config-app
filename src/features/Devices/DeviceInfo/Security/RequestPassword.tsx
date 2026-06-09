import Button, { ButtonSize } from "@/components/Input/Button";
import { useState } from "react";
import PasswordValue from "./PasswordValue";
import useGetSmartEmsSecretInfo from "@/generated/edge-administration/hooks/useGetSmartEmsSecretInfo";
import SimpleDialog from "@/components/Modal/SimpleDialog";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

const GuardedButton = withPermissionRequiredTooltip(Button);

export interface RequestPasswordParams {
  deviceId: string;
}

export default function RequestPassword({ deviceId }: RequestPasswordParams) {
  const { data } = useGetSmartEmsSecretInfo(deviceId);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);

  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
  };

  if (!deviceId || !data || !data.id) {
    return <></>;
  }

  return (
    <div>
      <GuardedButton permissionKey={PERMISSION_KEYS.DEVICE_PASSWORD_READ} deviceId={deviceId} size={ButtonSize.Small} onClick={() => setIsRequestModalOpen(true)}>
        Show password value
      </GuardedButton>
      <SimpleDialog isOpen={isRequestModalOpen} onClose={closeRequestModal} title={`Password for device ${deviceId}`}>
        <PasswordValue deviceId={deviceId} />
      </SimpleDialog>
    </div>
  );
}
