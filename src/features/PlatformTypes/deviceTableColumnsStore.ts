import { create } from "zustand";
import { persist } from "zustand/middleware";

const GEO_LOCATION_KEY_PATTERN = /geo.?location/i;

/** Sensible baseline when nothing has been explicitly configured: everything except geo-location. */
export function defaultFieldVisible(key: string): boolean {
  return !GEO_LOCATION_KEY_PATTERN.test(key);
}

interface DeviceTableColumnsState {
  /** Explicit per-field-key overrides; absence means "use defaultFieldVisible". */
  overrides: Record<string, boolean>;
  setFieldVisible: (key: string, visible: boolean) => void;
}

/**
 * Which device metadata fields show as columns in the devices table, configured from the
 * Platform Types settings page. The backend has no concept of this yet, so it's persisted
 * locally in the browser rather than shared across admins.
 */
const useDeviceTableColumnsStore = create<DeviceTableColumnsState>()(
  persist(
    (set) => ({
      overrides: {},
      setFieldVisible: (key, visible) =>
        set((state) => ({ overrides: { ...state.overrides, [key]: visible } })),
    }),
    { name: "sealman.device-table-columns" },
  ),
);

export default useDeviceTableColumnsStore;
