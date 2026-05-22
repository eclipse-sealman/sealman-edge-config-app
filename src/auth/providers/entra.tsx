/**
 * Entra ID (Azure AD) Authentication Provider
 * Uses @azure/msal-browser and @azure/msal-react
 */

import {
  PublicClientApplication,
  Configuration,
  InteractionRequiredAuthError,
  RedirectRequest,
} from "@azure/msal-browser";
import {
  MsalProvider,
  useMsal,
  useIsAuthenticated,
  useAccount,
} from "@azure/msal-react";
import {
  IAuthProvider,
  AuthContextValue,
  AuthProviderProps,
  UserProfile,
} from "../types";
import React from "react";

// Authentication scopes for API access
export const edgeConfigApiLoginRequest: RedirectRequest = {
  scopes: import.meta.env.VITE_API_SCOPES?.split(",") || [""],
};

// MSAL Configuration
const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_ID_CLIENT_ID || "",
    authority: import.meta.env.VITE_ENTRA_ID_AUTHORITY || "",
    redirectUri:
      import.meta.env.VITE_ENTRA_ID_REDIRECT_URI || window.location.origin,
  },
  system: {
    allowPlatformBroker: false, // Disables WAM Broker
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL instance (will be called before rendering)
let msalInitialized = false;
const initializeMsal = async () => {
  if (!msalInitialized) {
    await msalInstance.initialize();

    const response = await msalInstance.handleRedirectPromise();

    if (response?.account) {
      msalInstance.setActiveAccount(response.account);
    } else {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
      }
    }

    msalInitialized = true;
  }
};

// Login request configuration
const loginRequest = {
  scopes: import.meta.env.VITE_API_SCOPES?.split(",") || ["User.Read"],
};

function getToken(): string {
  const account = msalInstance.getActiveAccount();

  if (!account) {
    throw new Error("No user authenticated with Entra ID");
  }

  // Return the ID token from the account
  // Note: For fresh tokens, components should use getTokenAsync
  return account.idToken || "";
}

async function getTokenAsync(): Promise<string> {
  const account = msalInstance.getActiveAccount();

  if (!account) {
    throw new Error("No user authenticated with Entra ID");
  }

  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes: loginRequest.scopes,
      account: account,
    });
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Fallback to interactive method
      const response = await msalInstance.acquireTokenPopup({
        scopes: loginRequest.scopes,
        account: account,
      });
      return response.accessToken;
    }
    throw error;
  }
}

/**
 * Get access token for API calls (uses edgeConfigApiLoginRequest scopes)
 */
async function getAccessToken(): Promise<string> {
  const account = msalInstance.getActiveAccount();

  if (!account) {
    throw new Error("No user authenticated with Entra ID");
  }

  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes: edgeConfigApiLoginRequest.scopes,
      account: account,
    });
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Fallback to interactive method
      const response = await msalInstance.acquireTokenPopup({
        scopes: edgeConfigApiLoginRequest.scopes,
        account: account,
      });
      return response.accessToken;
    }
    throw error;
  }
}

function getUserProfile(): UserProfile {
  const account = msalInstance.getActiveAccount();

  if (!account) {
    throw new Error("No user authenticated with Entra ID");
  }

  return {
    sub: account.localAccountId,
    email: account.username,
    name: account.name,
    preferred_username: account.username,
    ...account.idTokenClaims,
  };
}

// Wrapper hook to match our unified interface
function useEntraAuth(): AuthContextValue {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const account = useAccount();

  const signIn = async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    const logoutRequest = {
      account: account ?? undefined,
      postLogoutRedirectUri: window.location.origin,
    };

    try {
      await instance.logoutRedirect(logoutRequest);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  const getAccessToken = (): string | null => {
    if (!account) return null;
    return account.idToken || null;
  };

  return {
    isAuthenticated,
    isLoading: inProgress !== "none",
    user: account
      ? {
          sub: account.localAccountId,
          email: account.username,
          name: account.name,
          preferred_username: account.username,
          ...account.idTokenClaims,
        }
      : null,
    signIn,
    signOut,
    getAccessToken,
  };
}

// Provider wrapper component
function EntraProvider({ children }: AuthProviderProps) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    initializeMsal().then(() => setReady(true));
  }, []);

  if (!ready) {
    return null;
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}

export const entraAuthProvider: IAuthProvider = {
  Provider: EntraProvider,
  useAuth: useEntraAuth,
  getToken,
  getUserProfile,
  getAccessToken,
};

// Export token async helper for components that can use it
export { getTokenAsync };
