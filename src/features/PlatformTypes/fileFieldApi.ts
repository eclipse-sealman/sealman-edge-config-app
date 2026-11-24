import { isAxiosError } from "axios";
import { edgeConfigApiInstance } from "@/api/edgeConfig/edgeConfigApi";
import type { FileOwner, FileRef } from "./fileField";

const COLLECTIONS = { endpoint: "endpoints", service: "services", device: "devices" } as const;
const path = (owner: FileOwner, field: string) =>
  `/${COLLECTIONS[owner.kind]}/${encodeURIComponent(owner.id)}/files/${encodeURIComponent(field)}`;

export async function uploadFieldFile(owner: FileOwner, field: string, file: File): Promise<FileRef> {
  const { data } = await edgeConfigApiInstance.put<FileRef>(path(owner, field), file, {
    params: { name: file.name },
    headers: { "Content-Type": "application/octet-stream" },
  });
  return data;
}

export async function removeFieldFile(owner: FileOwner, field: string): Promise<void> {
  await edgeConfigApiInstance.delete(path(owner, field));
}

/** A blob request's error body is a Blob too: read it as JSON so the API's `message` reaches the user. */
async function withJsonErrorBody(error: unknown): Promise<unknown> {
  const response = isAxiosError(error) ? error.response : undefined;
  if (response && response.data instanceof Blob) {
    try {
      response.data = JSON.parse(await response.data.text());
    } catch {
      response.data = undefined;
    }
  }
  return error;
}

export async function downloadFieldFile(owner: FileOwner, field: string, name: string): Promise<void> {
  let data: Blob;
  try {
    ({ data } = await edgeConfigApiInstance.get<Blob>(path(owner, field), { responseType: "blob" }));
  } catch (error) {
    throw await withJsonErrorBody(error);
  }
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
