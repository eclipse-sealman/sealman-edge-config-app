import { useParams } from "react-router-dom";
import Button from "../../../components/Input/Button";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { edgeConfigApi } from "../../../api/edgeConfig/edgeConfigApi";
import { CMD_PROXY_MODULE_NAME } from "@/api/edgeConfig/moduleNames";
import { withPermissionAndModuleRequiredTooltip } from "@/features/authorization/permissions/withPermissionAndModuleRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

const PermissionAndModuleGuardedButton = withPermissionAndModuleRequiredTooltip(Button);

export function DeviceSemsCheck () {
  const { deviceId } = useParams();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      let resp = await edgeConfigApi.getDeviceCmdStatus(deviceId)

      if (resp.moduleStatus === "Disconnected"){
        toast.warning(`this function require a connected <${CMD_PROXY_MODULE_NAME}> module -> check Module-Config`)
        resp.showSuccess = false
      }
      else{
        resp = await edgeConfigApi.postDeviceCmdSmartemsCheck(deviceId)
        resp.showSuccess = true
      }
      return resp
    },

    onError: (error: any) => {
      toast.error(`ERROR: Could not apply config update: ${error.code} ${JSON.stringify(error.response?.data)}`)
    },

    onSuccess: (resp: any) => {
      if (resp.showSuccess){
        toast.success("activate config update on device -> check command history")
      }
    }
  });

  return <div>
    <PermissionAndModuleGuardedButton
      deviceId={deviceId}
      permissionKey={PERMISSION_KEYS.DEVICE_READ}
      requiredModuleName={CMD_PROXY_MODULE_NAME}
      processing={isPending}
      onClick={() => mutate()}
    >
      Activate Config
    </PermissionAndModuleGuardedButton>
    </div>
}
