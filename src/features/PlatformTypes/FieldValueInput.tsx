import { components } from "@/generated/edge-administration/types";
import Toggle from "./Toggle";

export type FieldDefinitionLike = Pick<
  components["schemas"]["FieldDefinition"],
  "type" | "ui" | "options" | "validation"
>;
type FieldDefinition = components["schemas"]["FieldDefinition"];
type FieldValidation = NonNullable<FieldDefinitionLike["validation"]>;

export const inputClass =
  "w-full px-3 py-2 rounded-md bg-muted/30 border border-slate-200 hover:border-slate-300 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition";

/** Same as inputClass, but for h-8 contexts (e.g. next to a "sm" button) - py-2 doesn't leave
 * enough room for a line of text at a fixed 32px height, so this uses tighter py-1 instead. */
export const compactInputClass = inputClass.replace("py-2", "py-1") + " h-8";

/** Read-only counterpart to the input widget above: formats a value for display, driven by the same FieldDefinition. */
export function formatMetadataValue(value: unknown, definition: Pick<FieldDefinitionLike, "type">): string {
  if (value === null || value === undefined || value === "") return "";
  if (definition.type === "boolean") return value ? "Yes" : "No";
  return String(value);
}

/**
 * Mirrors the backend's field_validation.py:validate_value - the single source of truth for
 * whether a (non-empty) value satisfies a field's `validation` constraints and `options` list.
 * `required`/emptiness is intentionally not checked here (see `validateFields` below), since an
 * empty value is either fine (optional field) or a distinct "is required" error, not a
 * pattern/length/bounds violation.
 */
export function validateFieldValue(label: string, value: unknown, definition: FieldDefinitionLike): string | null {
  if (value === null || value === undefined || value === "") return null;

  const { type } = definition;
  if (type === "boolean" && typeof value !== "boolean") return `"${label}" must be a boolean`;
  if (type === "integer" && (typeof value !== "number" || !Number.isInteger(value))) {
    return `"${label}" must be an integer`;
  }
  if (type === "number" && typeof value !== "number") return `"${label}" must be a number`;
  if (type === "string" && typeof value !== "string") return `"${label}" must be a string`;

  const validation: Partial<FieldValidation> = definition.validation ?? {};

  if (type === "string" && typeof value === "string") {
    if (validation.pattern) {
      let matches: boolean;
      try {
        // Python's re.fullmatch requires the whole string to match - `^(?:...)$` mirrors that.
        matches = new RegExp(`^(?:${validation.pattern})$`).test(value);
      } catch {
        matches = true; // an invalid pattern shouldn't block the user here - it's caught at
        // field-definition save time instead (see TypeFormDialog's handleSave).
      }
      if (!matches) return `"${label}" does not match the required pattern`;
    }
    if (validation.min_length != null && value.length < validation.min_length) {
      return `"${label}" must be at least ${validation.min_length} characters long`;
    }
    if (validation.max_length != null && value.length > validation.max_length) {
      return `"${label}" must be at most ${validation.max_length} characters long`;
    }
  } else if ((type === "integer" || type === "number") && typeof value === "number") {
    if (validation.minimum != null) {
      const violates = validation.exclusive_minimum ? value <= validation.minimum : value < validation.minimum;
      if (violates) {
        return validation.exclusive_minimum
          ? `"${label}" must be greater than ${validation.minimum}`
          : `"${label}" must be at least ${validation.minimum}`;
      }
    }
    if (validation.maximum != null) {
      const violates = validation.exclusive_maximum ? value >= validation.maximum : value > validation.maximum;
      if (violates) {
        return validation.exclusive_maximum
          ? `"${label}" must be less than ${validation.maximum}`
          : `"${label}" must be at most ${validation.maximum}`;
      }
    }
    if (validation.multiple_of != null && value % validation.multiple_of !== 0) {
      return `"${label}" must be a multiple of ${validation.multiple_of}`;
    }
  }

  if (definition.options && !definition.options.includes(value as string)) {
    return `"${label}" must be one of ${definition.options.join(", ")}`;
  }

  return null;
}

/**
 * Validates a full set of instance values against their fields' definitions - required first,
 * then `validateFieldValue` - returning the first error found (or null if all pass). This is the
 * one function every device/endpoint/service instance create/edit form should call before
 * submitting, so bad input is caught locally instead of relying on the backend's generic
 * failure toast.
 */
export function validateFields(
  values: Record<string, unknown>,
  fields: Record<string, FieldDefinition>,
): string | null {
  for (const [key, definition] of Object.entries(fields)) {
    const value = values[key];
    const isEmpty = value === null || value === undefined || value === "";
    if (definition.required && isEmpty) {
      return `"${definition.label}" is required`;
    }
    if (!isEmpty) {
      const error = validateFieldValue(definition.label, value, definition);
      if (error) return error;
    }
  }
  return null;
}

function defaultUiFor(type: FieldDefinitionLike["type"]) {
  switch (type) {
    case "boolean":
      return "toggle";
    case "integer":
    case "number":
      return "number";
    default:
      return "input";
  }
}

interface FieldValueInputProps {
  definition: FieldDefinitionLike;
  value: unknown;
  onChange: (value: unknown) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Renders the appropriate input widget for a value, driven entirely by a
 * FieldDefinition's `type`/`ui`/`options` — the single source of truth for
 * how any platform-type field should be edited.
 */
export default function FieldValueInput({ definition, value, onChange, placeholder, disabled }: FieldValueInputProps) {
  const ui = definition.ui ?? defaultUiFor(definition.type);
  const options = definition.options ?? [];

  if (ui === "toggle") {
    return <Toggle checked={Boolean(value)} onChange={onChange} disabled={disabled} />;
  }

  if (ui === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
      />
    );
  }

  if (ui === "select") {
    return (
      <select
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={compactInputClass}
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (ui === "radio") {
    return (
      <div className="flex flex-wrap gap-3">
        {options.length === 0 && <span className="text-xs text-muted-foreground">No options defined</span>}
        {options.map((opt) => (
          <label key={opt} className="inline-flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              checked={value === opt}
              disabled={disabled}
              onChange={() => onChange(opt)}
              className="h-3.5 w-3.5 text-primary focus:ring-primary/30"
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  if (ui === "textarea") {
    return (
      <textarea
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        minLength={definition.validation?.min_length ?? undefined}
        maxLength={definition.validation?.max_length ?? undefined}
        className={inputClass}
      />
    );
  }

  if (ui === "password") {
    return (
      <input
        type="password"
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        pattern={definition.validation?.pattern ?? undefined}
        minLength={definition.validation?.min_length ?? undefined}
        maxLength={definition.validation?.max_length ?? undefined}
        className={compactInputClass}
      />
    );
  }

  if (ui === "slider") {
    const min = definition.validation?.minimum ?? 0;
    const max = definition.validation?.maximum ?? 100;
    const numericValue = typeof value === "number" ? value : min;
    return (
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={definition.validation?.multiple_of ?? (definition.type === "integer" ? 1 : "any")}
          disabled={disabled}
          value={numericValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{numericValue}</span>
      </div>
    );
  }

  if (ui === "number" || definition.type === "integer" || definition.type === "number") {
    return (
      <input
        type="number"
        step={definition.validation?.multiple_of ?? (definition.type === "integer" ? 1 : "any")}
        min={definition.validation?.minimum ?? undefined}
        max={definition.validation?.maximum ?? undefined}
        value={typeof value === "number" ? value : ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className={compactInputClass}
      />
    );
  }

  // Default: plain text input (ui === "input" or type === "string")
  return (
    <input
      type="text"
      value={typeof value === "string" ? value : ""}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      pattern={definition.validation?.pattern ?? undefined}
      minLength={definition.validation?.min_length ?? undefined}
      maxLength={definition.validation?.max_length ?? undefined}
      className={compactInputClass}
    />
  );
}
