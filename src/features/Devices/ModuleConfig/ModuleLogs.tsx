import { useState } from "react";
import { edgeConfigApi } from "../../../api/edgeConfig/edgeConfigApi";
import React from "react";
import Button from "../../../components/Input/Button";
import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import JsonEditor from "../../../components/Input/JsonEditor";
import { usePermissions } from "@/features/authorization/permissions/use-permissions";
import { NoPermissionsPanel } from "@/features/authorization/permissions/NoPermissionsPanel";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

interface LogData {
  payload: [
    {
      id: string;
      payload: string;
    }
  ];
}

export default function ModuleLogs({ moduleName }: { moduleName: string }) {
  const [lineNumber, setLineNumber] = useState(25);
  const { deviceId } = useParams();

  const { data, isPending, isFetching, isError, error, refetch } = useQuery<
    LogData,
    AxiosError
  >({
    queryKey: ["getModuleLogs", deviceId, moduleName],
    queryFn: () => {
      const payload = {
        methodName: "GetModuleLogs",
        methodPayload: {
          schemaVersion: "1.0",
          items: [
            {
              id: moduleName,
              filter: {
                tail: lineNumber,
              },
            },
          ],
          encoding: "none",
          contentType: "text",
        },
      };
      return edgeConfigApi.invokeDirectMethod(deviceId, "$edgeAgent", payload);
    },
  });

  const handleFormChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = ev.target;
    setLineNumber(Number(value));
  };

  const { hasPermission, noPermissionsMessage } = usePermissions({
    deviceId: deviceId,
    permissionKey: PERMISSION_KEYS.DEVICE_MODULE_EXECUTE_METHOD,
  });

  if (!hasPermission) {
    return <NoPermissionsPanel>{noPermissionsMessage}</NoPermissionsPanel>;
  }

  if (isPending) return <p className="text-sm text-muted-foreground">Loading logs...</p>;

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error: {error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
        <JsonEditor value={data.payload[0]?.payload} readOnly={true} />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <label htmlFor="lineNumber" className="text-sm font-medium">
          Lines
        </label>
        <Input
          id="lineNumber"
          type="number"
          name="lineNumber"
          className="w-28"
          value={lineNumber}
          onChange={handleFormChange}
        />
        <Button onClick={() => refetch()} processing={isFetching}>
          Get Module Logs
        </Button>
      </div>
    </div>
  );
}
