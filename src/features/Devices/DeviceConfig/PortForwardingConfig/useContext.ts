import { useContext } from "react";
import { PortForwardingContext } from "./context";

export function usePortForwardingConfig() {
  const ctx = useContext(PortForwardingContext);
  if (!ctx) {
    throw new Error(
      "usePortForwardingConfig must be used within PortForwardingConfigProvider"
    );
  }
  return ctx;
}
