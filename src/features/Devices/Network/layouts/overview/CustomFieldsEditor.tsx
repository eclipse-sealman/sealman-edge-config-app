import { useState } from "react";
import { toast } from "react-toastify";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/features/PlatformTypes/FieldValueInput";

interface props {
  /** Instance data keys that aren't part of the type's own field schema. */
  customValues: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onDelete: (key: string) => void;
  onAdd: (key: string, value: unknown) => void;
}

function toInputValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

/**
 * Freeform key/value editor for instance data that has nothing to do with the endpoint/service
 * type's defined fields - lets a user attach arbitrary extra data to a single instance.
 */
export default function CustomFieldsEditor({ customValues, onChange, onDelete, onAdd }: props) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    const key = newKey.trim();
    if (!key) {
      toast.error("Enter a field name");
      return;
    }
    if (key in customValues) {
      toast.error(`"${key}" already exists`);
      return;
    }
    onAdd(key, newValue);
    setNewKey("");
    setNewValue("");
  };

  return (
    <div className="space-y-3">
      {Object.entries(customValues).length === 0 && (
        <p className="text-sm text-muted-foreground">No custom fields added yet.</p>
      )}

      {Object.entries(customValues).map(([key, value]) => (
        <div key={key} className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground font-mono">{key}</label>
            <input
              type="text"
              value={toInputValue(value)}
              onChange={(e) => onChange(key, e.target.value)}
              className={inputClass}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(key)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}

      <div className="flex items-end gap-2 pt-2 border-t">
        <div className="w-1/3 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Field name</label>
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="custom_field"
            className={`${inputClass} font-mono`}
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Value</label>
          <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)} className={inputClass} />
        </div>
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={handleAdd}>
          <Plus /> Add Field
        </Button>
      </div>
    </div>
  );
}
