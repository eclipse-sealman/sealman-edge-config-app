import { Fragment, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FieldValueInput, { compactInputClass, formatMetadataValue } from "@/features/PlatformTypes/FieldValueInput";
import { isListRow, newListRow, orderedItemFields } from "@/features/PlatformTypes/listFields";
import type { components } from "@/generated/edge-administration/types";
import CustomFieldsEditor from "./CustomFieldsEditor";

type FieldDefinition = components["schemas"]["FieldDefinition"];

function displayValue(value: unknown, definition?: FieldDefinition): string {
  if (value === null || value === undefined || value === "") return "-";
  if (definition) return formatMetadataValue(value, definition) || "-";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function ValueCell({ value, definition, children }: { value: unknown; definition?: FieldDefinition; children?: ReactNode }) {
  return (
    <div className={`grid min-w-0 items-center ${definition?.ui === "textarea" ? "min-h-16" : "min-h-8"}`}>
      {/* Keep wrapped text's footprint when its editor is overlaid. */}
      <span aria-hidden={!!children}
        className={`col-start-1 row-start-1 flex min-h-8 items-center rounded-md border border-transparent px-3 py-1 ${children ? "invisible" : ""}`}>
        {displayValue(value, definition)}
      </span>
      {children && <div className="col-start-1 row-start-1 min-w-0">{children}</div>}
    </div>
  );
}

export default function AssetFieldValues({
  fields = {}, values, onChange, onDelete, disabled = false, lockSavedValues = true, children,
}: {
  fields?: Record<string, FieldDefinition>;
  values: Record<string, unknown>;
  onChange?: (key: string, value: unknown) => void;
  onDelete?: (key: string) => void;
  disabled?: boolean;
  lockSavedValues?: boolean;
  children?: ReactNode;
}) {
  const allKeys = [...new Set([...Object.keys(fields), ...Object.keys(values)])];
  const keys = [
    ...allKeys.filter(key => fields[key]?.type !== "list"),
    ...allKeys.filter(key => fields[key]?.type === "list"),
  ];
  const firstListKey = keys.find(key => fields[key]?.type === "list");
  const customFieldEditor = onChange && onDelete ? (
    <div key="custom-field-editor" className="col-span-full">
      <dt className="sr-only">Add custom field</dt>
      <dd>
        <fieldset disabled={disabled}>
          <CustomFieldsEditor addOnly customValues={{ ...fields, ...values }}
            onChange={onChange} onDelete={onDelete} onAdd={onChange} />
        </fieldset>
      </dd>
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      <dl className="grid items-start gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
        {children}
        {keys.map((key) => {
          const definition = fields[key];
          const value = values[key];
          const list = definition?.type === "list" && (value == null || (Array.isArray(value) && value.every(isListRow)))
            ? value ?? [] : null;
          const columns = definition && list !== null ? orderedItemFields(definition) : [];
          const locked = lockSavedValues && definition?.changeable === false && value != null && value !== "";
          const fieldDisabled = disabled || locked;
          const canDelete = onChange && onDelete && !definition?.required && !locked;
          return (
            <Fragment key={key}>
            {key === firstListKey && customFieldEditor}
            <div className={`min-w-0 space-y-1 ${definition?.type === "list" ? "col-span-full" : ""}`}>
              <dt className={`flex items-center justify-between gap-2 text-xs text-muted-foreground ${definition?.type === "list" ? "min-h-8" : "min-h-5"}`}>
                <span className="min-w-0 break-words">{definition?.label ?? key}{definition?.required ? " *" : ""}</span>
                <span className={`flex shrink-0 items-center gap-2 ${definition?.type === "list" ? "h-8 w-32 justify-end" : "h-5 w-5 justify-center"}`}>
                  {onChange && list !== null && definition && (
                    <Button type="button" variant="default" size="sm" disabled={fieldDisabled}
                      onClick={() => onChange(key, [...list, newListRow(definition)])}>Add row</Button>
                  )}
                  {canDelete && (
                    <Button type="button" variant="ghost" size="sm" className="h-5 px-1 text-destructive hover:text-destructive"
                      title={`Clear "${definition?.label ?? key}"`} aria-label={`Clear "${definition?.label ?? key}"`}
                      disabled={disabled} onClick={() => onDelete(key)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </span>
              </dt>
              <dd className="whitespace-pre-wrap break-words text-sm font-medium">
                {list !== null && definition ? (
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full table-fixed text-left text-sm" style={{ minWidth: `${columns.length * 10 + 3}rem` }}
                      aria-label={definition.label}>
                      <thead className="bg-muted/40">
                        <tr>
                          {columns.map(([columnKey, column]) => (
                            <th key={columnKey} scope="col" className="px-3 py-2 text-xs font-medium text-muted-foreground">
                              {column.label}{column.required ? " *" : ""}
                            </th>
                          ))}
                          <th scope="col" aria-label="Row actions" aria-hidden={!onChange} className="w-12" />
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {list.length === 0 && (
                          <tr><td colSpan={columns.length + 1} className="h-12 px-3 py-2 text-muted-foreground">No rows.</td></tr>
                        )}
                        {list.map((row, index) => (
                          <tr key={typeof row.id === "string" ? row.id : index}>
                            {columns.map(([columnKey, column]) => (
                              <td key={columnKey} className="px-3 py-2 align-top">
                                <ValueCell value={row[columnKey]} definition={column}>
                                  {onChange && <FieldValueInput
                                    definition={column} value={row[columnKey] ?? null} disabled={fieldDisabled}
                                    aria-label={`${column.label}, row ${index + 1}`}
                                    onChange={(next) => onChange(key, list.map((item, i) => i === index ? { ...item, [columnKey]: next } : item))}
                                  />}
                                </ValueCell>
                              </td>
                            ))}
                            <td className="px-1 py-2 align-top" aria-hidden={!onChange}>
                              {onChange && <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-destructive"
                                disabled={fieldDisabled} aria-label={`Remove row ${index + 1}`}
                                onClick={() => onChange(key, list.filter((_, i) => i !== index))}>
                                <Trash2 className="h-4 w-4" />
                              </Button>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <ValueCell value={value} definition={definition}>
                    {onChange && (definition ? <FieldValueInput
                      definition={definition} value={value ?? null} disabled={fieldDisabled}
                      aria-label={definition.label} onChange={(next) => onChange(key, next)}
                    /> : <input className={compactInputClass} aria-label={key} disabled={disabled}
                      value={value == null || value === "" ? "" : displayValue(value)}
                      onChange={(event) => onChange(key, event.target.value)} />)}
                  </ValueCell>
                )}
                {definition?.description && <p className="mt-1 text-xs font-normal text-muted-foreground">{definition.description}</p>}
                {locked && <p className="mt-1 text-xs font-normal text-muted-foreground">Locked after first save.</p>}
              </dd>
            </div>
            </Fragment>
          );
        })}
        {firstListKey === undefined && customFieldEditor}
      </dl>
      {!children && keys.length === 0 && <p className="text-sm text-muted-foreground">No additional information.</p>}
    </div>
  );
}
