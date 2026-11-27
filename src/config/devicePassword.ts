export function isDevicePasswordEnabled() {
  const value = import.meta.env.VITE_DEVICE_PASSWORD_ENABLED;
  return value === true || (typeof value === "string" && value.trim().toLowerCase() === "true");
}
