import { components } from "@/generated/edge-administration/types";
import Toggle from "./Toggle";

export type FieldDefinitionLike = Pick<
  components["schemas"]["FieldDefinition"],
  "type" | "ui" | "options" | "validation"
>;

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
        step={definition.type === "integer" ? 1 : "any"}
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
      className={compactInputClass}
    />
  );
}
