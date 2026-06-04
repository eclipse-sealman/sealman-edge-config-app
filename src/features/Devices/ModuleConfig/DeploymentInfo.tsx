import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
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

  const sortedDeployments = useMemo(() => {
    if (!deployments) {
      return [];
    }

    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: "base",
    });

    return [...deployments].sort((a, b) => collator.compare(a.id, b.id));
  }, [deployments]);

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
    mutationFn: (newDeployment: Deployment) =>
      edgeConfigApi.putDeploymentTag(deviceId, newDeployment.targetCondition),
    onSuccess: (_data, newDeployment) => {
      toast.success(`Successfully set new base deployment`);
      setIsEditing(false);
      setSelectedDeploymentId(newDeployment.id);
        queryClient.setQueryData<DeploymentInfoData | undefined>(
          ["getDeploymentStatus", deviceId],
          (previous) =>
            previous
              ? {
                  ...previous,
                  deploymentId: newDeployment.id,
                }
              : previous
        );
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
          {sortedDeployments.map((deployment) => (
            <option key={deployment.id} value={deployment.id}>
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
  const selectedDeployment = sortedDeployments.find(
    (deployment) => deployment.id === selectedDeploymentId
  );

  return (
    <div className="space-y-4">
      <div>
        <Heading processing={isFetching}>
          <InformationCircleIcon className="w-7 h-7 mr-1" />
          Module Deployment
          {isEditing ? (
            <>
              <HeadingButton
                onClick={() => {
                  if (!selectedDeployment) {
                    return;
                  }
                  putDeploymentMutation.mutate(selectedDeployment);
                }}
              >
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
              resourceType="device"
              deviceId={deviceId}
              onClick={() => {
                const currentDeployment = sortedDeployments.find(
                  (d) => d.id === deploymentInfo?.deploymentId
                );
                setSelectedDeploymentId(
                  currentDeployment?.id || deploymentInfo?.deploymentId || ""
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
