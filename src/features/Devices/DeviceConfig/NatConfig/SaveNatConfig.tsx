import { DeviceNatConfigRulesContext } from "./context";
import { useContext } from "react";
import { toast } from "react-toastify";
import Button from "@/components/Input/Button";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";

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
        resourceId={deviceId}
        permissionKey="edit_smartems_config_nat"
        onClick={handleOnClick}
        processing={postIsPending}
      >
        Save
      </GuardedButton>
  );
}
