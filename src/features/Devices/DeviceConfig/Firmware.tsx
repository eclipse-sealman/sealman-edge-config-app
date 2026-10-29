import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { WaterLoader } from "@/components/ui/water-loader";
import { CpuChipIcon } from "@heroicons/react/24/outline";
import { Heading } from "@/components/Typography/Heading";
import DictionaryList from "@/components/Table/DictionaryList";
import Badge, { BadgeColor } from "@/components/Typography/Badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import useSmartEmsStatusPolling from "./useSmartEmsStatusPolling";

const GuardedButton = withPermissionRequiredTooltip(Button);

// Mocked until the backend exposes available firmware images and an update endpoint.
const MOCK_AVAILABLE_FIRMWARE = [
  { version: "3.4.2", notes: "latest" },
  { version: "3.4.1", notes: "stable" },
  { version: "3.3.0", notes: "previous release" },
];
const MOCK_UPDATE_DURATION_MS = 2500;

export default function Firmware() {
  const { deviceId } = useParams();
  const { data, isPending, isFetching, isError, error } = useSmartEmsStatusPolling(deviceId);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const tableData = data
    ? {
        "Firmware Version": <Badge>{data.deviceFirmwareVersion}</Badge>,
        "Hardware Version": <Badge>{data.deviceHardwareVersion}</Badge>,
        "FW Update Scheduled": (
          <Badge color={data.firmwareUpdateScheduled ? BadgeColor.Purple : BadgeColor.Blue}>
            {data.firmwareUpdateScheduled ? "True" : "False"}
          </Badge>
        ),
      }
    : { "Firmware Version": "", "Hardware Version": "", "FW Update Scheduled": "" };

  const handleUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      toast.success(`Firmware ${selectedVersion} update started`);
    }, MOCK_UPDATE_DURATION_MS);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Heading processing={isFetching}>
          <CpuChipIcon className="w-7 h-7 mr-1" />
          Firmware
        </Heading>
        <DictionaryList dictionary={tableData} processing={isPending} error={isError ? error.message : undefined} />
      </div>

      <div className="space-y-4 rounded-lg border bg-background p-4">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold leading-none tracking-tight">Firmware Update</h2>
          <p className="text-sm text-muted-foreground">Select an available firmware version and start the update.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedVersion} onValueChange={setSelectedVersion} disabled={isUpdating}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select firmware version" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_AVAILABLE_FIRMWARE.map((fw) => (
                <SelectItem key={fw.version} value={fw.version}>
                  {fw.version} ({fw.notes})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <GuardedButton
            deviceId={deviceId}
            permissionKey={PERMISSION_KEYS.DEVICE_SMARTEMS_TEMPLATE_APPLY}
            disabled={!selectedVersion || isUpdating}
            onClick={handleUpdate}
          >
            {isUpdating && <WaterLoader />}
            {isUpdating ? "Updating..." : "Update Firmware"}
          </GuardedButton>
        </div>
      </div>
    </div>
  );
}
