import { OpcUaTreeBrowser } from "@/features/OPCUABrowser/OPCUATreeBrowser";
import { registerBrowser, BrowserComponentProps } from "@/lib/browserRegistry";

// Imported once for its side effects (e.g. from main.tsx) to populate the browser registry
// before anything tries to look a kind up. Add new `registerBrowser(...)` calls here as more
// browsers become available.

const OPCUA_MODULE_NAME = "seal-module-opcua-client";

function OpcUaBrowser({ ip, port }: BrowserComponentProps) {
  return <OpcUaTreeBrowser moduleName={OPCUA_MODULE_NAME} endpoint={`opc.tcp://${ip}:${port}`} />;
}

registerBrowser("opcua", "OPC-UA Browser", OpcUaBrowser);
