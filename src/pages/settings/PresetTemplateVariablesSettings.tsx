import { useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import { AlertTriangle } from "lucide-react";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import { ErrorState, InlineAlert, LoadingState } from "@/components/ui/page-state";
import PageTitle from "@/components/Typography/PageTitle";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BooleanVariableRow, PresetTemplateVariable, TemplateVariableRow } from "./TemplatesSettings";
import { usePendingChanges } from "./pendingChanges";

export type PresetVariableSection = {
  title: string;
  description?: string;
  /** Marks the section as a danger zone and says what a wrong value can cause. */
  danger?: string;
  variables: PresetTemplateVariable[];
};

export default function PresetTemplateVariablesSettings({
  title,
  description,
  sections,
  header,
  children,
}: {
  title: string;
  description: string;
  sections: PresetVariableSection[];
  header?: ReactNode;
  children?: ReactNode;
}) {
  const { variablesQuery, setVariableMutation, deleteVariableMutation } =
    edgeConfigApiHooks.useDeviceTemplateVariables();
  const [pendingDelete, setPendingDelete] = useState<PresetTemplateVariable | null>(null);
  // Edited values that are not saved yet, by variable name.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const variables = variablesQuery.data ?? {};
  const savedValue = (v: PresetTemplateVariable) =>
    v.type === "boolean" ? (variables[v.name] ?? v.defaultValue) : (variables[v.name] ?? "");
  const changedVariables = sections
    .flatMap((s) => s.variables)
    .filter((v) => drafts[v.name] !== undefined && drafts[v.name] !== savedValue(v));

  usePendingChanges(`preset-variables:${title}`, {
    label: `${title} variables`,
    dirty: changedVariables.length > 0,
    save: async () => {
      for (const { name } of changedVariables) await setVariableMutation.mutateAsync({ name, value: drafts[name] });
      setDrafts({});
    },
  });

  if (variablesQuery.isLoading) return <LoadingState label={`Loading ${title} settings...`} />;
  if (variablesQuery.isError) return <ErrorState title={`Could not load ${title} settings`} message={getErrorMessage(variablesQuery.error)} onRetry={() => variablesQuery.refetch()} />;

  const saving = setVariableMutation.isPending || deleteVariableMutation.isPending;

  const setDraft = (name: string, value: string) => setDrafts({ ...drafts, [name]: value });

  const deleteVariable = (name: string) => {
    deleteVariableMutation.mutate(name, {
      onError: () => toast.error(`Could not reset "${name}"`),
    });
  };

  const handleDelete = (name: string) => {
    setDrafts(Object.fromEntries(Object.entries(drafts).filter(([key]) => key !== name)));
    if (!(name in variables)) return;
    const preset = sections.flatMap((s) => s.variables).find((v) => v.name === name);
    if (preset?.deleteWarning) {
      setPendingDelete(preset);
      return;
    }
    deleteVariable(name);
  };

  return (
    <div className="space-y-6">
      <PageTitle title={title} description={description} />

      {header}

      {sections.map((section) => (
        <section
          key={section.title}
          className={cn("space-y-3", section.danger && "rounded-lg border-2 border-red-300 bg-red-50/50 p-4")}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {section.danger && <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />}
              <h3 className="text-base font-semibold">{section.title}</h3>
              {section.danger && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
                  Danger zone
                </span>
              )}
            </div>
            {section.description && (
              <p className="text-sm text-muted-foreground">{section.description}</p>
            )}
          </div>
          {section.danger && <InlineAlert variant="error">{section.danger}</InlineAlert>}
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
                  {section.variables.map(({ name, defaultValue, placeholder, type, plainText }) =>
                    type === "boolean" ? (
                      <BooleanVariableRow
                        key={name}
                        name={name}
                        value={(drafts[name] ?? variables[name] ?? defaultValue) === "true"}
                        changed={changedVariables.some((v) => v.name === name)}
                        onChange={(checked) => setDraft(name, checked ? "true" : "false")}
                        saving={saving}
                      />
                    ) : (
                    <TemplateVariableRow
                      key={name}
                      name={name}
                      value={drafts[name] ?? variables[name] ?? ""}
                      changed={changedVariables.some((v) => v.name === name)}
                      placeholder={placeholder ?? (defaultValue ? `Default: ${defaultValue}` : "Optional")}
                      plainText={plainText}
                      onChange={(value) => setDraft(name, value)}
                      onDelete={handleDelete}
                      saving={saving}
                    />
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ))}

      {children}

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{pendingDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>{pendingDelete?.deleteWarning}</AlertDialogDescription>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            The change is applied to all existing devices immediately.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) deleteVariable(pendingDelete.name);
                setPendingDelete(null);
              }}
            >
              Delete anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
