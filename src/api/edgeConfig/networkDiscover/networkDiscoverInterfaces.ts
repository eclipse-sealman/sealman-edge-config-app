export const DEFAULT_NETWORK_DISCOVER_TWIN_CONFIG_TEMPLATE: NetworkDiscoverTwinConfig = {
  scheduledCron: "* * * * *",
  scanDefinition: {
    networkDefinition: "",
    subnetMask: 24,
    ports: [21, 80, 443, 4840, 5900, 8080, 9443]
  },
  endpointNames: {}
};

export type NetworkDiscoverTwinConfigGet = NetworkDiscoverTwinConfig | null;

export type NetworkDiscoverTwinConfig = {
  scheduledCron: string;
  scanDefinition: ScanDefinition;
  endpointNames: EndpointNames;
};

export type EndpointNames = Record<string, EndpointConfig>;

export type EndpointConfig = {
  name: string;
  description?: string
  serviceNames: Record<string, string>;
};

export interface ScanDefinition {
  networkDefinition: string;
  subnetMask: number;
  ports: number[];
}

export interface NetworkScanData {
  scanResults: ScanResult[];
  scanDefinition: ScanDefinition
}

export interface ScanResult {
  ip: string,
  status: "online" | "offline" | "unknown";   // Wether this IP was pingable
  lastStatusChange?: string;                  // Since when the pinged IP is offline (Only applicable when status is offline)
  ports: Record<string, PortResult>;
}

export interface PortResult {
  status: "online" | "offline" | "unknown";   // Status of port scan
  lastStatusChange?: string;                  // Since when the port last changed its status
}
