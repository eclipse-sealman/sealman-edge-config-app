import { useMemo, useState } from "react";
import Roles from "./Roles";
import Scopes from "./Scopes";
import Teams from "./Teams";
import Users from "./Users";

type AuthorizationTab = "Scopes" | "Roles" | "Teams" | "Users";

export default function Authorization() {
  const [activeTab, setActiveTab] = useState<AuthorizationTab>("Scopes");

  const activePanel = useMemo(() => {
    switch (activeTab) {
      case "Scopes":
        return <Scopes />;
      case "Roles":
        return <Roles />;
      case "Teams":
        return <Teams />;
      case "Users":
        return <Users />;
      default:
        return null;
    }
  }, [activeTab]);

  const tabs: AuthorizationTab[] = ["Scopes", "Roles", "Teams", "Users"];

  return (
    <div className="h-full flex bg-gray-50">
      <div className="w-64 bg-white border-r">
        <nav className="flex flex-col p-2 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors text-left ${
                activeTab === tab
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">{activePanel}</div>
    </div>
  );
}
