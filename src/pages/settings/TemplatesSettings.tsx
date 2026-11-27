import { useState } from "react";
import { toast } from "react-toastify";
import { TrashIcon } from "@heroicons/react/24/outline";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ErrorState, LoadingState } from "@/components/ui/page-state";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { CHANGED_INPUT, usePendingChanges } from "./pendingChanges";

const CHANGED_ROW = "bg-yellow-50 hover:bg-yellow-50";

export type PresetTemplateVariable = { name: string; defaultValue: string; deleteWarning?: string; placeholder?: string; type?: "boolean"; plainText?: boolean };

export const IOTEDGE_REGISTRY_VARIABLES: PresetTemplateVariable[] = [
  { name: "iotedge_registry_url", defaultValue: "docker.io" },
  { name: "iotedge_registry_username", defaultValue: "" },
  { name: "iotedge_registry_password", defaultValue: "" },
];

export const IOTEDGE_AGENT_VARIABLES: PresetTemplateVariable[] = [
  { name: "edge_agent_image", defaultValue: "mcr.microsoft.com/azureiotedge-agent:1.4" },
];

export const IOTEDGE_PROVISIONING_VARIABLES: PresetTemplateVariable[] = [
  { name: "iotedge_dps_id_scope", defaultValue: "", placeholder: "id_scope" },
];

export const SEALMAN_EMS_VARIABLES: PresetTemplateVariable[] = [
  {
    name: "sems_device_url",
    defaultValue: "sems.localhost",
    deleteWarning:
      "Deleting this variable resets the SEMS URL on all devices to the template default. Devices may lose their connection to SEMS and can then no longer receive any configuration.",
  },
  { name: "sems_device_user", defaultValue: "edgeGateway" },
  { name: "sems_device_password", defaultValue: "123456", plainText: true },
  { name: "sems_polling_interval", defaultValue: "600" },
  { name: "sems_edgegatewayvcc", defaultValue: "false", type: "boolean" },
  { name: "sems_certificate", defaultValue: "" },
];

// Template variables holding JSON objects that the SEMS twig renders verbatim.
export const CONTAINER_REGISTRY_AUTHS_VARIABLE = "container_registry_auths";
export const STATIC_COMPOSE_FILES_VARIABLE = "static_compose_files";
export const MAX_CONTAINER_REGISTRIES = 4;

export const PRESET_VARIABLE_NAMES: string[] = [
  ...IOTEDGE_REGISTRY_VARIABLES,
  ...IOTEDGE_AGENT_VARIABLES,
  ...IOTEDGE_PROVISIONING_VARIABLES,
  ...SEALMAN_EMS_VARIABLES,
].map((v) => v.name).concat(CONTAINER_REGISTRY_AUTHS_VARIABLE, STATIC_COMPOSE_FILES_VARIABLE);

/** A variable row; `value` is what is shown, `changed` marks it as differing from the saved value. */
export function TemplateVariableRow({
  name,
  value,
  changed,
  onChange,
  onDelete,
  saving,
  placeholder,
  plainText,
}: {
  name: string;
  value: string;
  changed: boolean;
  onChange: (value: string) => void;
  onDelete: (name: string) => void;
  saving: boolean;
  placeholder?: string;
  plainText?: boolean;
}) {
  return (
    <tr className={cn("bg-background hover:bg-muted/40 transition-colors border-b last:border-b-0", changed && CHANGED_ROW)}>
      <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{name}</td>
      <td className="px-3 py-2">
        <Input
          type={!plainText && (name.includes("password") || name.includes("encoded")) ? "password" : "text"}
          value={value}
          placeholder={placeholder}
          className={cn(changed && CHANGED_INPUT)}
          onChange={(e) => onChange(e.target.value)}
        />
      </td>
      <td className="px-3 py-2 text-right whitespace-nowrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(name)}
          disabled={saving}
          className="text-muted-foreground hover:text-destructive"
          title={`Delete ${name}`}
        >
          <TrashIcon />
        </Button>
      </td>
    </tr>
  );
}

export function BooleanVariableRow({
  name,
  value,
  changed,
  onChange,
  saving,
}: {
  name: string;
  value: boolean;
  changed: boolean;
  onChange: (value: boolean) => void;
  saving: boolean;
}) {
  return (
    <tr className={cn("bg-background hover:bg-muted/40 transition-colors border-b last:border-b-0", changed && CHANGED_ROW)}>
      <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{name}</td>
      <td className="px-3 py-2">
        <Switch
          checked={value}
          disabled={saving}
          aria-label={name}
          className={cn(changed && "ring-2 ring-yellow-400")}
          onCheckedChange={onChange}
        />
      </td>
      <td className="px-3 py-2" />
    </tr>
  );
}

export function DeviceTemplateVariablesSection() {
  const { variablesQuery, setVariableMutation, deleteVariableMutation } =
    edgeConfigApiHooks.useDeviceTemplateVariables();

  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [added, setAdded] = useState<{ name: string; value: string }[]>([]);

  const variables = variablesQuery.data ?? {};
  const changedNames = Object.keys(edits).filter((name) => name in variables && edits[name] !== variables[name]);

  usePendingChanges("custom-template-variables", {
    label: "Custom template variables",
    dirty: changedNames.length > 0 || added.length > 0,
    save: async () => {
      for (const name of changedNames) await setVariableMutation.mutateAsync({ name, value: edits[name] });
      for (const { name, value } of added) await setVariableMutation.mutateAsync({ name, value });
      setEdits({});
      setAdded([]);
    },
  });

  const handleDelete = (name: string) => {
    setEdits((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => key !== name)));
    deleteVariableMutation.mutate(name, {
      onError: () => toast.error(`Could not delete "${name}"`),
    });
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    if (name in variables || added.some((variable) => variable.name === name)) {
      toast.error(`"${name}" already exists`);
      return;
    }
    setAdded([...added, { name, value: newValue }]);
    setNewName("");
    setNewValue("");
  };

  if (variablesQuery.isLoading) return <LoadingState label="Loading template variables..." />;
  if (variablesQuery.isError) return <ErrorState title="Could not load template variables" message={getErrorMessage(variablesQuery.error)} onRetry={() => variablesQuery.refetch()} />;

  const saving = setVariableMutation.isPending || deleteVariableMutation.isPending;

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        These variables are applied to all existing devices and to every new device during creation.
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
            {Object.entries(variables)
              .filter(([name]) => !PRESET_VARIABLE_NAMES.includes(name))
              .map(([name, value]) => (
              <TemplateVariableRow
                key={name}
                name={name}
                value={edits[name] ?? value}
                changed={changedNames.includes(name)}
                onChange={(next) => setEdits({ ...edits, [name]: next })}
                onDelete={handleDelete}
                saving={saving}
              />
            ))}
            {added.map(({ name, value }) => (
              <TemplateVariableRow
                key={`added:${name}`}
                name={name}
                value={value}
                changed
                onChange={(next) => setAdded(added.map((variable) => (variable.name === name ? { name, value: next } : variable)))}
                onDelete={() => setAdded(added.filter((variable) => variable.name !== name))}
                saving={saving}
              />
            ))}
            <tr className="bg-muted/20">
              <td className="px-4 py-3">
                <Input
                  placeholder="New variable name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  placeholder="Value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
              </td>
              <td className="px-3 py-2 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAdd}
                  disabled={!newName.trim() || saving}
                >
                  Add
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
