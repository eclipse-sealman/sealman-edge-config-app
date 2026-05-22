/**
 * Authentication Provider Factory
 * Selects and exports the appropriate auth provider based on configuration
 */

import { authProvider } from './authProviderConfig';
import { keycloakAuthProvider } from './providers/keycloak';
import { entraAuthProvider } from './providers/entra';
import { IAuthProvider } from './types';

// Select the appropriate provider based on configuration
function getAuthProviderInstance(): IAuthProvider {
  switch (authProvider) {
    case 'keycloak':
      return keycloakAuthProvider;
    case 'entra':
      return entraAuthProvider;
    default:
      throw new Error(`Unsupported authentication provider: ${authProvider}`);
  }
}

// Export the selected provider instance
const authProviderInstance = getAuthProviderInstance();

// Export provider components and hooks
export const AuthProvider = authProviderInstance.Provider;
export const useAuth = authProviderInstance.useAuth;
export const getToken = authProviderInstance.getToken;
export const getUserProfile = authProviderInstance.getUserProfile;
export const getAccessToken = authProviderInstance.getAccessToken;

// Export the provider type for debugging
export { authProvider };
