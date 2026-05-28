import {
  NavLink,
  Route,
  Routes,
  useParams,
  // useLocation,
} from "react-router-dom";
import DeviceConfig from "./DeviceConfig/DeviceConfig";
import ModuleList from "./ModuleConfig/ModuleList";
import SmartEmsInfo from "./DeviceInfo/SmartEmsInfo";
import ConnectionStatus from "./DeviceInfo/ConnectionInfo";
import { edgeConfigApiHooks } from "../../api/edgeConfig/edgeConfigApiHooks";
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
  // const location = useLocation();
  // const urlParams = new URLSearchParams(location.search);
  // const endpoint = urlParams.get("endpoint");

  const tabs = [
    {
      title: "Info",
      href: "",
      element: (
        <div className="space-y-4">
          <ConnectionStatus />
          <DeviceMetadata />
          <SmartEmsInfo />
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

  const { hasPermission, noPermissionsMessage, isLoading } = usePermissions({ resourceType: "device", resourceId: deviceId, permissionKey: PERMISSION_KEYS.DEVICE_READ });

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
        <div className="relative z-10 bg-white rounded-sm p-2 relative flex flex-col gap-2">
          <div className="shrink-0">
            <DeviceCard />
          </div>
          <div>
            <Routes>
              {tabs.map((tab) => (
                <Route path={tab.href} key={tab.href} element={tab.element} />
              ))}
              <Route path="opcua" element={<OPCUABrrowserPage />} />
              {/* <Route
                path="webvnc"
                element={
                  <WebVNCApp
                    deviceId={deviceId ?? ""}
                    sourceIp={endpoint ?? ""}
                  />
                }
              ></Route> */}
            </Routes>
          </div>
        </div>
      </div>

  );
}

function DeviceCard() {
  const { deviceId } = useParams();

  const { isLoading, isError, data: connectionStatus, error } = edgeConfigApiHooks.useGetDeviceConnectionStatus(deviceId);

  // show grey loading state
  if (isLoading)
    return (
      <div className="p-2 rounded-sm ring-1 ring-inset animate-pulse ring-gray-200">
        <div className="h-[55px] bg-slate-300 rounded-sm text-center text-4xl truncate p-2">{deviceId}</div>
        
      </div>
    );

  if (connectionStatus){
    // Show green state --> iot-runtime, iot-hub and sems are online
    if (connectionStatus.iotHub === "Connected" && connectionStatus.iotEdgeRuntime === "Connected" && connectionStatus.sems === "Connected"){
      return (
        <div className={`text-center text-4xl truncate p-2 rounded-sm ring-1 ring-inset bg-green-100 ring-green-600/20`}>
          {deviceId}
        </div>
      );
    }
    // Show red state --> iot-runtime, iot-hub and sems are offline
    if (connectionStatus.iotHub=="Disconnected" && connectionStatus.iotEdgeRuntime === "Disconnected" && connectionStatus.sems=="Disconnected"){
      return (
        <div className={`text-center text-4xl truncate p-2 rounded-sm ring-1 ring-inset bg-red-100 ring-red-600/20`}>
          {deviceId}
        </div>
      )
    }
    // Show yellow state --> at least one of iot-runtime, iot-hub or sems is offline
    if (connectionStatus.iotHub === "Disconnected" || connectionStatus.iotEdgeRuntime === "Disconnected" || connectionStatus.sems === "Disconnected" ){
      return (
        <div className={`text-center text-4xl truncate p-2 rounded-sm ring-1 ring-inset bg-yellow-100 ring-yellow-600/20`}>
          {deviceId}
        </div>
      )
    }
    

  }
  // handle errors
  if (isError)
    return (
      <div>
        Error: {error.message} {JSON.stringify(error.response?.data, null, 4)}
      </div>
    );

}
