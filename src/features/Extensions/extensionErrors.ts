import { ApiError } from "@/generated/edge-administration/api";

export function isExtensionsDisabledError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.statusCode === 404;
}