import { useParams } from "react-router-dom";
import Badge, { BadgeColor } from "../../../components/Typography/Badge";
import { Heading, HeadingColor } from "../../../components/Typography/Heading";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import DictionaryList, { DictionaryListEntries } from "../../../components/Table/DictionaryList";
import { edgeConfigApiHooks } from "../../../api/edgeConfig/edgeConfigApiHooks";


export default function SmartEmsInfo() {
  const { deviceId } = useParams();
  if (!deviceId) throw new Error("Device Id not defined")

  const { isPending, isError, data: smartEmsData, error, isFetching } = edgeConfigApiHooks.useGetSmartEmsInfo(deviceId);

  let cellular: boolean = false
    smartEmsData?.variables.forEach(function(obj){
      if (obj.toString === "cellular"){
          cellular = true
      }
    })

  let tableData: DictionaryListEntries = {
    "Smart-EMS Status": "",
    "Last Seen At": "",
    "Hardware Version": "",
    "FW Update Scheduled": "",
    "Firmware Version": "",
    "Template": "",
    "Cellular": "",
  }



  if (smartEmsData)

    tableData = {
      "Smart-EMS Status": <Badge color={smartEmsData.enabled ? BadgeColor.Green : BadgeColor.Red}>{smartEmsData.enabled ? "Enabled" : "Disabled"}</Badge>,
      "Last Seen At": <Badge>{new Date(smartEmsData.lastSeenAt).toLocaleString()}</Badge>,
      "Hardware Version": <Badge>{smartEmsData.hardwareVersion}</Badge>,
      "FW Update Scheduled": <Badge color={smartEmsData.updateFirmware ? BadgeColor.Purple : BadgeColor.Blue}>{smartEmsData.updateFirmware ? "True" : "False"}</Badge>,
      "Firmware Version":  <Badge>{smartEmsData.firmwareVersion}</Badge>,
      "Template": <Badge>{smartEmsData.template.toString}</Badge>,
      "Cellular":<div> <Badge>{cellular? "True" : "False"}</Badge> </div>,
    }

  const errorMessage = isError ? `${error.message}` : undefined

  return (
    <div>
      <Heading processing={isFetching} color={HeadingColor.Gray}><InformationCircleIcon className="w-7 h-7 mr-1" />SMART EMS Information</Heading>
      <DictionaryList dictionary={tableData} processing={isPending} error={errorMessage}/>

    </div>
  )
}
