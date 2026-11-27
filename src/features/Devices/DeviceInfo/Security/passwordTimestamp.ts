export function passwordTimestamp(value: string) {
  return new Date(value).toLocaleString(undefined, { timeZone: "UTC", timeZoneName: "short" });
}
