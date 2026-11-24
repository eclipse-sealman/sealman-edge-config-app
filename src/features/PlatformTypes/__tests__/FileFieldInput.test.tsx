import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import FileFieldInput from "../FileFieldInput";
import type { FieldDefinitionLike } from "../FieldValueInput";
import type { FileOwner, FileRef } from "../fileField";
import { ApiError } from "@/generated/edge-administration/api";

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  remove: vi.fn(),
  download: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../fileFieldApi", () => ({
  uploadFieldFile: mocks.upload,
  removeFieldFile: mocks.remove,
  downloadFieldFile: mocks.download,
}));
vi.mock("react-toastify", () => ({ toast: { error: mocks.toastError } }));

const owner: FileOwner = { kind: "endpoint", id: "e1" };
const definition = { type: "file", label: "Server certificate", required: false } as FieldDefinitionLike;
const secretDefinition = { ...definition, secret: true } as FieldDefinitionLike;
const ref: FileRef = {
  $file: "f1",
  name: "plc-line3.crt",
  kind: "certificate",
  not_after: "2099-01-01T00:00:00Z",
  uploaded_at: "2026-11-24T10:00:00Z",
};
const pick = (file: File) => fireEvent.change(screen.getByTestId("file-input"), { target: { files: [file] } });

describe("FileFieldInput", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads a chosen file and reports the reference", async () => {
    mocks.upload.mockResolvedValue(ref);
    const onChange = vi.fn();
    render(<FileFieldInput definition={definition} fieldKey="crt" value={null} owner={owner} onChange={onChange} />);
    expect(screen.getByText("No file")).toBeInTheDocument();
    const file = new File(["pem"], "plc-line3.crt");
    pick(file);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(ref));
    expect(mocks.upload).toHaveBeenCalledWith(owner, "crt", file);
  });

  it("shows name, status and Replace, Download, Remove for a file; no Download for a secret one", () => {
    const { rerender } = render(
      <FileFieldInput definition={definition} fieldKey="crt" value={ref} owner={owner} onChange={vi.fn()} />,
    );
    expect(screen.getByText(/plc-line3\.crt/)).toBeInTheDocument();
    expect(screen.getByText("valid until 2099-01-01")).toBeInTheDocument();
    for (const name of ["Replace", "Download", "Remove"]) expect(screen.getByRole("button", { name })).toBeInTheDocument();
    rerender(<FileFieldInput definition={secretDefinition} fieldKey="crt" value={ref} owner={owner} onChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Download" })).not.toBeInTheDocument();
    expect(screen.getByText("valid until 2099-01-01 · secret")).toBeInTheDocument();
  });

  it("removes only after confirmation", async () => {
    mocks.remove.mockResolvedValue(undefined);
    const onChange = vi.fn();
    render(<FileFieldInput definition={definition} fieldKey="crt" value={ref} owner={owner} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(mocks.remove).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(null));
    expect(mocks.remove).toHaveBeenCalledWith(owner, "crt");
  });

  it("shows the API's message when the upload is refused and keeps the value", async () => {
    mocks.upload.mockRejectedValue(new ApiError("A private key must be stored as secret: mark the field as secret", 422));
    const onChange = vi.fn();
    render(<FileFieldInput definition={definition} fieldKey="crt" value={null} owner={owner} onChange={onChange} />);
    pick(new File(["k"], "client.key"));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(expect.stringContaining("mark the field as secret")));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("without an owner it offers no buttons", () => {
    render(<FileFieldInput definition={definition} fieldKey="crt" value={null} onChange={vi.fn()} />);
    expect(screen.getByText("Add the file after saving")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("refuses a file over 64 KB without a request", () => {
    render(<FileFieldInput definition={definition} fieldKey="crt" value={null} owner={owner} onChange={vi.fn()} />);
    pick(new File([new Uint8Array(65537)], "big.pem"));
    expect(mocks.toastError).toHaveBeenCalledWith("The file must not exceed 64 KB");
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});
