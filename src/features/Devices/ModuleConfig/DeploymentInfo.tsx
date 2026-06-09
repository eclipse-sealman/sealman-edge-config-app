import { useParams } from "react-router-dom";
import { useState } from "react";
import Badge, { BadgeColor } from "../../../components/Typography/Badge";
import { Heading, HeadingButton } from "../../../components/Typography/Heading";
import {
  InformationCircleIcon,
  PencilSquareIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { edgeConfigApi } from "../../../api/edgeConfig/edgeConfigApi";
import { AxiosError } from "axios";
import DictionaryList, {
  DictionaryListEntries,
} from "../../../components/Table/DictionaryList";
import { toast } from "react-toastify";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

interface DeploymentInfoData {
  deviceId: string;
  deploymentId: string;
  priority: number;
  targeted: boolean;
  applied: boolean;
  success: boolean;
}

const GuardedHeadingButton = withPermissionRequiredTooltip(HeadingButton);

interface Deployment {
  id: string;
  targetCondition: string;
}

export default function DeploymentInfo() {
  const { deviceId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string>("");

  const queryClient = useQueryClient();

  const { data: deployments } = useQuery<Deployment[], AxiosError>({
    queryKey: ["getDeployments"],
    queryFn: () => edgeConfigApi.getDeployments(),
    refetchInterval: 30000,
  });

  const {
    data: deploymentInfo,
    isPending,
    isError,
    error,
    isFetching,
  } = useQuery<DeploymentInfoData, AxiosError>({
    queryKey: ["getDeploymentStatus", deviceId],
    queryFn: () => edgeConfigApi.getDeploymentStatus(deviceId),
    refetchInterval: 30000, // Polling
  });

  const putDeploymentMutation = useMutation({
    mutationFn: (newDeploymentId: string) =>
      edgeConfigApi.putDeploymentTag(deviceId, newDeploymentId),
    onSuccess: () => {
      toast.success(`Successfully set new base deployment`);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["getDeploymentStatus", deviceId] });
    },
  });

  let tableData: DictionaryListEntries = {
    "Deployment-ID": "",
    Applied: "",
    Success: "",
  };

  if (deploymentInfo) {
    tableData = {
      "Base Deployment": isEditing ? (
        <select
          value={selectedDeploymentId}
          onChange={(e) => setSelectedDeploymentId(e.target.value)}
        >
          {deployments &&
            deployments.map((deployment) => (
              <option
                key={deployment.targetCondition}
                value={deployment.targetCondition}
              >
                {deployment.id}
              </option>
            ))}
        </select>
      ) : (
        <Badge color={BadgeColor.Blue}>{deploymentInfo.deploymentId}</Badge>
      ),
      Applied: (
        <Badge
          color={deploymentInfo.applied ? BadgeColor.Green : BadgeColor.Red}
        >
          {deploymentInfo.applied ? "True" : "False"}
        </Badge>
      ),
      Success: (
        <Badge
          color={deploymentInfo.success ? BadgeColor.Green : BadgeColor.Red}
        >
          {deploymentInfo.success ? "True" : "False"}
        </Badge>
      ),
    };
  }

  const errorMessage = isError ? `${error.message}` : undefined;

  return (
    <div className="space-y-4">
      <div>
        <Heading processing={isFetching}>
          <InformationCircleIcon className="w-7 h-7 mr-1" />
          Module Deployment
          {isEditing ? (
            <>
              <HeadingButton onClick={() => putDeploymentMutation.mutate(selectedDeploymentId)}>
                <PencilSquareIcon className="w-7 h-7 ml-2 cursor-pointer" />
                Save
              </HeadingButton>
              <HeadingButton onClick={() => setIsEditing(false)}>
                <XMarkIcon className="w-7 h-7 ml-2 cursor-pointer" />
                Cancel
              </HeadingButton>
            </>
          ) : (
            <GuardedHeadingButton
              permissionKey={PERMISSION_KEYS.DEVICE_DEPLOYMENT_WRITE}
              deviceId={deviceId}
              onClick={() => {
                const currentDeployment = deployments?.find(
                  (d) => d.id === deploymentInfo?.deploymentId
                );
                setSelectedDeploymentId(
                  currentDeployment?.targetCondition || ""
                );
                setIsEditing(true);
              }}
            >
              <PencilSquareIcon className="w-7 h-7 ml-2 cursor-pointer" />
              Edit
            </GuardedHeadingButton>
          )}
        </Heading>
        <DictionaryList
          dictionary={tableData}
          processing={isPending}
          error={errorMessage}
        />
      </div>
    </div>
  );
}
