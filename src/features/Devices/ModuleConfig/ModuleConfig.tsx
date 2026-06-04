import { useState } from "react";
import Button from "../../../components/Input/Button";
import { useParams } from "react-router-dom";
import JsonEditor from "../../../components/Input/JsonEditor";
import { edgeConfigApiHooks } from "../../../api/edgeConfig/edgeConfigApiHooks";
import { toast } from "react-toastify";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

interface ModuleConfigProps {
  moduleName: string;
  appMessage?: string;
  moduleStatus: string;
}

const GuardedButton = withPermissionRequiredTooltip(Button);

export default function ModuleConfig({
  moduleName,
  appMessage,
  moduleStatus,
}: ModuleConfigProps) {
  const { deviceId } = useParams();

  const {
    data: config,
    isPending,
    isError,
    error,
    refetch,
  } = edgeConfigApiHooks.useGetTwinConfig<string>(deviceId, moduleName, {
    select: (data) => JSON.stringify(data, null, 4),
    staleTime: Infinity,
  });

  if (isPending) return <>Loading</>;

  if (isError) {
    return (
      <>
        <div className="flex my-2 gap-2">
          <div className="grow bg-red-100 border border-red-400 p-2">
            Could not retrieve twin config. {error.code}{" "}
            {JSON.stringify(error.response?.data)}
          </div>
          <Button onClick={() => refetch()} processing={isPending}>
            Retry
          </Button>
        </div>
        <JsonForm
          moduleName={moduleName}
          appMessage={appMessage}
          moduleStatus={moduleStatus}
          data={""}
        />
      </>
    );
  }

  return (
    <JsonForm
      moduleName={moduleName}
      appMessage={appMessage}
      moduleStatus={moduleStatus}
      data={config}
    />
  );
}

interface JsonFormProps {
  moduleName: string;
  appMessage?: string;
  moduleStatus: string;
  data: string;
}
function JsonForm({
  moduleName,
  appMessage,
  moduleStatus,
  data,
}: JsonFormProps) {
  const [twinConfigForm, setTwinConfig] = useState(data);
  const { deviceId } = useParams();
  if (!deviceId) throw new Error("No deviceId provided");

  const usePostTwinConfig = edgeConfigApiHooks.usePostTwinConfig(deviceId, moduleName);

  const onSetTwinConfig = () => {
    usePostTwinConfig.mutate(twinConfigForm, {
      onSuccess: () => {
        toast.success(`Success: Scheduled config update for ${moduleName}.`);
      },
      onError: (err) => {
        const errData: any = err.response?.data;
        toast.error(`Error: ${JSON.stringify(errData.message)}`);
      },
    });
  };

  const handleFormChange = (newValue: string) => {
    setTwinConfig(newValue);
  };

  return (
    <>
      <div className="h-[calc(100%-8rem)] md:h-[calc(100%-5rem)]">
        <JsonEditor value={twinConfigForm} onChange={handleFormChange} />
      </div>
      {appMessage &&
        appMessage !== "configuration successfull" &&
        appMessage !== "configuration successful" && (
          <div className="max-h-36 overflow-y-auto bg-red-100 border border-red-400 mt-2 p-2">
            {appMessage}
          </div>
        )}
      {moduleStatus === "delete_scheduled" ||
      moduleStatus === "deploy_scheduled" ? (
        <div className="max-h-36 overflow-y-auto bg-yellow-100 border border-yellow-400 mt-2 p-2">
          Cannot set Twin config in current Module-State
        </div>
      ) : (
        <div className="flex items-center">
          <GuardedButton
              resourceType="device"
              deviceId={deviceId}
              permissionKey={PERMISSION_KEYS.DEVICE_MODULE_TWIN_CONFIG_WRITE}
              processing={usePostTwinConfig.isPending}
              className="mt-2"
              onClick={() => onSetTwinConfig()}
            >
              Set Twin Config
          </GuardedButton>

          <span className="ml-2">
            ⚠️ Changes may take a few seconds to apply. If you reopen this modal
            immediately, you might still see the old values. Please wait a
            moment and try again.
          </span>
        </div>
      )}
    </>
  );
}
