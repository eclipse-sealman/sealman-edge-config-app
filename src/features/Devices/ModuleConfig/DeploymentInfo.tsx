import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import Badge, { BadgeColor } from "../../../components/Typography/Badge";
import { Heading } from "../../../components/Typography/Heading";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { edgeConfigApi } from "../../../api/edgeConfig/edgeConfigApi";
import DictionaryList, { DictionaryListEntries } from "../../../components/Table/DictionaryList";
import useGetComposeDeploymentStatus from "@/generated/edge-administration/hooks/useGetComposeDeploymentStatus";

interface DeploymentInfoData {
  deviceId: string;
  deploymentId?: string | null;
  success: boolean;
}

function DeploymentRow({ info }: { info?: DeploymentInfoData | null }) {
  if (!info?.deploymentId) return <Badge color={BadgeColor.Gray}>None</Badge>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge color={BadgeColor.Blue}>{info.deploymentId}</Badge>
      <Badge color={info.success ? BadgeColor.Green : BadgeColor.Yellow}>{info.success ? "Success" : "Pending"}</Badge>
    </div>
  );
}

export default function DeploymentInfo() {
  const { deviceId = "" } = useParams();

  const iotEdge = useQuery<DeploymentInfoData, AxiosError>({
    queryKey: ["getDeploymentStatus", deviceId],
    queryFn: () => edgeConfigApi.getDeploymentStatus(deviceId),
    refetchInterval: 30000, // Polling
  });
  const compose = useGetComposeDeploymentStatus(deviceId);

  const tableData: DictionaryListEntries = {
    "IoTEdge-Deployment": <DeploymentRow info={iotEdge.data} />,
    "Compose Deployment": <DeploymentRow info={compose.data} />,
  };

  const errorMessage = iotEdge.isError ? `${iotEdge.error.message}` : undefined;

  return (
    <div>
      <Heading processing={iotEdge.isFetching || compose.isFetching}>
        <InformationCircleIcon className="w-7 h-7 mr-1" />
        Module Deployment
      </Heading>
      <DictionaryList dictionary={tableData} processing={iotEdge.isPending} error={errorMessage} />
    </div>
  );
}
