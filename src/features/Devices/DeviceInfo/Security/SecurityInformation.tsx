import DictionaryList, { DictionaryListEntries } from "@/components/Table/DictionaryList";
import { Heading, HeadingColor } from "@/components/Typography/Heading";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import RequestPassword from "./RequestPassword";
import { useParams } from "react-router-dom";
import RenewPassword from "./RenewPassword";
import { isDevicePasswordEnabled } from "@/config/devicePassword";
import { ErrorState, InlineAlert, LoadingState } from "@/components/ui/page-state";
import { usePermissions } from "@/features/authorization/permissions/use-permissions";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import useGetDevicePasswordInfo from "@/generated/edge-administration/hooks/useGetDevicePasswordInfo";
import { getErrorMessage, isForbidden } from "@/lib/errors";
import { useAuth } from "@/auth";
import { useState } from "react";
import type { components } from "@/generated/edge-administration/types";
import PasswordRenewalStatus from "./PasswordRenewalStatus";
import { passwordTimestamp } from "./passwordTimestamp";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function SecurityInformation() {
  const { deviceId } = useParams();

  if (!deviceId || !isDevicePasswordEnabled()) {
    return null;
  }

  return <SecurityContent key={deviceId} deviceId={deviceId} />;
}

function SecurityContent({ deviceId }: { deviceId: string }) {
  const auth = useAuth();
  const readDevice = usePermissions({ deviceId, permissionKey: PERMISSION_KEYS.DEVICE_READ });
  const readPassword = usePermissions({ deviceId, permissionKey: PERMISSION_KEYS.DEVICE_PASSWORD_READ });
  const writePassword = usePermissions({ deviceId, permissionKey: PERMISSION_KEYS.DEVICE_PASSWORD_WRITE });
  const { data, isPending, isError, error, refetch } = useGetDevicePasswordInfo(deviceId, readDevice.hasPermission);

  if (readDevice.isLoading) return <LoadingState label="Checking device permissions..." />;
  if (!readDevice.hasPermission) {
    return <InlineAlert>{readDevice.isError ? `Could not check device permissions: ${getErrorMessage(readDevice.error)}` : readDevice.noPermissionsMessage}</InlineAlert>;
  }
  if (isError) {
    return <ErrorState title={isForbidden(error) ? "Not permitted" : "Could not load password information"} message={getErrorMessage(error)} onRetry={() => { void refetch(); }} />;
  }
  if (isPending) return <LoadingState label="Loading password information..." />;
  if (!data.deviceTypeHasAuthSecret) return <InlineAlert variant="info">Password not configured for this device type. {data.error}</InlineAlert>;
  if (data.error) return <ErrorState title="Could not load password information" message={data.error} onRetry={() => { void refetch(); }} />;
  if (!data.id) return <InlineAlert variant="info">Password for the device does not exist and will be auto-generated on next communication.</InlineAlert>;

  const scope = JSON.stringify([deviceId, auth.user?.iss, auth.user?.sub, readPassword.hasPermission, writePassword.hasPermission]);
  return (
    <SecurityDetails
      key={scope}
      deviceId={deviceId}
      info={data}
      canRead={readPassword.hasPermission}
      canRenew={writePassword.hasPermission}
      readMessage={readPassword.noPermissionsMessage}
      writeMessage={writePassword.noPermissionsMessage}
    />
  );
}

function SecurityDetails({ deviceId, info, canRead, canRenew, readMessage, writeMessage }: {
  deviceId: string;
  info: components["schemas"]["DeviceSecretInformation"];
  canRead: boolean;
  canRenew: boolean;
  readMessage?: string;
  writeMessage?: string;
}) {
  const [revealVersion, setRevealVersion] = useState(0);
  const tableData: DictionaryListEntries = {
    "Device Password": <RequestPassword key={JSON.stringify([revealVersion, info.forceRenewal, info.secretUpdatedAt])} deviceId={deviceId} canRead={canRead} noPermissionsMessage={readMessage} />,
    "Device Password Last Updated": (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span>{info.secretUpdatedAt ? `Last updated: ${passwordTimestamp(info.secretUpdatedAt)}` : info.secretCreatedAt ? `Created: ${passwordTimestamp(info.secretCreatedAt)}` : "Date not available."}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="About the password date" className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2">
                  <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">Date recorded by the password service.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <RenewPassword deviceId={deviceId} info={info} canRenew={canRenew} noPermissionsMessage={writeMessage} onRenewalStart={() => setRevealVersion((value) => value + 1)} />
        <PasswordRenewalStatus task={info.renewalTask ?? null} />
      </div>
    ),
  };

  return (
    <div>
      <Heading processing={false} color={HeadingColor.Gray}>
        <InformationCircleIcon className="w-7 h-7 mr-1" />
        Device Security
      </Heading>
      <DictionaryList dictionary={tableData} processing={false} error={""} />
    </div>
  );
}
