import { useAuth } from "@/auth";
import { Button } from "@/components/ui/button";

export default function SignOutButton() {
  const auth = useAuth();

  return (
    <Button variant="ghost" onClick={() => auth.signOut()} className="w-full justify-start rounded-none px-4 font-normal text-gray-700">
      Logout
    </Button>
  );
}
