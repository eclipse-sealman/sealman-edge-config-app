import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";
import { useQuery } from "@tanstack/react-query";
import { noPermissionForActionMessage } from "./no-permission-tooltip-utils";
import { PERMISSION_KEYS, type PermissionKey } from "./permission-keys";

interface PermissionsResponse {
  ResourceType: string;
  ResourceId?: string;
  Permissions: string[];
}

export interface UsePermissionsOutput {
  hasPermission: boolean;
  noPermissionsMessage?: string;
  isLoading?: boolean;
}

export interface UsePermissionsOptions {
  resourceType: string;
  resourceId?: string;
  permissionKey: PermissionKey;
}

let mockPermissions = false;
export function setMockPermission(){
  mockPermissions = true;
}

export function usePermissions({
  resourceType,
  resourceId,
  permissionKey
}: UsePermissionsOptions): UsePermissionsOutput {
  const { data, isLoading } = useQuery<PermissionsResponse>({
    queryKey: ["permissions", resourceType, resourceId],
    queryFn: async () => mockPermissions ? authPermissionsResponseBody : edgeConfigApi.getPermissions(resourceType, resourceId),
  });

  const hasPermission = data?.Permissions?.includes(permissionKey) ?? false;
  const noPermissionsMessage = !hasPermission ? noPermissionForActionMessage({permissionKey, resourceType, resourceId: resourceId!}) : undefined;
  return { hasPermission: hasPermission, noPermissionsMessage, isLoading: isLoading };
}

const authPermissionsResponseBody = {
    "ResourceType": "device",
    "ResourceId": "eg-23004254",
    "Permissions": Object.values(PERMISSION_KEYS)
};
