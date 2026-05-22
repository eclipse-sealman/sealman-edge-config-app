import axios from "axios";
import { SMART_EMS_API_URL } from "../../config";
import { clearAuthDataFromStorage, getSmartEmsAuth, saveAuthorizationDataToLocalStorage } from "./auth/local_storage";
import { getSmartEmsDecodedToken, isExpired } from "./auth/token";

export const client = axios.create({
  baseURL: `${SMART_EMS_API_URL}`,
});

let isRefreshingToken = false;

client.interceptors.request.use(async function (config) {
  const isCypress = window.Cypress != undefined;
  
  if (isCypress) {
    return config;
  }
  
  while (isRefreshingToken) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const auth = getSmartEmsAuth();
  let token = auth?.token;

  if (!token) {
    console.warn("NO TOKEN FOUND");
    return config;
  }

  const decodedToken = getSmartEmsDecodedToken();

  // if (false && !decodedToken) {
  if (!decodedToken) {
    console.warn("Couldn't decode token");
    return config;
  }

  // if (false && !decodedToken.exp) {
  if (!decodedToken.exp) {
    console.warn("Can not get expiration time from token");
    clearAuthDataFromStorage();
    isRefreshingToken = false;
    return config;
  }

  // if (true || isExpired(decodedToken.exp)) {
  if (isExpired(decodedToken.exp)) {
    console.info("Will try to refresh the token");
    isRefreshingToken = true;
    clearAuthDataFromStorage();
    try {
      const response = await axios.post(`${SMART_EMS_API_URL}/web/api/authentication/token/refresh`, {
        refreshToken: auth?.refreshToken,
      });
      token = response.data.token;
      saveAuthorizationDataToLocalStorage(response.data);
    } catch (err) {
      console.warn("Can not refresh smart ems auth", err);
    } finally {
      isRefreshingToken = false;
    }
  }

  config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(function (config) {
  if (config.status === 401) {
    clearAuthDataFromStorage();
  }

  return config;
});
