import { SMART_EMS_API_URL, SMART_EMS_AUTH_REDIRECT } from "../../../config"

export const getCodeAndStateFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search)
  return {
    code: urlParams.get('code'),
    state: urlParams.get('state'),
  }
}

export const clearUrlParams = () => {
  const url = new URL(window.location.href)
  url.search = ''
  window.history.replaceState({}, document.title, url.toString())
}

export const loginToSmartEMSWithSSO = () => {
  const encodedRedirectUri = encodeURIComponent(SMART_EMS_AUTH_REDIRECT)
  const loginUrl = `${SMART_EMS_API_URL}/web/api/authentication/sso/microsoftoidc/custom/redirect?redirect=${encodedRedirectUri}`
  window.location.href = loginUrl
}

export const authorizeWithCodeAPI = async (code: string, state: string)=> {
  const encodedRedirectUri = encodeURIComponent(SMART_EMS_AUTH_REDIRECT)
  const response = await fetch(
    `${SMART_EMS_API_URL}/web/api/authentication/sso/microsoftoidc/custom/authorize/${code}/${state}?redirect=${encodedRedirectUri}`,
    {
      method: 'GET',
      // headers: { 'Content-Type': 'application/json' }
    }
  )
  if (!response.ok) {
    throw new Error(`Authorization failed: ${response.status} ${response.statusText}`)
  }
  return response.json()
}
