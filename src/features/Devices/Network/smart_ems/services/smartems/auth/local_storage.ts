import { SMART_EMS_AUTH_STORAGE_REFRESH_TOKEN, SMART_EMS_AUTH_STORAGE_TOKEN } from "../../../config"

interface SmartEmsAuthData {
  token: string
  refreshToken: string
}

export const saveAuthorizationDataToLocalStorage = (authData: SmartEmsAuthData) => {
  try {
     localStorage.setItem(SMART_EMS_AUTH_STORAGE_TOKEN, authData.token)
     localStorage.setItem(SMART_EMS_AUTH_STORAGE_REFRESH_TOKEN, authData.refreshToken)
   } catch (error) {
     console.error('Failed to save auth data to localStorage:', error)
     clearAuthDataFromStorage()
   }
}

const loadAuthFromStorage = () => {
  const token = localStorage.getItem(SMART_EMS_AUTH_STORAGE_TOKEN)
  const refreshToken = localStorage.getItem(SMART_EMS_AUTH_STORAGE_REFRESH_TOKEN)

  try {
    if (!token) {
      throw new Error("stored data is undefined")
    }
    if (!refreshToken) {
      throw new Error("No SMART EMS refreshToken in local storage")
    }

    const authData: SmartEmsAuthData = {
      token,
      refreshToken,
    }

    return authData
  } catch (err) {
    console.error("Error while retrieving smart ems auth from local storage", err)
    clearAuthDataFromStorage()
  }
}

export const clearAuthDataFromStorage = () => {
  try {
    localStorage.removeItem(SMART_EMS_AUTH_STORAGE_TOKEN)
    localStorage.removeItem(SMART_EMS_AUTH_STORAGE_REFRESH_TOKEN)
  } catch (error) {
    console.error('Failed to clear auth data from localStorage:', error)
  }
}

export const getSmartEmsAuth = () => {
  const auth = loadAuthFromStorage()
  return auth
}
