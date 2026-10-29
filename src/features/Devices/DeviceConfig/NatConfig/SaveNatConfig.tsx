import { DeviceNatConfigRulesContext } from "./context";
import { useContext } from "react";
import { toast } from "react-toastify";
import { WaterLoader } from "@/components/ui/water-loader";
import { Button } from "@/components/ui/button";
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
      toast.success("Configuration saved");
    } catch (err) {
      console.error("ERROR", err);
      toast.error("Could not save the configuration");
    }
  };

  return (
    <GuardedButton
        deviceId={deviceId}
        permissionKey={PERMISSION_KEYS.DEVICE_NETWORK_WRITE}
        onClick={handleOnClick}
        disabled={postIsPending}
      >
        {postIsPending && <WaterLoader />}
        Save
      </GuardedButton>
  );
}
