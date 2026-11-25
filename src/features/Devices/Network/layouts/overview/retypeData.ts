import type { components } from "@/generated/edge-administration/types";
import { validateFields } from "@/features/PlatformTypes/FieldValueInput";
import { isListRow } from "@/features/PlatformTypes/listFields";

type FieldDefinition = components["schemas"]["FieldDefinition"];
type ResolvedField = components["schemas"]["ResolvedField"];

/**
 * Initial form values when an endpoint switches to another type: the endpoint's stored value for
 * every key the new type also defines, including null. Defaults initialize only new-type keys,
 * never existing controls or list cells. Same-type edits disable initialization entirely.
 */
export function initialRetypeValues(
  fields: Record<string, FieldDefinition>,
  currentData: Record<string, ResolvedField> | undefined,
  initializeDefaults = true,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [key, definition] of Object.entries(fields)) {
    values[key] = currentData && Object.hasOwn(currentData, key)
      ? currentData[key].value ?? null
      : initializeDefaults ? definition.default ?? null : null;
  }
  return values;
}

/**
 * Untouched empty controls do not establish stored presence; GET cannot distinguish absent
 * scalars from stored null. Explicit edits, including clears, must still reach the API.
 */
export function retypePatchValues(values: Record<string, unknown>, changedKeys: ReadonlySet<string>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([key, value]) =>
      value !== undefined && (changedKeys.has(key) || (value !== null && value !== "")))
  );
}

export function validateRetypeValues(
  values: Record<string, unknown>,
  fields: Record<string, FieldDefinition>,
  changedKeys: ReadonlySet<string>,
): string | null {
  const validationValues = { ...values };
  const validationFields = { ...fields };
  for (const [key, definition] of Object.entries(fields)) {
    if (definition.type !== "list") {
      // Only the API can distinguish an untouched missing scalar from an explicit stored null.
      if (values[key] == null && definition.default != null && !changedKeys.has(key)) {
        delete validationFields[key];
      }
    } else if (Array.isArray(values[key])) {
      const defaults = Object.fromEntries(Object.entries(definition.item_fields ?? {})
        .filter(([, field]) => field.default != null)
        .map(([itemKey, field]) => [itemKey, field.default]));
      // Retyping fills absent cells server-side; this preview never changes controls or payloads.
      validationValues[key] = values[key].map((item) => isListRow(item) ? { ...defaults, ...item } : item);
    }
  }
  return validateFields(validationValues, validationFields);
}
