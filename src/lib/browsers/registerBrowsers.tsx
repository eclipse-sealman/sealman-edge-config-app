import { OpcUaTreeBrowser } from "@/features/OPCUABrowser/OPCUATreeBrowser";
import { registerBrowser, BrowserComponentProps } from "@/lib/browserRegistry";

// Imported once for its side effects (e.g. from main.tsx) to populate the browser registry
// before anything tries to look a kind up. Add new `registerBrowser(...)` calls here as more
// browsers become available.

function OpcUaBrowser({ ip, port }: BrowserComponentProps) {
  return <OpcUaTreeBrowser endpoint={`opc.tcp://${ip}:${port}`} />;
}

registerBrowser("opcua", "OPC-UA Browser", OpcUaBrowser);
