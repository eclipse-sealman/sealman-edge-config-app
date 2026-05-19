import Button, { ButtonSize } from "@/components/Input/Button";
import { useState } from "react";
import PasswordValue from "./PasswordValue";
import useGetSmartEmsSecretInfo from "@/generated/edge-administration/hooks/useGetSmartEmsSecretInfo";
import SimpleDialog from "@/components/Modal/SimpleDialog";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";

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
      <GuardedButton permissionKey="read_password" resourceType="device" resourceId={deviceId} size={ButtonSize.Small} onClick={() => setIsRequestModalOpen(true)}>
        Show password value
      </GuardedButton>
      <SimpleDialog isOpen={isRequestModalOpen} onClose={closeRequestModal} title={`Password for device ${deviceId}`}>
        <PasswordValue deviceId={deviceId} />
      </SimpleDialog>
    </div>
  );
}
