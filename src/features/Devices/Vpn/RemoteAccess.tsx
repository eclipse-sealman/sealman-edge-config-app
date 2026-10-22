import { NavLink, Navigate, Route, Routes, useParams } from "react-router-dom";
import VpnPage from "./VpnPage";
import SettingsPlaceholder from "@/pages/settings/SettingsPlaceholder";

const TABS = [
  { title: "VPN", path: "vpn" },
  { title: "WebVNC", path: "web-vnc" },
  { title: "WebFTP", path: "web-ftp" },
  { title: "Connect Device", path: "connect-device" },
];

export default function RemoteAccess() {
  const { deviceId = "" } = useParams<{ deviceId: string }>();
  const base = `/devices/${deviceId}/remote-access`;

  return (
    <div className="rounded-lg border bg-background shadow-xs">
      <div className="space-y-1.5 border-b px-6 py-4">
        <h2 className="text-lg font-semibold leading-none tracking-tight">Remote Access</h2>
        <p className="text-sm text-muted-foreground">Reach this device and the assets behind it from your workstation.</p>
      </div>

      <div className="flex items-start">
        <nav
          aria-label="Remote access"
          className="flex w-52 shrink-0 flex-col gap-1 self-stretch border-r p-3 text-sm font-medium text-muted-foreground"
        >
          {TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={`${base}/${tab.path}`}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 transition-colors ${
                  isActive ? "bg-muted text-foreground shadow-sm" : "hover:bg-muted/60 hover:text-foreground"
                }`
              }
            >
              {tab.title}
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0 flex-1 space-y-6 p-6">
          <Routes>
            <Route index element={<Navigate to={`${base}/vpn`} replace />} />
            <Route path="vpn" element={<VpnPage deviceId={deviceId} />} />
            <Route path="web-vnc" element={<SettingsPlaceholder title="WebVNC" description="Remote desktop access to the device in your browser." />} />
            <Route path="web-ftp" element={<SettingsPlaceholder title="WebFTP" description="Browse and transfer files on the device in your browser." />} />
            <Route
              path="connect-device"
              element={<SettingsPlaceholder title="Connect Device" description="Connect directly to the device from your workstation." />}
            />
            <Route path="*" element={<Navigate to={`${base}/vpn`} replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
