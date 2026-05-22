import { useParams } from "react-router-dom";
import Badge, { BadgeColor } from "../../../components/Typography/Badge";
import { Heading, HeadingColor } from "../../../components/Typography/Heading";
import { SignalIcon } from "@heroicons/react/24/outline";
import DictionaryList, { DictionaryListEntries } from "../../../components/Table/DictionaryList";
import { edgeConfigApiHooks } from "../../../api/edgeConfig/edgeConfigApiHooks";

export default function ConnectionStatus() {
  const { deviceId } = useParams();

  const { isPending, isError, data: connectionStatus, error, isFetching } = edgeConfigApiHooks.useGetDeviceConnectionStatus(deviceId);

  let tableData: DictionaryListEntries = {
    "IoT-Edge Runtime": "",
    "IoT-Hub": "",
    "Smart-EMS": "",
  }

  if (connectionStatus) {
    tableData = {
      "IoT-Edge Runtime": <Badge color={(connectionStatus.iotEdgeRuntime === "Connected") ? BadgeColor.Green : BadgeColor.Red}>{(connectionStatus.iotEdgeRuntime === "Connected") ? "Connected" : "Disconnected"}</Badge>,
      "IoT-Hub": <Badge color={(connectionStatus.iotHub === "Connected") ? BadgeColor.Green : BadgeColor.Red}>{(connectionStatus.iotHub === "Connected") ? "Connected" : "Disconnected"}</Badge>,
      "Smart-EMS": <Badge color={(connectionStatus.sems === "Connected") ? BadgeColor.Green : BadgeColor.Red}>{(connectionStatus.sems === "Connected") ? "Connected" : "Disconnected"}</Badge>,
    }

    if (connectionStatus.vpn !== undefined) {
      tableData["VPN"] = <Badge color={(connectionStatus.vpn === "Connected") ? BadgeColor.Green : BadgeColor.Red}>{(connectionStatus.vpn === "Connected") ? "Connected" : "Disconnected"}</Badge>
    }
  }

  const errorMessage = isError ? `${error.message}` : undefined

  return (
    <div>
      <Heading processing={isFetching} color={HeadingColor.Gray}><SignalIcon className="w-7 h-7 mr-1" />Connection Status</Heading>
      <DictionaryList dictionary={tableData} processing={isPending} error={errorMessage}/>
    </div>
  )
}
