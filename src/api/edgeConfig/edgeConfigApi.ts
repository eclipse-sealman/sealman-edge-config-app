import axios, { AxiosError } from "axios";
import { NetworkScanData } from "./networkDiscover/networkDiscoverInterfaces";
import { getAccessToken } from "@/auth";
import { EndpointType } from "src/pages/settings/NetworkSettings";
import { CMD_PROXY_MODULE_NAME, NETWORK_DISCOVER_MODULE_NAME } from "./moduleNames";

export const edgeConfigApiInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URI}`,
});


edgeConfigApiInstance.interceptors.request.use(async function (config: any) {
  const isCypress = window.Cypress != undefined;
  
  if (isCypress) {
    return config;
  }
  
  try {
    const accessToken = await getAccessToken();
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  } catch (error) {
    console.error("Failed to acquire token:", error);
    throw new Error("User is not authenticated");
  }
  return config;
}, undefined);


export interface DirectMethodResponse<T> {
  status: number,
  payload: T
}

export interface DirectMethodRequest {
  methodName: string,
  methodPayload: any
}

/*
* This function unwraps the direct method responses, into AxiosErrors
* you can use it when handling direct methods
*/
function handleDirectMethodResponse(response: DirectMethodResponse<any>) {
  if (response.status >= 400) {
    throw new AxiosError(response.payload, response.status.toString());
  } else {
    return response;
  }
}

const getDevices = async () => {
  const { data } = await edgeConfigApiInstance.get('/devices');
  return data;
}

const getDevice = async (deviceId: string | undefined) => {
  const { data } = await edgeConfigApiInstance.get(`/device?device=${deviceId}`);
  return data;
}

const getSmartEmsInfo = async (deviceId: string | undefined) => {
  const { data } = await edgeConfigApiInstance.get(`/${deviceId}/smartems/info`);
  return data;
}

const putDeploymentTag = async (deviceId: string | undefined, deploymentTag: string) => {
  const { data } = await edgeConfigApiInstance.put(`/${deviceId}/deployment`, { deployment: deploymentTag });
  return data;
}

const getSmartEmsStatus = async (deviceId: string | undefined) => {
  const { data } = await edgeConfigApiInstance.get(`/${deviceId}/smartems/status`);
  return data;
}

const getModules = async (deviceId: string | undefined) => {
  const { data } = await edgeConfigApiInstance.get(`/${deviceId}/modules`);
  return data;
}

const getConfigStatus = async (deviceId: string | undefined, payload: any) => {
  const { data } = await edgeConfigApiInstance.post(`/${deviceId}/config/status`, payload);
  return data;
}

const getSmartEmsConfigLan = async (deviceId: string | undefined) => {
  const { data } = await edgeConfigApiInstance.get(`/${deviceId}/smartems/config/lan`);
  return data;
}

const getSmartEmsConfigExport = async (deviceId: string | undefined) => {
  const { data } = await edgeConfigApiInstance.get(`/${deviceId}/smartems/config/export`);
  return data;
}

const postSmartEmsConfigLan = async (deviceId: string | undefined, payload: any) => {
  const { data } = await edgeConfigApiInstance.post(`/${deviceId}/smartems/configure/lan`, payload);
  return data;
}

const scanNetwork = async (deviceId: string | undefined, payload: any) => {
  const { data } = await edgeConfigApiInstance.post(`/${deviceId}/${NETWORK_DISCOVER_MODULE_NAME}/methods`, payload);
  return handleDirectMethodResponse(data);
}

const getPeriodicNetworkScanResult = async (deviceId: string) => {
  const { data } = await edgeConfigApiInstance.get<NetworkScanData>(`/${deviceId}/network/topology`)
  return data
}

const nmShow = async (deviceId: string | undefined, payload: any) => {
  const { data } = await edgeConfigApiInstance.post(`/${deviceId}/${CMD_PROXY_MODULE_NAME}/methods`, payload);
  return handleDirectMethodResponse(data);
}

const getTwinConfig = async (deviceId: string | undefined, moduleName: string | undefined) => {
  const { data } = await edgeConfigApiInstance.get(`/${deviceId}/twin/config/${moduleName}`)
  return data;
}

const postTwinConfig = async (deviceId: string | undefined, moduleName: string | undefined, payload: any) => {
  const { data } = await edgeConfigApiInstance.post(`/${deviceId}/twin/config/${moduleName}`, payload)
  return data;
}

const invokeDirectMethod = async (deviceId: string | undefined, module: string, payload: DirectMethodRequest) => {
  const { data } = await edgeConfigApiInstance.post(`/${deviceId}/${module}/methods`, payload);
  return handleDirectMethodResponse(data);
}

const getDeployments = async () => {
  const { data } = await edgeConfigApiInstance.get('/deployments');
  return data;
}

const getDeploymentStatus = async (deviceId: string | undefined) => {
  const { data } = await edgeConfigApiInstance.get(`/${deviceId}/deployment/status`);
  return data;
}

const getConnectionStatus = async (deviceId: string | undefined) => {
  const { data } = await edgeConfigApiInstance.get(`/${deviceId}/connection/status`);
  return data;
}

const getCmdLanIpConfig = async (deviceId: string | undefined) => {
  const { data } = await edgeConfigApiInstance.get(`/${deviceId}/cmd/lan/ip/config`);
  return data;
}

const postDeviceCmdSmartemsCheck = async (deviceId: string | undefined) => {
  const { data } = await edgeConfigApiInstance.post(`/${deviceId}/cmd/smartems/check`);
  return data;
}

const getDeviceCmdStatus = async (deviceId: string | undefined) => {
  const { data } = await edgeConfigApiInstance.get(`/${deviceId}/cmd/status`);
  return data;
}

const getDeviceCmdConfigShow = async (deviceId: string | undefined) => {
  const { data } = await edgeConfigApiInstance.get(`/${deviceId}/cmd/config/show`);
  return data;
}

const getDeviceCmdNmConfig = async (deviceId: string | undefined) => {
  const { data } = await edgeConfigApiInstance.get(`/${deviceId}/cmd/nm/config`);
  return data;
}

const postDeviceCmdLanConfig = async (deviceId: string | undefined, payload: any) => {
  const { data } = await edgeConfigApiInstance.post(`/${deviceId}/cmd/lan/config`, payload);
  return data;
}

const getDeviceCellularConfig = async (deviceId: string | undefined) => {
  const { data } = await edgeConfigApiInstance.get(`/${deviceId}/smartems/config/cellular`);
  return data;
}

const postDeviceCellularConfig = async (deviceId: string | undefined, payload: any) => {
  const { data } = await edgeConfigApiInstance.post(`/${deviceId}/smartems/config/cellular`, payload);
  return data;
}

const postDeviceNetworkDiscover = async (deviceId: string | undefined, payload: any) => {
  const { data } = await edgeConfigApiInstance.post(`/${deviceId}/network/discover`, payload);
  return data;
}

const postWebFtpWriteFile = async (deviceId: string | undefined, payload: any) => {
  const { data } = await edgeConfigApiInstance.post(`/${deviceId}/webftp/writeFile`, payload, {headers: {'Content-Type': 'multipart/form-data'}})
  return data;
}

const postInfluxBucketCreate = async (deviceId: string | undefined) => {
  const { data } = await edgeConfigApiInstance.post(`/${deviceId}/influx/bucket/create`);
  return data;
}

const getPermissions = async (resourceType: string, deviceId: string | undefined) => {
  const url = `/auth/permissions/${resourceType}`;
  const params = deviceId ? { device_id: deviceId } : {};
  const { data } = await edgeConfigApiInstance.get(url, { params });
  return data;
}

const getEventData = async (deviceId: string = "*") => {
  const { data } = await edgeConfigApiInstance.get(`/eventData?device_id=${deviceId}`);
  return data;
}

type ServicePortPayload = {
  deviceEndpointServiceName: string;
  description: string | null;
  defaultPort: string | null;
};

const getAvailableTemplates = async () => {
  const { data } = await edgeConfigApiInstance.get('/platform/devices/available-templates');
  return data;
}

const saveSelectedTemplates = async (templates: string[]) => {
  const { data } = await edgeConfigApiInstance.post('/platform/devices/selected-templates', { templates });
  return data;
}

const getEndpointTypes = async () => {
  const { data } = await edgeConfigApiInstance.get('/platform/device-endpoints/types');
  return data;
}

const saveEndpointTypes = async (types: EndpointType[]) => {
  const { data } = await edgeConfigApiInstance.post('/platform/device-endpoints/types', { types });
  return data;
}

const getServicePorts = async () => {
  const { data } = await edgeConfigApiInstance.get('/platform/device-endpoints/services');
  return data;
}

const getMetadataKeys = async (): Promise<string[]> => {
  const { data } = await edgeConfigApiInstance.get<{ keys: string[] }>('/platform/metadata/keys');
  return data.keys;
}

const addMetadataKey = async (key: string): Promise<void> => {
  await edgeConfigApiInstance.post('/platform/metadata/keys', { key });
}

const deleteMetadataKey = async (key: string): Promise<void> => {
  await edgeConfigApiInstance.delete(`/platform/metadata/keys/${encodeURIComponent(key)}`);
}

const getDevicesWithMetaKey = async (key: string): Promise<string[]> => {
  const { data } = await edgeConfigApiInstance.get<{ deviceId: string }[]>('/devices', {
    params: { meta: { [key]: "" } },
  });
  return data.map((device) => device.deviceId);
}

const saveServicePorts = async (services: ServicePortPayload[]) => {
  const { data } = await edgeConfigApiInstance.post('/platform/device-endpoints/services', { services });
  return data;
}

const createDevice = async (deviceId: string, authType: string, meta?: Record<string, string>, registrationId?: string ) => {
  const body: Record<string, unknown> = { authType };
  if (meta && Object.keys(meta).length > 0) {
    body.meta = meta;
  }
  if (registrationId) {
    body.registration_id_generated = registrationId;
  }
  const { data } = await edgeConfigApiInstance.put(`/devices/${deviceId}`, body);
  return data;
};

const deleteDevice = async (deviceId: string) => {
  const { data } = await edgeConfigApiInstance.delete(`/devices/${deviceId}`);
  return data;
};


export const edgeConfigApi = {
  getDevices,
  getDevice,
  getSmartEmsInfo,
  putDeploymentTag,
  getSmartEmsStatus,
  getModules,
  getConfigStatus,
  getSmartEmsConfigLan,
  postSmartEmsConfigLan,
  scanNetwork,
  getPeriodicNetworkScanResult,
  getTwinConfig,
  postTwinConfig,
  invokeDirectMethod,
  getDeployments,
  getDeploymentStatus,
  getConnectionStatus,
  nmShow,
  getCmdLanIpConfig,
  postDeviceCmdSmartemsCheck,
  getDeviceCmdStatus,
  postDeviceCmdLanConfig,
  getDeviceCellularConfig,
  postDeviceCellularConfig,
  postDeviceNetworkDiscover,
  getDeviceCmdNmConfig,
  getSmartEmsConfigExport,
  getDeviceCmdConfigShow,
  postInfluxBucketCreate,
  postWebFtpWriteFile,
  getPermissions,
  getEventData,
  getAvailableTemplates,
  saveSelectedTemplates,
  getEndpointTypes,
  saveEndpointTypes,
  getServicePorts,
  saveServicePorts,
  getMetadataKeys,
  addMetadataKey,
  deleteMetadataKey,
  createDevice,
  deleteDevice,
  getDevicesWithMetaKey,
}
