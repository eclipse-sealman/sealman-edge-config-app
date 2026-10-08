import { useEffect, useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";

export function TemplateVariableRow({
  name,
  value,
  onSave,
  onDelete,
  saving,
  deletable = true,
}: {
  name: string;
  value: string;
  onSave: (name: string, value: string) => void;
  onDelete: (name: string) => void;
  saving: boolean;
  deletable?: boolean;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const isDirty = draft !== value;

  return (
    <tr className="bg-background hover:bg-muted/40 transition-colors border-b last:border-b-0">
      <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{name}</td>
      <td className="px-3 py-2">
        <input
          type={name.includes("password") || name.includes("encoded") ? "password" : "text"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="
            w-full px-3 py-1.5 rounded-md text-sm
            bg-muted/30
            border border-slate-200
            hover:border-slate-300
            focus:bg-background
            focus:border-primary
            focus:ring-2 focus:ring-primary/20
            outline-none
            transition
          "
        />
      </td>
      <td className="px-3 py-2 text-right whitespace-nowrap">
        <button
          onClick={() => onSave(name, draft)}
          disabled={!isDirty || saving}
          className="
            px-3 py-1.5 rounded-md text-sm font-medium
            bg-primary text-white
            hover:bg-primary/90
            disabled:opacity-40 disabled:cursor-not-allowed
            transition mr-2
          "
        >
          Save
        </button>
        <button
          onClick={() => onDelete(name)}
          disabled={saving || !deletable}
          className="
            inline-flex items-center justify-center h-8 w-8 rounded-md
            text-muted-foreground hover:text-red-600 hover:bg-red-50
            disabled:opacity-40 disabled:cursor-not-allowed
            transition
          "
          title={`Delete ${name}`}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
