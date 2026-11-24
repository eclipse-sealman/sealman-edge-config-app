export type FileRef = {
  $file: string;
  name: string;
  kind: "certificate" | "private-key" | "crl";
  not_after: string | null;
  uploaded_at: string;
};

export type FileOwner = { kind: "endpoint" | "service" | "device"; id: string };

export const FILE_SIZE_LIMIT = 65536;

export function isFileRef(value: unknown): value is FileRef {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).$file === "string" &&
    typeof (value as Record<string, unknown>).name === "string"
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WARNING_DAYS = 30;
const day = (iso: string) => new Date(iso).toISOString().slice(0, 10);

/** The status text next to a file's name, and how loudly to show it. */
export function fileStatus(ref: FileRef, secret: boolean, now: Date): { text: string; level: "ok" | "warning" | "error" } {
  const suffix = secret ? " · secret" : "";
  if (ref.not_after) {
    const remaining = new Date(ref.not_after).getTime() - now.getTime();
    if (remaining < 0) return { text: `expired ${day(ref.not_after)}${suffix}`, level: "error" };
    if (remaining <= WARNING_DAYS * DAY_MS) return { text: `expires ${day(ref.not_after)}${suffix}`, level: "warning" };
    return { text: `valid until ${day(ref.not_after)}${suffix}`, level: "ok" };
  }
  return { text: `uploaded ${day(ref.uploaded_at)}${suffix}`, level: "ok" };
}

/** Values without the file fields: a save must never send a file reference, only the upload and remove routes change it. */
export function withoutFileFields<T extends Record<string, unknown>>(values: T, fields: Record<string, { type: string }>): T {
  return Object.fromEntries(Object.entries(values).filter(([key]) => fields[key]?.type !== "file")) as T;
}
