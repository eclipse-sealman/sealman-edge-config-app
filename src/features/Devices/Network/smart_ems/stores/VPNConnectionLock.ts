import { create } from "zustand"

// This store exists solely to provide a way for different components that can alter the VPN Connection status of different endpoint devices to share a lock so that no parallel requests to the SEMS API can be fired.
interface VPNConnectionLockStore {
  isConnectingOrDisconnecting: boolean,
  setIsConnectingOrDisconnecting: (isConnecting: boolean) => void
}

export default create<VPNConnectionLockStore>(set => ({
  isConnectingOrDisconnecting: false,
  setIsConnectingOrDisconnecting: (isConnectingOrDisconnecting) => set({isConnectingOrDisconnecting: isConnectingOrDisconnecting})
}))
