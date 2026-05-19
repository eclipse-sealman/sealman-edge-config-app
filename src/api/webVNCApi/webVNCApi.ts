import axios from "axios";
import { WebVNCInstanceRequest } from "./interfaces/webVNCInstanceRequest";
import { WebVNC } from "./interfaces/webVNC";


export const webVNCApiInstance = axios.create({
  baseURL: `${import.meta.env.VITE_WEBVNC_URI}`,
  headers: {
    "api-key": `${import.meta.env.VITE_WEBVNC_API_KEY}`,
  },
});

const putWebvncNewInstance = async (request: WebVNCInstanceRequest) => {
  const { data } = await webVNCApiInstance.put<WebVNC>("/webvnc/newInstance", request);
  return data;
}

const deleteWebvncInstance = async (instanceId: string) => {
  const { data } = await webVNCApiInstance.delete<WebVNC>(`/webvnc/${instanceId}`);
  return data;
}

const getWebvncInstances = async () => {
  const { data } = await webVNCApiInstance.get<WebVNC[]>("/webvnc/instances");
  return data;
}


export const webVNCApi = {
  putWebvncNewInstance,
  deleteWebvncInstance,
  getWebvncInstances
}