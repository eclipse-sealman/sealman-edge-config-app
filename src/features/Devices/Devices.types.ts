import { DeviceData } from "@/api/edgeConfig/edgeConfigApiHooks";
import { Table as TanstackTable } from "@tanstack/react-table";
import type { ReactNode } from "react";
import type { EndpointData } from "./search/deviceSearch";

export interface DeviceDataDisplay extends DeviceData {
  onlineStatusEdge: string;
}

export interface DeviceEndpointsInfo {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  byDevice: Map<string, EndpointData[]>;
  /** Per device, the endpoints satisfying the active endpoint filters; only populated while any are set. */
  matching: Map<string, EndpointData[]>;
  hasEndpointFilters: boolean;
}

export interface DeviceListProps {
  table: TanstackTable<DeviceDataDisplay>;
  endpoints: DeviceEndpointsInfo;
  expandedIds: Set<string>;
  onToggleExpanded: (deviceId: string) => void;
}

export interface DeviceCardsProps extends DeviceListProps {
  data: DeviceDataDisplay[];
  searchBar: ReactNode;
}
