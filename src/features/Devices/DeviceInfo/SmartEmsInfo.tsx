import Badge, { BadgeColor } from "../../../components/Typography/Badge";
import { Heading, HeadingColor } from "../../../components/Typography/Heading";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import DictionaryList, { DictionaryListEntries } from "../../../components/Table/DictionaryList";
import { components } from "@/generated/edge-administration/types";
import { ApiError } from "@/generated/edge-administration/api";

type DeviceDetailResponse = components["schemas"]["DeviceDetailResponse"];

export interface SmartEmsInfoProps {
  data?: DeviceDetailResponse;
  lastSeenAt?: string | null;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  error?: ApiError | null;
}

export default function SmartEmsInfo({ data, lastSeenAt, isPending, isFetching, isError, error }: SmartEmsInfoProps) {
  let tableData: DictionaryListEntries = {
    "Smart-EMS Status": "",
    "Last Seen At": "",
    "Hardware Version": "",
    "FW Update Scheduled": "",
    "Firmware Version": "",
    "Template": "",
    "Cellular": "",
  };

  if (data)
    tableData = {
      "Smart-EMS Status": <Badge color={data.enabled ? BadgeColor.Green : BadgeColor.Red}>{data.enabled ? "Enabled" : "Disabled"}</Badge>,
      "Last Seen At": <Badge>{lastSeenAt ? new Date(lastSeenAt).toLocaleString() : "Unknown"}</Badge>,
      "Hardware Version": <Badge>{data.hardwareVersion}</Badge>,
      "FW Update Scheduled": <Badge color={data.updateFirmware ? BadgeColor.Purple : BadgeColor.Blue}>{data.updateFirmware ? "True" : "False"}</Badge>,
      "Firmware Version": <Badge>{data.firmwareVersion}</Badge>,
      "Template": <Badge>{data.template}</Badge>,
      "Cellular": <div> <Badge>{data.cellular ? "True" : "False"}</Badge> </div>,
    };

  const errorMessage = isError ? `${error?.message}` : undefined;

  return (
    <div>
      <Heading processing={isFetching} color={HeadingColor.Gray}><InformationCircleIcon className="w-7 h-7 mr-1" />Device Information</Heading>
      <DictionaryList dictionary={tableData} processing={isPending} error={errorMessage} />
    </div>
  )
}