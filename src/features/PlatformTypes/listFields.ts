import type { components } from "@/generated/edge-administration/types";

type FieldDefinition = components["schemas"]["FieldDefinition"];

export function isListRow(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function orderedItemFields(definition: Pick<FieldDefinition, "item_fields" | "item_order">) {
  const fields = definition.item_fields ?? {};
  const keys = new Set([...(definition.item_order ?? []), ...Object.keys(fields)]);
  return [...keys].filter((key) => Object.hasOwn(fields, key)).map((key) => [key, fields[key]] as const);
}

export type FieldDefinitionWrite = Omit<FieldDefinition, "item_fields" | "item_order"> & {
  item_fields?: Record<string, FieldDefinition | null> | null;
};

/** PATCH merges item_fields, so removed columns need explicit tombstones. */
export function fieldDefinitionWrite(
  definition: FieldDefinition,
  original?: FieldDefinition,
): FieldDefinitionWrite {
  const field = { ...definition };
  delete field.item_order;
  delete field.item_fields;
  if (definition.type !== "list") {
    return original?.type === "list" ? { ...field, item_fields: null } : field;
  }
  const columns: Record<string, FieldDefinition | null> = Object.fromEntries([
    ...Object.keys(original?.item_fields ?? {})
      .filter((key) => !Object.hasOwn(definition.item_fields ?? {}, key))
      .map((key) => [key, null]),
    ...Object.entries(definition.item_fields ?? {}).map(([key, column]) => {
      const scalar = { ...column };
      delete scalar.item_order;
      delete scalar.item_fields;
      return [key, scalar];
    }),
  ]);
  return { ...field, item_fields: columns };
}
