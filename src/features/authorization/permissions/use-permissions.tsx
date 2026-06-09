import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";
import { useQuery } from "@tanstack/react-query";
import { noPermissionForActionMessage } from "./no-permission-tooltip-utils";
import { PERMISSION_KEYS, type PermissionKey } from "./permission-keys";

interface PermissionsResponse {
  ResourceId?: string;
  Permissions: string[];
}

export interface UsePermissionsOutput {
  hasPermission: boolean;
  noPermissionsMessage?: string;
  isLoading?: boolean;
}

export interface UsePermissionsOptions {
  deviceId?: string;
  permissionKey: PermissionKey;
}

let mockPermissions = false;
export function setMockPermission(){
  mockPermissions = true;
}

export function usePermissions({
  deviceId,
  permissionKey
}: UsePermissionsOptions): UsePermissionsOutput {
  const { data, isLoading } = useQuery<PermissionsResponse>({
    queryKey: ["permissions", deviceId],
    queryFn: async () => mockPermissions ? authPermissionsResponseBody : edgeConfigApi.getPermissions(deviceId),
  });

  const hasPermission = data?.Permissions?.includes(permissionKey) ?? false;
  const noPermissionsMessage = !hasPermission ? noPermissionForActionMessage({permissionKey, deviceId: deviceId!}) : undefined;
  return { hasPermission: hasPermission, noPermissionsMessage, isLoading: isLoading };
}

const authPermissionsResponseBody = {
    "DeviceId": "eg-23004254",
    "Permissions": Object.values(PERMISSION_KEYS)
};
