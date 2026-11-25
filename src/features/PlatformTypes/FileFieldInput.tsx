import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import ConfirmDeleteDialog from "@/features/Devices/Network/layouts/overview/ConfirmDeleteDialog";
import { getErrorMessage } from "@/lib/errors";
import type { FieldDefinitionLike } from "./FieldValueInput";
import { FILE_SIZE_LIMIT, fileStatus, isFileRef, type FileOwner, type FileRef } from "./fileField";
import { downloadFieldFile, removeFieldFile, uploadFieldFile } from "./fileFieldApi";

interface FileFieldInputProps {
  definition: FieldDefinitionLike;
  /** The key of the field in its record. */
  fieldKey?: string;
  value: unknown;
  owner?: FileOwner;
  /** Passed to the upload, e.g. the secret flag of a template's default file. */
  uploadOptions?: { secret?: boolean };
  disabled?: boolean;
  /** Set when applying a template: the file is the module's own choice, the template's default (maybe none) is used without one.
   * Nothing is read back, so there is no Download and no Remove: a value is cleared with "Use the default" (or "Clear"
   * without a default). A value that is not a file reference (e.g. from a revision made when the variable was a string)
   * is shown as "Not a file", to be cleared or replaced. */
  applying?: { default: FileRef | null };
  onChange: (value: FileRef | null) => void;
}

const LEVEL_CLASS = { ok: "text-muted-foreground", warning: "text-amber-600", error: "text-destructive" } as const;

/** One row for a `file` field: the file's name and status, with the buttons to upload, replace, download and remove it. */
export default function FileFieldInput({ definition, fieldKey, value, owner, uploadOptions, disabled, applying, onChange }: FileFieldInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const ref = isFileRef(value) ? value : null;
  const notAFile = Boolean(applying) && value !== null && value !== undefined && !ref;
  const fallback = applying && !ref && !notAFile ? applying.default : null;
  const shown = ref ?? fallback;
  const secret = Boolean(definition.secret);
  const label = definition.label ?? "file";

  const run = async (action: () => Promise<void>, failure: string) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      toast.error(getErrorMessage(error, failure));
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file || !owner || !fieldKey) return;
    if (file.size > FILE_SIZE_LIMIT) {
      toast.error("The file must not exceed 64 KB");
      return;
    }
    void run(async () => onChange(await uploadFieldFile(owner, fieldKey, file, uploadOptions)), "Could not upload the file");
  };

  const status = shown ? fileStatus(shown, secret, new Date()) : null;
  const addressed = owner && fieldKey ? { owner, fieldKey } : null;
  // Without write permission (disabled) the file can still be downloaded, but not changed.
  const canEdit = !disabled;

  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 truncate text-sm">
        {shown && status ? (
          <>
            {shown.name} · <span className={LEVEL_CLASS[status.level]}>{status.text}</span>
            {fallback && " · default"}
          </>
        ) : notAFile ? (
          <span className="text-destructive">Not a file</span>
        ) : addressed || applying ? (
          <span className="text-muted-foreground">No file</span>
        ) : (
          <span className="text-muted-foreground">Add the file after saving</span>
        )}
      </span>
      {canEdit && addressed && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept=".pem,.crt,.cer,.der,.key,.crl"
            className="hidden"
            aria-label={`${label} file`}
            data-testid="file-input"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              handleFile(file);
            }}
          />
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {ref ? "Replace" : fallback ? "Use another file" : "Upload"}
          </Button>
        </>
      )}
      {canEdit && applying && (ref || notAFile) && (
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => onChange(null)}>
          {applying.default ? "Use the default" : "Clear"}
        </Button>
      )}
      {!applying && addressed && ref && !secret && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            void run(() => downloadFieldFile(addressed.owner, addressed.fieldKey, ref.name), "Could not download the file")
          }
        >
          Download
        </Button>
      )}
      {!applying && canEdit && addressed && (
        <>
          {ref && (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setConfirmOpen(true)}>
              Remove
            </Button>
          )}
          <ConfirmDeleteDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title={`Remove ${label}`}
            description={`This removes "${ref?.name ?? ""}" from the record. This cannot be undone.`}
            isPending={busy}
            onConfirm={() => {
              void run(async () => {
                await removeFieldFile(addressed.owner, addressed.fieldKey);
                setConfirmOpen(false);
                onChange(null);
              }, "Could not remove the file");
            }}
          />
        </>
      )}
    </div>
  );
}
