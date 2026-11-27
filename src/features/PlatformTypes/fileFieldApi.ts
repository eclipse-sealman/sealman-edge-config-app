import { isAxiosError } from "axios";
import { edgeConfigApiInstance } from "@/api/edgeConfig/edgeConfigApi";
import type { FileOwner, FileRef } from "./fileField";

const enc = encodeURIComponent;

/** The route of a file and the query it needs; the module's file is addressed by query, the others by path. */
function target(owner: FileOwner, field: string): { url: string; params?: Record<string, string | number> } {
  switch (owner.kind) {
    case "template":
      return { url: `/module-config-templates/${enc(owner.id)}/files/${enc(field)}` };
    case "module":
      return { url: `/${enc(owner.device)}/modules/${enc(owner.module)}/config/files`, params: { variable: field, template_id: owner.templateId } };
    default:
      return { url: `/${owner.kind}s/${enc(owner.id)}/files/${enc(field)}` };
  }
}

/** `secret` is the flag a template's default file is stored with; it is not part of the other owners' routes. */
export async function uploadFieldFile(owner: FileOwner, field: string, file: File, options?: { secret?: boolean }): Promise<FileRef> {
  const { url, params } = target(owner, field);
  const { data } = await edgeConfigApiInstance.put<FileRef>(url, file, {
    params: { ...params, name: file.name, ...(owner.kind === "template" ? { secret: Boolean(options?.secret) } : {}) },
    headers: { "Content-Type": "application/octet-stream" },
  });
  return data;
}

export async function removeFieldFile(owner: FileOwner, field: string): Promise<void> {
  const { url, params } = target(owner, field);
  await edgeConfigApiInstance.delete(url, params ? { params } : undefined);
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
    const { url, params } = target(owner, field);
    ({ data } = await edgeConfigApiInstance.get<Blob>(url, { responseType: "blob", ...(params ? { params } : {}) }));
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
