import Button, { ButtonSize } from "@/components/Input/Button";
import SimpleDialog from "@/components/Modal/SimpleDialog";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import useGetSmartEmsSecretInfo from "@/generated/edge-administration/hooks/useGetSmartEmsSecretInfo";
import { usePostSmartEmsSecret } from "@/generated/edge-administration/hooks/usePostSmartEmsSecret";
import { useState } from "react";
import { toast } from "react-toastify";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

export interface RenewPasswordParams {
  deviceId: string;
}

const GuardedButton = withPermissionRequiredTooltip(Button);

export default function RenewPassword({ deviceId }: RenewPasswordParams) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const { data, isLoading, isError: isGetSmartEmsSecretError } = useGetSmartEmsSecretInfo(deviceId);
  const { postDeviceSmartEmsSecret, isPending, isError, reset } = usePostSmartEmsSecret();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (data) {
    if (!data.deviceTypeHasAuthSecret) {
      return <div>Password not configured for this Device Type. {data.error}</div>;
    }

    if (!data.id) {
      return <div>Password for the device does not exist and it will be auto-generated on next communication.</div>;
    }
  }

  if (isGetSmartEmsSecretError) {
    return <div>Error fetching password information.</div>;
  }

  const renewPassword = () => {
    postDeviceSmartEmsSecret({
      deviceId: deviceId,
      onSuccess: () => {
        setIsConfirmModalOpen(false);
        reset();
        toast.success(`Success: Password for device ${deviceId} has been successfully renewed.`);
      },
    });
  };

  const secretLastUpdate = data?.secretUpdatedAt ? data.secretUpdatedAt : data?.secretCreatedAt;

  return (
    <div className="flex flex-row gap-4">
      <div>{secretLastUpdate ? new Date(secretLastUpdate).toLocaleString() : "N/A"}</div>
      <div>
        {data?.forceRenewal ? (
          <span>Device password will be automatically renewed during next device communication.</span>
        ) : (
          <GuardedButton
              size={ButtonSize.Small}
              onClick={() => {
                setIsConfirmModalOpen(true);
              }}
              resourceType="device"
              resourceId={deviceId}
              permissionKey={PERMISSION_KEYS.DEVICE_PASSWORD_WRITE}
            >
              Force password renew
            </GuardedButton>
        )}
      </div>
      <SimpleDialog isOpen={isConfirmModalOpen} title={`Force password renew for device ${deviceId}`}>
        <>
          {isError ? <div className="mb-3 text-red-600 ">Error forcing password renew.</div> : null}
          <div className="mt-6 flex justify-center space-x-4">
            <Button size={ButtonSize.Small} processing={isPending} onClick={renewPassword}>
              OK
            </Button>
            <Button
              size={ButtonSize.Small}
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
