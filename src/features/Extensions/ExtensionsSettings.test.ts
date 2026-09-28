import { ApiError } from "@/generated/edge-administration/api";
import { isExtensionsDisabledError } from "./extensionErrors";

describe("isExtensionsDisabledError", () => {
  it("recognizes the missing management API when extensions are disabled", () => {
    expect(isExtensionsDisabledError(new ApiError("Not found", 404))).toBe(true);
  });

  it("does not hide unrelated backend failures", () => {
    expect(isExtensionsDisabledError(new ApiError("Unavailable", 503))).toBe(false);
    expect(isExtensionsDisabledError(new Error("Network error"))).toBe(false);
  });
});