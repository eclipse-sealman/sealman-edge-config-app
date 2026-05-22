import { ReactNode } from "react";

/**
 * Unified interface for authentication providers
 * Supports both Keycloak (via OIDC) and Entra ID (via MSAL)
 */

export interface UserProfile {
  sub?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  [key: string]: any;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  signIn: () => void | Promise<void>;
  signOut: () => void | Promise<void>;
  getAccessToken: () => string | null;
}

export interface AuthProviderProps {
  children: ReactNode;
}

export interface IAuthProvider {
  Provider: React.ComponentType<AuthProviderProps>;
  useAuth: () => AuthContextValue;
  getToken: () => string;
  getUserProfile: () => UserProfile;
  getAccessToken: () => Promise<string>;
}
