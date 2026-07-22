import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { inputClass } from "./FieldValueInput";
import FieldsEditor, {
  Field,
  FieldDefinition,
  FieldRow,
  buildFieldsPayload,
  emptyFieldRow,
  findDuplicateKeys,
  rowsFromFields,
} from "./FieldsEditor";

const TYPE_ID_PATTERN = /^[a-z0-9_-]+$/;

export interface TypeRecord {
  type_id: string;
  label: string;
  description: string | null;
  fields: Record<string, FieldDefinition>;
}

export interface TypeFormResult {
  type_id: string;
  label: string;
  description: string | null;
  fields: Record<string, FieldDefinition | null>;
}

interface TypeFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: TypeFormResult) => Promise<void>;
  initial?: TypeRecord | null;
  singularLabel: string;
  isPending?: boolean;
}

export default function TypeFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initial,
  singularLabel,
  isPending,
}: TypeFormDialogProps) {
  const isEdit = Boolean(initial);

  const [typeId, setTypeId] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<FieldRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTypeId(initial?.type_id ?? "");
    setLabel(initial?.label ?? "");
    setDescription(initial?.description ?? "");
    setRows(initial ? rowsFromFields(initial.fields) : [emptyFieldRow()]);
    setError(null);
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const duplicateKeys = findDuplicateKeys(rows);

  const handleSave = async () => {
    const trimmedTypeId = typeId.trim();
    const trimmedLabel = label.trim();

    if (!isEdit) {
      if (!trimmedTypeId) {
        setError("Type ID is required");
        return;
      }
      if (!TYPE_ID_PATTERN.test(trimmedTypeId)) {
        setError("Type ID may only contain lowercase letters, numbers, underscores and hyphens");
        return;
      }
    }

    if (!trimmedLabel) {
      setError("Label is required");
      return;
    }

    if (duplicateKeys.size > 0) {
      setError(`Duplicate field key${duplicateKeys.size > 1 ? "s" : ""}: ${[...duplicateKeys].join(", ")}`);
      return;
    }

    for (const row of rows) {
      if (!row.key.trim()) {
        setError("Every field needs a key");
        return;
      }
      if (!row.definition.label.trim()) {
        setError(`Field "${row.key.trim()}" needs a label`);
        return;
      }
      const ui = row.definition.ui;
      if ((ui === "select" || ui === "radio") && (row.definition.options ?? []).length === 0) {
        setError(`Field "${row.key.trim()}" needs at least one option`);
        return;
      }
    }

    const originalKeys = Object.keys(initial?.fields ?? {});

    try {
      await onSubmit({
        type_id: isEdit ? (initial as TypeRecord).type_id : trimmedTypeId,
        label: trimmedLabel,
        description: description.trim() || null,
        fields: buildFieldsPayload(rows, originalKeys),
      });
      setError(null);
    } catch {
      setError(`Failed to save ${singularLabel.toLowerCase()}`);
    }
  };

  return (
    <div role="dialog" className="fixed inset-0 flex items-center justify-center bg-gray-900/50 z-20 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold">
            {isEdit ? `Edit ${singularLabel}` : `Add ${singularLabel}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type ID *">
              <input
                type="text"
                placeholder="e.g. plc_gateway"
                value={typeId}
                disabled={isEdit}
                onChange={(e) => setTypeId(e.target.value)}
                className={`${inputClass} font-mono ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
              />
            </Field>

            <Field label="Label *">
              <input
                type="text"
                placeholder="Human readable name"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Description">
            <input
              type="text"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </Field>

          <div>
            <h3 className="text-sm font-semibold mb-2">Fields</h3>
            <FieldsEditor rows={rows} onChange={setRows} duplicateKeys={duplicateKeys} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-1.5 rounded-md text-sm font-medium border border-slate-200 hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-1.5 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {isPending ? "Saving..." : isEdit ? "Save changes" : `Add ${singularLabel.toLowerCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
