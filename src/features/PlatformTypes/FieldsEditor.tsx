import { useState } from "react";
import { CheckCircleIcon, PlusIcon, TrashIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { components } from "@/generated/edge-administration/types";
import FieldValueInput, { compactInputClass, validateFieldValue } from "./FieldValueInput";
import Toggle from "./Toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FieldDefinition = components["schemas"]["FieldDefinition"];
type FieldType = FieldDefinition["type"];
type FieldUi = NonNullable<FieldDefinition["ui"]>;
type FieldValidation = NonNullable<FieldDefinition["validation"]>;

export interface FieldRow {
  /** Stable id for React keys / row identity, independent of the (editable) field key. */
  id: string;
  /** The key this field was loaded under, or null if it's a new field. Used to detect renames/deletions on save. */
  originalKey: string | null;
  key: string;
  definition: FieldDefinition;
  /** Raw text for the options input, kept separate from definition.options so typing a trailing comma isn't eaten. */
  optionsText: string;
  /** The mapping role (e.g. "ip", "port") this field is assigned to, or null if none. */
  role: string | null;
}

/** Describes the single mapping role (e.g. IP for endpoint types, Port for service types) that can be assigned to one field. */
export interface MappingRoleConfig {
  /** The role string sent to the backend's `mapping` dict, e.g. "ip" or "port". */
  value: string;
  label: string;
  compatibleTypes: FieldType[];
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
    definition: { type: "string", label: "", required: false, ui: "input", default: null, changeable: true },
    optionsText: "",
    role: null,
  };
}

function parseOptions(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function rowsFromFields(
  fields: Record<string, FieldDefinition>,
  mapping: Record<string, string> = {}
): FieldRow[] {
  return Object.entries(fields).map(([key, definition]) => ({
    id: crypto.randomUUID(),
    originalKey: key,
    key,
    definition,
    optionsText: (definition.options ?? []).join(", "),
    role: mapping[key] ?? null,
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

/**
 * Diffs the rows' currently-assigned mapping role against the type's original mapping and
 * produces a PATCH-ready payload: changed/new role assignments map to the role string, entries
 * that no longer apply (role cleared, or the field was renamed/removed) map to `null` so the
 * backend deletes them. When `originalMapping` is empty (creating a new type) this naturally
 * reduces to a plain `{ [key]: role }` object with no `null` entries.
 */
export function buildMappingPayload(
  rows: FieldRow[],
  originalMapping: Record<string, string>
): Record<string, string | null> {
  const payload: Record<string, string | null> = {};
  const currentByKey = new Map(
    rows.filter((r) => r.role && r.key.trim()).map((r) => [r.key.trim(), r.role as string])
  );

  for (const key of Object.keys(originalMapping)) {
    if (currentByKey.get(key) !== originalMapping[key]) {
      payload[key] = null;
    }
  }

  for (const [key, role] of currentByKey) {
    if (originalMapping[key] !== role) {
      payload[key] = role;
    }
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

/**
 * A live sandbox next to a field's definition: type a value in the same widget an instance form
 * would use, and see immediately whether it satisfies the `required`/`validation` constraints
 * currently configured - without having to save the type and go create a real instance just to
 * find out. `key`-ed by type/ui at the call site so switching between them resets the test value
 * instead of carrying over a now-nonsensical one (e.g. a string left over after switching to
 * integer); constraint edits (pattern, bounds, etc.) intentionally do NOT reset it, so you can
 * keep one value in place and watch it flip valid/invalid as you tune the constraints.
 */
function FieldValueTester({ label, definition }: { label: string; definition: FieldDefinition }) {
  const [testValue, setTestValue] = useState<unknown>(definition.type === "boolean" ? false : null);
  const isEmpty = testValue === null || testValue === undefined || testValue === "";
  const effectiveLabel = label.trim() || "This field";
  const error = definition.required && isEmpty
    ? `"${effectiveLabel}" is required`
    : validateFieldValue(effectiveLabel, testValue, definition);

  return (
    <div className="w-56 shrink-0 border rounded-md p-3 bg-muted/20 space-y-2">
      <div className="text-xs font-semibold text-muted-foreground">Test this field</div>
      <FieldValueInput
        definition={definition}
        value={testValue}
        onChange={setTestValue}
        placeholder="Try a value..."
      />
      {isEmpty && !definition.required ? (
        <p className="text-xs text-muted-foreground">Enter a value to test</p>
      ) : error ? (
        <p className="text-xs text-destructive flex items-start gap-1">
          <XCircleIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
        </p>
      ) : (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" /> Valid
        </p>
      )}
    </div>
  );
}

interface FieldsEditorProps {
  rows: FieldRow[];
  onChange: (rows: FieldRow[]) => void;
  duplicateKeys?: Set<string>;
  /** When set, shows a per-field toggle to assign this single mapping role (e.g. IP, Port) to one field. */
  mappingRole?: MappingRoleConfig;
}

/**
 * The single dynamic-UI component for a platform type's field definitions:
 * add/remove/edit rows, and for each row render exactly the controls that
 * make sense for its current type/ui (options, default value, etc).
 */
export default function FieldsEditor({ rows, onChange, duplicateKeys, mappingRole }: FieldsEditorProps) {
  const updateRow = (id: string, patch: Partial<FieldRow>) => {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const updateDefinition = (id: string, patch: Partial<FieldDefinition>) => {
    onChange(
      rows.map((row) => (row.id === id ? { ...row, definition: { ...row.definition, ...patch } } : row))
    );
  };

  // Only one field may hold a given mapping role at a time, so assigning it to a row clears it from any other.
  const updateRole = (id: string, role: string | null) => {
    onChange(
      rows.map((row) => {
        if (row.id === id) return { ...row, role };
        if (role !== null && row.role === role) return { ...row, role: null };
        return row;
      })
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
    const staysCompatible = !mappingRole || mappingRole.compatibleTypes.includes(type);
    updateRow(row.id, {
      // validation is reset too - none of string's pattern/min_length/max_length or
      // integer/number's minimum/maximum/multiple_of carry over correctly across a type change,
      // and the backend forbids `validation` entirely for type=boolean.
      definition: { ...row.definition, type, ui, options: null, default: null, validation: null },
      optionsText: "",
      role: staysCompatible ? row.role : null,
    });
  };

  const handleOptionsTextChange = (row: FieldRow, text: string) => {
    updateRow(row.id, { optionsText: text, definition: { ...row.definition, options: parseOptions(text) } });
  };

  // Merges a validation patch into the row's definition; drops the whole `validation` object
  // once every constraint is cleared back to its default, so an empty `{}` never gets persisted.
  const updateValidation = (id: string, patch: Partial<FieldValidation>) => {
    onChange(
      rows.map((row) => {
        if (row.id !== id) return row;
        const merged = { ...(row.definition.validation ?? {}), ...patch };
        const validation: FieldValidation = {
          ...merged,
          exclusive_minimum: merged.exclusive_minimum ?? false,
          exclusive_maximum: merged.exclusive_maximum ?? false,
        };
        const isEmpty =
          validation.pattern == null &&
          validation.min_length == null &&
          validation.max_length == null &&
          validation.minimum == null &&
          validation.maximum == null &&
          validation.multiple_of == null &&
          !validation.exclusive_minimum &&
          !validation.exclusive_maximum;
        return { ...row, definition: { ...row.definition, validation: isEmpty ? null : validation } };
      })
    );
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

        const isMappingCompatible = mappingRole?.compatibleTypes.includes(row.definition.type) ?? false;

        return (
          <div key={row.id} className="flex gap-3 items-start">
          <div className="flex-1 min-w-0 border rounded-md p-3 space-y-3 bg-background hover:bg-muted/20 transition-colors">
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-3">
                <Field label="Key *">
                  <input
                    type="text"
                    placeholder="field_key"
                    value={row.key}
                    onChange={(e) => updateRow(row.id, { key: e.target.value })}
                    className={`${compactInputClass} font-mono ${isDuplicate ? "border-destructive focus:border-destructive" : ""}`}
                  />
                </Field>
              </div>

              <div className="col-span-4">
                <Field label="Label *">
                  <input
                    type="text"
                    placeholder="Human readable label"
                    value={row.definition.label}
                    onChange={(e) => updateDefinition(row.id, { label: e.target.value })}
                    className={compactInputClass}
                  />
                </Field>
              </div>

              <div className="col-span-2">
                <Field label="Type">
                  <Select value={row.definition.type} onValueChange={(v) => handleTypeChange(row, v as FieldType)}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="integer">Integer</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="col-span-2">
                <Field label="Widget">
                  <Select
                    value={ui}
                    onValueChange={(v) =>
                      updateDefinition(row.id, { ui: v as FieldUi, options: null, default: null })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {uiOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="col-span-1 flex justify-end">
                {/* Invisible label matches the height of the sibling Field labels, so the button
                    lines up with the inputs exactly instead of relying on flex/grid guesswork. */}
                <Field label=" ">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors shadow-sm"
                    aria-label="Remove field"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </Field>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                <Toggle
                  checked={row.definition.required}
                  onChange={(val) => updateDefinition(row.id, { required: val })}
                />
                Required
              </label>

              <label
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground whitespace-nowrap"
                title="If off, an instance's value for this field can no longer be edited once it's been set"
              >
                <Toggle
                  checked={row.definition.changeable !== false}
                  onChange={(val) => updateDefinition(row.id, { changeable: val })}
                />
                Changeable
              </label>

              {mappingRole && (
                <label
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground whitespace-nowrap"
                  title={
                    isMappingCompatible
                      ? `Mark this field as the ${mappingRole.label}`
                      : `Only ${mappingRole.compatibleTypes.join("/")} fields can be the ${mappingRole.label}`
                  }
                >
                  <Toggle
                    checked={isMappingCompatible && row.role === mappingRole.value}
                    disabled={!isMappingCompatible}
                    onChange={(val) => updateRole(row.id, val ? mappingRole.value : null)}
                  />
                  Is {mappingRole.label}
                </label>
              )}
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-5">
                <Field label="Description">
                  <input
                    type="text"
                    placeholder="Optional help text"
                    value={row.definition.description ?? ""}
                    onChange={(e) => updateDefinition(row.id, { description: e.target.value || null })}
                    className={compactInputClass}
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
                      className={compactInputClass}
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

            {row.definition.type === "string" && (
              <div className="grid grid-cols-12 gap-3 pt-1 border-t">
                <div className="col-span-6">
                  <Field label="Pattern (regex, must fully match)">
                    <input
                      type="text"
                      placeholder="e.g. ^[A-Z]{2}\d{4}$"
                      value={row.definition.validation?.pattern ?? ""}
                      onChange={(e) => updateValidation(row.id, { pattern: e.target.value || null })}
                      className={`${compactInputClass} font-mono`}
                    />
                  </Field>
                </div>
                <div className="col-span-3">
                  <Field label="Min length">
                    <input
                      type="number"
                      min={0}
                      value={row.definition.validation?.min_length ?? ""}
                      onChange={(e) =>
                        updateValidation(row.id, { min_length: e.target.value === "" ? null : Number(e.target.value) })
                      }
                      className={compactInputClass}
                    />
                  </Field>
                </div>
                <div className="col-span-3">
                  <Field label="Max length">
                    <input
                      type="number"
                      min={0}
                      value={row.definition.validation?.max_length ?? ""}
                      onChange={(e) =>
                        updateValidation(row.id, { max_length: e.target.value === "" ? null : Number(e.target.value) })
                      }
                      className={compactInputClass}
                    />
                  </Field>
                </div>
              </div>
            )}

            {(row.definition.type === "integer" || row.definition.type === "number") && (
              <div className="grid grid-cols-12 gap-3 pt-1 border-t items-end">
                <div className="col-span-2">
                  <Field label="Minimum">
                    <input
                      type="number"
                      value={row.definition.validation?.minimum ?? ""}
                      onChange={(e) =>
                        updateValidation(row.id, { minimum: e.target.value === "" ? null : Number(e.target.value) })
                      }
                      className={compactInputClass}
                    />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Maximum">
                    <input
                      type="number"
                      value={row.definition.validation?.maximum ?? ""}
                      onChange={(e) =>
                        updateValidation(row.id, { maximum: e.target.value === "" ? null : Number(e.target.value) })
                      }
                      className={compactInputClass}
                    />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Multiple of">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={row.definition.validation?.multiple_of ?? ""}
                      onChange={(e) =>
                        updateValidation(row.id, { multiple_of: e.target.value === "" ? null : Number(e.target.value) })
                      }
                      className={compactInputClass}
                    />
                  </Field>
                </div>
                <label className="col-span-3 flex items-center gap-2 text-xs font-medium text-muted-foreground whitespace-nowrap pb-1.5">
                  <Toggle
                    checked={row.definition.validation?.exclusive_minimum ?? false}
                    onChange={(val) => updateValidation(row.id, { exclusive_minimum: val })}
                  />
                  Exclusive min
                </label>
                <label className="col-span-3 flex items-center gap-2 text-xs font-medium text-muted-foreground whitespace-nowrap pb-1.5">
                  <Toggle
                    checked={row.definition.validation?.exclusive_maximum ?? false}
                    onChange={(val) => updateValidation(row.id, { exclusive_maximum: val })}
                  />
                  Exclusive max
                </label>
              </div>
            )}
          </div>

          <FieldValueTester
            key={`${row.definition.type}-${ui}`}
            label={row.definition.label || row.key}
            definition={row.definition}
          />
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
