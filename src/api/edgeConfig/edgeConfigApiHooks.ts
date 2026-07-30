import { AxiosError } from "axios";
import { useMutation, useQuery, UseQueryOptions } from "@tanstack/react-query";

import { edgeConfigApi } from "./edgeConfigApi";
import { queryClient } from "../../config/queryConfig";
import { InterfaceData } from "./interfaces";
import type { components } from "@/generated/edge-administration/types";

type ScopeResponse = components["schemas"]["ScopeResponse"];
type RoleResponse = components["schemas"]["RoleResponse"];
type RoleDetailsResponse = components["schemas"]["RoleDetailsResponse"];
type ActionResponse = components["schemas"]["ActionResponse"];
type TeamListItemResponse = components["schemas"]["TeamListItemResponse"];
type TeamDetailsResponse = components["schemas"]["TeamDetailsResponse"];

export interface DeviceData {
  deviceId: string;
  typeId: string;
  countryCode?: string;
  deviceMetadata: {
    [key: string]: {
      value: unknown;
      source: "device" | "platform";
    };
  };
  createdAt?: string | null | undefined;
  updatedAt?: string | null | undefined;
  deviceStatus: "Connected" | "Disconnected";
  lastSeenAt?: string | null | undefined;
  lastSeenInRange?: boolean | null | undefined;
  lastSeenRangeInDays?: number | null | undefined;
  iotEdgeRuntime: string;
  iotHub: string;
  sems: string;
  vpn: string;
}

type ScopeDetailsResponse = components["schemas"]["ScopeDetailsResponse"];
type ScopeWritePayload = {
  name: string;
  description: string | null;
  attr: Record<string, unknown>;
  access_rule: "ALL" | "ANY";
};

// The following two hooks are almost the same, this is a hack to have two different hooks available with different caching behavior
const useGetDevice = (deviceId?: string) =>
  useQuery<DeviceData, AxiosError>({
    queryKey: ["device", deviceId],
    queryFn: () => edgeConfigApi.getDevice(deviceId),
  });

export interface ModuleData {
  moduleName: string;
  moduleId: string;
  connectionState: string;
  deploymentType: string;
  moduleType: string;
  status: string;
  version: string;
  appMessage?: string;
  appStatus?: string;
  confStatus?: string;
  desiredConfId?: string;
  reportedConfId?: string;
}

const useGetModules = (
  deviceId: string | undefined,
  queryOptions?: Omit<UseQueryOptions<ModuleData[], Error>, "queryKey" | "queryFn">
) =>
  useQuery<ModuleData[], Error>({
    queryKey: ["getModules", deviceId],
    queryFn: () => edgeConfigApi.getModules(deviceId),
    refetchInterval: 8000,
    ...queryOptions,
  });

interface ConnectionStatusResponse {
  iotEdgeRuntime: string;
  iotHub: string;
  sems: string;
  vpn: string;
}

const useGetDeviceConnectionStatus = (deviceId: string | undefined) =>
  useQuery<ConnectionStatusResponse, AxiosError>({
    queryKey: ["getConnectionStatus", deviceId],
    queryFn: () => edgeConfigApi.getConnectionStatus(deviceId),
  });

export interface SmartEMSDescription {
  description: string;
}

const useGetSmartEmsConfigLan = (deviceId: string) =>
  useQuery<InterfaceData, AxiosError>({
    queryKey: ["getSmartEmsConfigLan", deviceId],
    queryFn: () => edgeConfigApi.getSmartEmsConfigLan(deviceId),
  });

export interface TwinConfig {
  subscriptions: Subscription[];
}

export interface Subscription {
  subscriptionName: string;
  requestedPublishingInterval: number;
  requestedLifetimeCount: number;
  requestedMaxKeepAliveCount: number;
  maxNotificationsPerPublish: number;
  publishingEnabled: boolean;
  priority: number;
  monitoredItemSamplingInterval: number;
  monitoredItemQueueSize: number;
  monitoredItemDiscardOldest: boolean;
  mqttOutput: {
    topic: string;
    messageFormat: string;
    qos: number;
  };
  edgeHubOutput: {
    topic: string;
    messageFormat: string;
    applicationData: object;
  };
  nodeIds:
    | string[]
    | {
        [nodeId: string]: {
          alias: "string" | null;
          filter: "string" | null;
        };
      };
}

// OPCUA Client
const useGetTwinConfig = <SelectType = TwinConfig>(
  deviceId: string | undefined,
  moduleName: string | undefined,
  queryOptions?: Omit<UseQueryOptions<TwinConfig, AxiosError, SelectType>, 'queryKey' | 'queryFn'>,
) =>
  useQuery<TwinConfig, AxiosError, SelectType>({
    queryKey: ["getTwinConfig", deviceId, moduleName],
    queryFn: () => edgeConfigApi.getTwinConfig(deviceId, moduleName),
    ...queryOptions,
  });

const usePostTwinConfig = (deviceId: string, moduleName: string) =>
  useMutation<unknown, AxiosError, string>({
    mutationFn: (twinConfigForm: string) =>
      edgeConfigApi.postTwinConfig(deviceId, moduleName, JSON.parse(twinConfigForm)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["getTwinConfig", deviceId, moduleName],
      });
      queryClient.invalidateQueries({
        queryKey: ["getConfigStatus", deviceId],
      });
    },
  });

export interface SmartEmsData {
  enabled: boolean;
  lastSeenAt: string;
  hardwareVersion: string;
  updateFirmware: boolean;
  semsTemplate: string;
  firmwareVersion: string;
  deviceTypeId: string;
  deviceTypeName: string;
  template: { toString: string };
  description: string;
  variables: [{ toString: string; variableValue: string }];
}
const useGetSmartEmsInfo = (deviceId: string | undefined) =>
  useQuery<SmartEmsData, AxiosError>({
    queryKey: ["getSmartEmsInfo", deviceId],
    queryFn: () => edgeConfigApi.getSmartEmsInfo(deviceId),
  });

const useDeviceTemplates = () => {

  const templatesQuery = useQuery({
    queryKey: ["deviceTemplates"],
    queryFn: async () => {
      const res = await edgeConfigApi.getAvailableTemplates();
      const templates = res?.templates;
      const uniqueTemplates = templates.filter(
        (template : any, index : any, self : any) =>
          index === self.findIndex((t: any) => t.name === template.name)
      );
      return uniqueTemplates;
    }
  });

  const saveTemplatesMutation = useMutation({
    mutationFn: (templates: string[]) => edgeConfigApi.saveSelectedTemplates(templates)
  });

  return {
    templatesQuery,
    saveTemplatesMutation
  };
};

const useDeviceTemplateVariables = () => {
  const variablesQuery = useQuery({
    queryKey: ["deviceTemplateVariables"],
    queryFn: () => edgeConfigApi.getDeviceTemplateVariables(),
  });

  const setVariableMutation = useMutation({
    mutationFn: ({ name, value }: { name: string; value: string }) =>
      edgeConfigApi.setDeviceTemplateVariable(name, value),
    onSuccess: (variables) => {
      queryClient.setQueryData(["deviceTemplateVariables"], variables);
    },
  });

  const deleteVariableMutation = useMutation({
    mutationFn: (name: string) => edgeConfigApi.deleteDeviceTemplateVariable(name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deviceTemplateVariables"] });
    },
  });

  return {
    variablesQuery,
    setVariableMutation,
    deleteVariableMutation,
  };
};

const useGetScopes = () =>
  useQuery<ScopeResponse[], AxiosError>({
    queryKey: ["authScopes"],
    queryFn: () => edgeConfigApi.getScopes(),
  });

const useGetScopeDetails = (scopeId: string | undefined, enabled = true) =>
  useQuery<ScopeDetailsResponse, AxiosError>({
    queryKey: ["authScopeDetails", scopeId],
    queryFn: () => edgeConfigApi.getScopeDetails(scopeId ?? ""),
    enabled: Boolean(scopeId) && enabled,
  });

const useDeleteScope = () =>
  useMutation<unknown, AxiosError, string>({
    mutationFn: (scopeId: string) => edgeConfigApi.deleteScope(scopeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["authScopes"] });
    },
  });

const useGetRoles = () =>
  useQuery<RoleResponse[], AxiosError>({
    queryKey: ["authRoles"],
    queryFn: () => edgeConfigApi.getRoles(),
  });

const useGetRoleDetails = (roleId: string | undefined, enabled = true) =>
  useQuery<RoleDetailsResponse, AxiosError>({
    queryKey: ["authRoleDetails", roleId],
    queryFn: () => edgeConfigApi.getRoleDetails(roleId ?? ""),
    enabled: Boolean(roleId) && enabled,
  });

const useDeleteRole = () =>
  useMutation<unknown, AxiosError, string>({
    mutationFn: (roleId: string) => edgeConfigApi.deleteRole(roleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["authRoles"] });
    },
  });

const useGetActions = () =>
  useQuery<ActionResponse[], AxiosError>({
    queryKey: ["authActions"],
    queryFn: () => edgeConfigApi.getActions(),
  });

const useCreateRole = () =>
  useMutation<RoleResponse, AxiosError, { name: string; description: string | null; actions: string[] }>({
    mutationFn: (payload) => edgeConfigApi.createRole(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["authRoles"] });
    },
  });

const useUpdateRole = () =>
  useMutation<unknown, AxiosError, { roleId: string; payload: { name: string; description: string | null; actions: string[] } }>({
    mutationFn: ({ roleId, payload }) => edgeConfigApi.updateRole(roleId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["authRoles"] });
      await queryClient.invalidateQueries({ queryKey: ["authRoleDetails"] });
    },
  });

const useCreateScope = () =>
  useMutation<ScopeResponse, AxiosError, ScopeWritePayload>({
    mutationFn: (payload) => edgeConfigApi.createScope(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["authScopes"] });
    },
  });

const useUpdateScope = () =>
  useMutation<unknown, AxiosError, { scopeId: string; payload: ScopeWritePayload }>({
    mutationFn: ({ scopeId, payload }) => edgeConfigApi.updateScope(scopeId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["authScopes"] });
      await queryClient.invalidateQueries({ queryKey: ["authScopeDetails"] });
    },
  });

const useGetTeams = () =>
  useQuery<TeamListItemResponse[], AxiosError>({
    queryKey: ["authTeams"],
    queryFn: () => edgeConfigApi.getTeams(),
  });

const useGetTeamDetails = (teamId: string | undefined, enabled = true) =>
  useQuery<TeamDetailsResponse, AxiosError>({
    queryKey: ["authTeamDetails", teamId],
    queryFn: () => edgeConfigApi.getTeamDetails(teamId ?? ""),
    enabled: Boolean(teamId) && enabled,
  });

const useDeleteTeam = () =>
  useMutation<unknown, AxiosError, string>({
    mutationFn: (teamId: string) => edgeConfigApi.deleteTeam(teamId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["authTeams"] });
    },
  });

type TeamWritePayload = { name: string; scope_id: string | null; role_ids: string[] };

const useCreateTeam = () =>
  useMutation<unknown, AxiosError, TeamWritePayload>({
    mutationFn: (payload) => edgeConfigApi.createTeam(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["authTeams"] });
    },
  });

const useUpdateTeam = () =>
  useMutation<unknown, AxiosError, { teamId: string; payload: TeamWritePayload }>({
    mutationFn: ({ teamId, payload }) => edgeConfigApi.updateTeam(teamId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["authTeams"] });
      await queryClient.invalidateQueries({ queryKey: ["authTeamDetails"] });
    },
  });

type UserWithTeamsResponse = components["schemas"]["UserWithTeamsResponse"];

const useGetUsers = () =>
  useQuery<UserWithTeamsResponse[], AxiosError>({
    queryKey: ["authUsers"],
    queryFn: () => edgeConfigApi.getUsers(),
  });

type CurrentUserResponse = components["schemas"]["CurrentUserResponse"];

const useGetCurrentUser = (enabled = true) =>
  useQuery<CurrentUserResponse, AxiosError>({
    queryKey: ["authCurrentUser"],
    queryFn: () => edgeConfigApi.getCurrentUser(),
    enabled,
  });

const useGetCurrentUserTeams = (enabled = true) =>
  useQuery<UserTeamAssignmentsResponse, AxiosError>({
    queryKey: ["authCurrentUserTeams"],
    queryFn: () => edgeConfigApi.getCurrentUserTeams(),
    enabled,
  });

const useAddUserToTeam = () =>
  useMutation<unknown, AxiosError, { teamId: string; userId: string }>({
    mutationFn: ({ teamId, userId }) => edgeConfigApi.addUserToTeam(teamId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["authTeamDetails"] });
      await queryClient.invalidateQueries({ queryKey: ["authTeams"] });
    },
  });

const useRemoveUserFromTeam = () =>
  useMutation<unknown, AxiosError, { teamId: string; userId: string }>({
    mutationFn: ({ teamId, userId }) => edgeConfigApi.removeUserFromTeam(teamId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["authTeamDetails"] });
      await queryClient.invalidateQueries({ queryKey: ["authTeams"] });
    },
  });

type UserTeamAssignmentsResponse = components["schemas"]["UserTeamAssignmentsResponse"];

const useGetUserTeamAssignments = (userId: string | undefined, enabled = true) =>
  useQuery<UserTeamAssignmentsResponse, AxiosError>({
    queryKey: ["authUserTeamAssignments", userId],
    queryFn: () => edgeConfigApi.getUserTeamAssignments(userId ?? ""),
    enabled: Boolean(userId) && enabled,
  });

export const edgeConfigApiHooks = {
  useGetDevice,
  useGetSmartEmsInfo,
  useGetDeviceConnectionStatus,
  useGetModules,
  useGetTwinConfig,
  usePostTwinConfig,
  useGetSmartEmsConfigLan,
  useDeviceTemplates,
  useDeviceTemplateVariables,
  useGetScopes,
  useGetScopeDetails,
  useDeleteScope,
  useCreateScope,
  useUpdateScope,
  useGetRoles,
  useGetRoleDetails,
  useDeleteRole,
  useGetActions,
  useCreateRole,
  useUpdateRole,
  useGetTeams,
  useGetTeamDetails,
  useDeleteTeam,
  useCreateTeam,
  useUpdateTeam,
  useGetUsers,
  useGetCurrentUser,
  useGetCurrentUserTeams,
  useAddUserToTeam,
  useRemoveUserFromTeam,
  useGetUserTeamAssignments,
}
