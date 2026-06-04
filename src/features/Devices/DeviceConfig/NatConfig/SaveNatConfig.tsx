import { DeviceNatConfigRulesContext } from "./context";
import { useContext } from "react";
import { toast } from "react-toastify";
import Button from "@/components/Input/Button";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

const GuardedButton = withPermissionRequiredTooltip(Button);

export default function SaveNat() {
  const { postConfig, postIsPending, deviceId } = useContext(
    DeviceNatConfigRulesContext
  );

  const handleOnClick = async () => {
    try {
      await postConfig();
      toast.success("Success: configuration successfully saved");
    } catch (err) {
      console.error("ERROR", err);
      toast.error("Error: the configuration could not be saved");
    }
  };

  return (
    <GuardedButton
        resourceType="device"
        deviceId={deviceId}
        permissionKey={PERMISSION_KEYS.DEVICE_NETWORK_WRITE}
        onClick={handleOnClick}
        processing={postIsPending}
      >
        Save
      </GuardedButton>
  );
}
