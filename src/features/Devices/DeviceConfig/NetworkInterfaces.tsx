import { NavLink, Outlet, useParams } from "react-router-dom";
import { useDeviceCellularConfig } from "./DeviceCellularConfig";

const TABS = [
  { label: "LAN", path: "lan", needsCellular: false },
  { label: "LTE", path: "lte", needsCellular: true },
];

/** Network interface settings, split into the LAN ports and the cellular (LTE) modem. */
export default function NetworkInterfaces() {
  const { deviceId = "" } = useParams<{ deviceId: string }>();
  const base = `/devices/${deviceId}/device-config/network-interfaces`;
  const hasCellular = useDeviceCellularConfig(deviceId).data?.cellular === true;
  const tabs = TABS.filter((tab) => !tab.needsCellular || hasCellular);

  return (
    <div className="space-y-4">
      {tabs.length > 1 && (
        <nav aria-label="Network interface types" className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={`${base}/${tab.path}`}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      )}
      <Outlet />
    </div>
  );
}
