export const PERMISSION_KEYS = {
  DEVICE_DEPLOYMENT_WRITE: "device.deployment.write",
  DEVICE_LINE_WRITE: "device.line.write",
  DEVICE_MODULE_EXECUTE_METHOD: "device.module.execute_method",
  DEVICE_MODULE_TWIN_CONFIG_WRITE: "device.module_twin_config.write",
  DEVICE_NETWORK_DISCOVER: "device.network.discover",
  DEVICE_NETWORK_WRITE: "device.network.write",
  DEVICE_SMARTEMS_TEMPLATE_APPLY: "device.sems_template.apply",
  DEVICE_PASSWORD_READ: "device.password.read",
  DEVICE_PASSWORD_WRITE: "device.password.write",
  DEVICE_READ: "device.read",
} as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS];
