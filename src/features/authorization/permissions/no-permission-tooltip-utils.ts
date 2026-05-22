export function noPermissionForActionMessage({
  permissionKey,
  resourceType,
  resourceId,
}: {
  permissionKey: string;
  resourceType: string;
  resourceId?: string;
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
    resourceId != null && resourceId.trim() !== ""
      ? ` on ${resourceType} ${resourceId}`
      : ` on ${resourceType}`;

  return `You don't have permission to ${formattedAction}${context}.`;
}