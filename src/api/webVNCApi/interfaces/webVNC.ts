import { WebVNCInstanceRequest } from "./webVNCInstanceRequest";


export interface WebVNC extends WebVNCInstanceRequest {
    id: string
    remotePort: number
    instanceUrl: string
    websocketURL: string
    apiWebsocket: string
}