import { create } from "zustand";
import {
  EndpointNames,
  NetworkDiscoverTwinConfig,
} from "@/api/edgeConfig/networkDiscover/networkDiscoverInterfaces";

export enum Status {
  IsSetUp,
  IsSaving,
  Default
}
export interface TwinConfigStore {
  status: Status
  endpointConfigList: EndpointNames;
  twinConfig: NetworkDiscoverTwinConfig
  setTwinConfigState: (data: NetworkDiscoverTwinConfig) => void;
  setStatus: (status: Status) => void
}

export default create<TwinConfigStore>((set) => {
  return {
    status: Status.Default,
    endpointConfigList: {},
    twinConfig: {
      endpointNames: {},
      scanDefinition: {
        networkDefinition: "",
        ports: [],
        subnetMask: 0
      },
      scheduledCron: "* * * * *"
    },
    setTwinConfigState: (data) => set(() => ({
      status: data.scanDefinition.networkDefinition? Status.IsSetUp: Status.Default,
      endpointConfigList: data.endpointNames,
      twinConfig: data,
    })),
    setStatus: (status) => set({status})
  };
});
