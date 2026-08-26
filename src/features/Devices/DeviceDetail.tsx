import {
  NavLink,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import DeviceConfig from "./DeviceConfig/DeviceConfig";
import ModuleList from "./ModuleConfig/ModuleList";
import SmartEmsInfo from "./DeviceInfo/SmartEmsInfo";
import ConnectionStatus from "./DeviceInfo/ConnectionInfo";
import useGetDevice from "@/generated/edge-administration/hooks/devices/useGetDevice";
import OPCUABrrowserPage from "../../pages/OPCUABrowser";
import DeploymentInfo from "./ModuleConfig/DeploymentInfo";
import { NetworkPage } from "./Network";
import SecurityInformation from "./DeviceInfo/Security/SecurityInformation";
import { usePermissions } from "../authorization/permissions/use-permissions";
import { NoPermissionsPanel } from "../authorization/permissions/NoPermissionsPanel";
import DeviceMetadata from "./DeviceInfo/Metadata/DeviceMetadata";
import { PERMISSION_KEYS } from "../authorization/permissions/permission-keys";

export default function DeviceDetail() {
  const { deviceId } = useParams();

  const device = useGetDevice(deviceId ?? "");

  const tabs = [
    {
      title: "Info",
      href: "",
      element: (
        <div className="space-y-4">
          <ConnectionStatus
            connectionStatus={device.data?.connectionStatus}
            isFetching={device.isFetching}
            isError={device.isError}
            error={device.error as any}
          />
          <DeviceMetadata
            deviceMetadata={device.data?.deviceMetadata ?? {}}
            isFetching={device.isFetching}
            isError={device.isError}
            error={device.error as any}
          />
          <SmartEmsInfo
            data={device.data}
            lastSeenAt={device.data?.lastSeenAt}
            isFetching={device.isFetching}
            isPending={device.isPending}
            isError={device.isError}
            error={device.error as any}
          />
          <SecurityInformation />
        </div>
      ),
    },
    {
      title: "Device Config",
      href: "device-config",
      element: <DeviceConfig />,
    },
    {
      title: "Module Config",
      href: "module-config",
      element: (
        <div className="space-y-4">
          <DeploymentInfo />
          <ModuleList />
        </div>
      ),
    },
    {
      title: "Network",
      href: "network",
      element: <NetworkPage deviceId={ deviceId ?? "no device ID in the path"} />,
    }
  ];

  const { hasPermission, noPermissionsMessage, isLoading } = usePermissions({ deviceId: deviceId, permissionKey: PERMISSION_KEYS.DEVICE_READ });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-blue"></div>
      </div>
    );
  }

  if (!hasPermission) {
    return <NoPermissionsPanel>{noPermissionsMessage}</NoPermissionsPanel>;
  }

  return (
      <div className="space-y-2 h-full overflow-hidden overflow-y-auto flex flex-col">
        <div className="sticky top-0 flex space-x-1 rounded-sm bg-vibrant-blue p-2 z-20">
          {tabs.map((tab) => (
            <NavLink
              to={tab.href ? `/devices/${deviceId}/${tab.href}` : `/devices/${deviceId}`}
              end
              key={tab.href}
              className={({
                isActive,
              }: {
                isActive: boolean;
              }) => `w-full rounded-sm p-2.5 font-medium ring-night-blue text-center ring-white/60 ring-offset-1 ring-offset-blue-400 focus:outline-hidden focus:ring-1
              ${
                isActive
                  ? "bg-blue-50 text-vibrant-blue"
                  : "text-blue-100 hover:bg-white/25 hover:text-white"
              }`}
            >
              {tab.title}
            </NavLink>
          ))}
        </div>
        <div className="relative z-10 bg-white rounded-sm p-2 relative flex-1 min-h-0 flex flex-col gap-2">
          <div className="shrink-0">
            <DeviceCard connectionStatus={device.data?.connectionStatus} isLoading={device.isLoading} isError={device.isError} error={device.error} deviceId={deviceId} />
          </div>
          <div className="flex-1 min-h-0">
            <Routes>
              {tabs.map((tab) => (
                <Route path={tab.href} key={tab.href} element={tab.element} />
              ))}
              <Route path="opcua" element={<OPCUABrrowserPage />} />
            </Routes>
          </div>
        </div>
      </div>

  );
}

function DeviceCard({
  connectionStatus,
  isLoading,
  isError,
  error,
  deviceId,
}: {
  connectionStatus?: { iotEdgeRuntime: string; iotHub: string; sems: string };
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  deviceId?: string;
}) {
  if (isLoading)
    return (
      <div className="p-2 rounded-sm ring-1 ring-inset animate-pulse ring-gray-200">
        <div className="h-[55px] bg-slate-300 rounded-sm text-center text-4xl truncate p-2">{deviceId}</div>
      </div>
    );

  if (connectionStatus){
    if (connectionStatus.iotHub === "Connected" && connectionStatus.iotEdgeRuntime === "Connected" && connectionStatus.sems === "Connected"){
      return (
        <div className={`text-center text-4xl truncate p-2 rounded-sm ring-1 ring-inset bg-green-100 ring-green-600/20`}>
          {deviceId}
        </div>
      );
    }
    if (connectionStatus.iotHub=="Disconnected" && connectionStatus.iotEdgeRuntime === "Disconnected" && connectionStatus.sems=="Disconnected"){
      return (
        <div className={`text-center text-4xl truncate p-2 rounded-sm ring-1 ring-inset bg-red-100 ring-red-600/20`}>
          {deviceId}
        </div>
      )
    }
    if (connectionStatus.iotHub === "Disconnected" || connectionStatus.iotEdgeRuntime === "Disconnected" || connectionStatus.sems === "Disconnected" ){
      return (
        <div className={`text-center text-4xl truncate p-2 rounded-sm ring-1 ring-inset bg-yellow-100 ring-yellow-600/20`}>
          {deviceId}
        </div>
      )
    }
  }
  if (isError)
    return (
      <div>
        Error: {String(error)}
      </div>
    );
}