import { client } from "./client";

export async function listUserCertificate() {
  const { data, status } = await client.get("/web/api/usercertificate/certificates");

  if (status != 200) {
    console.error("listUserCertificate failed", data);
    return;
  }

  return data;
}

interface SmartEmsUser {
  id: number;
}

// Disabled linting as the schemas is complicated to extract: the calling function must define it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listUser(requestBody: any) {
  const { data, status } = await client.post<{ results: SmartEmsUser[] }>("/web/api/user/list", requestBody);

  if (status != 200) {
    console.error("listUser failed", data);
    return;
  }

  return data;
}

interface EndpointDeviceConnection {
  id: number;
  virtualIp: string;
}

interface DeviceConnection {
  id: number;
  virtualIp: string;
  vpnConnected: boolean;
}

// Disabled linting as the schemas is complicated to extract: the calling function must define it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listDevices(requestBody: any) {
  const { data, status } = await client.post("web/api/device/list", requestBody);

  if (status != 200) {
    console.error("listVpnContainerByName failed", data);
    return;
  }

  return data;
}

interface VpnConnectionStatus {
  user?: {
    id: number;
    vpnConnected?: boolean;
  };
  connections: {
    id: number;
    endpointDevice: EndpointDeviceConnection;
    device?: DeviceConnection
  }[];
}

export async function getVpnConnectionStatus() {
  const { data, status } = await client.get<VpnConnectionStatus>("/web/api/vpn/connection/status");

  if (status != 200) {
    console.error("getVpnConnectionStatus failed", data);
    return;
  }

  return data;
}


export async function openVpnConnectionByDeviceId(id: number) {
  const { data, status } = await client.get(`/web/api/device/${id}/open/vpnconnection`);

  if (status != 200) {
    console.error("openVpnConnectionByDeviceId failed", data);
    return false;
  }

  return true;
}

export async function openVpnConnectionByEndpointId(id: number) {
  const { data, status } = await client.get(`/web/api/deviceendpointdevice/${id}/open/vpnconnection`);

  if (status != 200) {
    console.error("openVpnConnectionByEndpointId failed", data);
    return false;
  }

  return true;
}

export async function closeVpnConnectionById(id: number) {
  const { status, data } = await client.get(`web/api/vpnconnection/${id}/close/vpnconnection`);

  if (status != 200) {
    console.error("closeVpnConnectionById failed", data);
    return false;
  }

  return true;
}

// Disabled linting as the schemas is complicated to extract: the calling function must define it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateDeviceById(id: number, body: any) {
  const { data, status } = await client.post(`/web/api/device/${id}`, body);

  if (status != 200) {
    console.error("updateDeviceById", data);
    return;
  }

  return data;
}

export async function deleteEndpointDeviceById(id: number) {
  const { status } = await client.delete(`web/api/deviceendpointdevice/${id}`);

  if (status != 204) {
    console.error("deleteEndpointDeviceById failed");
    return false;
  }

  return true;
}

interface UserRoles {
  roles: string[];
  username: string;
  refreshTokenExpiration: number;
  sessionTimeout: number;
  representation: string;
}

export async function getUserRoles() {
  const { data, status } = await client.get<UserRoles>("/web/api/authentication/get/roles");

  if (status != 200) {
    console.error("getUserRoles failed", data);
    return;
  }

  return data;
}

export async function logoutMicrosoftSSO() {
  const { data, status } = await client.get("/web/api/authentication/sso/microsoftoidc/logout");

  if (status != 200) {
    console.error("logoutMicrosoftSSO failed", data);
    return false;
  }

  return true;
}

export async function downloadUserOpenVpnConfiguration() {
  const { data, status } = await client.get(`/web/api/vpn/client/config`);

  if (status != 200) {
    console.error("downloadUserOpenVpnConfiguration failed", data);
    return;
  }

  return data;
}
