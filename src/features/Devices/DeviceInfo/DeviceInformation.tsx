import Badge, { BadgeColor } from "@/components/Typography/Badge";
import DictionaryList, { DictionaryListEntries } from "@/components/Table/DictionaryList";
import { formatMetadataValue } from "@/features/PlatformTypes/FieldValueInput";
import { components } from "@/generated/edge-administration/types";
import { ApiError } from "@/generated/edge-administration/api";

type DeviceDetailResponse = components["schemas"]["DeviceDetailResponse"];

export interface DeviceInformationProps {
  data?: DeviceDetailResponse;
  isPending: boolean;
  isError: boolean;
  error?: ApiError | null;
}

/** Read-only: device facts first, then every metadata value. Metadata is edited on the Assets tab. */
export default function DeviceInformation({ data, isPending, isError, error }: DeviceInformationProps) {
  const entries: DictionaryListEntries = {
    "Hardware Version": "",
    "Firmware Version": "",
    Cellular: "",
    "Last Seen At (SEMS)": "",
  };

  if (data) {
    entries["Hardware Version"] = <Badge>{data.hardwareVersion}</Badge>;
    entries["Firmware Version"] = <Badge>{data.firmwareVersion}</Badge>;
    entries.Cellular = <Badge color={data.cellular ? BadgeColor.Green : BadgeColor.Blue}>{data.cellular ? "Yes" : "No"}</Badge>;
    entries["Last Seen At (SEMS)"] = <Badge>{data.lastSeenAt ? new Date(data.lastSeenAt).toLocaleString() : "Unknown"}</Badge>;

    const metadata = Object.entries(data.deviceMetadata ?? {})
      .map(([key, entry]) => [entry.field?.label ?? key, formatMetadataValue(entry.value, entry.field ?? { type: "string" })] as const)
      .sort(([a], [b]) => a.localeCompare(b));
    for (const [label, value] of metadata) entries[label] = value;
  }

  return <DictionaryList dictionary={entries} processing={isPending} error={isError ? `${error?.message}` : undefined} />;
}
