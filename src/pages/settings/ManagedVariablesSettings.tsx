import { toast } from "react-toastify";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import { TemplateVariableRow } from "./TemplateVariableRow";

const AZURE_IOT_VARIABLES = ["edge_agent_image"];
const CONTAINER_REGISTRY_VARIABLES = [
  "container_registry_address",
  "container_registry_username",
  "container_registry_password",
  "container_registry_credentials_encoded",
];
const SEALMAN_EMS_VARIABLES = ["sems_device_url"];

// Variables with a dedicated settings tab; hidden from the generic Templates tab.
export const MANAGED_TEMPLATE_VARIABLES: string[] = [
  ...AZURE_IOT_VARIABLES,
  ...CONTAINER_REGISTRY_VARIABLES,
  ...SEALMAN_EMS_VARIABLES,
];

function ManagedVariablesSection({
  names,
  description,
}: {
  names: string[];
  description: string;
}) {
  const { variablesQuery, setVariableMutation, deleteVariableMutation } =
    edgeConfigApiHooks.useDeviceTemplateVariables();

  const variables: Record<string, string> = variablesQuery.data ?? {};
  const saving = setVariableMutation.isPending || deleteVariableMutation.isPending;

  const handleSave = (name: string, value: string) => {
    setVariableMutation.mutate(
      { name, value },
      { onError: () => toast.error(`Failed to save "${name}".`) }
    );
  };

  const handleDelete = (name: string) => {
    deleteVariableMutation.mutate(name, {
      onError: () => toast.error(`Failed to delete "${name}".`),
    });
  };

  if (variablesQuery.isLoading) return <div>Loading settings...</div>;
  if (variablesQuery.isError) return <div>Failed to load settings.</div>;

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <p className="text-sm text-muted-foreground">{description}</p>

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
            {names.map((name) => (
              <TemplateVariableRow
                key={name}
                name={name}
                value={variables[name] ?? ""}
                onSave={handleSave}
                onDelete={handleDelete}
                saving={saving}
                deletable={name in variables}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AzureIotSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Azure IoT</h2>
      <ManagedVariablesSection
        names={AZURE_IOT_VARIABLES}
        description="Azure IoT settings applied to every new device during creation."
      />
    </div>
  );
}

export function ContainerRegistrySettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Container Registry</h2>
      <ManagedVariablesSection
        names={CONTAINER_REGISTRY_VARIABLES}
        description="Container registry settings applied to every new device during creation."
      />
    </div>
  );
}

export function SealmanEmsSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Sealman EMS</h2>
      <ManagedVariablesSection
        names={SEALMAN_EMS_VARIABLES}
        description="Sealman EMS settings applied to every new device during creation."
      />
    </div>
  );
}
