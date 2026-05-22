export interface MachineType {
  name: string
  endpoints?: EndpointType[]
}

export interface EndpointType {
  name?: string;
  ip: string;
  services?: Record<string, string>;
};

export const ENDPOINT_TYPES: EndpointType[] = [
  {
    "name": "New Endpoint",
    "ip": ""
  },
  {
    "name": "Edge Device",
    "ip": ""
  }
]

export const MACHINE_TYPES: MachineType[] = [
  {
    "name": "New Machine"
  }
]