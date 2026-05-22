import { Badge } from "@/components/ui/badge";

export function AuthorizedStatus({
  isAuthenticated,
  isAuthenticating,
}: {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
}) {
  if (isAuthenticating) {
    return (
      <Badge variant="outline" className="text-blue-600 border-blue-600">
        Checking...
      </Badge>
    );
  }

  if (isAuthenticated) {
    return (
      <Badge variant="outline" className="text-green-600 border-green-600">
        Authorized
      </Badge>
    );
  }

  if (!isAuthenticated) {
    return (
      <Badge variant="outline" className="text-red-600 border-red-600">
        Unauthorized
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-red-600 border-red-600">
      Error
    </Badge>
  );
}
