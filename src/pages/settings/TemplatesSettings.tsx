import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { TrashIcon } from "@heroicons/react/24/outline";
import { TransferList } from "@/components/settings/TransferList";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";

function TemplateVariableRow({
  name,
  value,
  onSave,
  onDelete,
  saving,
}: {
  name: string;
  value: string;
  onSave: (name: string, value: string) => void;
  onDelete: (name: string) => void;
  saving: boolean;
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
          disabled={saving}
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

function DeviceTemplateVariablesSection() {
  const { variablesQuery, setVariableMutation, deleteVariableMutation } =
    edgeConfigApiHooks.useDeviceTemplateVariables();

  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");

  const variables = variablesQuery.data ?? {};

  const handleSave = (name: string, value: string) => {
    setVariableMutation.mutate(
      { name, value },
      {
        onError: () => toast.error(`Failed to save "${name}".`),
      }
    );
  };

  const handleDelete = (name: string) => {
    deleteVariableMutation.mutate(name, {
      onError: () => toast.error(`Failed to delete "${name}".`),
    });
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    if (name in variables) {
      toast.error(`"${name}" already exists.`);
      return;
    }
    setVariableMutation.mutate(
      { name, value: newValue },
      {
        onSuccess: () => {
          setNewName("");
          setNewValue("");
        },
        onError: () => toast.error(`Failed to add "${name}".`),
      }
    );
  };

  if (variablesQuery.isLoading) return <div>Loading device template variables...</div>;
  if (variablesQuery.isError) return <div>Failed to load device template variables.</div>;

  const saving = setVariableMutation.isPending || deleteVariableMutation.isPending;

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        These variables are applied to every new device during creation.
      </p>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground border-b w-1/3">
                Variable
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground border-b">
                Value
              </th>
              <th className="px-4 py-3 border-b" />
            </tr>
          </thead>
          <tbody>
            {Object.entries(variables).map(([name, value]) => (
              <TemplateVariableRow
                key={name}
                name={name}
                value={value}
                onSave={handleSave}
                onDelete={handleDelete}
                saving={saving}
              />
            ))}
            <tr className="bg-muted/20">
              <td className="px-4 py-3">
                <input
                  placeholder="New variable name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md text-sm bg-background border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  placeholder="Value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md text-sm bg-background border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                />
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim() || saving}
                  className="
                    px-3 py-1.5 rounded-md text-sm font-medium
                    bg-primary text-white
                    hover:bg-primary/90
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition
                  "
                >
                  Add
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

type TemplateInfo = { id: number; name: string; selected: boolean };

function SelectedTemplatesSection() {
  const { templatesQuery, saveTemplatesMutation } = edgeConfigApiHooks.useDeviceTemplates();

  if (templatesQuery.isLoading) return <div>Loading templates...</div>;
  if (templatesQuery.isError) return <div>Failed to load templates</div>;

  const templates: TemplateInfo[] = templatesQuery.data || [];
  const selectedTemplates = templates.filter((t) => t.selected).map((t) => t.name);
  const availableTemplates = templates.filter((t) => !t.selected).map((t) => t.name);

  const handleAdd = (value: string) => {
    const updated = [...selectedTemplates, value];
    saveTemplatesMutation.mutate(updated, {
      onSuccess: () => templatesQuery.refetch(),
    });
  };

  const handleRemove = (value: string) => {
    const updated = selectedTemplates.filter((t: string) => t !== value);
    saveTemplatesMutation.mutate(updated, {
      onSuccess: () => templatesQuery.refetch(),
    });
  };

  return (
    <TransferList
      title=""
      selectedItems={selectedTemplates}
      availableItems={availableTemplates}
      onAdd={handleAdd}
      onRemove={handleRemove}
    />
  );
}

export default function TemplatesSettings() {
  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Selected Templates</h2>
        <SelectedTemplatesSection />
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Template Variables</h2>
        <DeviceTemplateVariablesSection />
      </div>
    </div>
  );
}
