import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

function useGetFullPath() {
  const location = useLocation();
  const fullPath = location.pathname + location.search;

  return fullPath;
}

export function SmartEmsSettingsButton() {
  const from = useGetFullPath();

  return (
    <>
      <Link to={`/settings/smartems?from=${from}`}>
        <Button variant="outline">
          <Settings /> Go to settings
        </Button>
      </Link>
    </>
  );
}

export function SmartEmsSettingsButtonIcon() {
  const from = useGetFullPath();

  return (
    <>
      <Link to={`/settings/smartems?from=${from}`}>
        <Button size="icon" variant="outline">
          <Settings />
        </Button>
      </Link>
    </>
  );
}
