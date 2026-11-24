import { describe, expect, it } from "vitest";
import { fileStatus, withoutFileFields, type FileRef } from "../fileField";
import { formatMetadataValue } from "../FieldValueInput";

const NOW = new Date("2026-11-25T00:00:00Z");
const cert = (not_after: string | null): FileRef => ({
  $file: "f1",
  name: "plc-line3.crt",
  kind: "certificate",
  not_after,
  uploaded_at: "2026-11-24T10:00:00Z",
});

describe("fileStatus", () => {
  it("a certificate valid for long is ok", () => {
    expect(fileStatus(cert("2027-05-01T00:00:00Z"), false, NOW)).toEqual({ text: "valid until 2027-05-01", level: "ok" });
  });

  it("warns up to and including 30 days before expiry", () => {
    expect(fileStatus(cert("2026-12-20T00:00:00Z"), false, NOW)).toEqual({ text: "expires 2026-12-20", level: "warning" });
    expect(fileStatus(cert("2026-12-25T00:00:00Z"), false, NOW).level).toBe("warning");
    expect(fileStatus(cert("2026-12-26T00:00:00Z"), false, NOW).level).toBe("ok");
  });

  it("an expired certificate is an error", () => {
    expect(fileStatus(cert("2026-11-01T00:00:00Z"), false, NOW)).toEqual({ text: "expired 2026-11-01", level: "error" });
  });

  it("a secret private key shows its upload date and that it is secret", () => {
    const key: FileRef = { ...cert(null), name: "client.key", kind: "private-key" };
    expect(fileStatus(key, true, NOW)).toEqual({ text: "uploaded 2026-11-24 · secret", level: "ok" });
  });
});

describe("file values in forms", () => {
  it("formatMetadataValue shows the file name", () => {
    expect(formatMetadataValue(cert(null), { type: "file" })).toBe("plc-line3.crt");
    expect(formatMetadataValue(null, { type: "file" })).toBe("");
  });

  it("withoutFileFields drops file fields only", () => {
    const fields = { crt: { type: "file" }, host: { type: "string" } };
    expect(withoutFileFields({ crt: cert(null), host: "a", custom: 1 }, fields)).toEqual({ host: "a", custom: 1 });
  });
});
