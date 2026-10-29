import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WaterLoader } from "@/components/ui/water-loader";
import { useAuthRedirectHandler } from "../services/smartems/auth/useAuth";
import { useIsUserAuthenticated } from "../services/smartems/hooks";

const FALLBACK_PATH = "/devices";

/** Landing page of the Smart EMS SSO redirect: stores the token, then returns to where the login started. */
export function SmartEmsAuthCallback() {
  const navigate = useNavigate();
  const { isError } = useAuthRedirectHandler();
  const { isAuthenticated } = useIsUserAuthenticated();
  const from = sessionStorage.getItem("from") ?? FALLBACK_PATH;

  useEffect(() => {
    if (!isAuthenticated) return;
    sessionStorage.removeItem("from");
    navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
        <p className="text-sm text-destructive">Authorization with Smart EMS failed.</p>
        <Link to={from} className="text-sm text-blue-700 underline">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <p className="flex items-center gap-2 text-muted-foreground">
        <WaterLoader /> Authorizing with Smart EMS...
      </p>
    </div>
  );
}
