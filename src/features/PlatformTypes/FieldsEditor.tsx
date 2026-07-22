import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { components } from "@/generated/edge-administration/types";
import FieldValueInput, { inputClass } from "./FieldValueInput";
import Toggle from "./Toggle";

export type FieldDefinition = components["schemas"]["FieldDefinition"];
type FieldType = FieldDefinition["type"];
type FieldUi = NonNullable<FieldDefinition["ui"]>;

export interface FieldRow {
  /** Stable id for React keys / row identity, independent of the (editable) field key. */
  id: string;
  /** The key this field was loaded under, or null if it's a new field. Used to detect renames/deletions on save. */
  originalKey: string | null;
  key: string;
  definition: FieldDefinition;
  /** Raw text for the options input, kept separate from definition.options so typing a trailing comma isn't eaten. */
  optionsText: string;
}

const UI_OPTIONS_BY_TYPE: Record<FieldType, { value: FieldUi; label: string }[]> = {
  string: [
    { value: "input", label: "Text input" },
    { value: "textarea", label: "Textarea" },
    { value: "password", label: "Password" },
    { value: "select", label: "Select (dropdown)" },
    { value: "radio", label: "Radio buttons" },
  ],
  boolean: [
    { value: "toggle", label: "Toggle" },
    { value: "checkbox", label: "Checkbox" },
  ],
  integer: [
    { value: "number", label: "Number input" },
    { value: "slider", label: "Slider" },
  ],
  number: [
    { value: "number", label: "Number input" },
    { value: "slider", label: "Slider" },
  ],
};

export function emptyFieldRow(): FieldRow {
  return {
    id: crypto.randomUUID(),
    originalKey: null,
    key: "",
    definition: { type: "string", label: "", required: false, ui: "input", default: null },
    optionsText: "",
  };
}

function parseOptions(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function rowsFromFields(fields: Record<string, FieldDefinition>): FieldRow[] {
  return Object.entries(fields).map(([key, definition]) => ({
    id: crypto.randomUUID(),
    originalKey: key,
    key,
    definition,
    optionsText: (definition.options ?? []).join(", "),
  }));
}

export function findDuplicateKeys(rows: FieldRow[]): Set<string> {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const key = row.key.trim().toLowerCase();
    if (!key) continue;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return new Set([...seen.entries()].filter(([, count]) => count > 1).map(([key]) => key));
}

/**
 * Diffs the current rows against the field keys a type originally had and
 * produces a PATCH-ready fields payload: unchanged/renamed/new fields map to
 * their full definition, keys that disappeared (removed or renamed away
 * from) map to `null` so the backend deletes them.
 */
export function buildFieldsPayload(
  rows: FieldRow[],
  originalKeys: string[]
): Record<string, FieldDefinition | null> {
  const payload: Record<string, FieldDefinition | null> = {};

  const stillPresentOriginalKeys = new Set(
    rows.filter((r) => r.originalKey && r.originalKey === r.key.trim()).map((r) => r.originalKey as string)
  );

  for (const key of originalKeys) {
    if (!stillPresentOriginalKeys.has(key)) {
      payload[key] = null;
    }
  }

  for (const row of rows) {
    payload[row.key.trim()] = row.definition;
  }

  return payload;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

interface FieldsEditorProps {
  rows: FieldRow[];
  onChange: (rows: FieldRow[]) => void;
  duplicateKeys?: Set<string>;
}

/**
 * The single dynamic-UI component for a platform type's field definitions:
 * add/remove/edit rows, and for each row render exactly the controls that
 * make sense for its current type/ui (options, default value, etc).
 */
export default function FieldsEditor({ rows, onChange, duplicateKeys }: FieldsEditorProps) {
  const updateRow = (id: string, patch: Partial<FieldRow>) => {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const updateDefinition = (id: string, patch: Partial<FieldDefinition>) => {
    onChange(
      rows.map((row) => (row.id === id ? { ...row, definition: { ...row.definition, ...patch } } : row))
    );
  };

  const removeRow = (id: string) => {
    onChange(rows.filter((row) => row.id !== id));
  };

  const addRow = () => {
    onChange([...rows, emptyFieldRow()]);
  };

  const handleTypeChange = (row: FieldRow, type: FieldType) => {
    const ui = UI_OPTIONS_BY_TYPE[type][0].value;
    updateRow(row.id, {
      definition: { ...row.definition, type, ui, options: null, default: null },
      optionsText: "",
    });
  };

  const handleOptionsTextChange = (row: FieldRow, text: string) => {
    updateRow(row.id, { optionsText: text, definition: { ...row.definition, options: parseOptions(text) } });
  };

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No fields defined yet.</p>
      )}

      {rows.map((row) => {
        const uiOptions = UI_OPTIONS_BY_TYPE[row.definition.type];
        const ui = row.definition.ui ?? uiOptions[0].value;
        const showOptions = ui === "select" || ui === "radio";
        const isDuplicate = duplicateKeys?.has(row.key.trim().toLowerCase()) && row.key.trim() !== "";

        return (
          <div key={row.id} className="border rounded-md p-3 space-y-3 bg-background hover:bg-muted/20 transition-colors">
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-3">
                <Field label="Key *">
                  <input
                    type="text"
                    placeholder="field_key"
                    value={row.key}
                    onChange={(e) => updateRow(row.id, { key: e.target.value })}
                    className={`${inputClass} font-mono ${isDuplicate ? "border-destructive focus:border-destructive" : ""}`}
                  />
                </Field>
              </div>

              <div className="col-span-3">
                <Field label="Label *">
                  <input
                    type="text"
                    placeholder="Human readable label"
                    value={row.definition.label}
                    onChange={(e) => updateDefinition(row.id, { label: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="col-span-2">
                <Field label="Type">
                  <select
                    value={row.definition.type}
                    onChange={(e) => handleTypeChange(row, e.target.value as FieldType)}
                    className={inputClass}
                  >
                    <option value="string">String</option>
                    <option value="boolean">Boolean</option>
                    <option value="integer">Integer</option>
                    <option value="number">Number</option>
                  </select>
                </Field>
              </div>

              <div className="col-span-2">
                <Field label="Widget">
                  <select
                    value={ui}
                    onChange={(e) =>
                      updateDefinition(row.id, { ui: e.target.value as FieldUi, options: null, default: null })
                    }
                    className={inputClass}
                  >
                    {uiOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="col-span-1">
                <Field label="Required">
                  <div className="flex h-[38px] items-center">
                    <Toggle
                      checked={row.definition.required}
                      onChange={(val) => updateDefinition(row.id, { required: val })}
                    />
                  </div>
                </Field>
              </div>

              <div className="col-span-1 flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="inline-flex items-center px-3 py-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors shadow-sm"
                  aria-label="Remove field"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-5">
                <Field label="Description">
                  <input
                    type="text"
                    placeholder="Optional help text"
                    value={row.definition.description ?? ""}
                    onChange={(e) => updateDefinition(row.id, { description: e.target.value || null })}
                    className={inputClass}
                  />
                </Field>
              </div>

              {showOptions && (
                <div className="col-span-4">
                  <Field label="Options (comma separated)">
                    <input
                      type="text"
                      placeholder="option1, option2, option3"
                      value={row.optionsText}
                      onChange={(e) => handleOptionsTextChange(row, e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}

              <div className={showOptions ? "col-span-3" : "col-span-7"}>
                <Field label="Default value">
                  <FieldValueInput
                    definition={row.definition}
                    value={row.definition.default}
                    onChange={(value) => updateDefinition(row.id, { default: value })}
                  />
                </Field>
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium
          bg-primary/10 text-primary border border-primary/20
          hover:bg-primary hover:text-white hover:border-primary
          transition-all shadow-sm"
      >
        <PlusIcon className="w-4 h-4" />
        Add field
      </button>
    </div>
  );
}
