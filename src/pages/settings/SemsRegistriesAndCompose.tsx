import { useEffect, useState, type ReactNode } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import YamlEditor from "@/components/Input/YamlEditor";
import { yamlProblems } from "@/components/Input/yamlProblem";
import { ErrorState, LoadingState } from "@/components/ui/page-state";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { CHANGED_BLOCK, CHANGED_INPUT, usePendingChanges } from "./pendingChanges";
import { CONTAINER_REGISTRY_AUTHS_VARIABLE, MAX_CONTAINER_REGISTRIES, STATIC_COMPOSE_FILES_VARIABLE } from "./TemplatesSettings";

type Registry = { address: string; auth: string };
type Stack = { name: string; yaml: string };

function parseObject(raw: string | undefined): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const parseRegistries = (raw: string | undefined): Registry[] =>
  Object.entries(parseObject(raw)).map(([address, value]) => ({
    address,
    auth: ((value as { auth?: string | null } | null)?.auth ?? "") as string,
  }));

const serializeRegistries = (items: Registry[]): string =>
  JSON.stringify(Object.fromEntries(items.map((r) => [r.address.trim(), { auth: r.auth.trim() || null }])));

const parseStacks = (raw: string | undefined): Stack[] =>
  Object.entries(parseObject(raw)).map(([name, yaml]) => ({ name, yaml: String(yaml) }));

const serializeStacks = (items: Stack[]): string =>
  JSON.stringify(Object.fromEntries(items.map((s) => [s.name.trim(), s.yaml])));

// Edits a list locally and stores it in one JSON template variable; an empty list removes the variable.
function useListVariable<T>(
  name: string,
  label: string,
  parse: (raw: string | undefined) => T[],
  serialize: (items: T[]) => string,
  validate: (items: T[]) => string | null
) {
  const { variablesQuery, setVariableMutation, deleteVariableMutation } = edgeConfigApiHooks.useDeviceTemplateVariables();
  const stored = variablesQuery.data?.[name];
  const [draft, setDraft] = useState<T[]>(() => parse(stored));

  useEffect(() => {
    setDraft(parse(stored));
  }, [stored, parse]);

  const dirty = serialize(draft) !== serialize(parse(stored));
  const saving = setVariableMutation.isPending || deleteVariableMutation.isPending;

  const save = async () => {
    const value = serialize(draft);
    if (value === "{}") {
      if (stored !== undefined) await deleteVariableMutation.mutateAsync(name);
    } else {
      await setVariableMutation.mutateAsync({ name, value });
    }
  };

  usePendingChanges(name, { label, dirty, error: dirty ? validate(draft) : null, save });

  return { variablesQuery, draft, setDraft, dirty, saving, saved: parse(stored) };
}

function validateNames(names: string[], label: string): string | null {
  const trimmed = names.map((n) => n.trim());
  if (trimmed.some((n) => !n)) return `Every ${label} needs a name.`;
  const invalidChar = (n: string) => [...n].some((c) => c === '"' || c === "\\" || c.charCodeAt(0) < 32);
  if (trimmed.some(invalidChar)) return `A ${label} name must not contain quotes, backslashes or control characters.`;
  if (new Set(trimmed).size !== trimmed.length) return `${label[0].toUpperCase()}${label.slice(1)} names must be unique.`;
  return null;
}

function validateStacks(stacks: Stack[]): string | null {
  const invalid = stacks.find((s) => yamlProblems(s.yaml).length > 0);
  return invalid ? `Stack "${invalid.name.trim() || "(unnamed)"}" contains a YAML syntax error.` : null;
}

function SectionShell({
  title,
  description,
  addLabel,
  canAdd,
  onAdd,
  error,
  dirty,
  saving,
  children,
}: {
  title: string;
  description: string;
  addLabel: string;
  canAdd: boolean;
  onAdd: () => void;
  error: string | null;
  dirty: boolean;
  saving: boolean;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className={cn("bg-card border rounded-lg p-4 space-y-3", dirty && CHANGED_BLOCK)}>
        {children}
        {error && dirty && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onAdd} disabled={!canAdd || saving}>
            <PlusIcon className="size-4" />
            {addLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}

export function ContainerRegistriesSection() {
  const { variablesQuery, draft, setDraft, dirty, saving, saved } = useListVariable(
    CONTAINER_REGISTRY_AUTHS_VARIABLE,
    "Container registries",
    parseRegistries,
    serializeRegistries,
    (items) => validateNames(items.map((r) => r.address), "registry")
  );

  if (variablesQuery.isLoading) return <LoadingState label="Loading container registries..." />;
  if (variablesQuery.isError) return <ErrorState title="Could not load container registries" message={getErrorMessage(variablesQuery.error)} onRetry={() => variablesQuery.refetch()} />;

  const update = (index: number, patch: Partial<Registry>) =>
    setDraft(draft.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  return (
    <SectionShell
      title="Container Registries"
      description={`Registries and credentials used for the Docker deployments on the devices. Up to ${MAX_CONTAINER_REGISTRIES} registries; none is allowed.`}
      addLabel="Add registry"
      canAdd={draft.length < MAX_CONTAINER_REGISTRIES}
      onAdd={() => setDraft([...draft, { address: "", auth: "" }])}
      error={validateNames(draft.map((r) => r.address), "registry")}
      dirty={dirty}
      saving={saving}
    >
      {draft.length === 0 && <p className="text-sm text-muted-foreground">No container registry configured.</p>}
      {draft.map((registry, index) => {
        const original = saved[index];
        const addressChanged = registry.address !== original?.address;
        const authChanged = registry.auth !== original?.auth;
        return (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder="Registry address, e.g. docker.io"
              value={registry.address}
              className={cn(addressChanged && CHANGED_INPUT)}
              onChange={(e) => update(index, { address: e.target.value })}
            />
            <Input
              type="password"
              placeholder="base64(username:password)"
              value={registry.auth}
              className={cn(authChanged && CHANGED_INPUT)}
              onChange={(e) => update(index, { auth: e.target.value })}
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              title="Remove registry"
              onClick={() => setDraft(draft.filter((_, i) => i !== index))}
            >
              <TrashIcon />
            </Button>
          </div>
        );
      })}
    </SectionShell>
  );
}

export function StaticComposeDeploymentsSection() {
  const { variablesQuery, draft, setDraft, dirty, saving, saved } = useListVariable(
    STATIC_COMPOSE_FILES_VARIABLE,
    "Static compose deployments",
    parseStacks,
    serializeStacks,
    (items) => validateNames(items.map((s) => s.name), "stack") ?? validateStacks(items)
  );

  if (variablesQuery.isLoading) return <LoadingState label="Loading compose deployments..." />;
  if (variablesQuery.isError) return <ErrorState title="Could not load compose deployments" message={getErrorMessage(variablesQuery.error)} onRetry={() => variablesQuery.refetch()} />;

  const update = (index: number, patch: Partial<Stack>) =>
    setDraft(draft.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  return (
    <SectionShell
      title="Static Compose Deployments"
      description="Docker Compose stacks deployed to every device. Each stack is a name and its compose YAML."
      addLabel="Add stack"
      canAdd
      onAdd={() => setDraft([...draft, { name: "", yaml: "" }])}
      error={validateNames(draft.map((s) => s.name), "stack") ?? validateStacks(draft)}
      dirty={dirty}
      saving={saving}
    >
      {draft.length === 0 && <p className="text-sm text-muted-foreground">No compose stack configured.</p>}
      {draft.map((stack, index) => {
        const original = saved[index];
        const nameChanged = stack.name !== original?.name;
        const yamlChanged = stack.yaml !== original?.yaml;
        return (
          <div key={index} className="border rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Stack name, e.g. seal-app-connection-check"
                value={stack.name}
                className={cn(nameChanged && CHANGED_INPUT)}
                onChange={(e) => update(index, { name: e.target.value })}
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                title="Remove stack"
                onClick={() => setDraft(draft.filter((_, i) => i !== index))}
              >
                <TrashIcon />
              </Button>
            </div>
            <div className={cn("rounded-md border border-transparent", yamlChanged && CHANGED_BLOCK)}>
              <YamlEditor
                label={`Compose file of ${stack.name || "new stack"}`}
                className="h-72"
                value={stack.yaml}
                onChange={(yaml) => update(index, { yaml })}
              />
            </div>
          </div>
        );
      })}
    </SectionShell>
  );
}
