import DictionaryList, { DictionaryListEntries } from "@/components/Table/DictionaryList";
import { Heading } from "@/components/Typography/Heading";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import RequestPassword from "./RequestPassword";
import { useParams } from "react-router-dom";
import RenewPassword from "./RenewPassword";

export default function SecurityInformation() {
  const { deviceId } = useParams();

  if (!deviceId) {
    return null;
  }

  const tableData: DictionaryListEntries = {
    "Device Password": <RequestPassword deviceId={deviceId} />,
    "Device Password Last Updated": <RenewPassword deviceId={deviceId} />,
  };

  return (
    <div>
      <Heading processing={false} description="Access credentials of this device.">
        <InformationCircleIcon className="w-5 h-5" />
        Device Security
      </Heading>
      <DictionaryList dictionary={tableData} processing={false} error={""} />
    </div>
  );
}
