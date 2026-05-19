import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";
import { useQuery } from "@tanstack/react-query";
import { noPermissionForActionMessage } from "./no-permission-tooltip-utils";

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
  permissionKey: string;
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
    "Permissions": [
        "add_module",
        "discover_network",
        "edit_ip_static",
        "edit_module_config_status",
        "edit_module_names",
        "edit_module_twin_config",
        "edit_network",
        "edit_password",
        "edit_smartems_config_cellular",
        "edit_smartems_config_lan",
        "edit_smartems_config_nat",
        "edit_smartems_description",
        "edit_tags",
        "execute_smartems_check",
        "execute_module_method",
        "export_smartems_config",
        "read",
        "read_cmd_config",
        "read_cmd_fw_config",
        "read_cmd_status",
        "read_connection_status",
        "read_deployment_list",
        "read_events",
        "read_ip_config",
        "read_lan_config",
        "read_metrics",
        "read_modules",
        "read_module_deployment_status",
        "read_module_twin_config",
        "read_password",
        "read_smartems_check",
        "read_smartems_config_cellular",
        "read_smartems_config_lan",
        "read_smartems_config_nat",
        "read_smartems_device_info",
        "read_smartems_firmware_status",
        "read_tags",
        "read_vnc",
        "remove_module",
        "write_vnc"
    ]
};
