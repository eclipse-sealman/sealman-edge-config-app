import { describe, expect, it, vi } from "vitest";
import { AxiosError, type AxiosResponse } from "axios";
import { getErrorMessage } from "@/lib/errors";
import { downloadFieldFile, uploadFieldFile } from "../fileFieldApi";

const mocks = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));

vi.mock("@/api/edgeConfig/edgeConfigApi", () => ({ edgeConfigApiInstance: { get: mocks.get, put: mocks.put } }));

describe("downloadFieldFile", () => {
  it("a refused download carries the API's message, not the status text", async () => {
    const message = "This file is secret and cannot be downloaded";
    const response = {
      status: 403,
      data: new Blob([JSON.stringify({ message })], { type: "application/json" }),
    } as AxiosResponse;
    mocks.get.mockRejectedValue(
      new AxiosError("Request failed with status code 403", "ERR_BAD_REQUEST", undefined, undefined, response),
    );

    const error = await downloadFieldFile({ kind: "endpoint", id: "e1" }, "crt", "a.crt").catch((e: unknown) => e);

    expect(getErrorMessage(error, "Could not download the file")).toBe(message);
  });
});

describe("uploadFieldFile", () => {
  const file = new File(["pem"], "root.crt");
  const headers = { "Content-Type": "application/octet-stream" };

  it("stores a template's default file under the variable, with the secret flag", async () => {
    mocks.put.mockResolvedValue({ data: {} });
    await uploadFieldFile({ kind: "template", id: "7" }, "ca", file, { secret: true });
    expect(mocks.put).toHaveBeenCalledWith("/module-config-templates/7/files/ca", file, { params: { name: "root.crt", secret: true }, headers });
  });

  it("stores a module's file by variable and template", async () => {
    mocks.put.mockResolvedValue({ data: {} });
    const x = new File(["pem"], "x.crt");
    await uploadFieldFile({ kind: "module", device: "dev1", module: "mod", templateId: 7 }, "a/ca", x);
    expect(mocks.put).toHaveBeenCalledWith("/dev1/modules/mod/config/files", x, { params: { variable: "a/ca", template_id: 7, name: "x.crt" }, headers });
  });
});
