import { jwtDecode, JwtPayload } from "jwt-decode";
import { useQuery } from "@tanstack/react-query";
import { useAuth, authProvider } from "@/auth";
import { useMsal } from "@azure/msal-react";
import { edgeConfigApiLoginRequest } from "@/auth/providers/entra";

// Re-export from entra provider to maintain backward compatibility
export { edgeConfigApiLoginRequest };

export const getRolesFromToken = (token: string) => {
  const decodedToken = jwtDecode(token);
  return decodedToken || [];
};

interface RoleJwtPayload extends JwtPayload {
  roles?: string[]
}

/**
 * Unified hook to get JWT that works with both Keycloak and Entra ID
 * For Entra ID, it uses MSAL's acquireTokenSilent
 * For Keycloak, it decodes the access token from OIDC
 */
export const useGetJwt = () => {
  const auth = useAuth();
  
  // For Entra ID provider, use MSAL directly if available
  const msalHook = authProvider === 'entra' ? useMsal() : { instance: null };

  const query = useQuery({
    queryKey: ['authToken', authProvider],
    queryFn: async () => {
      if (authProvider === 'entra' && msalHook.instance) {
        // Use MSAL for Entra ID
        const authResult = await msalHook.instance.acquireTokenSilent(edgeConfigApiLoginRequest);
        return jwtDecode<RoleJwtPayload>(authResult.accessToken);
      } else {
        // Use OIDC token for Keycloak
        const token = auth.getAccessToken();
        if (!token) {
          throw new Error("No access token available");
        }
        return jwtDecode<RoleJwtPayload>(token);
      }
    },
    enabled: auth.isAuthenticated,
  });

  return query;
};

/**
 * Hook to get current user ID (compatible with both providers)
 */
export const useGetCurrentUserId = () => {
  const auth = useAuth();
  const msalHook = authProvider === 'entra' ? useMsal() : { instance: null };
  
  if (authProvider === 'entra' && msalHook.instance) {
    return msalHook.instance.getActiveAccount()?.localAccountId;
  }
  
  return auth.user?.sub;
};
