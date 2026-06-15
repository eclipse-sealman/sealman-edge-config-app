import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import DeviceList from "./features/Devices/DeviceList";
import MainLayout from "./layouts/MainLayout";
import { ToastContainer } from "react-toastify";
import { queryClient } from "./config/queryConfig";
import Dashboard from "./pages/Dashboard";

import SidebarLayout from "./layouts/SidebarLayout";
import DeviceDetail from "./features/Devices/DeviceDetail";
import Deployments from "./features/deployments/Deployments";
import ErrorFallback from "./pages/ErrorFallback";
import PageNotFound from "./pages/PageNotFound";
import Version from "./pages/Version";
import { QueryClientProvider } from "@tanstack/react-query";
// import { SmartEmsSettings } from "@/features/Devices/Network/smart_ems/pages/settings.tsx";
import SettingsLayout from "./pages/settings/SettingsLayout";
import NetworkSettings from "./pages/settings/NetworkSettings";
import DeviceSettings from "./pages/settings/DeviceSettings";
import DeviceMetadataSettings from "./pages/settings/DeviceMetadataSettings";
import { useAuth } from "./auth";
import { useEffect } from "react";
import DeploymentDetails from "./features/deployments/DeploymentDetails";
import ServiceDetails from "./features/deployments/ServiceDetails";
import Authorization from "./features/authorization/Authorization";
import Teams from "./features/authorization/Teams";
import Roles from "./features/authorization/Roles";
import Scopes from "./features/authorization/Scopes";
import Users from "./features/authorization/Users";

export default function App() {
  const auth = useAuth();

  // Auto sign-in for Keycloak (similar to useAutoSignin)
  useEffect(() => {
    if (!auth.isAuthenticated && !auth.isLoading) {
      auth.signIn();
    }
  }, [auth, auth.isAuthenticated, auth.isLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} errorElement={<ErrorFallback />} />
            <Route path="devices" element={<Outlet />}>
              <Route
                index
                element={
                  <div className="h-full overflow-y-auto">
                    <DeviceList />
                  </div>
                }
              />
              <Route path=":deviceId/*" element={<SidebarLayout sidebar={<DeviceList />} />}>
                <Route path="*" element={<DeviceDetail />} />
              </Route>
            </Route>

            <Route path="deployments" element={<Outlet />}>
              <Route index element={<Deployments />} />
              <Route path=":deploymentId" element={<Outlet />}>
                <Route index element={<DeploymentDetails />} />
                <Route path="services/:serviceId" element={<ServiceDetails />} />
              </Route>
            </Route>

            <Route path="authorization" element={<Authorization />}>
              <Route index element={<Navigate to="teams" replace />} />
              <Route path="teams" element={<Teams />} />
              <Route path="roles" element={<Roles />} />
              <Route path="scopes" element={<Scopes />} />
              <Route path="users" element={<Users />} />
            </Route>

            <Route path="settings" element={<SettingsLayout />}>
              <Route path="network" element={<NetworkSettings />} />
              <Route path="device-templates" element={<DeviceSettings />} />
              <Route path="device-metadata" element={<DeviceMetadataSettings />} />
              {/* <Route path="smartems" element={<SmartEmsSettings />} /> */}
            </Route>
            <Route path="version" element={<Version />} />
            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ToastContainer position="bottom-right" />
    </QueryClientProvider>
  );
}
