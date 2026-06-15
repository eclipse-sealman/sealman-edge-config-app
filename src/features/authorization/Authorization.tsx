import { NavLink, Outlet } from "react-router-dom";

type AuthorizationTab = { label: string; path: string };

const tabs: AuthorizationTab[] = [
  { label: "Teams", path: "teams" },
  { label: "Roles", path: "roles" },
  { label: "Scopes", path: "scopes" },
  { label: "Users", path: "users" },
];

export default function Authorization() {
  return (
    <div className="h-full flex bg-gray-50">
      <div className="w-64 bg-white border-r">
        <nav className="flex flex-col p-2 gap-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `px-3 py-2 rounded text-sm font-medium transition-colors text-left ${
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
