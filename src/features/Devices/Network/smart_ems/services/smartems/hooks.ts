import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listUserCertificate,
  listDevices,
  getVpnConnectionStatus,
  getUserRoles,
  listUser,
  downloadUserOpenVpnConfiguration,
} from "./api";
import { AxiosError } from "axios";
import { useCallback, useEffect, useMemo } from "react";

export const DEVICE_TYPE_EDGE_GATEWAY_WITH_VPN_CONTAINER_CLIENT = import.meta.env.VITE_EDGE_GATEWAY_WITH_VPN_CONTAINER_DEVICE_TYPE ?? "10";
export const DEVICE_TYPE_VPN_CONTAINER_CLIENT = import.meta.env.VITE_VPN_CONTAINER_DEVICE_TYPE ?? "8";
export interface UserCertificate {
  useableCertificates: {
    certificate?: {
      certificateType?: {
        // id: number,
        certificateCategory?: string;
      };
      hasCertificate?: boolean;
      certificateValidTo?: Date;
    };
  }[];
}

export function useListUserCertificate() {
  return useQuery<UserCertificate>({
    queryKey: ["smartEms", "listUserCertificates"],
    queryFn: listUserCertificate,
  });
}

export function useDownloadOpenVpnConfig() {
  const mutation = useMutation({
    mutationFn: () => downloadUserOpenVpnConfiguration(),
  });

  const downloadCallback = useCallback(async () => {
    const blob = await new Blob([mutation.data], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vpn-config.ovpn";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [mutation.data]);

  useEffect(() => {
    if (!mutation.data) {
      return;
    }

    downloadCallback();
  }, [mutation.data, downloadCallback]);

  return mutation;
}

export interface EndpointDevice {
  id: number;
  physicalIp: string;
  virtualIp: string;
  createdAt: string;
}

export function useGetVPNContainerEndpointDevices(name: string) {
  const { vpnContainerClient } = useGetVpnContainerClientByName(name);

  return {
    endpointDevices: vpnContainerClient?.endpointDevices,
  };
}

export function useGetVPNContainerEndpointDevicesQuery(name: string) {
  const query = useGetVpnContainerClientByName(name);
  const endpointDevices = query.vpnContainerClient?.endpointDevices;

  return {
    endpointDevices,
    getEndpointByIp: (ip: string) => endpointDevices?.find((e) => e.physicalIp === ip),
    ...query,
  };
}

export interface VpnContainerClientDevice {
  id: number;
  endpointDevices: EndpointDevice[];
  seenAt: string;
}

interface ListVpnContainerResults {
  results: VpnContainerClientDevice[];
}

export function useGetVpnContainerClientBySerialNumber(serialNumber: string) {
  const requestBody = {
    page: 1,
    rowsPerPage: 1,
    sorting: [{ field: "createdAt", direction: "desc" }],
    filters: {
      deviceType: {
        filterBy: "deviceType",
        filterType: "equal",
        filterValue: DEVICE_TYPE_EDGE_GATEWAY_WITH_VPN_CONTAINER_CLIENT,
      },
      name: {
        filterBy: "serialNumber",
        filterType: "like",
        filterValue: serialNumber,
      },
    },
  };

  const query = useQuery<ListVpnContainerResults, AxiosError, VpnContainerClientDevice[]>({
    queryKey: ["smartEms", "getVpnContainerBySN", serialNumber],
    queryFn: () => {
      return listDevices(requestBody);
    },
    select: (d) => d.results ?? [],
  });

  return {
    vpnContainerClient: query.data ? query.data[0] : undefined,
    ...query,
  };
}

export function useGetVpnContainerClientByName(name: string) {
  const requestBody = {
    page: 1,
    rowsPerPage: 1,
    sorting: [{ field: "createdAt", direction: "desc" }],
    filters: {
      deviceType: {
        filterBy: "deviceType",
        filterType: "equal",
        filterValue: DEVICE_TYPE_VPN_CONTAINER_CLIENT,
      },
      name: {
        filterBy: "name",
        filterType: "like",
        filterValue: name,
      },
    },
  };

  const query = useQuery<ListVpnContainerResults, AxiosError, VpnContainerClientDevice[]>({
    queryKey: ["smartEms", "getVpnContainer", name],
    queryFn: () => {
      return listDevices(requestBody);
    },
    select: (d) => d.results ?? [],
  });

  return {
    vpnContainerClient: query.data ? query.data[0] : undefined,
    ...query,
  };
}

export function useGetUserDetails() {
  const queryRoles = useListUserRoles();
  const query = useQuery({
    queryKey: ["smartEms", "useGetUserDetails", queryRoles?.data?.username],
    queryFn: () => {
      const requestBody = {
        page: 1,
        rowsPerPage: 10,
        sorting: [],
        filters: {
          username: { filterBy: "username", filterType: "like", filterValue: queryRoles?.data?.username },
        },
      };
      return listUser(requestBody);
    },
  });

  return {
    ...query,
    user: Array.isArray(query.data?.results) ? query.data?.results[0] : null,
    isLoading: queryRoles.isLoading || query.isLoading,
  };
}

export function useGetEndpointByIp(endpoints: EndpointDevice[], ip: string) {
  return useMemo(() => {
    return endpoints.find((e) => e.physicalIp === ip);
  }, [endpoints, ip]);
}

function useGetVpnConnectionStatus() {
  return useQuery({
    queryKey: ["smartEms", "getConnectionStatus"],
    queryFn: getVpnConnectionStatus,
    refetchInterval: 30000,
  });
}

export function useGetUserId() {
  const { data, isLoading } = useGetVpnConnectionStatus();

  return {
    id: data?.user?.id,
    isFetching: isLoading,
  };
}

export function useGetUserEndpointDeviceConnections() {
  const { data, isLoading } = useGetVpnConnectionStatus();

  return {
    connections: data?.connections,
    isFetching: isLoading,
  };
}

export function useGetUserEndpointDeviceConnectionsQuery() {
  const query = useGetVpnConnectionStatus();

  return {
    connections: query.data?.connections,
    ...query,
  };
}

export function useGetConnectionByDeviceId(deviceId?: number) {
  const query = useGetVpnConnectionStatus();

  return {
    connection: query.data?.connections.find((c) => c.device?.id === deviceId),
    ...query,
  };
}

export function useGetConnectionByEndpointDeviceId(deviceId?: number) {
  const query = useGetUserEndpointDeviceConnectionsQuery();

  return {
    connection: query.connections?.find((c) => c.endpointDevice?.id === deviceId),
    ...query,
  };
}

export function useGetUserVpnConnectionStatus() {
  const query = useGetVpnConnectionStatus();

  return {
    user: query.data?.user,
    ...query,
  };
}

export function isWaiting(createdAt: Date, lastSeen: Date) {
  if (createdAt.getTime() >= lastSeen.getTime()) {
    return true
  }
  return false
}

export function useInvalidateConnections() {
  const queryClient = useQueryClient();

  return {
    invalidate: () =>
      queryClient.invalidateQueries({
        queryKey: ["smartEms", "getConnectionStatus"],
      }),
  };
}

export function useInvalidateAllSmartEmsQueries() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["smartEms"],
    });

  return invalidate;
}

export function useListUserRoles() {
  const query = useQuery({
    queryKey: ["smartEms", "getUserRoles"],
    queryFn: getUserRoles,
  });

  return query;
}

export function useIsUserAuthenticated() {
  const query = useListUserRoles();

  return {
    isAuthenticated: Array.isArray(query.data?.roles) && !query.isError,
    ...query,
  };
}
