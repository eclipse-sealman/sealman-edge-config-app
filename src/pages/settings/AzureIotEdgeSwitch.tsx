import { toast } from "react-toastify";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/lib/errors";
import { usePermissions } from "@/features/authorization/permissions/use-permissions";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import { usePlatformFunctions, useUpdatePlatformFunctions } from "@/features/PlatformFunctions/platformFunctionsApi";

export default function AzureIotEdgeSwitch() {
  const functionsQuery = usePlatformFunctions();
  const update = useUpdatePlatformFunctions();
  const { hasPermission: canWrite, noPermissionsMessage } = usePermissions({ permissionKey: PERMISSION_KEYS.PLATFORM_CONFIG_WRITE });

  const functions = functionsQuery.data;

  return (
    <div className="flex items-center justify-between gap-6 rounded-lg border bg-background px-6 py-4 shadow-xs">
      <div className="space-y-1">
        <Label htmlFor="azureIotEdge" className="cursor-pointer">
          Azure IoT Edge configuration
        </Label>
        <p className="text-sm text-muted-foreground">
          When disabled, the Azure IoT Edge section is left out of the device configuration of all devices. Devices
          are still registered in the IoT Hub when they are created.
        </p>
      </div>
      <Switch
        id="azureIotEdge"
        checked={functions?.azure_iot_edge_enabled ?? true}
        disabled={!functions || !canWrite || update.isPending}
        title={canWrite ? undefined : noPermissionsMessage}
        onCheckedChange={(checked) =>
          functions &&
          update.mutate(
            { ...functions, azure_iot_edge_enabled: checked },
            { onError: (error) => toast.error(`Could not save Azure IoT Edge setting: ${getErrorMessage(error)}`) },
          )
        }
      />
    </div>
  );
}
