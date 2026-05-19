import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { useLogin } from "../../services/smartems/auth/useAuth";

export function ConnectSmartEMS() {
  const login = useLogin()

  return (
    <div className="sm:text-right">
      <Button variant="outline" className="w-full sm:w-auto" onClick={() => login()}>
        <Link /> Authorize using Microsoft SSO
      </Button>
    </div>
  );
}
