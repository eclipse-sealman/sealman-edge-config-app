import FieldValueInput from "@/features/PlatformTypes/FieldValueInput";
import { components } from "@/generated/edge-administration/types";

type FieldDefinition = components["schemas"]["FieldDefinition"];

interface props {
  fields: Record<string, FieldDefinition>;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  /** The field mapped to this type's "ip"/"port" role - shown read-only with the actual observed value. */
  lockedFieldKey?: string | null;
  /** Whether a non-empty value in a `changeable: false` field reflects something already saved
   * (and therefore genuinely immutable) rather than just a fresh, not-yet-persisted default fill.
   * Defaults to true for the common case (viewing/editing an existing, already-created record) -
   * pass false for a not-yet-saved record (a manual "Add" flow, or a reassignment whose fields
   * are being re-entered from scratch), otherwise a type's own default value for a `changeable:
   * false` field (e.g. a service type's default port) would lock the field before anything has
   * actually been saved, making it impossible to type in a different value on first creation. */
  lockSavedValues?: boolean;
}

export default function TypeFieldsForm({
  fields,
  values,
  onChange,
  lockedFieldKey,
  lockSavedValues = true,
}: props) {
  const entries = Object.entries(fields);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">This type has no configurable fields.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map(([key, definition]) => {
        const hasValue = values[key] !== null && values[key] !== undefined && values[key] !== "";
        const isNonChangeable = lockSavedValues && definition.changeable === false && hasValue;
        const isLocked = key === lockedFieldKey || isNonChangeable;
        return (
          <div key={key} className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {definition.label}
              {definition.required && !isLocked ? " *" : ""}
              {key === lockedFieldKey ? <span className="text-blue-600"> (detected on network)</span> : ""}
              {isNonChangeable ? <span className="text-muted-foreground"> (locked after first save)</span> : ""}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <FieldValueInput
                  definition={definition}
                  value={values[key] ?? null}
                  onChange={(value) => onChange(key, value)}
                  disabled={isLocked}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
