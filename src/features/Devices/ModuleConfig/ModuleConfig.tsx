import { useState } from "react";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import Button from "../../../components/Input/Button";
import { Button as UiButton } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

  if (isPending) return <p className="text-sm text-muted-foreground">Loading twin config...</p>;

  if (isError) {
    return (
      <div className="flex h-full flex-col gap-3">
        <Alert variant="destructive" className="shrink-0">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Could not retrieve twin config</AlertTitle>
          <AlertDescription className="flex items-start justify-between gap-4">
            <span className="break-all">
              {error.code} {JSON.stringify(error.response?.data)}
            </span>
            <UiButton type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </UiButton>
          </AlertDescription>
        </Alert>
        <div className="min-h-0 flex-1">
          <JsonForm
            moduleName={moduleName}
            appMessage={appMessage}
            moduleStatus={moduleStatus}
            data={""}
          />
        </div>
      </div>
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
    <div className="flex h-full flex-col gap-3">
      <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
        <JsonEditor value={twinConfigForm} onChange={handleFormChange} />
      </div>
      {appMessage &&
        appMessage !== "configuration successfull" &&
        appMessage !== "configuration successful" && (
          <Alert variant="destructive" className="max-h-36 shrink-0 overflow-y-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Module reported a configuration error</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap break-words">{appMessage}</AlertDescription>
          </Alert>
        )}
      {moduleStatus === "delete_scheduled" ||
      moduleStatus === "deploy_scheduled" ? (
        <Alert className="shrink-0 border-amber-200 bg-amber-50 text-amber-800 [&>svg]:text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Cannot set Twin config in current Module-State</AlertDescription>
        </Alert>
      ) : (
        <div className="flex shrink-0 items-center gap-3">
          <GuardedButton
            deviceId={deviceId}
            permissionKey={PERMISSION_KEYS.DEVICE_MODULE_TWIN_CONFIG_WRITE}
            processing={usePostTwinConfig.isPending}
            onClick={() => onSetTwinConfig()}
          >
            Set Twin Config
          </GuardedButton>

          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" />
            Changes may take a few seconds to apply. If you reopen this dialog
            immediately, you might still see the old values.
          </p>
        </div>
      )}
    </div>
  );
}
