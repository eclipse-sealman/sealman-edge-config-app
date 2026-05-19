export interface IpConfig {
  dhcp: boolean;
  ip?: string;
  subnet?: string;
  gw?: string;
  dns?: string;
}

export interface InterfaceData {
  interfaceConfig: {
    lan1: IpConfig;
    lan2: IpConfig;
    lan3: IpConfig;
  };
}
