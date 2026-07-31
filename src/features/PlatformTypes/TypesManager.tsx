import { useState } from "react";
import { toast } from "react-toastify";
import { PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import SimpleDialog from "@/components/Modal/SimpleDialog";
import Button, { ButtonColor, ButtonSize } from "@/components/Input/Button";
import { compactInputClass } from "@/features/PlatformTypes/FieldValueInput";
import { ApiError } from "@/generated/edge-administration/api";
import TypeFormDialog, { BrowserKindOption, TypeFormResult, TypeRecord } from "./TypeFormDialog";
import { FieldDefinition, MappingRoleConfig } from "./FieldsEditor";

export interface TypesManagerProps {
  title: string;
  singularLabel: string;
  description?: string;
  types: TypeRecord[];
  isLoading: boolean;
  /** When set, the form lets a single field be assigned this mapping role (e.g. IP, Port). */
  mappingRole?: MappingRoleConfig;
  /** When set, the form lets this type be assigned one of these built-in browsers. */
  browserKindOptions?: BrowserKindOption[];
  /** Example shown in the Type ID field's placeholder (e.g. "powerpak-3000" for endpoint types,
   * "ftp" for service types). Defaults to a generic example when unset. */
  typeIdPlaceholder?: string;
  /** When set, a brand-new type starts pre-populated with these fields instead of a blank row -
   * used for Device Types, where the default type's fields always apply anyway. */
  defaultFields?: Record<string, FieldDefinition>;
  /** Type ID that can't be deleted (its delete button is hidden entirely) - used for the
   * "default" device type, which the backend also rejects deleting. */
  protectedTypeId?: string;
  /**
   * When set, deleting a type is a cascading delete that also removes every instance of it
   * (e.g. every endpoint of an endpoint type) - `instancesLabel` is the singular noun for one
   * instance (e.g. "endpoint"), used in copy like "every {instancesLabel} of it". To guard
   * against a stray click nuking real data, the user must type the type's exact Type ID before
   * the Delete button is enabled. When unset, deletion is a plain, non-cascading, single-click
   * confirmation (e.g. for Device Types).
   */
  cascadeDelete?: { instancesLabel: string };
  onCreate: (body: {
    type_id: string;
    label: string;
    description: string | null;
    fields: Record<string, FieldDefinition>;
    mapping?: Record<string, string>;
    browser_kind?: string | null;
  }) => Promise<unknown>;
  onUpdate: (
    typeId: string,
    body: {
      label: string;
      description: string | null;
      fields: Record<string, FieldDefinition | null>;
      mapping?: Record<string, string | null>;
      browser_kind?: string | null;
    }
  ) => Promise<unknown>;
  onDelete: (typeId: string) => Promise<unknown>;
}

function nonNullFields(fields: Record<string, FieldDefinition | null>): Record<string, FieldDefinition> {
  return Object.fromEntries(
    Object.entries(fields).filter((entry): entry is [string, FieldDefinition] => entry[1] !== null)
  );
}

function nonNullMapping(mapping: Record<string, string | null>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(mapping).filter((entry): entry is [string, string] => entry[1] !== null)
  );
}

export default function TypesManager({
  title,
  singularLabel,
  description,
  types,
  isLoading,
  mappingRole,
  browserKindOptions,
  typeIdPlaceholder,
  defaultFields,
  protectedTypeId,
  cascadeDelete,
  onCreate,
  onUpdate,
  onDelete,
}: TypesManagerProps) {
  const [dialogState, setDialogState] = useState<{ open: boolean; editing: TypeRecord | null }>({
    open: false,
    editing: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TypeRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const sortedTypes = [...types].sort((a, b) => a.label.localeCompare(b.label));

  const openAdd = () => setDialogState({ open: true, editing: null });
  const openEdit = (type: TypeRecord) => setDialogState({ open: true, editing: type });
  const closeDialog = () => setDialogState({ open: false, editing: null });
  const closeDeleteDialog = () => {
    setPendingDelete(null);
    setDeleteConfirmationText("");
  };

  const handleSubmit = async (result: TypeFormResult) => {
    setIsSubmitting(true);
    try {
      if (dialogState.editing) {
        await onUpdate(dialogState.editing.type_id, {
          label: result.label,
          description: result.description,
          fields: result.fields,
          ...(mappingRole ? { mapping: result.mapping } : {}),
          ...(browserKindOptions ? { browser_kind: result.browser_kind } : {}),
        });
        toast.success(`${singularLabel} "${result.label}" updated`);
      } else {
        await onCreate({
          type_id: result.type_id,
          label: result.label,
          description: result.description,
          fields: nonNullFields(result.fields),
          ...(mappingRole ? { mapping: nonNullMapping(result.mapping) } : {}),
          ...(browserKindOptions ? { browser_kind: result.browser_kind } : {}),
        });
        toast.success(`${singularLabel} "${result.label}" created`);
      }
      closeDialog();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    if (cascadeDelete && deleteConfirmationText !== pendingDelete.type_id) return;
    setIsDeleting(true);
    try {
      await onDelete(pendingDelete.type_id);
      toast.success(`${singularLabel} "${pendingDelete.label}" deleted`);
      closeDeleteDialog();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : null;
      toast.error(
        message ?? `Failed to delete ${singularLabel.toLowerCase()} "${pendingDelete.label}"`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium
            bg-primary/10 text-primary border border-primary/20
            hover:bg-primary hover:text-white hover:border-primary
            transition-all shadow-sm shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          Add {singularLabel.toLowerCase()}
        </button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground border-b">Type ID</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground border-b">Label</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground border-b">Description</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground border-b w-24">Fields</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground border-b w-28">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Loading {title.toLowerCase()}...
                </td>
              </tr>
            ) : sortedTypes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No {title.toLowerCase()} defined
                </td>
              </tr>
            ) : (
              sortedTypes.map((type) => (
                <tr
                  key={type.type_id}
                  className="bg-background hover:bg-muted/40 transition-colors border-b last:border-b-0"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{type.type_id}</td>
                  <td className="px-4 py-3 font-medium">{type.label}</td>
                  <td className="px-4 py-3 text-muted-foreground">{type.description || "-"}</td>
                  <td className="px-4 py-3 text-center">{Object.keys(type.fields).length}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(type)}
                        className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shadow-sm"
                        aria-label={`Edit ${type.label}`}
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      {type.type_id !== protectedTypeId && (
                        <button
                          onClick={() => setPendingDelete(type)}
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors shadow-sm"
                          aria-label={`Delete ${type.label}`}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TypeFormDialog
        isOpen={dialogState.open}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        initial={dialogState.editing}
        singularLabel={singularLabel}
        isPending={isSubmitting}
        mappingRole={mappingRole}
        browserKindOptions={browserKindOptions}
        typeIdPlaceholder={typeIdPlaceholder}
        defaultFields={defaultFields}
      />

      <SimpleDialog
        isOpen={pendingDelete !== null}
        title={pendingDelete ? `Delete ${singularLabel.toLowerCase()} "${pendingDelete.label}"` : ""}
      >
        <div className="space-y-4">
          {cascadeDelete ? (
            <>
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                This permanently deletes this {singularLabel.toLowerCase()} <strong>and every {cascadeDelete.instancesLabel} of it</strong>. This cannot be undone.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Type <span className="font-mono">{pendingDelete?.type_id}</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder={pendingDelete?.type_id}
                  autoFocus
                  className={`${compactInputClass} font-mono`}
                />
              </div>
            </>
          ) : (
            <p className="text-sm">
              This will permanently remove this {singularLabel.toLowerCase()}. This cannot be undone.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              size={ButtonSize.Small}
              color={ButtonColor.Red}
              onClick={handleDelete}
              processing={isDeleting}
              disabled={cascadeDelete ? deleteConfirmationText !== pendingDelete?.type_id : false}
            >
              Delete
            </Button>
            <Button
              size={ButtonSize.Small}
              color={ButtonColor.Gray}
              onClick={closeDeleteDialog}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </SimpleDialog>
    </div>
  );
}
