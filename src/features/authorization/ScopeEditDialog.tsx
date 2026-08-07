import { useEffect, useMemo, useState } from "react";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import { Button } from "@/components/ui/button";
import { AttributeNameCombobox } from "./AttributeNameCombobox";
import useDeviceMetadataFields from "@/features/PlatformTypes/useDeviceMetadataFields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import type { components } from "@/generated/edge-administration/types";

type ScopeResponse = components["schemas"]["ScopeResponse"];

type ScopeEditDialogProps = {
  scope: ScopeResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (scope: ScopeResponse) => void;
};

type AttributeRow = {
  id: string;
  name: string;
  value: string;
};

function formatAttrValue(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item === null) {
          return "null";
        }

        if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
          return String(item);
        }

        return JSON.stringify(item);
      })
      .join(", ");
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function parseAttrValue(value: string): unknown {
  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  if (trimmed.includes(",")) {
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return value;
}

function createAttributeRow(name = "", value = ""): AttributeRow {
  return {
    id: crypto.randomUUID(),
    name,
    value,
  };
}

export function ScopeEditDialog({ scope, open, onOpenChange, onCreated }: ScopeEditDialogProps) {
  const createScopeMutation = edgeConfigApiHooks.useCreateScope();
  const updateScopeMutation = edgeConfigApiHooks.useUpdateScope();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accessRule, setAccessRule] = useState<"ALL" | "ANY">("ALL");
  const [attributeRows, setAttributeRows] = useState<AttributeRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // The "default" device type's required fields - these are enforced for every device
  // regardless of its own type (see db/sqlalchemy/device.py:_effective_fields_for), so they're
  // guaranteed to exist on every device's metadata, which is exactly what makes them safe
  // candidates for a scope attribute key (a scope referencing a key that some devices don't
  // have would just silently never match for those devices).
  const { fields: deviceMetadataFields } = useDeviceMetadataFields();
  const platformMetadataKeys = useMemo(
    () => deviceMetadataFields.map(([key]) => key).sort((a, b) => a.localeCompare(b)),
    [deviceMetadataFields],
  );

  const isEditMode = Boolean(scope);
  const isSaving = createScopeMutation.isPending || updateScopeMutation.isPending;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (scope) {
      setName(scope.name);
      setDescription(scope.description ?? "");
      setAccessRule(scope.access_rule);
      setAttributeRows(
        Object.entries(scope.attr).map(([key, value]) =>
          createAttributeRow(key, formatAttrValue(value)),
        ),
      );
    } else {
      setName("");
      setDescription("");
      setAccessRule("ALL");
      setAttributeRows([]);
    }

    setError(null);
  }, [open, scope]);

  const handleSave = async () => {
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name is required");
      return;
    }

    const trimmedAttributeNames = attributeRows
      .map((row) => row.name.trim())
      .filter((attributeName) => attributeName.length > 0);

    const attributeNameByNormalizedKey = new Map<string, string>();
    const duplicateAttributeNames = new Set<string>();

    trimmedAttributeNames.forEach((attributeName) => {
      const normalizedName = attributeName.toLowerCase();
      const firstSeenName = attributeNameByNormalizedKey.get(normalizedName);

      if (firstSeenName) {
        duplicateAttributeNames.add(firstSeenName);
        return;
      }

      attributeNameByNormalizedKey.set(normalizedName, attributeName);
    });

    if (duplicateAttributeNames.size > 0) {
      setError(
        `Duplicate attribute keys are not allowed: ${Array.from(duplicateAttributeNames)
          .sort((a, b) => a.localeCompare(b))
          .join(", ")}`,
      );
      return;
    }

    const completeAttributeRows = attributeRows.filter(
      (row) => row.name.trim().length > 0 && row.value.trim().length > 0,
    );

    if (completeAttributeRows.length === 0) {
      setError("At least one attribute row with both name and value is required");
      return;
    }

    try {
      const attr = completeAttributeRows.reduce<Record<string, unknown>>((accumulator, row) => {
        const key = row.name.trim();

         const parsedValue = parseAttrValue(row.value);
         accumulator[key] = parsedValue;
        return accumulator;
      }, {});

      const payload = {
        name: trimmedName,
        description: description.trim() ? description.trim() : null,
        attr,
        access_rule: accessRule,
      };

      if (scope) {
        await updateScopeMutation.mutateAsync({
          scopeId: scope.id,
          payload,
        });
      } else {
        const created = await createScopeMutation.mutateAsync(payload);
        onCreated?.(created);
      }

      onOpenChange(false);
    } catch (e: unknown) {
      let message: string = "Failed to save scope";
      
      if (e && typeof e === "object") {
        const error = e as any;
        // Try common error response structures
        if (typeof error.response?.data?.message === "string") {
          message = error.response.data.message;
        } else if (typeof error.response?.data?.detail === "string") {
          message = error.response.data.detail;
        } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
          // Handle validation errors array
          message = error.response.data.errors
            .map((err: any) => (typeof err === "string" ? err : err.msg || JSON.stringify(err)))
            .join(", ");
        } else if (error.response?.statusText) {
          message = `${error.response.status}: ${error.response.statusText}`;
        } else if (typeof error.message === "string") {
          message = error.message;
        }
      } else if (typeof e === "string") {
        message = e;
      }
      
      setError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit scope" : "Create scope"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the scope name, description, and attributes."
              : "Set scope name, description, and attributes."}
          </DialogDescription>
        </DialogHeader>

        {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="scope-name">Name</Label>
            <Input
              id="scope-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              placeholder="Scope name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope-description">Description</Label>
            <Textarea
              id="scope-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Scope description"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="access-rule">Access Rule</Label>
            <Select value={accessRule} onValueChange={(value) => setAccessRule(value as "ALL" | "ANY")}>
              <SelectTrigger id="access-rule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="ANY">Any</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Attributes</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setAttributeRows((current) => [...current, createAttributeRow()]);
                  setError(null);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add row
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="w-16 text-right"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attributeRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                        No attributes yet. Add a row to start.
                      </TableCell>
                    </TableRow>
                  ) : (
                    attributeRows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <AttributeNameCombobox
                            value={row.name}
                            options={platformMetadataKeys}
                            onChange={(selectedName) => {
                              setAttributeRows((current) =>
                                current.map((currentRow, currentIndex) =>
                                  currentIndex === index
                                    ? { ...currentRow, name: selectedName }
                                    : currentRow,
                                ),
                              );
                              setError(null);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              value={row.value}
                              onChange={(event) => {
                                const value = event.target.value;
                                setAttributeRows((current) =>
                                  current.map((currentRow, currentIndex) =>
                                    currentIndex === index ? { ...currentRow, value } : currentRow,
                                  ),
                                );
                                setError(null);
                              }}
                              placeholder="Enter value - separate multiple with a comma"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setAttributeRows((current) =>
                                current.filter((_, currentIndex) => currentIndex !== index),
                              );
                              setError(null);
                            }}
                            aria-label={`Remove attribute row ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : isEditMode ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}