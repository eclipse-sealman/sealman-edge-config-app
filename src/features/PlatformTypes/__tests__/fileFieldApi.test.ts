import { describe, expect, it, vi } from "vitest";
import { AxiosError, type AxiosResponse } from "axios";
import { getErrorMessage } from "@/lib/errors";
import { downloadFieldFile } from "../fileFieldApi";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/api/edgeConfig/edgeConfigApi", () => ({ edgeConfigApiInstance: { get: mocks.get } }));

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
