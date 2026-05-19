import { AxiosError } from "axios";
import { useMutation, useQuery, UseQueryOptions } from "@tanstack/react-query";

import { edgeConfigApi } from "./edgeConfigApi";
import { queryClient } from "../../config/queryConfig";
import { InterfaceData } from "./interfaces";

export interface DeviceData {
  deviceId: string;
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
      return res?.templates;
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

export const edgeConfigApiHooks = {
  useGetDevice,
  useGetSmartEmsInfo,
  useGetDeviceConnectionStatus,
  useGetModules,
  useGetTwinConfig,
  usePostTwinConfig,
  useGetSmartEmsConfigLan,
  useDeviceTemplates,
}
