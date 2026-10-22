import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import DeviceList from "./features/Devices/DeviceList";
import MainLayout from "./layouts/MainLayout";
import { ToastContainer } from "react-toastify";
import { queryClient } from "./config/queryConfig";
import Dashboard from "./pages/Dashboard";

import DeviceDetail from "./features/Devices/DeviceDetail";
import ComingNextPage from "./pages/ComingNextPage";
import ErrorFallback from "./pages/ErrorFallback";
import PageNotFound from "./pages/PageNotFound";
import Version from "./pages/Version";
import { QueryClientProvider } from "@tanstack/react-query";
// import { SmartEmsSettings } from "@/features/Devices/Network/smart_ems/pages/settings.tsx";
import SettingsLayout from "./pages/settings/SettingsLayout";
import PlatformTypesSettings from "./pages/settings/PlatformTypesSettings";
import TemplatesSettings from "./pages/settings/TemplatesSettings";
import SettingsPlaceholder from "./pages/settings/SettingsPlaceholder";
import SealAgentSettings from "./pages/settings/SealAgentSettings";
import { SmartEmsAuthCallback } from "./features/Devices/Network/smart_ems/pages/AuthCallback";
import { useAuth } from "./auth";
import { useEffect } from "react";
import { NewUserCheck } from "./components/NewUserCheck";
import Authorization from "./features/authorization/Authorization";
import Teams from "./features/authorization/Teams";
import Roles from "./features/authorization/Roles";
import Scopes from "./features/authorization/Scopes";
import Users from "./features/authorization/Users";
import UserProfile from "./pages/UserProfile";

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
              <Route path=":deviceId/*" element={<DeviceDetail />} />
            </Route>

            <Route
              path="platform-types"
              element={
                <div className="h-full overflow-y-auto p-6">
                  <PlatformTypesSettings />
                </div>
              }
            />
            <Route
              path="deployments/*"
              element={
                <ComingNextPage
                  title="Deployments"
                  description="Rolling out deployments across your whole fleet is the next feature on our roadmap and will arrive in an upcoming release."
                />
              }
            />
            <Route
              path="activity/*"
              element={
                <ComingNextPage
                  title="Monitoring"
                  description="A central log of what happened on your platform and fleet is coming soon and will arrive in an upcoming release."
                />
              }
            />
            <Route
              path="fleet-configuration/*"
              element={
                <ComingNextPage
                  title="Fleet Configuration"
                  description="Managing configuration for your whole fleet in one place is coming soon and will arrive in an upcoming release."
                />
              }
            />

            <Route path="authorization" element={<Authorization />}>
              <Route index element={<Navigate to="teams" replace />} />
              <Route path="teams" element={<Teams />} />
              <Route path="roles" element={<Roles />} />
              <Route path="scopes" element={<Scopes />} />
              <Route path="users" element={<Users />} />
            </Route>

            <Route path="settings/smartems" element={<SmartEmsAuthCallback />} />
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="seal-agent" replace />} />
              <Route path="platform-types" element={<Navigate to="/platform-types" replace />} />
              <Route path="seal-agent" element={<SealAgentSettings />} />
              <Route
                path="azure-iot-edge"
                element={<SettingsPlaceholder title="Azure IoT Edge" description="Connection and runtime settings for Azure IoT Edge." />}
              />
              <Route
                path="sealman-ems"
                element={<SettingsPlaceholder title="SEALMAN EMS" description="Settings for the SEALMAN Edge Management System." />}
              />
              <Route
                path="container-registries"
                element={<SettingsPlaceholder title="Container Registries" description="Registries used to pull container images for deployments." />}
              />
              <Route path="templates" element={<TemplatesSettings />} />
              {/* <Route path="smartems" element={<SmartEmsSettings />} /> */}
            </Route>
            <Route path="user/profile" element={<UserProfile />} />
            <Route path="version" element={<Version />} />
            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <NewUserCheck />
      <ToastContainer position="top-right" theme="light" autoClose={5000} newestOnTop pauseOnFocusLoss={false} />
    </QueryClientProvider>
  );
}
