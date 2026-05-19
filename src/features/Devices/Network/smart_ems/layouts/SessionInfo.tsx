import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "../components/Alert";
import { SessionTimer } from "../components/session/SessionTimer";
import { UserInfo } from "../components/session/UserInfo";
import { useIsUserAuthenticated } from "../services/smartems/hooks";

export function SessionInfo() {
  const { isAuthenticated, isLoading } = useIsUserAuthenticated();

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Alert title="Unauthorized">
        <p>You must authorize Edge Config to use Smart EMS on your behalf first.</p>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <UserInfo />
      <div className="flex items-center space-x-4">
        <p className="text-muted-foreground">Connection authorized for the next:</p>
        <div className="w-20">
          <SessionTimer />
        </div>
      </div>
    </div>
  );
}
