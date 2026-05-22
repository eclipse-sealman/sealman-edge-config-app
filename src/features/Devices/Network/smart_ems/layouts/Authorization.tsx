import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectSmartEMS } from "../components/config/Connect";
import { DisconnectSmartEMS } from "../components/config/Disconnect";
import { useAuthRedirectHandler } from "../services/smartems/auth/useAuth";
import { useIsUserAuthenticated } from "../services/smartems/hooks";
import { SessionInfo } from "./SessionInfo";
import { AuthorizedStatus } from "../components/config/AuthorizedStatus";

export function Authorization() {
  const { isAuthenticated, isLoading } = useIsUserAuthenticated();
  useAuthRedirectHandler();

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Authorization</CardTitle>
      </CardHeader>
      <CardContent className="grow space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <p className="text-xl">SMART EMS</p>
            <AuthorizedStatus isAuthenticated={isAuthenticated} isAuthenticating={isLoading} />
          </div>
          <SessionInfo />
          {!isAuthenticated && <ConnectSmartEMS />}
          {isAuthenticated && <DisconnectSmartEMS />}
        </div>
      </CardContent>
    </Card>
  );
}
