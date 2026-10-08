export const LOCAL_ONLINE_SIMULATION = `${import.meta.env.VITE_LOCAL_ONLINE_SIMULATION}`.toLowerCase() === "true";

const CONNECTION_STATE_KEYS = new Set(["deviceStatus", "iotEdgeRuntime", "iotHub", "sems", "vpn", "connectionState"]);

/** Recursively sets every device/module connection state in an API response to "Connected". */
export function simulateOnline<T>(data: T): T {
  if (Array.isArray(data)) return data.map(simulateOnline) as T;
  if (data && Object.getPrototypeOf(data) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) =>
        CONNECTION_STATE_KEYS.has(key) && typeof value === "string" ? [key, "Connected"] : [key, simulateOnline(value)],
      ),
    ) as T;
  }
  return data;
}
