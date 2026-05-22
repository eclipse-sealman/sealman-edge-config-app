import { createContext } from "react";
import { PortForwardingConfig, PortForwardingRule } from "./types";


export interface PortForwardingContextValue {
  config?: PortForwardingConfig;
  setConfig: React.Dispatch<
    React.SetStateAction<PortForwardingConfig | undefined>
  >;
  addRule: (rule: PortForwardingRule) => void;
  updateRule: (index: number, rule: PortForwardingRule) => void;
  deleteRule: (index: number) => void;
}

export const PortForwardingContext =
  createContext<PortForwardingContextValue | undefined>(undefined);


