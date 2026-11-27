import { NavLink, Outlet } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/page-state";
import { WaterLoader } from "@/components/ui/water-loader";
import { getErrorMessage } from "@/lib/errors";
import { PendingChangesProvider, SaveChangesButton } from "./PendingChangesProvider";

const TABS = [
  { title: "Azure IoT Edge", path: "azure-iot-edge" },
  { title: "SEMS", path: "sealman-ems" },
];

export default function DevicesSettings() {
  const testMutation = useMutation({ mutationFn: () => edgeConfigApi.testDeviceConfig() });

  return (
    <PendingChangesProvider>
    <div className="flex h-full min-h-0 flex-col rounded-lg border bg-background shadow-xs">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b px-6 py-4">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold leading-none tracking-tight">Global Device Settings</h2>
          <p className="text-sm text-muted-foreground">
            Platform-wide settings that every device is provisioned with.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
            {testMutation.isPending && <WaterLoader />}
            {testMutation.isPending ? "Testing..." : "Test device config"}
          </Button>
          <SaveChangesButton />
        </div>
      </div>

      {(testMutation.data || testMutation.isError) && (
        <div className="shrink-0 border-b px-6 py-3">
          {testMutation.isError ? (
            <InlineAlert variant="error">{getErrorMessage(testMutation.error)}</InlineAlert>
          ) : (
            <InlineAlert variant={testMutation.data?.valid ? "success" : "error"}>
              {testMutation.data?.valid
                ? "Device configuration is valid."
                : `Device configuration is invalid: ${testMutation.data?.message}`}
            </InlineAlert>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Device settings"
          className="flex w-52 shrink-0 flex-col gap-1 overflow-y-auto border-r p-3 text-sm font-medium text-muted-foreground"
        >
          {TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
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

        <div className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto p-6">
          <Outlet />
        </div>
      </div>
    </div>
    </PendingChangesProvider>
  );
}
