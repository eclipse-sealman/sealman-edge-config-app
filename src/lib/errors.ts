import { isAxiosError } from "axios";

/** Extracts a human readable message from an API/Axios error for use in notifications and alerts. */
export function getErrorMessage(error: unknown, fallback = "Unknown error"): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: unknown; detail?: unknown } | string | undefined;
    if (typeof data === "string" && data.trim() !== "") return data;
    if (data && typeof data === "object") {
      if (typeof data.message === "string" && data.message !== "") return data.message;
      if (typeof data.detail === "string" && data.detail !== "") return data.detail;
      if (Array.isArray(data.detail)) {
        const messages = data.detail.map((d) => (typeof d?.msg === "string" ? d.msg : null)).filter(Boolean);
        if (messages.length > 0) return messages.join("; ");
      }
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === "string" && error !== "") return error;
  return fallback;
}
