/**
 * Authentication Provider Configuration
 * 
 * Determines which authentication provider to use based on environment variable
 * VITE_AUTHENTICATION_PROVIDER: 'keycloak' (default) or 'entra'
 */

export type AuthProvider = 'keycloak' | 'entra';

const VALID_PROVIDERS: AuthProvider[] = ['keycloak', 'entra'];

function getAuthProvider(): AuthProvider {
  const provider = import.meta.env.VITE_AUTHENTICATION_PROVIDER;
  
  // Default to keycloak if not set
  if (!provider) {
    return 'keycloak';
  }
  
  // Validate the provider value
  if (!VALID_PROVIDERS.includes(provider as AuthProvider)) {
    throw new Error(
      `Invalid authentication provider: "${provider}". ` +
      `Must be one of: ${VALID_PROVIDERS.join(', ')}`
    );
  }
  
  return provider as AuthProvider;
}

export const authProvider = getAuthProvider();
