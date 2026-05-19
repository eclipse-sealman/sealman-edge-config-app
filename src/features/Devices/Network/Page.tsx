import useGetModuleTwinConfig from "@/generated/edge-administration/hooks/useGetModuleTwinConfig";
import { NetworkDiscoverTwinConfig } from "@/api/edgeConfig/networkDiscover/networkDiscoverInterfaces";
import { NETWORK_DISCOVER_MODULE_NAME } from "@/api/edgeConfig/moduleNames";
import { Centered } from "@/features/Devices/Network/components";
import { ApiError } from "@/generated/edge-administration/api";
import { Loader2 } from "lucide-react";
import { useEffect , useState } from "react";
import { useNetworkPageStore, useScanDefinitionStore, useTwinConfigStore } from "./stores";
import { NetworkMainLayout } from "@/features/Devices/Network/layouts";
import { loadNetworkMeta , isMetaLoaded } from "./api/networkMeta"
import { MissingModulePanel } from "./MissingModulePanel";

interface props {
  deviceId: string
}

function isModuleNotDeployedError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.statusCode === 404;
}

export default function Page({ deviceId }: props) {
  const setDeviceId = useNetworkPageStore(s => s.setDeviceId)
  const setTwinConfigState = useTwinConfigStore(s => s.setTwinConfigState)
  const setScanDefinition = useScanDefinitionStore(s => s.setScanDefinition)
  const [metaReady, setMetaReady] = useState(isMetaLoaded());
  const [_metaError, setMetaError] = useState<string | null>(null);

  if (!deviceId) {
    throw Error("NO DEVICE ID")
  }

  setDeviceId(deviceId)

  const { data, isLoading, isError, error } = useGetModuleTwinConfig(deviceId, NETWORK_DISCOVER_MODULE_NAME)
  const isMissingRequiredModule = isError && isModuleNotDeployedError(error)

  useEffect(() => {
  async function bootstrap() {
    try {
      if (!isMetaLoaded()) {
        await loadNetworkMeta();
      }
      setMetaReady(true);
    } catch (err) {
      setMetaError("Failed to load network configuration.");
      setMetaReady(true);
    }
  }

  bootstrap();
}, []);


useEffect(() => {
  if (!metaReady || !data) return;

  const typedData = data as unknown as NetworkDiscoverTwinConfig;

  setTwinConfigState(typedData);
  setScanDefinition(typedData.scanDefinition);
}, [metaReady, data]);

  useEffect(() => {
    return () => {
      useTwinConfigStore.setState(useTwinConfigStore.getInitialState())
      useScanDefinitionStore.setState(useScanDefinitionStore.getInitialState())
    }
  }, [])

  if (isMissingRequiredModule) {
    return (
      <MissingModulePanel moduleName={NETWORK_DISCOVER_MODULE_NAME} />
    )
  }

  if(isLoading || !metaReady) {
    return (
      <Centered>
        <p className="text-muted-foreground flex items-center gap-4">
          <Loader2 className="animate-spin" /> Loading ...
        </p>
      </Centered>
    )
  }

  return <NetworkMainLayout />
}
