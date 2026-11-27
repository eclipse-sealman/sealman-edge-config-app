import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/features/authorization/permissions/use-permissions";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import { usePlatformFunctions, useUpdatePlatformFunctions } from "@/features/PlatformFunctions/platformFunctionsApi";
import { CHANGED_BLOCK, usePendingChanges } from "./pendingChanges";

export default function AzureIotEdgeSwitch() {
  const functionsQuery = usePlatformFunctions();
  const update = useUpdatePlatformFunctions();
  const { hasPermission: canWrite, noPermissionsMessage } = usePermissions({ permissionKey: PERMISSION_KEYS.PLATFORM_CONFIG_WRITE });
  const [draft, setDraft] = useState<boolean | null>(null);

  const functions = functionsQuery.data;
  const saved = functions?.azure_iot_edge_enabled ?? true;
  const checked = draft ?? saved;
  const changed = checked !== saved;

  usePendingChanges("azure-iot-edge-switch", {
    label: "Azure IoT Edge configuration",
    dirty: changed,
    save: async () => {
      if (!functions) return;
      await update.mutateAsync({ ...functions, azure_iot_edge_enabled: checked });
      setDraft(null);
    },
  });

  return (
    <div className={cn("flex items-center justify-between gap-6 rounded-lg border bg-background px-6 py-4 shadow-xs", changed && CHANGED_BLOCK)}>
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
        checked={checked}
        disabled={!functions || !canWrite || update.isPending}
        title={canWrite ? undefined : noPermissionsMessage}
        onCheckedChange={setDraft}
      />
    </div>
  );
}
