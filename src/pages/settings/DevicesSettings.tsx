import { NavLink, Outlet } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/page-state";
import { WaterLoader } from "@/components/ui/water-loader";
import { getErrorMessage } from "@/lib/errors";

const TABS = [
  { title: "Azure IoT Edge", path: "azure-iot-edge" },
  { title: "SEMS", path: "sealman-ems" },
];

export default function DevicesSettings() {
  const testMutation = useMutation({ mutationFn: () => edgeConfigApi.testDeviceConfig() });

  return (
    <div className="rounded-lg border bg-background shadow-xs">
      <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold leading-none tracking-tight">Devices</h2>
          <p className="text-sm text-muted-foreground">
            Platform-wide settings that every device is provisioned with.
          </p>
        </div>
        <div className="shrink-0">
          <Button onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
            {testMutation.isPending && <WaterLoader />}
            {testMutation.isPending ? "Testing..." : "Test device config"}
          </Button>
        </div>
      </div>

      {(testMutation.data || testMutation.isError) && (
        <div className="border-b px-6 py-3">
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

      <div className="flex items-start">
        <nav
          aria-label="Device settings"
          className="flex w-52 shrink-0 flex-col gap-1 self-stretch border-r p-3 text-sm font-medium text-muted-foreground"
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

        <div className="min-w-0 flex-1 space-y-6 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
