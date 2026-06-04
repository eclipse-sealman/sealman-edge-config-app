export function noPermissionForActionMessage({
  permissionKey,
  resourceType,
  deviceId,
}: {
  permissionKey: string;
  resourceType: string;
  deviceId?: string;
}): string {
  // Normalize: trim, lowercase, replace underscores with spaces
  const action = permissionKey.trim().toLowerCase().replace(/_/g, " ");

  // Capitalize short acronyms (e.g., id)
  const formattedAction = action
    .split(" ")
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w))
    .join(" ");

  // Build context part
  const context =
    deviceId != null && deviceId.trim() !== ""
      ? ` on ${resourceType} ${deviceId}`
      : ` on ${resourceType}`;

  return `You don't have permission to ${formattedAction}${context}.`;
}