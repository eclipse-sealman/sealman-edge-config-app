import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useLogin } from "../../services/smartems/auth/useAuth";

export function ConnectSmartEMS() {
  const login = useLogin()
  const location = useLocation()

  // The SSO round trip leaves the app; the callback page sends the user back to this path.
  const authorize = () => {
    sessionStorage.setItem("from", location.pathname + location.search)
    login()
  }

  return (
    <div className="sm:text-right">
      <Button variant="outline" className="w-full sm:w-auto" onClick={authorize}>
        <Link /> Authorize using Microsoft SSO
      </Button>
    </div>
  );
}
