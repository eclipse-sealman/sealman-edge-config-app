import { useEffect, useState } from "react";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import { useAuth } from "@/auth";
import { NewUserDialog } from "@/features/authorization/NewUserDialog";

export function NewUserCheck() {
  const auth = useAuth();
  const { data } = edgeConfigApiHooks.useGetCurrentUser(auth.isAuthenticated);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (data?.is_new) {
      setOpen(true);
    }
  }, [data]);

  return <NewUserDialog open={open} onOpenChange={setOpen} />;
}
