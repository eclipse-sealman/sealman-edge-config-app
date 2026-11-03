import type { ReactNode } from "react";
import { toast } from "react-toastify";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import { ErrorState, LoadingState } from "@/components/ui/page-state";
import PageTitle from "@/components/Typography/PageTitle";
import { getErrorMessage } from "@/lib/errors";
import { PresetTemplateVariable, TemplateVariableRow } from "./TemplatesSettings";

export type PresetVariableSection = {
  title: string;
  description?: string;
  variables: PresetTemplateVariable[];
};

export default function PresetTemplateVariablesSettings({
  title,
  description,
  sections,
  children,
}: {
  title: string;
  description: string;
  sections: PresetVariableSection[];
  children?: ReactNode;
}) {
  const { variablesQuery, setVariableMutation, deleteVariableMutation } =
    edgeConfigApiHooks.useDeviceTemplateVariables();

  if (variablesQuery.isLoading) return <LoadingState label={`Loading ${title} settings...`} />;
  if (variablesQuery.isError) return <ErrorState title={`Could not load ${title} settings`} message={getErrorMessage(variablesQuery.error)} onRetry={() => variablesQuery.refetch()} />;

  const variables = variablesQuery.data ?? {};
  const saving = setVariableMutation.isPending || deleteVariableMutation.isPending;

  const handleSave = (name: string, value: string) => {
    setVariableMutation.mutate(
      { name, value },
      { onError: () => toast.error(`Could not save "${name}"`) }
    );
  };

  const handleDelete = (name: string) => {
    if (!(name in variables)) return;
    deleteVariableMutation.mutate(name, {
      onError: () => toast.error(`Could not reset "${name}"`),
    });
  };

  return (
    <div className="space-y-6">
      <PageTitle title={title} description={description} />

      {sections.map((section) => (
        <section key={section.title} className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">{section.title}</h3>
            {section.description && (
              <p className="text-sm text-muted-foreground">{section.description}</p>
            )}
          </div>
          <div className="bg-card border rounded-lg p-4">
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
                  {section.variables.map(({ name, defaultValue }) => (
                    <TemplateVariableRow
                      key={name}
                      name={name}
                      value={variables[name] ?? ""}
                      placeholder={defaultValue ? `Default: ${defaultValue}` : "Optional"}
                      onSave={handleSave}
                      onDelete={handleDelete}
                      saving={saving}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ))}

      {children}
    </div>
  );
}
