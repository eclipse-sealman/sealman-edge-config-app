export type Protocol = "TCP" | "UDP";

export type PortForwardingRule = {
  name: string;
  interface: string;
  srcPort?: number;
  destAddr: string;
  destPort?: number;
}

export interface PortForwardingConfig {
  rules: PortForwardingRule[];
}
