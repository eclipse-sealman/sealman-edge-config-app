import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { inputClass, validateFieldValue } from "./FieldValueInput";
import FieldsEditor, {
  Field,
  FieldDefinition,
  FieldRow,
  MappingRoleConfig,
  buildFieldsPayload,
  buildMappingPayload,
  emptyFieldRow,
  findDuplicateKeys,
  rowsFromFields,
} from "./FieldsEditor";

const TYPE_ID_PATTERN = /^[a-z0-9_-]+$/;

export interface BrowserKindOption {
  value: string;
  label: string;
}

export interface TypeRecord {
  type_id: string;
  label: string;
  description: string | null;
  fields: Record<string, FieldDefinition>;
  mapping?: Record<string, string>;
  browser_kind?: string | null;
}

export interface TypeFormResult {
  type_id: string;
  label: string;
  description: string | null;
  fields: Record<string, FieldDefinition | null>;
  mapping: Record<string, string | null>;
  browser_kind: string | null;
}

interface TypeFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: TypeFormResult) => Promise<void>;
  initial?: TypeRecord | null;
  singularLabel: string;
  isPending?: boolean;
  mappingRole?: MappingRoleConfig;
  /** When set, shows a "Browse Action" dropdown letting this type be assigned one of these
   * built-in browsers (e.g. VNC, OPC-UA, plain HTTP) for its "Browse" button on the Overview page. */
  browserKindOptions?: BrowserKindOption[];
  /** Example shown in the Type ID field's placeholder - pick something representative of what
   * this kind of type actually looks like (e.g. "powerpak-3000" for endpoint types, "ftp" for
   * service types). */
  typeIdPlaceholder?: string;
  /** When set, a brand-new type (not editing an existing one) starts with these fields
   * pre-populated instead of a single blank row - used so creating a device type shows the
   * default type's fields right away, since they'll apply to it regardless (see
   * db/sqlalchemy/device_type.py:_serialize_with_mirroring). Ignored while editing an existing
   * type, since `initial.fields` already reflects the current mirrored view in that case. */
  defaultFields?: Record<string, FieldDefinition>;
}

export default function TypeFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initial,
  singularLabel,
  isPending,
  mappingRole,
  browserKindOptions,
  typeIdPlaceholder = "e.g. plc_gateway",
  defaultFields,
}: TypeFormDialogProps) {
  const isEdit = Boolean(initial);

  const [typeId, setTypeId] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [browserKind, setBrowserKind] = useState("");
  const [rows, setRows] = useState<FieldRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTypeId(initial?.type_id ?? "");
    setLabel(initial?.label ?? "");
    setDescription(initial?.description ?? "");
    setBrowserKind(initial?.browser_kind ?? "");
    if (initial) {
      setRows(rowsFromFields(initial.fields, initial.mapping ?? {}));
    } else if (defaultFields && Object.keys(defaultFields).length > 0) {
      setRows(rowsFromFields(defaultFields, {}));
    } else {
      setRows([emptyFieldRow()]);
    }
    setError(null);
  }, [isOpen, initial, defaultFields]);

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

      const validation = row.definition.validation;
      if (validation?.pattern) {
        try {
          new RegExp(validation.pattern);
        } catch {
          setError(`Field "${row.key.trim()}" has an invalid regex pattern`);
          return;
        }
      }
      if (
        validation?.min_length != null &&
        validation?.max_length != null &&
        validation.min_length > validation.max_length
      ) {
        setError(`Field "${row.key.trim()}": min length cannot be greater than max length`);
        return;
      }
      if (validation?.minimum != null && validation?.maximum != null && validation.minimum > validation.maximum) {
        setError(`Field "${row.key.trim()}": minimum cannot be greater than maximum`);
        return;
      }
      if (ui === "slider" && (validation?.minimum == null || validation?.maximum == null)) {
        setError(`Field "${row.key.trim()}": a slider needs both a minimum and a maximum`);
        return;
      }
      if (row.definition.default != null) {
        const defaultError = validateFieldValue(row.definition.label || row.key.trim(), row.definition.default, row.definition);
        if (defaultError) {
          setError(`Field "${row.key.trim()}" default value: ${defaultError}`);
          return;
        }
      }
    }

    const originalKeys = Object.keys(initial?.fields ?? {});

    try {
      await onSubmit({
        type_id: isEdit ? (initial as TypeRecord).type_id : trimmedTypeId,
        label: trimmedLabel,
        description: description.trim() || null,
        fields: buildFieldsPayload(rows, originalKeys),
        mapping: buildMappingPayload(rows, initial?.mapping ?? {}),
        browser_kind: browserKind || null,
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
                placeholder={typeIdPlaceholder}
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

          {browserKindOptions && (
            <Field label="Browse Action">
              <select
                value={browserKind}
                onChange={(e) => setBrowserKind(e.target.value)}
                className={inputClass}
              >
                <option value="">None</option>
                {browserKindOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div>
            <h3 className="text-sm font-semibold mb-2">Fields</h3>
            <FieldsEditor rows={rows} onChange={setRows} duplicateKeys={duplicateKeys} mappingRole={mappingRole} />
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
