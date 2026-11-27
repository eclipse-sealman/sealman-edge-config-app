import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingState } from "@/components/ui/page-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import JsonEditor from "@/components/Input/JsonEditor";
import { jsonProblem } from "@/components/Input/jsonProblem";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { CHANGED_BLOCK, CHANGED_INPUT, usePendingChanges } from "./pendingChanges";
import { usePermissions } from "@/features/authorization/permissions/use-permissions";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import {
  useBaseDeployment,
  useResetBaseDeployment,
  useSaveBaseDeployment,
  type BaseDeploymentModule,
  type ModuleStatus,
  type RestartPolicy,
} from "@/features/BaseDeployment/baseDeploymentApi";

const RESTART_POLICIES: RestartPolicy[] = ["always", "never", "on-failure", "on-unhealthy"];
const STATUSES: ModuleStatus[] = ["running", "stopped"];
const MODULE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const RESERVED_NAMES = ["edgeagent", "edgehub"];

interface DraftModule {
  id: number;
  name: string;
  image: string;
  restart_policy: RestartPolicy;
  status: ModuleStatus;
  create_options: string;
  env: { key: string; value: string }[];
  twinText: string;
}

const emptyModule = (id: number): DraftModule => ({
  id,
  name: "",
  image: "",
  restart_policy: "always",
  status: "running",
  create_options: "",
  env: [],
  twinText: "",
});

function toDraft(modules: BaseDeploymentModule[], nextId: () => number): DraftModule[] {
  return modules.map((m) => ({
    id: nextId(),
    name: m.name,
    image: m.image,
    restart_policy: m.restart_policy,
    status: m.status,
    create_options: m.create_options,
    env: Object.entries(m.env).map(([key, value]) => ({ key, value })),
    twinText: Object.keys(m.twin).length > 0 ? JSON.stringify(m.twin, null, 2) : "",
  }));
}

const withoutIds = (draft: DraftModule[]) => JSON.stringify(draft, (key, value) => (key === "id" ? undefined : value));

function toModules(draft: DraftModule[]): BaseDeploymentModule[] {
  return draft.map((m) => ({
    name: m.name.trim(),
    image: m.image.trim(),
    restart_policy: m.restart_policy,
    status: m.status,
    create_options: m.create_options,
    env: Object.fromEntries(m.env.map((e) => [e.key.trim(), e.value])),
    twin: m.twinText.trim() ? JSON.parse(m.twinText) : {},
  }));
}

function jsonObjectProblem(text: string): string | null {
  if (!text.trim()) return null;
  if (jsonProblem(text)) return "is not valid JSON";
  const parsed: unknown = JSON.parse(text);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? null : "must be a JSON object";
}

function validate(draft: DraftModule[]): string | null {
  const names = draft.map((m) => m.name.trim());
  if (new Set(names).size !== names.length) return "Module names must be unique.";
  for (const m of draft) {
    const label = m.name.trim() || "(unnamed)";
    if (!MODULE_NAME.test(m.name.trim())) return `Module "${label}": the name may contain letters, digits, ".", "_" and "-" (max. 64).`;
    if (RESERVED_NAMES.includes(m.name.trim().toLowerCase())) return `Module "${label}": edgeAgent and edgeHub are system modules.`;
    if (!m.image.trim()) return `Module "${label}" needs an image.`;
    const createOptions = jsonObjectProblem(m.create_options);
    if (createOptions) return `Module "${label}": createOptions ${createOptions}.`;
    const twin = jsonObjectProblem(m.twinText);
    if (twin) return `Module "${label}": the twin ${twin}.`;
    const keys = m.env.map((e) => e.key.trim());
    if (keys.some((k) => !k)) return `Module "${label}": environment variable names must not be empty.`;
    if (new Set(keys).size !== keys.length) return `Module "${label}": environment variable names must be unique.`;
  }
  return null;
}

function ModuleEditor({
  module,
  saved,
  disabled,
  onChange,
}: {
  module: DraftModule;
  /** The module as last saved; none for a module that was just added. */
  saved: DraftModule | undefined;
  disabled: boolean;
  onChange: (patch: Partial<DraftModule>) => void;
}) {
  const setEnv = (index: number, patch: Partial<{ key: string; value: string }>) =>
    onChange({ env: module.env.map((e, i) => (i === index ? { ...e, ...patch } : e)) });
  const differs = (key: keyof DraftModule) => saved !== undefined && JSON.stringify(saved[key]) !== JSON.stringify(module[key]);

  return (
    <div className="space-y-5 py-2">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={module.name} disabled={disabled} placeholder="e.g. seal-mqtt" className={cn(differs("name") && CHANGED_INPUT)} onChange={(e) => onChange({ name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Image</Label>
          <Input value={module.image} disabled={disabled} placeholder="registry/image:tag" className={cn(differs("image") && CHANGED_INPUT)} onChange={(e) => onChange({ image: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Restart policy</Label>
          <Select value={module.restart_policy} disabled={disabled} onValueChange={(v) => onChange({ restart_policy: v as RestartPolicy })}>
            <SelectTrigger className={cn(differs("restart_policy") && CHANGED_INPUT)}><SelectValue /></SelectTrigger>
            <SelectContent>{RESTART_POLICIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={module.status} disabled={disabled} onValueChange={(v) => onChange({ status: v as ModuleStatus })}>
            <SelectTrigger className={cn(differs("status") && CHANGED_INPUT)}><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Create options</Label>
        <div className={cn("rounded-md border border-transparent", differs("create_options") && CHANGED_BLOCK)}>
          <JsonEditor
            label={`Create options of ${module.name || "new module"}`}
            value={module.create_options}
            readOnly={disabled}
            allowFullscreen={false}
            className="h-40"
            onChange={(create_options) => onChange({ create_options })}
          />
        </div>
      </div>

      <div className={cn("space-y-2 rounded-md border border-transparent", differs("env") && cn(CHANGED_BLOCK, "p-2"))}>
        <Label>Environment variables</Label>
        {module.env.length === 0 && <p className="text-sm text-muted-foreground">No environment variables.</p>}
        {module.env.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input value={entry.key} disabled={disabled} placeholder="NAME" onChange={(e) => setEnv(index, { key: e.target.value })} />
            <Input value={entry.value} disabled={disabled} placeholder="value" onChange={(e) => setEnv(index, { value: e.target.value })} />
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              title="Remove variable"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onChange({ env: module.env.filter((_, i) => i !== index) })}
            >
              <TrashIcon />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" disabled={disabled} onClick={() => onChange({ env: [...module.env, { key: "", value: "" }] })}>
          <PlusIcon className="size-4" />
          Add variable
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label>Module twin (desired properties)</Label>
        <div className={cn("rounded-md border border-transparent", differs("twinText") && CHANGED_BLOCK)}>
          <JsonEditor
            label={`Twin of ${module.name || "new module"}`}
            value={module.twinText}
            readOnly={disabled}
            allowFullscreen={false}
            className="h-48"
            onChange={(twinText) => onChange({ twinText })}
          />
        </div>
      </div>
    </div>
  );
}

function validateHubEnv(env: { key: string; value: string }[]): string | null {
  const keys = env.map((e) => e.key.trim());
  if (keys.some((k) => !k)) return "edgeHub: environment variable names must not be empty.";
  if (new Set(keys).size !== keys.length) return "edgeHub: environment variable names must be unique.";
  return null;
}

const toEnvRows = (env: Record<string, string>) => Object.entries(env).map(([key, value]) => ({ key, value }));

function EdgeHubEnvEditor({
  env,
  saved,
  disabled,
  onChange,
}: {
  env: { key: string; value: string }[];
  saved: Record<string, string>;
  disabled: boolean;
  onChange: (env: { key: string; value: string }[]) => void;
}) {
  const setRow = (index: number, patch: Partial<{ key: string; value: string }>) =>
    onChange(env.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  return (
    <div className="space-y-2 py-2">
      <Label>Environment variables</Label>
      {env.length === 0 && <p className="text-sm text-muted-foreground">No environment variables.</p>}
      {env.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={entry.key}
            disabled={disabled}
            placeholder="NAME"
            className={cn(!(entry.key in saved) && CHANGED_INPUT)}
            onChange={(e) => setRow(index, { key: e.target.value })}
          />
          <Input
            value={entry.value}
            disabled={disabled}
            placeholder="value"
            className={cn(saved[entry.key] !== entry.value && CHANGED_INPUT)}
            onChange={(e) => setRow(index, { value: e.target.value })}
          />
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            title="Remove variable"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onChange(env.filter((_, i) => i !== index))}
          >
            <TrashIcon />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => onChange([...env, { key: "", value: "" }])}>
        <PlusIcon className="size-4" />
        Add variable
      </Button>
    </div>
  );
}

export default function BaseDeploymentSection() {
  const query = useBaseDeployment();
  const save = useSaveBaseDeployment();
  const reset = useResetBaseDeployment();
  const { hasPermission: canWrite, noPermissionsMessage } = usePermissions({ permissionKey: PERMISSION_KEYS.PLATFORM_CONFIG_WRITE });

  const counter = useRef(0);
  const nextId = () => ++counter.current;
  const [draft, setDraft] = useState<DraftModule[]>([]);
  // The modules as last saved, by draft id.
  const [baseline, setBaseline] = useState<Record<number, DraftModule>>({});
  const [open, setOpen] = useState<string[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [hubEnv, setHubEnv] = useState<{ key: string; value: string }[]>([]);

  const data = query.data;
  useEffect(() => {
    if (!data) return;
    const modules = toDraft(data.modules, nextId);
    setDraft(modules);
    setBaseline(Object.fromEntries(modules.map((m) => [m.id, m])));
    setHubEnv(toEnvRows(data.edge_hub_env ?? {}));
  }, [data]);

  const saved = useMemo(() => (data ? withoutIds(toDraft(data.modules, () => 0)) : ""), [data]);
  const savedHubEnv = useMemo(() => data?.edge_hub_env ?? {}, [data]);
  const hubChanged = data !== undefined && JSON.stringify(hubEnv) !== JSON.stringify(toEnvRows(savedHubEnv));
  const dirty = data !== undefined && (withoutIds(draft) !== saved || hubChanged);
  const error = useMemo(() => validate(draft) ?? validateHubEnv(hubEnv), [draft, hubEnv]);
  const busy = save.isPending || reset.isPending;
  const disabled = !canWrite || busy;

  usePendingChanges("base-deployment", {
    label: "Sealman Base Deployment",
    dirty,
    error,
    order: -10,
    save: () =>
      save.mutateAsync({
        modules: toModules(draft),
        edge_hub_env: Object.fromEntries(hubEnv.map((e) => [e.key.trim(), e.value])),
      }),
  });

  if (query.isLoading) return <LoadingState label="Loading base deployment..." />;
  if (query.isError) return <ErrorState title="Could not load the base deployment" message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;

  const update = (id: number, patch: Partial<DraftModule>) => setDraft(draft.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const addModule = () => {
    const module = emptyModule(nextId());
    setDraft([...draft, module]);
    setOpen([...open, String(module.id)]);
  };

  const handleReset = () =>
    reset.mutate(undefined, {
      onSuccess: () => toast.success("Base deployment reset to the default"),
      onError: (e) => toast.error(`Could not reset the base deployment: ${getErrorMessage(e)}`),
    });

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Sealman Base Deployment</h3>
          {data && !data.stored && <Badge variant="outline">Default, not saved yet</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          Modules of the base deployment. Saving stores the fully rendered deployment manifest on the platform as the
          basis for the platform deployments. It is not written to the IoT Hub.
        </p>
      </div>

      <div className="bg-card border rounded-lg p-4 space-y-3" title={canWrite ? undefined : noPermissionsMessage}>
        <Accordion type="multiple" value={open} onValueChange={setOpen} className="space-y-2">
          <AccordionItem value="edge-hub" className={cn("overflow-hidden rounded-md border bg-background last:border-b", hubChanged && CHANGED_BLOCK)}>
            <AccordionTrigger className="px-3.5 py-3 text-left hover:no-underline">
              <span className="flex items-center gap-3">
                <span className="font-medium">edgeHub</span>
                <Badge variant="secondary">system module</Badge>
                {hubChanged && <Badge variant="outline" className="border-yellow-400 bg-yellow-100">Changed</Badge>}
              </span>
            </AccordionTrigger>
            <AccordionContent className="border-t px-4">
              <EdgeHubEnvEditor env={hubEnv} saved={savedHubEnv} disabled={disabled} onChange={setHubEnv} />
            </AccordionContent>
          </AccordionItem>

          {draft.map((module) => {
            const original = baseline[module.id];
            const isNew = original === undefined;
            const modified = !isNew && withoutIds([module]) !== withoutIds([original]);
            return (
            <AccordionItem key={module.id} value={String(module.id)} className={cn("overflow-hidden rounded-md border bg-background last:border-b", (isNew || modified) && CHANGED_BLOCK)}>
              <div className="flex items-center">
                <AccordionTrigger className="flex-1 gap-3 px-3.5 py-3 text-left hover:no-underline">
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="font-medium">{module.name || "New module"}</span>
                    <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">{module.image}</span>
                    <Badge variant={module.status === "running" ? "default" : "secondary"}>{module.status}</Badge>
                    {(isNew || modified) && <Badge variant="outline" className="border-yellow-400 bg-yellow-100">{isNew ? "New" : "Changed"}</Badge>}
                  </span>
                </AccordionTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  title="Remove module"
                  className="mr-2 text-muted-foreground hover:text-destructive"
                  onClick={() => setDraft(draft.filter((m) => m.id !== module.id))}
                >
                  <TrashIcon />
                </Button>
              </div>
              <AccordionContent className="border-t px-4">
                <ModuleEditor module={module} saved={original} disabled={disabled} onChange={(patch) => update(module.id, patch)} />
              </AccordionContent>
            </AccordionItem>
            );
          })}

          {data && (
            <AccordionItem value="manifest" className="overflow-hidden rounded-md border bg-background last:border-b">
              <AccordionTrigger className="px-3.5 py-3 text-left hover:no-underline">
                <span className="font-medium">Rendered manifest</span>
                <span className="ml-3 text-xs text-muted-foreground">as stored on the platform</span>
              </AccordionTrigger>
              <AccordionContent className="border-t px-4 py-3">
                <JsonEditor
                  label="Rendered base deployment manifest"
                  value={JSON.stringify(data.manifest, null, 2)}
                  readOnly
                  allowFullscreen={false}
                  className="h-96"
                />
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {error && dirty && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={disabled} onClick={addModule}>
              <PlusIcon className="size-4" />
              Add module
            </Button>
            <Button variant="ghost" size="sm" disabled={disabled || !data?.stored} onClick={() => setConfirmReset(true)}>
              Reset to default
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset the base deployment?</AlertDialogTitle>
            <AlertDialogDescription>
              The saved modules and the stored manifest are discarded and the default modules apply again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
