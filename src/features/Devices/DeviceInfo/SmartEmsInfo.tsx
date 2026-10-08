import Badge from "../../../components/Typography/Badge";
import { Heading } from "../../../components/Typography/Heading";
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
    "Last Seen At": "",
    "Hardware Version": "",
    "Firmware Version": "",
    "Cellular": "",
  };

  if (data)
    tableData = {
      "Last Seen At": <Badge>{lastSeenAt ? new Date(lastSeenAt).toLocaleString() : "Unknown"}</Badge>,
      "Hardware Version": <Badge>{data.hardwareVersion}</Badge>,
      "Firmware Version": <Badge>{data.firmwareVersion}</Badge>,
      "Cellular": <div> <Badge>{data.cellular ? "True" : "False"}</Badge> </div>,
    };

  const errorMessage = isError ? `${error?.message}` : undefined;

  return (
    <div>
      <Heading processing={isFetching} description="Hardware and firmware of the Smart-EMS."><InformationCircleIcon className="w-5 h-5" />Device Information</Heading>
      <DictionaryList dictionary={tableData} processing={isPending} error={errorMessage} />
    </div>
  )
}