import {
  NavLink,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import DeviceConfig from "./DeviceConfig/DeviceConfig";
import ApplicationsTab from "./ModuleConfig/ApplicationsTab";
import SmartEmsInfo from "./DeviceInfo/SmartEmsInfo";
import ConnectionStatus from "./DeviceInfo/ConnectionInfo";
import useGetDevice from "@/generated/edge-administration/hooks/devices/useGetDevice";
import OPCUABrrowserPage from "../../pages/OPCUABrowser";
import { NetworkPage } from "./Network";
import { usePermissions } from "../authorization/permissions/use-permissions";
import { NoPermissionsPanel } from "../authorization/permissions/NoPermissionsPanel";
import DeviceMetadata from "./DeviceInfo/Metadata/DeviceMetadata";
import { PERMISSION_KEYS } from "../authorization/permissions/permission-keys";
import { Boxes, Info, Network, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import DeviceHeader from "./DeviceHeader";
import VpnPage from "./Vpn/VpnPage";

export default function DeviceDetail() {
  const { deviceId } = useParams();

  const device = useGetDevice(deviceId ?? "");

  const tabs = [
    {
      title: "Info",
      href: "",
      icon: Info,
      element: (
        <div className="space-y-6">
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
        </div>
      ),
    },
    {
      title: "Device Config",
      href: "device-config",
      icon: SlidersHorizontal,
      element: <DeviceConfig />,
    },
    {
      title: "Applications",
      href: "module-config",
      icon: Boxes,
      element: <ApplicationsTab />,
    },
    {
      title: "Endpoints",
      href: "network",
      icon: Network,
      element: <NetworkPage deviceId={ deviceId ?? "no device ID in the path"} />,
    },
    {
      title: "VPN",
      href: "vpn",
      icon: ShieldCheck,
      element: <VpnPage deviceId={deviceId ?? "no device ID in the path"} />,
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
    <div className="flex h-full flex-col gap-3 overflow-hidden p-3">
      <DeviceHeader
        deviceId={deviceId}
        connectionStatus={device.data?.connectionStatus}
        isLoading={device.isLoading}
        isError={device.isError}
        error={device.error}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
        <nav className="flex shrink-0 gap-1 self-start overflow-x-auto rounded-lg border bg-white p-2 max-md:w-full md:w-56 md:flex-col">
          {tabs.map((tab) => (
            <NavLink
              to={tab.href ? `/devices/${deviceId}/${tab.href}` : `/devices/${deviceId}`}
              end
              key={tab.href}
              className={({ isActive }: { isActive: boolean }) =>
                cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100",
                )
              }
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              {tab.title}
            </NavLink>
          ))}
        </nav>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto rounded-lg border bg-white p-3">
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